-- ValiSys - Imagem/logo da loja
-- Rode no painel de dados caso sua tabela lojas ainda não tenha o campo imagem.

alter table public.lojas
add column if not exists imagem text;
