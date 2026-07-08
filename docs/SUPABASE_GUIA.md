# ValiSys + Supabase

Esta versão ainda mantém o sistema atual funcionando com `localStorage`, mas já traz os arquivos para começar a migração para banco online.

## Arquivos adicionados

- `supabase-setup.sql`: cria as tabelas no Supabase.
- `supabase-config.js`: onde você coloca URL e chave pública do projeto.
- `supabase-service.js`: funções prontas para acessar lojas, funcionários, produtos, lançamentos e notificações no Supabase.

## Como configurar

1. Acesse o Supabase e crie um novo projeto.
2. Abra o projeto.
3. Vá em `SQL Editor`.
4. Cole e rode o conteúdo do arquivo `supabase-setup.sql`.
5. Vá em `Project Settings > API`.
6. Copie:
   - Project URL
   - anon public key ou publishable key
7. Abra o arquivo `supabase-config.js`.
8. Cole os valores aqui:

```js
const VALISYS_SUPABASE_URL = "sua-url";
const VALISYS_SUPABASE_ANON_KEY = "sua-chave-publica";
```

## Importante

Não coloque `service_role key` no front-end. Essa chave é secreta e só deve ficar em servidor.

## Fase 1

A fase 1 serve para preparar a estrutura e começar a migrar telas.

## Fase 2

Na fase 2, as telas principais devem trocar o `localStorage` por chamadas do `valisysDB`:

- escolher loja -> `valisysDB.listarLojas()`
- cadastrar loja -> `valisysDB.criarLoja()`
- cadastrar funcionário -> `valisysDB.criarFuncionario()`
- lançar validade -> `valisysDB.criarLancamento()`
- lista geral -> `valisysDB.listarLancamentos()`
- retirada -> `valisysDB.marcarRetirado()`

## Vários celulares

Com Supabase configurado e as telas migradas, a lista completa deixa de ser do celular e passa a vir do banco online.

```txt
Promotor lança no celular dele
↓
Supabase salva online
↓
Gerente abre no celular dele
↓
Lista completa aparece atualizada
```
