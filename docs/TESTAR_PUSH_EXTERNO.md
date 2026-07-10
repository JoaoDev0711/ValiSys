# Testar push externo

Nesta versão existe uma função nova:

```txt
supabase/functions/test-push
```

Ela envia um push de teste para os aparelhos cadastrados.

## 1. Deploy obrigatório

Rode:

```bash
npx.cmd supabase functions deploy push-subscribe --no-verify-jwt
npx.cmd supabase functions deploy notify-product --no-verify-jwt
npx.cmd supabase functions deploy verificar-vencimentos --no-verify-jwt
npx.cmd supabase functions deploy test-push --no-verify-jwt
```

## 2. Resetar aparelhos

No Supabase SQL Editor rode:

```sql
-- arquivo:
database/reset-push-aparelhos.sql
```

## 3. Ativar no celular

Depois de subir o site no GitHub Pages:

```txt
abre o site no celular
entra no sistema
toca no sino
ativa notificação
permite no Chrome
```

A tabela `push_subscriptions` precisa criar uma linha.

## 4. Testar push externo

No Supabase Dashboard, vá em:

```txt
Edge Functions
test-push
Invoke
```

Body:

```json
{}
```

Se tiver aparelho ativo, deve chegar:

```txt
Teste ValiSys
Se você recebeu isto, o push externo está funcionando.
```

Se a resposta vier com:

```json
"aparelhos_ativos_total": 0
```

o celular não cadastrou.

Se vier com `enviados: 0` e `total > 0`, o problema é chave VAPID ou permissão do navegador.
