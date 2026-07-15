# Mercado Pago no ValiSys

## O que foi preparado

- Botão **Mercado Pago** em `minha-assinatura.html`
- Edge Function `mercado-pago-create-payment`
- Edge Function `mercado-pago-webhook`
- Campos no SQL principal para salvar `preference_id`, `payment_id`, status e link
- Cancelamento de assinatura via RPC `valisys_financeiro_cancelar_assinatura`

## Secrets necessários no Supabase

Configure no Supabase:

```bash
npx supabase secrets set MP_ACCESS_TOKEN="SEU_ACCESS_TOKEN_DO_MERCADO_PAGO"
npx supabase secrets set SITE_URL="https://joaodev0711.github.io/ValiSys"
npx supabase secrets set FUNCTION_BASE_URL="https://SEU_PROJECT_REF.supabase.co/functions/v1"
```

O token do Mercado Pago nunca deve ir no HTML, CSS ou JS público.

## Deploy das functions

```bash
npx supabase functions deploy mercado-pago-create-payment
npx supabase functions deploy mercado-pago-webhook
```

## SQL

Rode `database/valisys-sql-unico.sql` no SQL Editor do Supabase.

## Fluxo

1. Admin acessa Minha assinatura.
2. Clica em Mercado Pago.
3. Edge Function cria preferência no Mercado Pago.
4. Cliente paga no link seguro.
5. Webhook atualiza a cobrança para pago.
6. Assinatura fica ativa.
