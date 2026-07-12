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
