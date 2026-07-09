-- =========================================================
-- ValiSys / Vencimentos - SQL ÚNICO
-- Rode este arquivo uma vez no SQL Editor.
--
-- Este SQL cria/atualiza tudo que o sistema precisa:
-- lojas, funcionários, produtos, lançamentos, notificações,
-- imagem da loja, região, grupo/rede, cor da rede e status.
-- =========================================================

create extension if not exists pgcrypto;

-- =========================
-- TABELA: LOJAS
-- =========================
create table if not exists public.lojas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  responsavel text,
  telefone text,
  imagem text,
  regiao text,
  grupo text,
  cor_tema text,
  status text not null default 'ativa',
  criada_em timestamptz not null default now()
);

alter table public.lojas
add column if not exists responsavel text;

alter table public.lojas
add column if not exists telefone text;

alter table public.lojas
add column if not exists imagem text;

alter table public.lojas
add column if not exists regiao text;

alter table public.lojas
add column if not exists grupo text;

alter table public.lojas
add column if not exists cor_tema text;

alter table public.lojas
add column if not exists status text not null default 'ativa';

alter table public.lojas
add column if not exists criada_em timestamptz not null default now();

alter table public.lojas
alter column status set default 'ativa';

update public.lojas
set status = 'ativa'
where status is null or status = '';

-- =========================
-- TABELA: FUNCIONÁRIOS
-- =========================
create table if not exists public.funcionarios (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid references public.lojas(id) on delete set null,
  nome text not null,
  cargo text not null,
  setor text,
  marca_promotoria text,
  codigo_acesso text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

alter table public.funcionarios
add column if not exists loja_id uuid references public.lojas(id) on delete set null;

alter table public.funcionarios
add column if not exists nome text;

alter table public.funcionarios
add column if not exists cargo text;

alter table public.funcionarios
add column if not exists setor text;

alter table public.funcionarios
add column if not exists marca_promotoria text;

alter table public.funcionarios
add column if not exists codigo_acesso text;

alter table public.funcionarios
add column if not exists ativo boolean not null default true;

alter table public.funcionarios
add column if not exists criado_em timestamptz not null default now();

update public.funcionarios
set ativo = true
where ativo is null;


-- =========================
-- TABELA: MARCAS DE PROMOTORIA
-- =========================
create table if not exists public.marcas_promotoria (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid references public.lojas(id) on delete cascade,
  nome text not null,
  ativa boolean not null default true,
  criado_em timestamptz not null default now()
);

alter table public.marcas_promotoria
add column if not exists loja_id uuid references public.lojas(id) on delete cascade;

alter table public.marcas_promotoria
add column if not exists nome text;

alter table public.marcas_promotoria
add column if not exists ativa boolean not null default true;

alter table public.marcas_promotoria
add column if not exists criado_em timestamptz not null default now();

update public.marcas_promotoria
set ativa = true
where ativa is null;

create index if not exists idx_marcas_promotoria_loja
on public.marcas_promotoria(loja_id);

create index if not exists idx_marcas_promotoria_nome
on public.marcas_promotoria(nome);

-- =========================
-- TABELA: PRODUTOS
-- =========================
create table if not exists public.produtos (
  id uuid primary key default gen_random_uuid(),
  ean text not null,
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

alter table public.produtos
add column if not exists ean text;

alter table public.produtos
add column if not exists nome text;

alter table public.produtos
add column if not exists marca text;

alter table public.produtos
add column if not exists fabricante text;

alter table public.produtos
add column if not exists sabor text;

alter table public.produtos
add column if not exists categoria text;

alter table public.produtos
add column if not exists quantidade_padrao text;

alter table public.produtos
add column if not exists porcao text;

alter table public.produtos
add column if not exists embalagem text;

alter table public.produtos
add column if not exists origem text;

alter table public.produtos
add column if not exists paises text;

alter table public.produtos
add column if not exists lojas_encontradas text;

alter table public.produtos
add column if not exists ingredientes text;

alter table public.produtos
add column if not exists alergicos text;

alter table public.produtos
add column if not exists rastros text;

alter table public.produtos
add column if not exists nutriscore text;

alter table public.produtos
add column if not exists ecoscore text;

alter table public.produtos
add column if not exists nova text;

alter table public.produtos
add column if not exists foto text;

alter table public.produtos
add column if not exists fonte text;

alter table public.produtos
add column if not exists criado_em timestamptz not null default now();

-- Garante EAN único quando possível.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'produtos_ean_unique'
  ) then
    begin
      alter table public.produtos
      add constraint produtos_ean_unique unique (ean);
    exception
      when others then
        raise notice 'Não foi possível criar unique em produtos.ean. Verifique se existem EAN duplicados.';
    end;
  end if;
end $$;

-- =========================
-- TABELA: LANÇAMENTOS
-- =========================
create table if not exists public.lancamentos (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid references public.lojas(id) on delete set null,
  produto_id uuid references public.produtos(id) on delete set null,
  ean text,
  nome_produto text not null,
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
  fonte text,
  setor text,
  quantidade integer not null default 1,
  validade date not null,
  foto text,
  status text not null default 'ativo',
  usuario_nome text,
  usuario_cargo text,
  retirado_em timestamptz,
  retirado_por text,
  criado_em timestamptz not null default now()
);

alter table public.lancamentos
add column if not exists loja_id uuid references public.lojas(id) on delete set null;

alter table public.lancamentos
add column if not exists produto_id uuid references public.produtos(id) on delete set null;

alter table public.lancamentos
add column if not exists ean text;

alter table public.lancamentos
add column if not exists nome_produto text;

alter table public.lancamentos
add column if not exists marca text;

alter table public.lancamentos
add column if not exists fabricante text;

alter table public.lancamentos
add column if not exists sabor text;

alter table public.lancamentos
add column if not exists categoria text;

alter table public.lancamentos
add column if not exists quantidade_padrao text;

alter table public.lancamentos
add column if not exists porcao text;

alter table public.lancamentos
add column if not exists embalagem text;

alter table public.lancamentos
add column if not exists origem text;

alter table public.lancamentos
add column if not exists paises text;

alter table public.lancamentos
add column if not exists lojas_encontradas text;

alter table public.lancamentos
add column if not exists ingredientes text;

alter table public.lancamentos
add column if not exists alergicos text;

alter table public.lancamentos
add column if not exists rastros text;

alter table public.lancamentos
add column if not exists nutriscore text;

alter table public.lancamentos
add column if not exists ecoscore text;

alter table public.lancamentos
add column if not exists nova text;

alter table public.lancamentos
add column if not exists fonte text;

alter table public.lancamentos
add column if not exists setor text;

alter table public.lancamentos
add column if not exists quantidade integer not null default 1;

alter table public.lancamentos
add column if not exists validade date;

alter table public.lancamentos
add column if not exists foto text;

alter table public.lancamentos
add column if not exists status text not null default 'ativo';

alter table public.lancamentos
add column if not exists usuario_nome text;

alter table public.lancamentos
add column if not exists usuario_cargo text;

alter table public.lancamentos
add column if not exists retirado_em timestamptz;

alter table public.lancamentos
add column if not exists retirado_por text;

alter table public.lancamentos
add column if not exists criado_em timestamptz not null default now();

update public.lancamentos
set status = 'ativo'
where status is null or status = '';

-- =========================
-- TABELA: NOTIFICAÇÕES
-- =========================
create table if not exists public.notificacoes (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid references public.lojas(id) on delete set null,
  tipo text not null default 'aviso',
  titulo text,
  mensagem text,
  lancamento_id uuid references public.lancamentos(id) on delete set null,
  produto text,
  setor text,
  validade date,
  criado_por text,
  lida boolean not null default false,
  criado_em timestamptz not null default now()
);

alter table public.notificacoes
add column if not exists loja_id uuid references public.lojas(id) on delete set null;

alter table public.notificacoes
add column if not exists tipo text not null default 'aviso';

alter table public.notificacoes
add column if not exists titulo text;

alter table public.notificacoes
add column if not exists mensagem text;

alter table public.notificacoes
add column if not exists lancamento_id uuid references public.lancamentos(id) on delete set null;

alter table public.notificacoes
add column if not exists produto text;

alter table public.notificacoes
add column if not exists setor text;

alter table public.notificacoes
add column if not exists validade date;

alter table public.notificacoes
add column if not exists criado_por text;

alter table public.notificacoes
add column if not exists lida boolean not null default false;

alter table public.notificacoes
add column if not exists criado_em timestamptz not null default now();

update public.notificacoes
set lida = false
where lida is null;

-- =========================
-- ÍNDICES
-- =========================
create index if not exists idx_lojas_status on public.lojas(status);
create index if not exists idx_lojas_grupo on public.lojas(grupo);
create index if not exists idx_lojas_regiao on public.lojas(regiao);

create index if not exists idx_funcionarios_loja on public.funcionarios(loja_id);
create index if not exists idx_funcionarios_cargo on public.funcionarios(cargo);
create index if not exists idx_funcionarios_ativo on public.funcionarios(ativo);
create index if not exists idx_funcionarios_marca_promotoria on public.funcionarios(marca_promotoria);

create index if not exists idx_produtos_ean on public.produtos(ean);

create index if not exists idx_lancamentos_loja on public.lancamentos(loja_id);
create index if not exists idx_lancamentos_validade on public.lancamentos(validade);
create index if not exists idx_lancamentos_status on public.lancamentos(status);
create index if not exists idx_lancamentos_setor on public.lancamentos(setor);

create index if not exists idx_notificacoes_loja on public.notificacoes(loja_id);
create index if not exists idx_notificacoes_lida on public.notificacoes(lida);

-- =========================
-- REGRAS DE ACESSO PARA TESTE
-- Importante:
-- Estas permissões liberam leitura/escrita pelo front-end estático.
-- Para produção real, o correto é trocar por autenticação real e regras por usuário/loja.
-- =========================
alter table public.lojas enable row level security;
alter table public.funcionarios enable row level security;
alter table public.marcas_promotoria enable row level security;
alter table public.produtos enable row level security;
alter table public.lancamentos enable row level security;
alter table public.notificacoes enable row level security;

drop policy if exists "ValiSys select lojas" on public.lojas;
drop policy if exists "ValiSys insert lojas" on public.lojas;
drop policy if exists "ValiSys update lojas" on public.lojas;
drop policy if exists "ValiSys delete lojas" on public.lojas;

drop policy if exists "ValiSys select funcionarios" on public.funcionarios;
drop policy if exists "ValiSys insert funcionarios" on public.funcionarios;
drop policy if exists "ValiSys update funcionarios" on public.funcionarios;
drop policy if exists "ValiSys delete funcionarios" on public.funcionarios;

drop policy if exists "ValiSys select marcas_promotoria" on public.marcas_promotoria;
drop policy if exists "ValiSys insert marcas_promotoria" on public.marcas_promotoria;
drop policy if exists "ValiSys update marcas_promotoria" on public.marcas_promotoria;
drop policy if exists "ValiSys delete marcas_promotoria" on public.marcas_promotoria;

drop policy if exists "ValiSys select produtos" on public.produtos;
drop policy if exists "ValiSys insert produtos" on public.produtos;
drop policy if exists "ValiSys update produtos" on public.produtos;
drop policy if exists "ValiSys delete produtos" on public.produtos;

drop policy if exists "ValiSys select lancamentos" on public.lancamentos;
drop policy if exists "ValiSys insert lancamentos" on public.lancamentos;
drop policy if exists "ValiSys update lancamentos" on public.lancamentos;
drop policy if exists "ValiSys delete lancamentos" on public.lancamentos;

drop policy if exists "ValiSys select notificacoes" on public.notificacoes;
drop policy if exists "ValiSys insert notificacoes" on public.notificacoes;
drop policy if exists "ValiSys update notificacoes" on public.notificacoes;
drop policy if exists "ValiSys delete notificacoes" on public.notificacoes;

create policy "ValiSys select lojas" on public.lojas
for select to anon using (true);

create policy "ValiSys insert lojas" on public.lojas
for insert to anon with check (true);

create policy "ValiSys update lojas" on public.lojas
for update to anon using (true) with check (true);

create policy "ValiSys delete lojas" on public.lojas
for delete to anon using (true);

create policy "ValiSys select funcionarios" on public.funcionarios
for select to anon using (true);

create policy "ValiSys insert funcionarios" on public.funcionarios
for insert to anon with check (true);

create policy "ValiSys update funcionarios" on public.funcionarios
for update to anon using (true) with check (true);

create policy "ValiSys delete funcionarios" on public.funcionarios
for delete to anon using (true);

create policy "ValiSys select marcas_promotoria" on public.marcas_promotoria
for select to anon using (true);

create policy "ValiSys insert marcas_promotoria" on public.marcas_promotoria
for insert to anon with check (true);

create policy "ValiSys update marcas_promotoria" on public.marcas_promotoria
for update to anon using (true) with check (true);

create policy "ValiSys delete marcas_promotoria" on public.marcas_promotoria
for delete to anon using (true);

create policy "ValiSys select produtos" on public.produtos
for select to anon using (true);

create policy "ValiSys insert produtos" on public.produtos
for insert to anon with check (true);

create policy "ValiSys update produtos" on public.produtos
for update to anon using (true) with check (true);

create policy "ValiSys delete produtos" on public.produtos
for delete to anon using (true);

create policy "ValiSys select lancamentos" on public.lancamentos
for select to anon using (true);

create policy "ValiSys insert lancamentos" on public.lancamentos
for insert to anon with check (true);

create policy "ValiSys update lancamentos" on public.lancamentos
for update to anon using (true) with check (true);

create policy "ValiSys delete lancamentos" on public.lancamentos
for delete to anon using (true);

create policy "ValiSys select notificacoes" on public.notificacoes
for select to anon using (true);

create policy "ValiSys insert notificacoes" on public.notificacoes
for insert to anon with check (true);

create policy "ValiSys update notificacoes" on public.notificacoes
for update to anon using (true) with check (true);

create policy "ValiSys delete notificacoes" on public.notificacoes
for delete to anon using (true);

-- =========================
-- FIM
-- =========================
select 'ValiSys SQL único aplicado com sucesso.' as resultado;

