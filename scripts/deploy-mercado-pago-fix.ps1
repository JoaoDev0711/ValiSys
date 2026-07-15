$ErrorActionPreference = "Stop"

npx.cmd supabase link --project-ref bwrgkzetsnglmkneqqzs

npx.cmd supabase functions deploy mercado-pago-create-payment --no-verify-jwt
npx.cmd supabase functions deploy mercado-pago-webhook --no-verify-jwt

npx.cmd supabase functions list
