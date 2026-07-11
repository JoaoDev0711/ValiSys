# Comunicado somente do dia

Agora o comunicado da equipe aparece apenas no dia em que foi enviado.

Fluxo:

- gerente/encarregado/admin envia pela Gestão da Loja;
- o aviso aparece no dashboard dentro do card Controle do mercado;
- o push externo é enviado;
- no dia seguinte o aviso deixa de aparecer automaticamente.

## SQL obrigatório

Rode no Supabase SQL Editor:

```sql
-- database/comunicados-equipe.sql
```

Isso adiciona o campo:

```sql
expira_em timestamptz
```

## Deploy obrigatório

```bash
npx.cmd supabase functions deploy send-team-message --no-verify-jwt
```
