-- =========================================================
-- ValiSys - Comunicados da equipe com push externo
-- Gerentes, encarregados e admins podem mandar avisos.
-- O aviso aparece no dashboard e também vai como push externo.
-- =========================================================

create table if not exists public.comunicados_equipe (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid references public.lojas(id) on delete cascade,
  titulo text not null default 'Aviso da equipe',
  mensagem text not null,
  tipo text not null default 'aviso',
  criado_por text not null,
  criado_por_cargo text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

alter table public.comunicados_equipe
add column if not exists loja_id uuid references public.lojas(id) on delete cascade;

alter table public.comunicados_equipe
add column if not exists titulo text not null default 'Aviso da equipe';

alter table public.comunicados_equipe
add column if not exists mensagem text;

alter table public.comunicados_equipe
add column if not exists tipo text not null default 'aviso';

alter table public.comunicados_equipe
add column if not exists criado_por text;

alter table public.comunicados_equipe
add column if not exists criado_por_cargo text;

alter table public.comunicados_equipe
add column if not exists ativo boolean not null default true;

alter table public.comunicados_equipe
add column if not exists criado_em timestamptz not null default now();

create index if not exists comunicados_equipe_loja_ativo_idx
on public.comunicados_equipe(loja_id, ativo, criado_em desc);

alter table public.comunicados_equipe enable row level security;

drop policy if exists "comunicados_equipe_select_public" on public.comunicados_equipe;
create policy "comunicados_equipe_select_public"
on public.comunicados_equipe
for select
using (true);

-- Inserts devem ser feitas pela Edge Function com service_role.

-- Comunicado aparece somente no dia em que foi enviado.
alter table public.comunicados_equipe
add column if not exists expira_em timestamptz;

create index if not exists comunicados_equipe_expira_idx
on public.comunicados_equipe(loja_id, ativo, expira_em desc);
