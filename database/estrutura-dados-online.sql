-- ValiSys - Estrutura inicial para dados online
-- Rode este arquivo no dados online > SQL Editor.
-- Esta é a FASE 1: dados online para sincronizar celulares.
-- Observação: as policies abaixo estão simples para protótipo.
-- Na versão comercial final, use dados online Auth + regras de acesso por loja.

create extension if not exists "pgcrypto";

-- Lojas
create table if not exists public.lojas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  responsavel text,
  telefone text,
  imagem text,
  status text not null default 'ativa',
  criada_em timestamptz not null default now()
);

-- Funcionários / usuários internos do sistema
create table if not exists public.funcionarios (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid references public.lojas(id) on delete restrict,
  nome text not null,
  cargo text not null check (cargo in ('promotor', 'encarregado', 'gerente', 'admin')),
  codigo_acesso text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

-- Produtos cadastrados ou puxados da base de produtos
create table if not exists public.produtos (
  id uuid primary key default gen_random_uuid(),
  ean text not null unique,
  nome text not null,
  marca text,
  fabricante text,
  sabor text,
  categoria text,
  quantidade_padrao text,
  porcao text,
  embalagem text,
  origem text,
  paises text,
  lojas_encontradas text,
  ingredientes text,
  alergicos text,
  rastros text,
  nutriscore text,
  ecoscore text,
  nova text,
  foto text,
  fonte text,
  criado_em timestamptz not null default now()
);

-- Lançamentos de validade
create table if not exists public.lancamentos (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid references public.lojas(id) on delete restrict,
  produto_id uuid references public.produtos(id) on delete set null,
  ean text,
  nome_produto text not null,
  marca text,
  fabricante text,
  sabor text,
  categoria text,
  setor text not null,
  quantidade numeric not null default 1,
  validade date not null,
  foto text,
  status text not null default 'ativo' check (status in ('ativo', 'retirado')),
  usuario_nome text,
  usuario_cargo text,
  retirado_em timestamptz,
  retirado_por text,
  criado_em timestamptz not null default now()
);

-- Notificações internas
create table if not exists public.notificacoes (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid references public.lojas(id) on delete cascade,
  tipo text not null default 'aviso',
  titulo text not null,
  mensagem text not null,
  lancamento_id uuid references public.lancamentos(id) on delete set null,
  produto text,
  setor text,
  validade date,
  criado_por text,
  lida boolean not null default false,
  criado_em timestamptz not null default now()
);

-- Índices para deixar filtros rápidos
create index if not exists idx_funcionarios_loja on public.funcionarios(loja_id);
create index if not exists idx_lancamentos_loja on public.lancamentos(loja_id);
create index if not exists idx_lancamentos_validade on public.lancamentos(validade);
create index if not exists idx_lancamentos_status on public.lancamentos(status);
create index if not exists idx_produtos_ean on public.produtos(ean);
create index if not exists idx_notificacoes_loja on public.notificacoes(loja_id);

-- Loja de demonstração
insert into public.lojas (nome, responsavel, telefone)
select 'Mercado Demonstração', 'Gerente Demonstração', ''
where not exists (
  select 1 from public.lojas where nome = 'Mercado Demonstração'
);

-- IMPORTANTE SOBRE SEGURANÇA:
-- Para protótipo rápido, você pode deixar as tabelas sem regras de acesso enquanto testa.
-- Para vender/comercializar, ative regras de acesso e use dados online Auth.

-- Exemplo de ativação futura de regras de acesso:
-- alter table public.lojas enable row level security;
-- alter table public.funcionarios enable row level security;
-- alter table public.produtos enable row level security;
-- alter table public.lancamentos enable row level security;
-- alter table public.notificacoes enable row level security;
