# Comunicados da equipe com push externo

Agora gerente, encarregado e admin podem mandar avisos pelo dashboard.

O aviso:

- aparece no dashboard, abaixo do card "Controle do mercado";
- mostra quem enviou;
- dispara push externo para os aparelhos cadastrados da loja;
- não usa mais a tela antiga de notificações internas.

## SQL

Rode no Supabase SQL Editor:

```sql
-- database/comunicados-equipe.sql
```

Ou rode novamente o `database/valisys-sql-unico.sql`.

## Deploy da função

Rode:

```bash
npx.cmd supabase functions deploy send-team-message --no-verify-jwt
npx.cmd supabase functions deploy notify-product --no-verify-jwt
npx.cmd supabase functions deploy verificar-vencimentos --no-verify-jwt
npx.cmd supabase functions deploy test-push --no-verify-jwt
```

## Permissões

Podem enviar:

- gerente
- encarregado
- admin

Promotor apenas visualiza o comunicado.
