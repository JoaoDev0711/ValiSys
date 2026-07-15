-- ValiSys - Correção isolada do financeiro
-- Execute este arquivo sozinho no Supabase SQL Editor.

alter table public.financeiro_cobrancas
add column if not exists mercado_pago_preference_id text;

alter table public.financeiro_cobrancas
add column if not exists mercado_pago_payment_id text;

alter table public.financeiro_cobrancas
add column if not exists mercado_pago_status text;

alter table public.financeiro_cobrancas
add column if not exists mercado_pago_external_reference text;

alter table public.financeiro_cobrancas
add column if not exists mercado_pago_init_point text;

alter table public.financeiro_cobrancas
add column if not exists mercado_pago_sandbox_init_point text;

drop function if exists public.valisys_financeiro_cancelar_assinatura(uuid, text, text);

create or replace function public.valisys_financeiro_cancelar_assinatura(
  p_loja_id uuid,
  p_cancelado_por text default '',
  p_cancelado_cargo text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_assinatura_id uuid;
begin
  select id
  into v_assinatura_id
  from public.financeiro_assinaturas
  where loja_id = p_loja_id
  limit 1;

  if v_assinatura_id is null then
    return jsonb_build_object(
      'ok', false,
      'erro', 'Nenhuma assinatura encontrada para esta loja.'
    );
  end if;

  update public.financeiro_assinaturas
  set status = 'cancelada',
      atualizado_em = now()
  where id = v_assinatura_id;

  update public.financeiro_cobrancas
  set status = 'cancelada',
      atualizado_em = now()
  where assinatura_id = v_assinatura_id
    and status in ('pendente', 'aguardando_pagamento', 'vencida');

  update public.lojas
  set plano_codigo = null,
      assinatura_status = 'cancelada',
      acesso_bloqueado = false,
      assinatura_vencimento = null
  where id = p_loja_id;

  return jsonb_build_object(
    'ok', true,
    'assinatura', jsonb_build_object(
      'id', v_assinatura_id,
      'loja_id', p_loja_id,
      'status', 'cancelada',
      'cancelado_por', coalesce(p_cancelado_por, ''),
      'cancelado_cargo', coalesce(p_cancelado_cargo, '')
    )
  );
end;
$$;

grant execute on function
public.valisys_financeiro_cancelar_assinatura(uuid, text, text)
to anon, authenticated;

notify pgrst, 'reload schema';
