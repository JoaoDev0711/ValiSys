# ValiSys - Push tipo aplicativo mantendo como site

Este pacote mantém o ValiSys como site normal, mas adiciona estrutura para notificação tipo aplicativo usando PWA + Web Push + Supabase Edge Functions.

## O que já entrou no código

- `manifest.json`
- `service-worker.js`
- `js/pwa-register.js`
- `js/push-notifications.js`
- botão flutuante "Notificações do celular"
- ícones PWA em `assets/icons`
- SQL em `database/push-notifications.sql`
- Edge Functions em:
  - `supabase/functions/push-subscribe`
  - `supabase/functions/notify-product`
  - `supabase/functions/verificar-vencimentos`

## O que precisa configurar no Supabase

### 1. Rodar o SQL

No Supabase SQL Editor, rode:

```sql
-- arquivo:
database/push-notifications.sql
```

Ou rode novamente o `database/valisys-sql-unico.sql`, pois o bloco de push já foi anexado nele.

### 2. Gerar chaves VAPID

No computador:

```bash
npx web-push generate-vapid-keys
```

Você vai receber:

```txt
Public Key
Private Key
```

### 3. Colar a chave pública no site

Abra:

```txt
js/push-notifications.js
```

Troque:

```js
const VALISYS_PUSH_PUBLIC_KEY = "COLE_AQUI_SUA_CHAVE_PUBLICA_VAPID";
```

pela Public Key gerada.

### 4. Configurar secrets das Edge Functions

No Supabase:

```bash
supabase secrets set VAPID_PUBLIC_KEY="SUA_PUBLIC_KEY"
supabase secrets set VAPID_PRIVATE_KEY="SUA_PRIVATE_KEY"
supabase secrets set VAPID_SUBJECT="mailto:seuemail@exemplo.com"
```

### 5. Fazer deploy das funções

```bash
supabase functions deploy push-subscribe
supabase functions deploy notify-product
supabase functions deploy verificar-vencimentos
```

### 6. Agendar verificação automática

Você pode agendar `verificar-vencimentos` para rodar todo dia de manhã pelo Supabase Cron.

Exemplo:

```sql
select cron.schedule(
  'valisys-verificar-vencimentos-diario',
  '0 8 * * *',
  $$
  select net.http_post(
    url := 'https://SEU-PROJETO.supabase.co/functions/v1/verificar-vencimentos',
    headers := '{"Authorization": "Bearer SUA_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

## Como fica o fluxo

```txt
Usuário entra no site
↓
Clica em "Ativar notificações"
↓
O navegador pede permissão
↓
A inscrição do aparelho é salva no Supabase
↓
Ao lançar produto, a função notify-product envia push
↓
Todo dia, verificar-vencimentos checa:
- produto perto de vencer
- produto vence hoje
- produto vencido
↓
O celular recebe a notificação
```

## Observação importante

O ValiSys continua sendo site. Não precisa publicar na Play Store.
