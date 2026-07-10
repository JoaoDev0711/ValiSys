# Resetar aparelhos das notificações externas

Para limpar todos os celulares/navegadores cadastrados no push, rode no Supabase SQL Editor:

```sql
-- arquivo:
database/reset-push-aparelhos.sql
```

Isso apaga:

- `push_subscriptions`: aparelhos cadastrados.
- `push_eventos_enviados`: histórico usado para evitar push duplicado.
- notificações internas antigas dos tipos de push criadas por versões anteriores.

Depois disso, cada usuário precisa abrir o site e ativar as notificações novamente.
