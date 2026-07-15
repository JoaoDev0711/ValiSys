$ErrorActionPreference = "Stop"

Write-Host "Vinculando projeto Supabase..."
npx.cmd supabase link --project-ref bwrgkzetsnglmkneqqzs

Write-Host "Publicando função de cancelamento..."
npx.cmd supabase functions deploy financeiro-cancelar-assinatura --no-verify-jwt

Write-Host "Publicando criação de pagamento Mercado Pago..."
npx.cmd supabase functions deploy mercado-pago-create-payment --no-verify-jwt

Write-Host "Publicando webhook Mercado Pago..."
npx.cmd supabase functions deploy mercado-pago-webhook --no-verify-jwt

Write-Host "Funções publicadas."
npx.cmd supabase functions list
