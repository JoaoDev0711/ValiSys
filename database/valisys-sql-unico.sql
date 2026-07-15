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

-- =========================================================
-- Fotos profissionais: Storage + thumbnails leves
-- =========================================================

-- Bucket público para fotos de produtos.
-- A foto original e a thumb ficam no Storage.
-- O banco guarda só URL pequena/caminho, sem base64 pesado nas listas.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'produtos',
  'produtos',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'ValiSys fotos produtos leitura publica'
  ) then
    create policy "ValiSys fotos produtos leitura publica"
    on storage.objects
    for select
    to anon, authenticated
    using (bucket_id = 'produtos');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'ValiSys fotos produtos upload'
  ) then
    create policy "ValiSys fotos produtos upload"
    on storage.objects
    for insert
    to anon, authenticated
    with check (bucket_id = 'produtos');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'ValiSys fotos produtos atualizar'
  ) then
    create policy "ValiSys fotos produtos atualizar"
    on storage.objects
    for update
    to anon, authenticated
    using (bucket_id = 'produtos')
    with check (bucket_id = 'produtos');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'ValiSys fotos produtos apagar'
  ) then
    create policy "ValiSys fotos produtos apagar"
    on storage.objects
    for delete
    to anon, authenticated
    using (bucket_id = 'produtos');
  end if;
end $$;

alter table public.produtos
add column if not exists foto_url text;

alter table public.produtos
add column if not exists foto_thumb_url text;

alter table public.lancamentos
add column if not exists foto_url text;

alter table public.lancamentos
add column if not exists foto_thumb_url text;

create index if not exists produtos_foto_thumb_idx
on public.produtos(foto_thumb_url)
where foto_thumb_url is not null and foto_thumb_url <> '';

create index if not exists lancamentos_foto_thumb_idx
on public.lancamentos(foto_thumb_url)
where foto_thumb_url is not null and foto_thumb_url <> '';

-- Atualiza a função paginada para retornar somente thumbnail/URL leve.
-- Base64 antigo em lancamentos.foto NÃO volta para a Lista Geral.
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
      case
        when coalesce(l.foto_thumb_url, '') <> '' then l.foto_thumb_url
        when coalesce(l.foto_url, '') <> '' then l.foto_url
        when coalesce(p.foto_thumb_url, '') <> '' then p.foto_thumb_url
        when coalesce(p.foto_url, '') <> '' then p.foto_url
        when coalesce(l.foto, '') <> '' and l.foto not like 'data:image%' then l.foto
        when coalesce(p.foto, '') <> '' and p.foto not like 'data:image%' then p.foto
        else null
      end as foto,
      case
        when coalesce(l.foto_url, '') <> '' then l.foto_url
        when coalesce(p.foto_url, '') <> '' then p.foto_url
        when coalesce(l.foto, '') <> '' and l.foto not like 'data:image%' then l.foto
        when coalesce(p.foto, '') <> '' and p.foto not like 'data:image%' then p.foto
        else null
      end as foto_url,
      case
        when coalesce(l.foto_thumb_url, '') <> '' then l.foto_thumb_url
        when coalesce(p.foto_thumb_url, '') <> '' then p.foto_thumb_url
        when coalesce(l.foto_url, '') <> '' then l.foto_url
        when coalesce(p.foto_url, '') <> '' then p.foto_url
        when coalesce(l.foto, '') <> '' and l.foto not like 'data:image%' then l.foto
        when coalesce(p.foto, '') <> '' and p.foto not like 'data:image%' then p.foto
        else null
      end as foto_thumb_url,
      l.status,
      l.usuario_nome,
      l.usuario_cargo,
      l.retirado_em,
      l.retirado_por,
      l.criado_em
    from public.lancamentos l
    left join public.produtos p on p.ean = l.ean
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

analyze public.produtos;
analyze public.lancamentos;
notify pgrst, 'reload schema';

-- =========================================================
-- Financeiro ValiSys: planos, assinatura e cobranças
-- =========================================================

create extension if not exists pgcrypto;

create table if not exists public.financeiro_planos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null,
  descricao text,
  valor_mensal numeric(10,2) not null default 0,
  limite_lojas integer not null default 1,
  limite_usuarios integer not null default 3,
  recursos jsonb not null default '[]'::jsonb,
  destaque boolean not null default false,
  ativo boolean not null default true,
  ordem integer not null default 0,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.financeiro_assinaturas (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid not null references public.lojas(id) on delete cascade,
  plano_id uuid not null references public.financeiro_planos(id) on delete restrict,
  status text not null default 'ativa',
  ciclo text not null default 'mensal',
  inicio_em date not null default current_date,
  proximo_vencimento date,
  criado_por text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique(loja_id)
);

create table if not exists public.financeiro_cobrancas (
  id uuid primary key default gen_random_uuid(),
  assinatura_id uuid not null references public.financeiro_assinaturas(id) on delete cascade,
  loja_id uuid not null references public.lojas(id) on delete cascade,
  competencia date not null,
  descricao text not null,
  valor numeric(10,2) not null default 0,
  vencimento date not null,
  status text not null default 'pendente',
  link_pagamento text,
  boleto_url text,
  linha_digitavel text,
  pix_copia_cola text,
  meio_pagamento text,
  pago_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique(assinatura_id, competencia)
);

create table if not exists public.financeiro_meios_pagamento (
  id uuid primary key default gen_random_uuid(),
  tipo text not null, -- pix, boleto, link, cartao, transferencia, outro
  nome text not null,
  descricao text,
  chave_pix text,
  pix_nome_recebedor text,
  link_pagamento text,
  boleto_url text,
  linha_digitavel text,
  dados_bancarios text,
  instrucoes text,
  ativo boolean not null default true,
  ordem integer not null default 0,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.financeiro_pagamento_solicitacoes (
  id uuid primary key default gen_random_uuid(),
  cobranca_id uuid not null references public.financeiro_cobrancas(id) on delete cascade,
  meio_id uuid references public.financeiro_meios_pagamento(id) on delete set null,
  usuario_nome text,
  usuario_cargo text,
  status text not null default 'aberta',
  criado_em timestamptz not null default now()
);

alter table public.lojas
add column if not exists plano_codigo text;

alter table public.lojas
add column if not exists assinatura_status text not null default 'sem_assinatura';

alter table public.lojas
add column if not exists acesso_bloqueado boolean not null default false;

alter table public.lojas
add column if not exists assinatura_vencimento date;

create index if not exists financeiro_planos_ativo_ordem_idx
on public.financeiro_planos(ativo, ordem);

create index if not exists financeiro_assinaturas_loja_idx
on public.financeiro_assinaturas(loja_id);

create index if not exists financeiro_cobrancas_loja_vencimento_idx
on public.financeiro_cobrancas(loja_id, vencimento);

create index if not exists financeiro_cobrancas_assinatura_competencia_idx
on public.financeiro_cobrancas(assinatura_id, competencia);

create index if not exists financeiro_cobrancas_status_vencimento_idx
on public.financeiro_cobrancas(status, vencimento);

create index if not exists financeiro_meios_pagamento_ativo_ordem_idx
on public.financeiro_meios_pagamento(ativo, ordem);

insert into public.financeiro_planos
  (codigo, nome, descricao, valor_mensal, limite_lojas, limite_usuarios, recursos, destaque, ativo, ordem)
values
  (
    'inicial',
    'Inicial',
    'Para pequenos controles de vencimento.',
    49.00,
    1,
    3,
    '["1 loja","Até 3 usuários","Lançamento de produtos","Lista de vencimentos","Leitura de EAN","Foto do produto"]'::jsonb,
    false,
    true,
    1
  ),
  (
    'operacional',
    'Operacional',
    'Para operação diária com equipe, setores e notificações.',
    79.00,
    1,
    10,
    '["Tudo do Inicial","Usuários por cargo","Lista Geral completa","Comunicados internos","Dashboard da loja","Notificações"]'::jsonb,
    true,
    true,
    2
  ),
  (
    'profissional',
    'Profissional',
    'Para gestão completa com histórico, relatórios e suporte.',
    119.00,
    1,
    25,
    '["Tudo do Operacional","Relatórios","Histórico de retiradas","Permissões avançadas","Exportação dos dados","Backup mensal"]'::jsonb,
    false,
    true,
    3
  )
on conflict (codigo) do update set
  nome = excluded.nome,
  descricao = excluded.descricao,
  valor_mensal = excluded.valor_mensal,
  limite_lojas = excluded.limite_lojas,
  limite_usuarios = excluded.limite_usuarios,
  recursos = excluded.recursos,
  destaque = excluded.destaque,
  ativo = excluded.ativo,
  ordem = excluded.ordem,
  atualizado_em = now();

insert into public.financeiro_meios_pagamento
  (tipo, nome, descricao, chave_pix, pix_nome_recebedor, link_pagamento, boleto_url, linha_digitavel, dados_bancarios, instrucoes, ativo, ordem)
values
  (
    'pix',
    'PIX',
    'Pagamento por chave PIX.',
    'CONFIGURE-SUA-CHAVE-PIX',
    'ValiSys',
    null,
    null,
    null,
    null,
    'Após pagar, envie o comprovante pelo canal combinado para liberação manual.',
    true,
    1
  ),
  (
    'boleto',
    'Boleto',
    'Boleto ou linha digitável gerada manualmente.',
    null,
    null,
    null,
    null,
    'CONFIGURE-A-LINHA-DIGITAVEL-OU-DESATIVE-ESTE-MEIO',
    null,
    'Use este meio quando houver boleto emitido manualmente.',
    false,
    2
  ),
  (
    'link',
    'Link de pagamento',
    'Link externo do meio de pagamento que você tiver.',
    null,
    null,
    'https://configure-seu-link-de-pagamento.example',
    null,
    null,
    null,
    'Abra o link para concluir o pagamento.',
    false,
    3
  ),
  (
    'transferencia',
    'Transferência bancária',
    'Transferência ou depósito manual.',
    null,
    null,
    null,
    null,
    null,
    'Banco: CONFIGURAR\nAgência: CONFIGURAR\nConta: CONFIGURAR\nTitular: CONFIGURAR',
    'Após transferir, envie o comprovante pelo canal combinado.',
    false,
    4
  )
on conflict do nothing;

create or replace function public.financeiro_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists trg_financeiro_planos_updated_at on public.financeiro_planos;
create trigger trg_financeiro_planos_updated_at
before update on public.financeiro_planos
for each row execute function public.financeiro_set_updated_at();

drop trigger if exists trg_financeiro_assinaturas_updated_at on public.financeiro_assinaturas;
create trigger trg_financeiro_assinaturas_updated_at
before update on public.financeiro_assinaturas
for each row execute function public.financeiro_set_updated_at();

drop trigger if exists trg_financeiro_cobrancas_updated_at on public.financeiro_cobrancas;
create trigger trg_financeiro_cobrancas_updated_at
before update on public.financeiro_cobrancas
for each row execute function public.financeiro_set_updated_at();

drop trigger if exists trg_financeiro_meios_pagamento_updated_at on public.financeiro_meios_pagamento;
create trigger trg_financeiro_meios_pagamento_updated_at
before update on public.financeiro_meios_pagamento
for each row execute function public.financeiro_set_updated_at();

drop function if exists public.valisys_financeiro_minha_assinatura(uuid);
drop function if exists public.valisys_financeiro_assinar_plano(uuid, text, text);
drop function if exists public.valisys_financeiro_registrar_solicitacao_pagamento(uuid, uuid, text, text);

create or replace function public.valisys_financeiro_minha_assinatura(
  p_loja_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  assinatura_json jsonb;
  cobrancas_json jsonb;
  meios_json jsonb;
begin
  update public.financeiro_cobrancas
  set status = 'vencida',
      atualizado_em = now()
  where loja_id = p_loja_id
    and status in ('pendente', 'aguardando_pagamento')
    and vencimento < current_date;

  select to_jsonb(x)
  into assinatura_json
  from (
    select
      a.id,
      a.loja_id,
      a.plano_id,
      a.status,
      a.ciclo,
      a.inicio_em,
      a.proximo_vencimento,
      a.criado_em,
      jsonb_build_object(
        'id', p.id,
        'codigo', p.codigo,
        'nome', p.nome,
        'descricao', p.descricao,
        'valor_mensal', p.valor_mensal,
        'limite_lojas', p.limite_lojas,
        'limite_usuarios', p.limite_usuarios,
        'recursos', p.recursos,
        'destaque', p.destaque
      ) as plano
    from public.financeiro_assinaturas a
    join public.financeiro_planos p on p.id = a.plano_id
    where a.loja_id = p_loja_id
    limit 1
  ) x;

  select coalesce(jsonb_agg(to_jsonb(c) order by c.competencia asc), '[]'::jsonb)
  into cobrancas_json
  from (
    select
      id,
      assinatura_id,
      loja_id,
      competencia,
      descricao,
      valor,
      vencimento,
      status,
      link_pagamento,
      boleto_url,
      linha_digitavel,
      pix_copia_cola,
      meio_pagamento,
      pago_em,
      criado_em
    from public.financeiro_cobrancas
    where loja_id = p_loja_id
      and competencia >= date_trunc('month', current_date)::date
      and competencia < (date_trunc('month', current_date)::date + interval '12 months')::date
    order by competencia asc
  ) c;

  select coalesce(jsonb_agg(to_jsonb(m) order by m.ordem asc), '[]'::jsonb)
  into meios_json
  from (
    select
      id,
      tipo,
      nome,
      descricao,
      chave_pix,
      pix_nome_recebedor,
      link_pagamento,
      boleto_url,
      linha_digitavel,
      dados_bancarios,
      instrucoes,
      ativo,
      ordem
    from public.financeiro_meios_pagamento
    where ativo = true
    order by ordem asc
  ) m;

  return jsonb_build_object(
    'assinatura', assinatura_json,
    'cobrancas', coalesce(cobrancas_json, '[]'::jsonb),
    'meios_pagamento', coalesce(meios_json, '[]'::jsonb)
  );
end;
$$;

create or replace function public.valisys_financeiro_assinar_plano(
  p_loja_id uuid,
  p_plano_codigo text,
  p_criado_por text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  plano_record public.financeiro_planos%rowtype;
  assinatura_record public.financeiro_assinaturas%rowtype;
  i integer;
  competencia_final date;
  vencimento_final date;
begin
  select *
  into plano_record
  from public.financeiro_planos
  where codigo = p_plano_codigo
    and ativo = true
  limit 1;

  if plano_record.id is null then
    raise exception 'Plano não encontrado: %', p_plano_codigo;
  end if;

  insert into public.financeiro_assinaturas
    (loja_id, plano_id, status, ciclo, inicio_em, proximo_vencimento, criado_por)
  values
    (
      p_loja_id,
      plano_record.id,
      'ativa',
      'mensal',
      current_date,
      (date_trunc('month', current_date)::date + interval '9 days')::date,
      p_criado_por
    )
  on conflict (loja_id) do update set
    plano_id = excluded.plano_id,
    status = 'ativa',
    ciclo = excluded.ciclo,
    proximo_vencimento = excluded.proximo_vencimento,
    atualizado_em = now()
  returning * into assinatura_record;

  for i in 0..11 loop
    competencia_final := (date_trunc('month', current_date)::date + make_interval(months => i))::date;
    vencimento_final := (competencia_final + interval '9 days')::date;

    if vencimento_final < current_date then
      vencimento_final := current_date + 7;
    end if;

    insert into public.financeiro_cobrancas
      (assinatura_id, loja_id, competencia, descricao, valor, vencimento, status)
    values
      (
        assinatura_record.id,
        p_loja_id,
        competencia_final,
        'Mensalidade ValiSys - ' || plano_record.nome,
        plano_record.valor_mensal,
        vencimento_final,
        'pendente'
      )
    on conflict (assinatura_id, competencia) do update set
      descricao = excluded.descricao,
      valor = excluded.valor,
      vencimento = excluded.vencimento,
      atualizado_em = now()
    where public.financeiro_cobrancas.status not in ('pago', 'recebido', 'cancelado');
  end loop;

  update public.lojas
  set plano_codigo = plano_record.codigo,
      assinatura_status = 'ativa',
      acesso_bloqueado = false,
      assinatura_vencimento = assinatura_record.proximo_vencimento
  where id = p_loja_id;

  return public.valisys_financeiro_minha_assinatura(p_loja_id);
end;
$$;

create or replace function public.valisys_financeiro_registrar_solicitacao_pagamento(
  p_cobranca_id uuid,
  p_meio_id uuid,
  p_usuario_nome text default '',
  p_usuario_cargo text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  solicitacao_record public.financeiro_pagamento_solicitacoes%rowtype;
  cobranca_json jsonb;
  meio_json jsonb;
begin
  insert into public.financeiro_pagamento_solicitacoes
    (cobranca_id, meio_id, usuario_nome, usuario_cargo, status)
  values
    (p_cobranca_id, p_meio_id, p_usuario_nome, p_usuario_cargo, 'aberta')
  returning * into solicitacao_record;

  update public.financeiro_cobrancas
  set status = case
      when status in ('pendente', 'vencida') then 'aguardando_pagamento'
      else status
    end,
    meio_pagamento = (
      select tipo
      from public.financeiro_meios_pagamento
      where id = p_meio_id
      limit 1
    ),
    atualizado_em = now()
  where id = p_cobranca_id;

  select to_jsonb(c)
  into cobranca_json
  from public.financeiro_cobrancas c
  where c.id = p_cobranca_id;

  select to_jsonb(m)
  into meio_json
  from public.financeiro_meios_pagamento m
  where m.id = p_meio_id;

  return jsonb_build_object(
    'solicitacao', to_jsonb(solicitacao_record),
    'cobranca', cobranca_json,
    'meio_pagamento', meio_json
  );
end;
$$;

grant select on public.financeiro_planos to anon, authenticated;
grant select, insert, update on public.financeiro_assinaturas to anon, authenticated;
grant select, insert, update on public.financeiro_cobrancas to anon, authenticated;
grant select on public.financeiro_meios_pagamento to anon, authenticated;
grant select, insert, update on public.financeiro_pagamento_solicitacoes to anon, authenticated;

grant execute on function public.valisys_financeiro_minha_assinatura(uuid) to anon, authenticated;
grant execute on function public.valisys_financeiro_assinar_plano(uuid, text, text) to anon, authenticated;
grant execute on function public.valisys_financeiro_registrar_solicitacao_pagamento(uuid, uuid, text, text) to anon, authenticated;

analyze public.financeiro_planos;
analyze public.financeiro_assinaturas;
analyze public.financeiro_cobrancas;
analyze public.financeiro_meios_pagamento;

notify pgrst, 'reload schema';

-- =========================================================
-- Financeiro: cancelamento de assinatura + Mercado Pago
-- =========================================================

alter table public.financeiro_assinaturas
add column if not exists cancelado_em timestamptz;

alter table public.financeiro_assinaturas
add column if not exists cancelado_por text;

alter table public.financeiro_assinaturas
add column if not exists cancelado_cargo text;

alter table public.financeiro_cobrancas
add column if not exists mercado_pago_preference_id text;

alter table public.financeiro_cobrancas
add column if not exists mercado_pago_payment_id text;

alter table public.financeiro_cobrancas
add column if not exists mercado_pago_status text;

alter table public.financeiro_cobrancas
add column if not exists mercado_pago_external_reference text;

alter table public.financeiro_cobrancas
add column if not exists mercado_pago_init_point text;

alter table public.financeiro_cobrancas
add column if not exists mercado_pago_sandbox_init_point text;

create index if not exists financeiro_cobrancas_mp_payment_idx
on public.financeiro_cobrancas(mercado_pago_payment_id);

create index if not exists financeiro_cobrancas_mp_reference_idx
on public.financeiro_cobrancas(mercado_pago_external_reference);

insert into public.financeiro_meios_pagamento
  (tipo, nome, descricao, instrucoes, ativo, ordem)
select
  'mercadopago',
  'Mercado Pago',
  'Pagamento via link seguro do Mercado Pago.',
  'Ao clicar em pagar, o sistema gera um link seguro do Mercado Pago.',
  true,
  1
where not exists (
  select 1
  from public.financeiro_meios_pagamento
  where tipo = 'mercadopago'
);

drop function if exists public.valisys_financeiro_cancelar_assinatura(uuid, text, text);

create or replace function public.valisys_financeiro_cancelar_assinatura(
  p_loja_id uuid,
  p_cancelado_por text default '',
  p_cancelado_cargo text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  assinatura_atual public.financeiro_assinaturas%rowtype;
  assinatura_json jsonb;
  cobrancas_json jsonb;
  meios_json jsonb;
begin
  select *
  into assinatura_atual
  from public.financeiro_assinaturas
  where loja_id = p_loja_id
  limit 1;

  if assinatura_atual.id is null then
    return jsonb_build_object(
      'ok', false,
      'erro', 'Assinatura não encontrada.'
    );
  end if;

  update public.financeiro_assinaturas
  set status = 'cancelada',
      cancelado_em = now(),
      cancelado_por = coalesce(p_cancelado_por, ''),
      cancelado_cargo = coalesce(p_cancelado_cargo, ''),
      atualizado_em = now()
  where id = assinatura_atual.id;

  update public.financeiro_cobrancas
  set status = 'cancelada',
      atualizado_em = now()
  where assinatura_id = assinatura_atual.id
    and status in ('pendente', 'aguardando_pagamento', 'vencida');

  update public.lojas
  set plano_codigo = null,
      assinatura_status = 'cancelada',
      acesso_bloqueado = false,
      assinatura_vencimento = null
  where id = p_loja_id;

  select to_jsonb(x)
  into assinatura_json
  from (
    select
      a.id,
      a.loja_id,
      a.plano_id,
      a.status,
      a.ciclo,
      a.inicio_em,
      a.proximo_vencimento,
      a.cancelado_em,
      a.cancelado_por,
      a.criado_em,
      jsonb_build_object(
        'id', p.id,
        'codigo', p.codigo,
        'nome', p.nome,
        'descricao', p.descricao,
        'valor_mensal', p.valor_mensal,
        'limite_lojas', p.limite_lojas,
        'limite_usuarios', p.limite_usuarios,
        'recursos', p.recursos,
        'destaque', p.destaque
      ) as plano
    from public.financeiro_assinaturas a
    join public.financeiro_planos p on p.id = a.plano_id
    where a.id = assinatura_atual.id
  ) x;

  select coalesce(jsonb_agg(to_jsonb(c) order by c.competencia asc), '[]'::jsonb)
  into cobrancas_json
  from (
    select
      id,
      assinatura_id,
      loja_id,
      competencia,
      descricao,
      valor,
      vencimento,
      status,
      link_pagamento,
      boleto_url,
      linha_digitavel,
      pix_copia_cola,
      meio_pagamento,
      pago_em,
      mercado_pago_preference_id,
      mercado_pago_payment_id,
      mercado_pago_status,
      mercado_pago_init_point,
      mercado_pago_sandbox_init_point,
      criado_em
    from public.financeiro_cobrancas
    where loja_id = p_loja_id
      and competencia >= date_trunc('month', current_date)::date
      and competencia < (date_trunc('month', current_date)::date + interval '12 months')::date
    order by competencia asc
  ) c;

  select coalesce(jsonb_agg(to_jsonb(m) order by m.ordem asc), '[]'::jsonb)
  into meios_json
  from (
    select
      id,
      tipo,
      nome,
      descricao,
      chave_pix,
      pix_nome_recebedor,
      link_pagamento,
      boleto_url,
      linha_digitavel,
      dados_bancarios,
      instrucoes,
      ativo,
      ordem
    from public.financeiro_meios_pagamento
    where ativo = true
    order by ordem asc
  ) m;

  return jsonb_build_object(
    'ok', true,
    'assinatura', assinatura_json,
    'cobrancas', cobrancas_json,
    'meios_pagamento', meios_json
  );
end;
$$;

grant execute on function public.valisys_financeiro_cancelar_assinatura(uuid, text, text) to anon, authenticated;

notify pgrst, 'reload schema';

