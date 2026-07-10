# Push externo sem notificação interna

Nesta versão, as Edge Functions de push **não criam mais aviso na tabela `notificacoes`**.

Agora o fluxo é:

```txt
Produto lançado / vencimento detectado
↓
Edge Function
↓
Web Push para celular/navegador cadastrado
```

As funções alteradas são:

- `supabase/functions/notify-product`
- `supabase/functions/verificar-vencimentos`

Depois de subir este pacote no GitHub, faça redeploy:

```bash
npx.cmd supabase functions deploy notify-product --no-verify-jwt
npx.cmd supabase functions deploy verificar-vencimentos --no-verify-jwt
```

Para resetar aparelhos cadastrados, rode:

```sql
-- database/reset-push-aparelhos.sql
```
