-- ValiSys - Ajuste para login por loja e setor
-- Rode no SQL Editor caso sua tabela funcionarios ainda não tenha o campo setor.

alter table public.funcionarios
add column if not exists setor text;

-- Opcional: preencher como Geral quando estiver vazio
update public.funcionarios
set setor = 'Geral'
where setor is null or setor = '';
