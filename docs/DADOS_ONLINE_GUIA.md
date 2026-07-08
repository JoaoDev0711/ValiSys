# ValiSys + sistema

Esta versão ainda mantém o sistema atual funcionando com `localStorage`, mas já traz os arquivos para começar a migração para dados online.

## Arquivos adicionados

- `dados_online-setup.sql`: cria as tabelas no sistema.
- `dados_online-config.js`: onde você coloca URL e chave pública do projeto.
- `dados_online-service.js`: funções prontas para acessar lojas, funcionários, produtos, lançamentos e notificações no sistema.

## Como configurar

1. Acesse o sistema e crie um novo projeto.
2. Abra o projeto.
3. Vá em `SQL Editor`.
4. Cole e rode o conteúdo do arquivo `dados_online-setup.sql`.
5. Vá em `Project Settings > base de produtos`.
6. Copie:
   - Project URL
   - anon public key ou publishable key
7. Abra o arquivo `dados_online-config.js`.
8. Cole os valores aqui:

```js
const VALISYS_DADOS_URL = "sua-url";
const VALISYS_DADOS_PUBLIC_KEY = "sua-chave-publica";
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

Com sistema configurado e as telas migradas, a lista completa deixa de ser do celular e passa a vir do dados online.

```txt
Promotor lança no celular dele
↓
sistema salva online
↓
Gerente abre no celular dele
↓
Lista completa aparece atualizada
```
