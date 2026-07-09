-- =========================================================
-- ValiSys - Catálogo interno inicial de produtos
-- Produtos sem EAN oficial usam codigo_interno.
-- Use para busca por nome, marca, fabricante e categoria quando o EAN não retornar.
-- =========================================================

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
