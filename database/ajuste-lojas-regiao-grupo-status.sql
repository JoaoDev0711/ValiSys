-- ValiSys - Região, grupo/rede e ativação de loja
-- Rode no painel de dados para liberar os novos campos da Dashboard Admin.

alter table public.lojas
add column if not exists regiao text;

alter table public.lojas
add column if not exists grupo text;

alter table public.lojas
add column if not exists imagem text;

alter table public.lojas
alter column status set default 'ativa';

update public.lojas
set status = 'ativa'
where status is null or status = '';

-- Exemplos opcionais:
-- update public.lojas set grupo = 'Bahamas', regiao = 'Fortaleza' where nome ilike '%bahamas%';
-- update public.lojas set grupo = 'Frangolândia', regiao = 'Fortaleza' where nome ilike '%frangolandia%';
