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
-- TABELA: SETORES DA LOJA
-- =========================
create table if not exists public.setores_loja (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid references public.lojas(id) on delete cascade,
  nome text not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

alter table public.setores_loja
add column if not exists loja_id uuid references public.lojas(id) on delete cascade;

alter table public.setores_loja
add column if not exists nome text;

alter table public.setores_loja
add column if not exists ativo boolean not null default true;

alter table public.setores_loja
add column if not exists criado_em timestamptz not null default now();

update public.setores_loja
set ativo = true
where ativo is null;

create index if not exists idx_setores_loja_loja
on public.setores_loja(loja_id);

create index if not exists idx_setores_loja_nome
on public.setores_loja(nome);


-- =========================
-- TABELA: CATÁLOGO INTERNO DE PRODUTOS
-- =========================

create table if not exists public.catalogo_produtos (
  id uuid primary key default gen_random_uuid(),
  codigo_interno text,
  ean text,
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
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

alter table public.catalogo_produtos
add column if not exists codigo_interno text;

alter table public.catalogo_produtos
add column if not exists ean text;

alter table public.catalogo_produtos
add column if not exists nome text;

alter table public.catalogo_produtos
add column if not exists marca text;

alter table public.catalogo_produtos
add column if not exists fabricante text;

alter table public.catalogo_produtos
add column if not exists sabor text;

alter table public.catalogo_produtos
add column if not exists categoria text;

alter table public.catalogo_produtos
add column if not exists quantidade_padrao text;

alter table public.catalogo_produtos
add column if not exists porcao text;

alter table public.catalogo_produtos
add column if not exists embalagem text;

alter table public.catalogo_produtos
add column if not exists origem text;

alter table public.catalogo_produtos
add column if not exists paises text;

alter table public.catalogo_produtos
add column if not exists lojas_encontradas text;

alter table public.catalogo_produtos
add column if not exists ingredientes text;

alter table public.catalogo_produtos
add column if not exists alergicos text;

alter table public.catalogo_produtos
add column if not exists rastros text;

alter table public.catalogo_produtos
add column if not exists nutriscore text;

alter table public.catalogo_produtos
add column if not exists ecoscore text;

alter table public.catalogo_produtos
add column if not exists nova text;

alter table public.catalogo_produtos
add column if not exists foto text;

alter table public.catalogo_produtos
add column if not exists fonte text;

alter table public.catalogo_produtos
add column if not exists ativo boolean not null default true;

alter table public.catalogo_produtos
add column if not exists criado_em timestamptz not null default now();

create unique index if not exists idx_catalogo_produtos_codigo_interno
on public.catalogo_produtos(codigo_interno)
where codigo_interno is not null and codigo_interno <> '';


do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'catalogo_produtos_codigo_interno_unique'
  ) then
    begin
      alter table public.catalogo_produtos
      add constraint catalogo_produtos_codigo_interno_unique unique (codigo_interno);
    exception
      when others then
        raise notice 'Não foi possível criar unique em catalogo_produtos.codigo_interno. Verifique duplicados.';
    end;
  end if;
end $$;



create index if not exists idx_catalogo_produtos_ean
on public.catalogo_produtos(ean);

create index if not exists idx_catalogo_produtos_nome
on public.catalogo_produtos(nome);

create index if not exists idx_catalogo_produtos_marca
on public.catalogo_produtos(marca);

create index if not exists idx_catalogo_produtos_categoria
on public.catalogo_produtos(categoria);

insert into public.catalogo_produtos (
  codigo_interno,
  ean,
  nome,
  marca,
  fabricante,
  sabor,
  categoria,
  quantidade_padrao,
  porcao,
  embalagem,
  origem,
  paises,
  lojas_encontradas,
  ingredientes,
  alergicos,
  rastros,
  nutriscore,
  ecoscore,
  nova,
  foto,
  fonte,
  ativo
)
values
('BASE-0001', null, 'Arroz Tipo 1 1kg', 'Camil', 'Camil Alimentos', '', 'Arroz', '1kg', '', 'Pacote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0002', null, 'Arroz Tipo 1 5kg', 'Camil', 'Camil Alimentos', '', 'Arroz', '5kg', '', 'Pacote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0003', null, 'Arroz Tipo 1 1kg', 'Tio João', 'Josapar', '', 'Arroz', '1kg', '', 'Pacote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0004', null, 'Arroz Tipo 1 5kg', 'Tio João', 'Josapar', '', 'Arroz', '5kg', '', 'Pacote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0005', null, 'Arroz Parboilizado 1kg', 'Urbano', 'Urbano Agroindustrial', '', 'Arroz', '1kg', '', 'Pacote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0006', null, 'Feijão Carioca 1kg', 'Camil', 'Camil Alimentos', '', 'Feijão', '1kg', '', 'Pacote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0007', null, 'Feijão Preto 1kg', 'Camil', 'Camil Alimentos', '', 'Feijão', '1kg', '', 'Pacote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0008', null, 'Feijão Carioca 1kg', 'Kicaldo', 'Kicaldo', '', 'Feijão', '1kg', '', 'Pacote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0009', null, 'Açúcar Cristal 1kg', 'União', 'Camil Alimentos', '', 'Açúcar', '1kg', '', 'Pacote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0010', null, 'Açúcar Refinado 1kg', 'União', 'Camil Alimentos', '', 'Açúcar', '1kg', '', 'Pacote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0011', null, 'Açúcar Cristal 1kg', 'Caravelas', 'Caravelas', '', 'Açúcar', '1kg', '', 'Pacote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0012', null, 'Sal Refinado 1kg', 'Cisne', 'Cisne', '', 'Sal', '1kg', '', 'Pacote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0013', null, 'Sal Refinado 1kg', 'Lebre', 'Lebre', '', 'Sal', '1kg', '', 'Pacote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0014', null, 'Farinha de Trigo Tradicional 1kg', 'Dona Benta', 'J. Macêdo', '', 'Farinhas', '1kg', '', 'Pacote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0015', null, 'Farinha de Trigo Sem Fermento 1kg', 'Finna', 'M. Dias Branco', '', 'Farinhas', '1kg', '', 'Pacote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0016', null, 'Farinha de Trigo Com Fermento 1kg', 'Finna', 'M. Dias Branco', '', 'Farinhas', '1kg', '', 'Pacote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0017', null, 'Farinha de Mandioca 1kg', 'Yoki', 'General Mills Brasil', '', 'Farinhas', '1kg', '', 'Pacote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0018', null, 'Fubá Mimoso 500g', 'Yoki', 'General Mills Brasil', '', 'Farinhas', '500g', '', 'Pacote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0019', null, 'Massa de Cuscuz 500g', 'Vitamilho', 'Vitamilho', '', 'Cereais', '500g', '', 'Pacote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0020', null, 'Massa de Cuscuz 500g', 'Kimilho', 'Yoki', '', 'Cereais', '500g', '', 'Pacote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0021', null, 'Macarrão Espaguete 500g', 'Vitarella', 'M. Dias Branco', '', 'Massas', '500g', '', 'Pacote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0022', null, 'Macarrão Espaguete 500g', 'Adria', 'M. Dias Branco', '', 'Massas', '500g', '', 'Pacote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0023', null, 'Macarrão Parafuso 500g', 'Dona Benta', 'J. Macêdo', '', 'Massas', '500g', '', 'Pacote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0024', null, 'Macarrão Instantâneo Galinha Caipira 85g', 'Nissin', 'Nissin Foods', '', 'Massas', '85g', '', 'Pacote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0025', null, 'Macarrão Instantâneo Carne 85g', 'Nissin', 'Nissin Foods', '', 'Massas', '85g', '', 'Pacote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0026', null, 'Molho de Tomate Tradicional 300g', 'Quero', 'Kraft Heinz', '', 'Molhos', '300g', '', 'Sachê', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0027', null, 'Molho de Tomate Tradicional 340g', 'Pomarola', 'Cargill', '', 'Molhos', '340g', '', 'Sachê', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0028', null, 'Extrato de Tomate 340g', 'Elefante', 'Cargill', '', 'Molhos', '340g', '', 'Lata', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0029', null, 'Milho Verde 170g', 'Quero', 'Kraft Heinz', '', 'Conservas', '170g', '', 'Lata', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0030', null, 'Ervilha 170g', 'Quero', 'Kraft Heinz', '', 'Conservas', '170g', '', 'Lata', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0031', null, 'Sardinha em Óleo 125g', 'Gomes da Costa', 'Gomes da Costa', '', 'Conservas', '125g', '', 'Lata', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0032', null, 'Atum Sólido em Óleo 170g', 'Gomes da Costa', 'Gomes da Costa', '', 'Conservas', '170g', '', 'Lata', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0033', null, 'Óleo de Soja 900ml', 'Soya', 'Bunge', '', 'Óleos', '900ml', '', 'Garrafa', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0034', null, 'Óleo de Soja 900ml', 'Liza', 'Cargill', '', 'Óleos', '900ml', '', 'Garrafa', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0035', null, 'Óleo de Soja 900ml', 'Concórdia', 'Bunge', '', 'Óleos', '900ml', '', 'Garrafa', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0036', null, 'Azeite de Oliva Extra Virgem 500ml', 'Gallo', 'Gallo', '', 'Azeites', '500ml', '', 'Vidro', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0037', null, 'Azeite de Oliva Extra Virgem 500ml', 'Andorinha', 'Sovena', '', 'Azeites', '500ml', '', 'Vidro', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0038', null, 'Café Torrado e Moído 250g', 'Pilão', 'JDE', '', 'Café', '250g', '', 'Pacote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0039', null, 'Café Torrado e Moído 500g', 'Pilão', 'JDE', '', 'Café', '500g', '', 'Pacote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0040', null, 'Café Torrado e Moído 250g', 'Melitta', 'Melitta', '', 'Café', '250g', '', 'Pacote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0041', null, 'Café Torrado e Moído 250g', '3 Corações', 'Grupo 3corações', '', 'Café', '250g', '', 'Pacote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0042', null, 'Achocolatado em Pó 370g', 'Nescau', 'Nestlé', '', 'Achocolatados', '370g', '', 'Lata', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0043', null, 'Achocolatado em Pó 400g', 'Toddy', 'PepsiCo', '', 'Achocolatados', '400g', '', 'Pote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0044', null, 'Leite em Pó Integral 400g', 'Ninho', 'Nestlé', '', 'Laticínios', '400g', '', 'Lata', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0045', null, 'Leite Condensado 395g', 'Moça', 'Nestlé', '', 'Doces', '395g', '', 'Lata', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0046', null, 'Leite Condensado 395g', 'Italac', 'Italac', '', 'Doces', '395g', '', 'Caixa', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0047', null, 'Creme de Leite 200g', 'Nestlé', 'Nestlé', '', 'Laticínios', '200g', '', 'Caixa', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0048', null, 'Creme de Leite 200g', 'Italac', 'Italac', '', 'Laticínios', '200g', '', 'Caixa', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0049', null, 'Biscoito Cream Cracker 350g', 'Fortaleza', 'M. Dias Branco', '', 'Biscoitos', '350g', '', 'Pacote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0050', null, 'Biscoito Cream Cracker 350g', 'Vitarella', 'M. Dias Branco', '', 'Biscoitos', '350g', '', 'Pacote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0051', null, 'Biscoito Recheado Chocolate 126g', 'Trakinas', 'Mondelez', '', 'Biscoitos', '126g', '', 'Pacote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0052', null, 'Biscoito Recheado Morango 126g', 'Trakinas', 'Mondelez', '', 'Biscoitos', '126g', '', 'Pacote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0053', null, 'Biscoito Recheado Chocolate 90g', 'Passatempo', 'Nestlé', '', 'Biscoitos', '90g', '', 'Pacote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0054', null, 'Biscoito Wafer Chocolate 100g', 'Bauducco', 'Bauducco', '', 'Biscoitos', '100g', '', 'Pacote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0055', null, 'Torrada Tradicional 142g', 'Bauducco', 'Bauducco', '', 'Biscoitos', '142g', '', 'Pacote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0056', null, 'Chocolate ao Leite 90g', 'Garoto', 'Nestlé', '', 'Chocolates', '90g', '', 'Barra', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0057', null, 'Chocolate ao Leite 90g', 'Lacta', 'Mondelez', '', 'Chocolates', '90g', '', 'Barra', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0058', null, 'Chocolate KitKat 41,5g', 'KitKat', 'Nestlé', '', 'Chocolates', '41,5g', '', 'Unidade', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0059', null, 'Refrigerante Cola 2L', 'Coca-Cola', 'The Coca-Cola Company', '', 'Bebidas', '2L', '', 'Garrafa PET', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0060', null, 'Refrigerante Guaraná 2L', 'Guaraná Antarctica', 'Ambev', '', 'Bebidas', '2L', '', 'Garrafa PET', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0061', null, 'Refrigerante Guaraná 2L', 'Kuat', 'The Coca-Cola Company', '', 'Bebidas', '2L', '', 'Garrafa PET', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0062', null, 'Refrigerante Laranja 2L', 'Fanta', 'The Coca-Cola Company', '', 'Bebidas', '2L', '', 'Garrafa PET', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0063', null, 'Refrigerante Limão 2L', 'Sprite', 'The Coca-Cola Company', '', 'Bebidas', '2L', '', 'Garrafa PET', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0064', null, 'Água Mineral sem Gás 500ml', 'Crystal', 'The Coca-Cola Company', '', 'Bebidas', '500ml', '', 'Garrafa', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0065', null, 'Água Mineral sem Gás 1,5L', 'Indaiá', 'Minalba Brasil', '', 'Bebidas', '1,5L', '', 'Garrafa', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0066', null, 'Suco Néctar Uva 1L', 'Del Valle', 'The Coca-Cola Company', '', 'Bebidas', '1L', '', 'Caixa', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0067', null, 'Suco Néctar Pêssego 1L', 'Del Valle', 'The Coca-Cola Company', '', 'Bebidas', '1L', '', 'Caixa', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0068', null, 'Suco Néctar Uva 1L', 'Maguary', 'Britvic Brasil', '', 'Bebidas', '1L', '', 'Caixa', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0069', null, 'Bebida Láctea Chocolate 200ml', 'Toddynho', 'PepsiCo', '', 'Bebidas', '200ml', '', 'Caixa', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0070', null, 'Energético 250ml', 'Red Bull', 'Red Bull', '', 'Bebidas', '250ml', '', 'Lata', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0071', null, 'Leite UHT Integral 1L', 'Italac', 'Italac', '', 'Laticínios', '1L', '', 'Caixa', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0072', null, 'Leite UHT Integral 1L', 'Piracanjuba', 'Piracanjuba', '', 'Laticínios', '1L', '', 'Caixa', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0073', null, 'Leite UHT Desnatado 1L', 'Piracanjuba', 'Piracanjuba', '', 'Laticínios', '1L', '', 'Caixa', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0074', null, 'Leite UHT Integral 1L', 'Betânia', 'Betânia Lácteos', '', 'Laticínios', '1L', '', 'Caixa', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0075', null, 'Iogurte Morango 170g', 'Nestlé', 'Nestlé', '', 'Laticínios', '170g', '', 'Pote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0076', null, 'Iogurte Morango 170g', 'Danone', 'Danone', '', 'Laticínios', '170g', '', 'Pote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0077', null, 'Iogurte Natural 170g', 'Vigor', 'Vigor', '', 'Laticínios', '170g', '', 'Pote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0078', null, 'Requeijão Cremoso 200g', 'Vigor', 'Vigor', '', 'Laticínios', '200g', '', 'Pote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0079', null, 'Requeijão Cremoso 200g', 'Itambé', 'Itambé', '', 'Laticínios', '200g', '', 'Pote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0080', null, 'Margarina com Sal 500g', 'Qualy', 'BRF', '', 'Margarinas', '500g', '', 'Pote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0081', null, 'Margarina com Sal 500g', 'Delícia', 'Upfield', '', 'Margarinas', '500g', '', 'Pote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0082', null, 'Manteiga com Sal 200g', 'Aviação', 'Aviação', '', 'Laticínios', '200g', '', 'Tablete', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0083', null, 'Queijo Mussarela Fatiado 150g', 'Sadia', 'BRF', '', 'Frios', '150g', '', 'Pacote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0084', null, 'Presunto Fatiado 180g', 'Sadia', 'BRF', '', 'Frios', '180g', '', 'Pacote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0085', null, 'Salsicha Hot Dog 500g', 'Sadia', 'BRF', '', 'Frios', '500g', '', 'Pacote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0086', null, 'Salsicha Hot Dog 500g', 'Perdigão', 'BRF', '', 'Frios', '500g', '', 'Pacote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0087', null, 'Detergente Líquido Neutro 500ml', 'Ypê', 'Química Amparo', '', 'Limpeza', '500ml', '', 'Frasco', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0088', null, 'Detergente Líquido Limão 500ml', 'Ypê', 'Química Amparo', '', 'Limpeza', '500ml', '', 'Frasco', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0089', null, 'Sabão em Pó 800g', 'OMO', 'Unilever', '', 'Limpeza', '800g', '', 'Caixa', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0090', null, 'Sabão em Pó 1,6kg', 'OMO', 'Unilever', '', 'Limpeza', '1,6kg', '', 'Caixa', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0091', null, 'Sabão em Pó 800g', 'Tixan Ypê', 'Química Amparo', '', 'Limpeza', '800g', '', 'Caixa', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0092', null, 'Amaciante Concentrado 500ml', 'Comfort', 'Unilever', '', 'Limpeza', '500ml', '', 'Frasco', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0093', null, 'Amaciante 2L', 'Ypê', 'Química Amparo', '', 'Limpeza', '2L', '', 'Frasco', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0094', null, 'Água Sanitária 1L', 'Qboa', 'Qboa', '', 'Limpeza', '1L', '', 'Frasco', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0095', null, 'Desinfetante Lavanda 500ml', 'Pinho Sol', 'Colgate-Palmolive', '', 'Limpeza', '500ml', '', 'Frasco', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0096', null, 'Limpador Multiuso 500ml', 'Veja', 'Reckitt', '', 'Limpeza', '500ml', '', 'Frasco', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0097', null, 'Esponja Multiuso 4 un', 'Scotch-Brite', '3M', '', 'Limpeza', '4 un', '', 'Pacote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0098', null, 'Sabonete 85g', 'Dove', 'Unilever', '', 'Higiene e Perfumaria', '85g', '', 'Unidade', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0099', null, 'Sabonete 85g', 'Lux', 'Unilever', '', 'Higiene e Perfumaria', '85g', '', 'Unidade', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0100', null, 'Sabonete 90g', 'Protex', 'Colgate-Palmolive', '', 'Higiene e Perfumaria', '90g', '', 'Unidade', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0101', null, 'Creme Dental 90g', 'Colgate', 'Colgate-Palmolive', '', 'Higiene e Perfumaria', '90g', '', 'Tubo', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0102', null, 'Creme Dental 90g', 'Sorriso', 'Colgate-Palmolive', '', 'Higiene e Perfumaria', '90g', '', 'Tubo', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0103', null, 'Shampoo 350ml', 'Seda', 'Unilever', '', 'Higiene e Perfumaria', '350ml', '', 'Frasco', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0104', null, 'Shampoo 400ml', 'Pantene', 'Procter & Gamble', '', 'Higiene e Perfumaria', '400ml', '', 'Frasco', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0105', null, 'Condicionador 350ml', 'Seda', 'Unilever', '', 'Higiene e Perfumaria', '350ml', '', 'Frasco', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0106', null, 'Desodorante Aerosol 150ml', 'Rexona', 'Unilever', '', 'Higiene e Perfumaria', '150ml', '', 'Aerosol', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0107', null, 'Papel Higiênico Folha Dupla 12 rolos', 'Neve', 'Kimberly-Clark', '', 'Higiene e Perfumaria', '12 rolos', '', 'Pacote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0108', null, 'Papel Higiênico Folha Dupla 16 rolos', 'Personal', 'Santher', '', 'Higiene e Perfumaria', '16 rolos', '', 'Pacote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0109', null, 'Ração Cães Adultos Carne 1kg', 'Pedigree', 'Mars', '', 'Pet', '1kg', '', 'Pacote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0110', null, 'Ração Gatos Adultos Carne 1kg', 'Whiskas', 'Mars', '', 'Pet', '1kg', '', 'Pacote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true),
('BASE-0111', null, 'Ração Cães Adultos 1kg', 'Golden', 'PremieRpet', '', 'Pet', '1kg', '', 'Pacote', 'Brasil', 'Brasil', '', '', '', '', '', '', '', '', 'Catálogo interno ValiSys', true)
on conflict do nothing;


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
  ativo boolean not null default true,
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
add column if not exists ativo boolean not null default true;

update public.produtos
set ativo = true
where ativo is null;

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
-- TABELA: SAC ONLINE
-- =========================
create table if not exists public.sac_mensagens (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  contato text not null,
  mensagem text not null,
  status text not null default 'nova',
  origem text,
  criado_em timestamptz not null default now()
);

alter table public.sac_mensagens
add column if not exists nome text;

alter table public.sac_mensagens
add column if not exists contato text;

alter table public.sac_mensagens
add column if not exists mensagem text;

alter table public.sac_mensagens
add column if not exists status text not null default 'nova';

alter table public.sac_mensagens
add column if not exists origem text;

alter table public.sac_mensagens
add column if not exists criado_em timestamptz not null default now();

update public.sac_mensagens
set status = 'nova'
where status is null or status = '';

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
create index if not exists idx_sac_mensagens_status on public.sac_mensagens(status);
create index if not exists idx_sac_mensagens_criado_em on public.sac_mensagens(criado_em);

-- =========================
-- REGRAS DE ACESSO PARA TESTE
-- Importante:
-- Estas permissões liberam leitura/escrita pelo front-end estático.
-- Para produção real, o correto é trocar por autenticação real e regras por usuário/loja.
-- =========================
alter table public.lojas enable row level security;
alter table public.funcionarios enable row level security;
alter table public.marcas_promotoria enable row level security;
alter table public.setores_loja enable row level security;
alter table public.catalogo_produtos enable row level security;
alter table public.produtos enable row level security;
alter table public.lancamentos enable row level security;
alter table public.notificacoes enable row level security;
alter table public.sac_mensagens enable row level security;

drop policy if exists "ValiSys select lojas" on public.lojas;
drop policy if exists "ValiSys insert lojas" on public.lojas;
drop policy if exists "ValiSys update lojas" on public.lojas;
drop policy if exists "ValiSys delete lojas" on public.lojas;

drop policy if exists "ValiSys select funcionarios" on public.funcionarios;
drop policy if exists "ValiSys insert funcionarios" on public.funcionarios;
drop policy if exists "ValiSys update funcionarios" on public.funcionarios;
drop policy if exists "ValiSys delete funcionarios" on public.funcionarios;

drop policy if exists "ValiSys select marcas_promotoria" on public.marcas_promotoria;
drop policy if exists "ValiSys select setores_loja" on public.setores_loja;
drop policy if exists "ValiSys insert setores_loja" on public.setores_loja;
drop policy if exists "ValiSys update setores_loja" on public.setores_loja;
drop policy if exists "ValiSys delete setores_loja" on public.setores_loja;
drop policy if exists "ValiSys insert marcas_promotoria" on public.marcas_promotoria;
drop policy if exists "ValiSys update marcas_promotoria" on public.marcas_promotoria;
drop policy if exists "ValiSys delete marcas_promotoria" on public.marcas_promotoria;

drop policy if exists "ValiSys select catalogo_produtos" on public.catalogo_produtos;
drop policy if exists "ValiSys insert catalogo_produtos" on public.catalogo_produtos;
drop policy if exists "ValiSys update catalogo_produtos" on public.catalogo_produtos;
drop policy if exists "ValiSys delete catalogo_produtos" on public.catalogo_produtos;

drop policy if exists "ValiSys select produtos" on public.produtos;
drop policy if exists "ValiSys insert produtos" on public.produtos;
drop policy if exists "ValiSys update produtos" on public.produtos;
drop policy if exists "ValiSys delete produtos" on public.produtos;

drop policy if exists "ValiSys select lancamentos" on public.lancamentos;
drop policy if exists "ValiSys insert lancamentos" on public.lancamentos;
drop policy if exists "ValiSys update lancamentos" on public.lancamentos;
drop policy if exists "ValiSys delete lancamentos" on public.lancamentos;

drop policy if exists "ValiSys select notificacoes" on public.notificacoes;
drop policy if exists "ValiSys select sac_mensagens" on public.sac_mensagens;
drop policy if exists "ValiSys insert sac_mensagens" on public.sac_mensagens;
drop policy if exists "ValiSys update sac_mensagens" on public.sac_mensagens;
drop policy if exists "ValiSys delete sac_mensagens" on public.sac_mensagens;
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

create policy "ValiSys select setores_loja" on public.setores_loja
for select to anon using (true);

create policy "ValiSys insert setores_loja" on public.setores_loja
for insert to anon with check (true);

create policy "ValiSys update setores_loja" on public.setores_loja
for update to anon using (true) with check (true);

create policy "ValiSys delete setores_loja" on public.setores_loja
for delete to anon using (true);

create policy "ValiSys select catalogo_produtos" on public.catalogo_produtos
for select to anon using (true);

create policy "ValiSys insert catalogo_produtos" on public.catalogo_produtos
for insert to anon with check (true);

create policy "ValiSys update catalogo_produtos" on public.catalogo_produtos
for update to anon using (true) with check (true);

create policy "ValiSys delete catalogo_produtos" on public.catalogo_produtos
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

create policy "ValiSys select sac_mensagens" on public.sac_mensagens
for select to anon using (true);

create policy "ValiSys insert sac_mensagens" on public.sac_mensagens
for insert to anon with check (true);

create policy "ValiSys update sac_mensagens" on public.sac_mensagens
for update to anon using (true) with check (true);

create policy "ValiSys delete sac_mensagens" on public.sac_mensagens
for delete to anon using (true);

-- =========================
-- FIM
-- =========================
select 'ValiSys SQL único aplicado com sucesso.' as resultado;



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
