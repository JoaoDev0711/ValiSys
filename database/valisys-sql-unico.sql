-- ValiSys - SQL principal incremental
-- Rode este arquivo no Supabase SQL Editor quando atualizar o site.

-- Permissão de usuário para lançar produto como caixa.
alter table public.funcionarios
add column if not exists permite_caixa boolean not null default false;

-- Gramagem do produto e lançamento por caixa.
alter table public.produtos
add column if not exists gramagem text;

alter table public.lancamentos
add column if not exists gramagem text;

alter table public.lancamentos
add column if not exists is_caixa boolean not null default false;

-- Comunicado aparece somente no dia em que foi enviado.
alter table public.comunicados_equipe
add column if not exists expira_em timestamptz;

create index if not exists comunicados_equipe_expira_idx
on public.comunicados_equipe(loja_id, ativo, expira_em desc);

-- Força o PostgREST/Supabase a recarregar o schema cache.
notify pgrst, 'reload schema';

-- Índices para evitar timeout no dashboard/lista.
create index if not exists lancamentos_dashboard_idx
on public.lancamentos(loja_id, status, validade);

create index if not exists lancamentos_usuario_dashboard_idx
on public.lancamentos(loja_id, usuario_nome, usuario_cargo, status, validade);

create index if not exists lancamentos_setor_dashboard_idx
on public.lancamentos(loja_id, setor, status, validade);

notify pgrst, 'reload schema';

-- Otimizações gerais para evitar carregamento pesado no Supabase.
create index if not exists produtos_busca_idx
on public.produtos(nome, marca, categoria);

create index if not exists produtos_ean_idx
on public.produtos(ean);

create index if not exists funcionarios_loja_ativo_idx
on public.funcionarios(loja_id, ativo, nome);

create index if not exists setores_loja_ativo_idx
on public.setores_loja(loja_id, ativo, nome);

create index if not exists sac_chat_idx
on public.notificacoes(tipo, titulo, criado_em desc);

create index if not exists lojas_status_nome_idx
on public.lojas(status, nome);

notify pgrst, 'reload schema';

-- Modo ultra leve: índices para consultas pequenas por loja/status/data.
create index if not exists lancamentos_leve_loja_status_validade_idx
on public.lancamentos(loja_id, status, validade);

create index if not exists lancamentos_leve_usuario_idx
on public.lancamentos(loja_id, usuario_nome, usuario_cargo, status, validade);

create index if not exists produtos_leve_nome_idx
on public.produtos(nome);

create index if not exists catalogo_leve_nome_idx
on public.catalogo_produtos(nome);

create index if not exists notificacoes_sac_leve_idx
on public.notificacoes(tipo, titulo, criado_em desc);

notify pgrst, 'reload schema';

-- Correção final da Lista Geral: busca leve por status/data e loja/status/data.
create index if not exists lancamentos_status_validade_idx
on public.lancamentos(status, validade);

create index if not exists lancamentos_loja_status_validade_idx
on public.lancamentos(loja_id, status, validade);

create index if not exists lancamentos_loja_setor_status_validade_idx
on public.lancamentos(loja_id, setor, status, validade);

analyze public.lancamentos;
notify pgrst, 'reload schema';

-- Lista sem timeout: índices auxiliares para filtros diretos sem ordenação pesada.
create index if not exists lancamentos_loja_idx
on public.lancamentos(loja_id);

create index if not exists lancamentos_status_idx
on public.lancamentos(status);

create index if not exists lancamentos_loja_status_idx
on public.lancamentos(loja_id, status);

analyze public.lancamentos;
notify pgrst, 'reload schema';

-- Função leve para Lista Geral sem timeout.
-- Evita REST pesado, RLS duplicado, relacionamento com lojas e order by em tabela grande.
create index if not exists lancamentos_rpc_loja_status_idx
on public.lancamentos(loja_id, status);

create index if not exists lancamentos_rpc_loja_idx
on public.lancamentos(loja_id);

drop function if exists public.valisys_listar_lancamentos_leve(uuid, text, integer);

create or replace function public.valisys_listar_lancamentos_leve(
  p_loja_id uuid,
  p_status text default 'ativo',
  p_limite integer default 30
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  retorno jsonb;
  limite_final integer;
begin
  limite_final := least(greatest(coalesce(p_limite, 30), 1), 50);

  select coalesce(jsonb_agg(to_jsonb(l)), '[]'::jsonb)
  into retorno
  from (
    select
      id,
      loja_id,
      ean,
      nome_produto,
      marca,
      quantidade_padrao as gramagem,
      quantidade_padrao,
      sabor,
      categoria,
      setor,
      quantidade,
      false as is_caixa,
      validade,
      foto,
      status,
      usuario_nome,
      usuario_cargo,
      retirado_em,
      retirado_por,
      criado_em
    from public.lancamentos
    where loja_id = p_loja_id
      and (
        p_status is null
        or p_status = ''
        or p_status = 'todos'
        or status = p_status
      )
    limit limite_final
  ) l;

  return retorno;
end;
$$;

grant execute on function public.valisys_listar_lancamentos_leve(uuid, text, integer) to anon, authenticated;

analyze public.lancamentos;
notify pgrst, 'reload schema';

-- =========================================================
-- Lista Geral profissional: RPC paginada, leve e sem fotos
-- =========================================================

alter table public.produtos
add column if not exists gramagem text;

alter table public.lancamentos
add column if not exists gramagem text;

alter table public.lancamentos
add column if not exists is_caixa boolean not null default false;

create extension if not exists pg_trgm;

create index if not exists lancamentos_lista_loja_status_validade_id_idx
on public.lancamentos(loja_id, status, validade, id);

create index if not exists lancamentos_lista_loja_validade_id_idx
on public.lancamentos(loja_id, validade, id);

create index if not exists lancamentos_lista_usuario_idx
on public.lancamentos(loja_id, usuario_nome, usuario_cargo, status, validade, id);

create index if not exists lancamentos_lista_setor_idx
on public.lancamentos(loja_id, setor, status, validade, id);

create index if not exists lancamentos_nome_produto_trgm_idx
on public.lancamentos using gin (nome_produto gin_trgm_ops);

create index if not exists lancamentos_ean_trgm_idx
on public.lancamentos using gin (ean gin_trgm_ops);

create index if not exists lancamentos_marca_trgm_idx
on public.lancamentos using gin (marca gin_trgm_ops);

drop function if exists public.valisys_listar_lancamentos_paginado(
  uuid,
  text,
  text,
  date,
  uuid,
  integer,
  text,
  text,
  text
);

create or replace function public.valisys_listar_lancamentos_paginado(
  p_loja_id uuid,
  p_status text default 'ativo',
  p_busca text default '',
  p_cursor_validade date default null,
  p_cursor_id uuid default null,
  p_limite integer default 30,
  p_usuario_nome text default null,
  p_usuario_cargo text default null,
  p_setor text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  limite_final integer;
  busca_final text;
  retorno jsonb;
begin
  limite_final := least(greatest(coalesce(p_limite, 30), 1), 50);
  busca_final := lower(trim(coalesce(p_busca, '')));

  with base as (
    select
      l.id,
      l.loja_id,
      l.ean,
      l.nome_produto,
      l.marca,
      coalesce(l.gramagem, l.quantidade_padrao) as gramagem,
      l.quantidade_padrao,
      l.sabor,
      l.categoria,
      l.setor,
      l.quantidade,
      l.is_caixa,
      l.validade,
      null::text as foto,
      l.status,
      l.usuario_nome,
      l.usuario_cargo,
      l.retirado_em,
      l.retirado_por,
      l.criado_em
    from public.lancamentos l
    where l.loja_id = p_loja_id
      and (
        p_status is null
        or p_status = ''
        or p_status = 'todos'
        or l.status = p_status
      )
      and (
        p_usuario_nome is null
        or p_usuario_nome = ''
        or (
          lower(l.usuario_nome) = lower(p_usuario_nome)
          and (p_usuario_cargo is null or p_usuario_cargo = '' or l.usuario_cargo = p_usuario_cargo)
        )
      )
      and (
        p_setor is null
        or p_setor = ''
        or lower(l.setor) = lower(p_setor)
      )
      and (
        busca_final = ''
        or length(busca_final) < 2
        or lower(coalesce(l.nome_produto, '')) like '%' || busca_final || '%'
        or lower(coalesce(l.ean, '')) like '%' || busca_final || '%'
        or lower(coalesce(l.marca, '')) like '%' || busca_final || '%'
        or lower(coalesce(l.setor, '')) like '%' || busca_final || '%'
        or lower(coalesce(l.usuario_nome, '')) like '%' || busca_final || '%'
        or lower(coalesce(l.gramagem, l.quantidade_padrao, '')) like '%' || busca_final || '%'
      )
      and (
        p_cursor_validade is null
        or (l.validade, l.id) > (p_cursor_validade, p_cursor_id)
      )
    order by l.validade asc nulls last, l.id asc
    limit limite_final + 1
  ),
  pagina as (
    select *
    from base
    order by validade asc nulls last, id asc
    limit limite_final
  ),
  ultimo as (
    select validade, id
    from pagina
    order by validade desc nulls last, id desc
    limit 1
  )
  select jsonb_build_object(
    'itens', coalesce((select jsonb_agg(to_jsonb(pagina.*) order by validade asc nulls last, id asc) from pagina), '[]'::jsonb),
    'tem_mais', (select count(*) from base) > limite_final,
    'proximo_cursor_validade', (select validade from ultimo),
    'proximo_cursor_id', (select id from ultimo)
  )
  into retorno;

  return retorno;
end;
$$;

grant execute on function public.valisys_listar_lancamentos_paginado(
  uuid,
  text,
  text,
  date,
  uuid,
  integer,
  text,
  text,
  text
) to anon, authenticated;

analyze public.lancamentos;
notify pgrst, 'reload schema';
