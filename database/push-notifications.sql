-- =========================================================
-- ValiSys - Notificações Push tipo aplicativo
-- Rode este SQL no Supabase depois do SQL principal.
-- =========================================================

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  usuario_id text,
  usuario_nome text,
  usuario_cargo text,
  usuario_setor text,
  loja_id uuid references public.lojas(id) on delete cascade,
  loja_nome text,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.push_subscriptions
add column if not exists usuario_id text;

alter table public.push_subscriptions
add column if not exists usuario_nome text;

alter table public.push_subscriptions
add column if not exists usuario_cargo text;

alter table public.push_subscriptions
add column if not exists usuario_setor text;

alter table public.push_subscriptions
add column if not exists loja_id uuid references public.lojas(id) on delete cascade;

alter table public.push_subscriptions
add column if not exists loja_nome text;

alter table public.push_subscriptions
add column if not exists endpoint text;

alter table public.push_subscriptions
add column if not exists p256dh text;

alter table public.push_subscriptions
add column if not exists auth text;

alter table public.push_subscriptions
add column if not exists user_agent text;

alter table public.push_subscriptions
add column if not exists ativo boolean not null default true;

alter table public.push_subscriptions
add column if not exists criado_em timestamptz not null default now();

alter table public.push_subscriptions
add column if not exists atualizado_em timestamptz not null default now();

create unique index if not exists push_subscriptions_endpoint_idx
on public.push_subscriptions(endpoint);

create index if not exists push_subscriptions_loja_ativo_idx
on public.push_subscriptions(loja_id, ativo);

create table if not exists public.push_eventos_enviados (
  id uuid primary key default gen_random_uuid(),
  chave_unica text not null unique,
  tipo text not null,
  lancamento_id uuid references public.lancamentos(id) on delete cascade,
  loja_id uuid references public.lojas(id) on delete cascade,
  criado_em timestamptz not null default now()
);

create unique index if not exists push_eventos_enviados_chave_idx
on public.push_eventos_enviados(chave_unica);

create index if not exists push_eventos_enviados_lancamento_idx
on public.push_eventos_enviados(lancamento_id);

alter table public.push_subscriptions enable row level security;
alter table public.push_eventos_enviados enable row level security;

-- As Edge Functions usam SERVICE_ROLE_KEY e ignoram RLS.
-- Por segurança, o site não grava direto nessas tabelas.
