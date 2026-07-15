-- ValiSys - Correção definitiva de permissão do Mercado Pago
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

drop function if exists public.valisys_financeiro_mp_obter_cobranca(uuid, uuid);

create or replace function public.valisys_financeiro_mp_obter_cobranca(
  p_cobranca_id uuid,
  p_loja_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  retorno jsonb;
begin
  select jsonb_build_object(
    'id', c.id,
    'loja_id', c.loja_id,
    'assinatura_id', c.assinatura_id,
    'descricao', c.descricao,
    'valor', c.valor,
    'vencimento', c.vencimento,
    'status', c.status
  )
  into retorno
  from public.financeiro_cobrancas c
  where c.id = p_cobranca_id
    and c.loja_id = p_loja_id
  limit 1;

  if retorno is null then
    return jsonb_build_object(
      'ok', false,
      'erro', 'Cobrança não encontrada para a loja selecionada.'
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'cobranca', retorno
  );
end;
$$;

grant execute on function
public.valisys_financeiro_mp_obter_cobranca(uuid, uuid)
to anon, authenticated;

drop function if exists public.valisys_financeiro_mp_registrar_preferencia(
  uuid, text, text, text
);

create or replace function public.valisys_financeiro_mp_registrar_preferencia(
  p_cobranca_id uuid,
  p_preference_id text,
  p_init_point text,
  p_sandbox_init_point text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.financeiro_cobrancas
  set status = 'aguardando_pagamento',
      meio_pagamento = 'mercadopago',
      link_pagamento = coalesce(nullif(p_init_point, ''), nullif(p_sandbox_init_point, '')),
      mercado_pago_preference_id = nullif(p_preference_id, ''),
      mercado_pago_external_reference = p_cobranca_id::text,
      mercado_pago_init_point = nullif(p_init_point, ''),
      mercado_pago_sandbox_init_point = nullif(p_sandbox_init_point, ''),
      atualizado_em = now()
  where id = p_cobranca_id;

  if not found then
    return jsonb_build_object(
      'ok', false,
      'erro', 'Cobrança não encontrada ao salvar a preferência.'
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'cobranca_id', p_cobranca_id
  );
end;
$$;

grant execute on function
public.valisys_financeiro_mp_registrar_preferencia(uuid, text, text, text)
to anon, authenticated;

drop function if exists public.valisys_financeiro_mp_confirmar_pagamento(
  uuid, text, text, text, timestamptz
);

create or replace function public.valisys_financeiro_mp_confirmar_pagamento(
  p_cobranca_id uuid,
  p_payment_id text,
  p_mercado_pago_status text,
  p_cobranca_status text,
  p_pago_em timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_loja_id uuid;
  v_assinatura_id uuid;
  v_vencimento date;
begin
  update public.financeiro_cobrancas
  set status = p_cobranca_status,
      meio_pagamento = 'mercadopago',
      mercado_pago_payment_id = nullif(p_payment_id, ''),
      mercado_pago_status = nullif(p_mercado_pago_status, ''),
      mercado_pago_external_reference = p_cobranca_id::text,
      pago_em = case
        when p_cobranca_status = 'pago'
          then coalesce(p_pago_em, now())
        else pago_em
      end,
      atualizado_em = now()
  where id = p_cobranca_id
  returning loja_id, assinatura_id, vencimento
  into v_loja_id, v_assinatura_id, v_vencimento;

  if v_loja_id is null then
    return jsonb_build_object(
      'ok', false,
      'erro', 'Cobrança não encontrada ao confirmar pagamento.'
    );
  end if;

  if p_cobranca_status = 'pago' then
    update public.financeiro_assinaturas
    set status = 'ativa',
        atualizado_em = now()
    where id = v_assinatura_id;

    update public.lojas
    set assinatura_status = 'ativa',
        acesso_bloqueado = false,
        assinatura_vencimento = v_vencimento
    where id = v_loja_id;
  end if;

  return jsonb_build_object(
    'ok', true,
    'cobranca_id', p_cobranca_id,
    'loja_id', v_loja_id,
    'assinatura_id', v_assinatura_id,
    'status', p_cobranca_status
  );
end;
$$;

grant execute on function
public.valisys_financeiro_mp_confirmar_pagamento(
  uuid, text, text, text, timestamptz
)
to anon, authenticated;

notify pgrst, 'reload schema';
