-- ValiSys - Assinatura pendente, ativa e retorno ao gratuito
-- Execute este arquivo sozinho no Supabase SQL Editor.

alter table public.financeiro_assinaturas
add column if not exists cancelado_em timestamptz;

alter table public.financeiro_assinaturas
add column if not exists cancelado_por text;

alter table public.financeiro_assinaturas
add column if not exists cancelado_cargo text;

-- Corrige lojas que ficaram presas no estado cancelado.
update public.lojas
set assinatura_status = 'sem_assinatura',
    plano_codigo = null,
    assinatura_vencimento = null,
    acesso_bloqueado = false
where assinatura_status = 'cancelada';

drop function if exists public.valisys_financeiro_minha_assinatura(uuid);

create or replace function public.valisys_financeiro_minha_assinatura(
  p_loja_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  assinatura_json jsonb;
  cobrancas_json jsonb;
  meios_json jsonb;
  assinatura_id_ativa uuid;
begin
  -- Atualiza somente cobranças de uma assinatura que ainda está válida.
  update public.financeiro_cobrancas c
  set status = 'vencida',
      atualizado_em = now()
  from public.financeiro_assinaturas a
  where c.assinatura_id = a.id
    and a.loja_id = p_loja_id
    and a.status <> 'cancelada'
    and c.status in ('pendente', 'aguardando_pagamento')
    and c.vencimento < current_date;

  select a.id
  into assinatura_id_ativa
  from public.financeiro_assinaturas a
  where a.loja_id = p_loja_id
    and a.status <> 'cancelada'
  limit 1;

  if assinatura_id_ativa is null then
    select coalesce(jsonb_agg(to_jsonb(m) order by m.ordem asc), '[]'::jsonb)
    into meios_json
    from (
      select
        id,
        tipo,
        nome,
        descricao,
        chave_pix,
        pix_nome_recebedor,
        link_pagamento,
        boleto_url,
        linha_digitavel,
        dados_bancarios,
        instrucoes,
        ativo,
        ordem
      from public.financeiro_meios_pagamento
      where ativo = true
      order by ordem asc
    ) m;

    return jsonb_build_object(
      'assinatura', null,
      'cobrancas', '[]'::jsonb,
      'meios_pagamento', coalesce(meios_json, '[]'::jsonb),
      'modo', 'gratuito'
    );
  end if;

  select to_jsonb(x)
  into assinatura_json
  from (
    select
      a.id,
      a.loja_id,
      a.plano_id,
      a.status,
      a.ciclo,
      a.inicio_em,
      a.proximo_vencimento,
      a.criado_em,
      jsonb_build_object(
        'id', p.id,
        'codigo', p.codigo,
        'nome', p.nome,
        'descricao', p.descricao,
        'valor_mensal', p.valor_mensal,
        'limite_lojas', p.limite_lojas,
        'limite_usuarios', p.limite_usuarios,
        'recursos', p.recursos,
        'destaque', p.destaque
      ) as plano
    from public.financeiro_assinaturas a
    join public.financeiro_planos p on p.id = a.plano_id
    where a.id = assinatura_id_ativa
  ) x;

  select coalesce(jsonb_agg(to_jsonb(c) order by c.competencia asc), '[]'::jsonb)
  into cobrancas_json
  from (
    select
      id,
      assinatura_id,
      loja_id,
      competencia,
      descricao,
      valor,
      vencimento,
      status,
      link_pagamento,
      boleto_url,
      linha_digitavel,
      pix_copia_cola,
      meio_pagamento,
      pago_em,
      mercado_pago_preference_id,
      mercado_pago_payment_id,
      mercado_pago_status,
      mercado_pago_init_point,
      mercado_pago_sandbox_init_point,
      criado_em
    from public.financeiro_cobrancas
    where assinatura_id = assinatura_id_ativa
      and competencia >= date_trunc('month', current_date)::date
      and competencia < (
        date_trunc('month', current_date)::date +
        interval '12 months'
      )::date
      and status <> 'cancelada'
    order by competencia asc
  ) c;

  select coalesce(jsonb_agg(to_jsonb(m) order by m.ordem asc), '[]'::jsonb)
  into meios_json
  from (
    select
      id,
      tipo,
      nome,
      descricao,
      chave_pix,
      pix_nome_recebedor,
      link_pagamento,
      boleto_url,
      linha_digitavel,
      dados_bancarios,
      instrucoes,
      ativo,
      ordem
    from public.financeiro_meios_pagamento
    where ativo = true
    order by ordem asc
  ) m;

  return jsonb_build_object(
    'assinatura', assinatura_json,
    'cobrancas', coalesce(cobrancas_json, '[]'::jsonb),
    'meios_pagamento', coalesce(meios_json, '[]'::jsonb),
    'modo', 'assinatura'
  );
end;
$$;

grant execute on function
public.valisys_financeiro_minha_assinatura(uuid)
to anon, authenticated, service_role;

drop function if exists public.valisys_financeiro_assinar_plano(uuid, text, text);

create or replace function public.valisys_financeiro_assinar_plano(
  p_loja_id uuid,
  p_plano_codigo text,
  p_criado_por text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  plano_record public.financeiro_planos%rowtype;
  assinatura_record public.financeiro_assinaturas%rowtype;
  i integer;
  competencia_final date;
  vencimento_final date;
begin
  select *
  into plano_record
  from public.financeiro_planos
  where codigo = p_plano_codigo
    and ativo = true
  limit 1;

  if plano_record.id is null then
    raise exception 'Plano não encontrado: %', p_plano_codigo;
  end if;

  insert into public.financeiro_assinaturas
    (
      loja_id,
      plano_id,
      status,
      ciclo,
      inicio_em,
      proximo_vencimento,
      criado_por,
      cancelado_em,
      cancelado_por,
      cancelado_cargo
    )
  values
    (
      p_loja_id,
      plano_record.id,
      'aguardando_pagamento',
      'mensal',
      current_date,
      (date_trunc('month', current_date)::date + interval '9 days')::date,
      p_criado_por,
      null,
      null,
      null
    )
  on conflict (loja_id) do update set
    plano_id = excluded.plano_id,
    status = 'aguardando_pagamento',
    ciclo = excluded.ciclo,
    inicio_em = current_date,
    proximo_vencimento = excluded.proximo_vencimento,
    criado_por = excluded.criado_por,
    cancelado_em = null,
    cancelado_por = null,
    cancelado_cargo = null,
    atualizado_em = now()
  returning * into assinatura_record;

  for i in 0..11 loop
    competencia_final := (
      date_trunc('month', current_date)::date +
      make_interval(months => i)
    )::date;

    vencimento_final := (
      competencia_final + interval '9 days'
    )::date;

    if vencimento_final < current_date then
      vencimento_final := current_date + 7;
    end if;

    insert into public.financeiro_cobrancas
      (
        assinatura_id,
        loja_id,
        competencia,
        descricao,
        valor,
        vencimento,
        status
      )
    values
      (
        assinatura_record.id,
        p_loja_id,
        competencia_final,
        'Mensalidade ValiSys - ' || plano_record.nome,
        plano_record.valor_mensal,
        vencimento_final,
        'pendente'
      )
    on conflict (assinatura_id, competencia) do update set
      descricao = excluded.descricao,
      valor = excluded.valor,
      vencimento = excluded.vencimento,
      status = case
        when public.financeiro_cobrancas.status in ('pago', 'recebido')
          then public.financeiro_cobrancas.status
        else 'pendente'
      end,
      link_pagamento = case
        when public.financeiro_cobrancas.status in ('pago', 'recebido')
          then public.financeiro_cobrancas.link_pagamento
        else null
      end,
      boleto_url = case
        when public.financeiro_cobrancas.status in ('pago', 'recebido')
          then public.financeiro_cobrancas.boleto_url
        else null
      end,
      linha_digitavel = case
        when public.financeiro_cobrancas.status in ('pago', 'recebido')
          then public.financeiro_cobrancas.linha_digitavel
        else null
      end,
      pix_copia_cola = case
        when public.financeiro_cobrancas.status in ('pago', 'recebido')
          then public.financeiro_cobrancas.pix_copia_cola
        else null
      end,
      meio_pagamento = case
        when public.financeiro_cobrancas.status in ('pago', 'recebido')
          then public.financeiro_cobrancas.meio_pagamento
        else null
      end,
      pago_em = case
        when public.financeiro_cobrancas.status in ('pago', 'recebido')
          then public.financeiro_cobrancas.pago_em
        else null
      end,
      mercado_pago_preference_id = case
        when public.financeiro_cobrancas.status in ('pago', 'recebido')
          then public.financeiro_cobrancas.mercado_pago_preference_id
        else null
      end,
      mercado_pago_payment_id = case
        when public.financeiro_cobrancas.status in ('pago', 'recebido')
          then public.financeiro_cobrancas.mercado_pago_payment_id
        else null
      end,
      mercado_pago_status = case
        when public.financeiro_cobrancas.status in ('pago', 'recebido')
          then public.financeiro_cobrancas.mercado_pago_status
        else null
      end,
      mercado_pago_external_reference = case
        when public.financeiro_cobrancas.status in ('pago', 'recebido')
          then public.financeiro_cobrancas.mercado_pago_external_reference
        else null
      end,
      mercado_pago_init_point = case
        when public.financeiro_cobrancas.status in ('pago', 'recebido')
          then public.financeiro_cobrancas.mercado_pago_init_point
        else null
      end,
      mercado_pago_sandbox_init_point = case
        when public.financeiro_cobrancas.status in ('pago', 'recebido')
          then public.financeiro_cobrancas.mercado_pago_sandbox_init_point
        else null
      end,
      atualizado_em = now();
  end loop;

  update public.lojas
  set plano_codigo = plano_record.codigo,
      assinatura_status = 'aguardando_pagamento',
      acesso_bloqueado = false,
      assinatura_vencimento = assinatura_record.proximo_vencimento
  where id = p_loja_id;

  return public.valisys_financeiro_minha_assinatura(p_loja_id);
end;
$$;

grant execute on function
public.valisys_financeiro_assinar_plano(uuid, text, text)
to anon, authenticated, service_role;

drop function if exists public.valisys_financeiro_cancelar_assinatura(uuid, text, text);

create or replace function public.valisys_financeiro_cancelar_assinatura(
  p_loja_id uuid,
  p_cancelado_por text default '',
  p_cancelado_cargo text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
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
    update public.lojas
    set plano_codigo = null,
        assinatura_status = 'sem_assinatura',
        acesso_bloqueado = false,
        assinatura_vencimento = null
    where id = p_loja_id;

    return jsonb_build_object(
      'ok', true,
      'assinatura', null,
      'cobrancas', '[]'::jsonb,
      'modo', 'gratuito'
    );
  end if;

  update public.financeiro_assinaturas
  set status = 'cancelada',
      cancelado_em = now(),
      cancelado_por = coalesce(p_cancelado_por, ''),
      cancelado_cargo = coalesce(p_cancelado_cargo, ''),
      atualizado_em = now()
  where id = v_assinatura_id;

  update public.financeiro_cobrancas
  set status = 'cancelada',
      link_pagamento = null,
      boleto_url = null,
      linha_digitavel = null,
      pix_copia_cola = null,
      meio_pagamento = null,
      mercado_pago_preference_id = null,
      mercado_pago_status = null,
      mercado_pago_init_point = null,
      mercado_pago_sandbox_init_point = null,
      atualizado_em = now()
  where assinatura_id = v_assinatura_id
    and status not in ('pago', 'recebido');

  update public.lojas
  set plano_codigo = null,
      assinatura_status = 'sem_assinatura',
      acesso_bloqueado = false,
      assinatura_vencimento = null
  where id = p_loja_id;

  return jsonb_build_object(
    'ok', true,
    'assinatura', null,
    'cobrancas', '[]'::jsonb,
    'modo', 'gratuito'
  );
end;
$$;

grant execute on function
public.valisys_financeiro_cancelar_assinatura(uuid, text, text)
to anon, authenticated, service_role;

-- Corrige assinaturas atualmente incoerentes:
-- loja com plano selecionado não pode ficar cancelada.
update public.financeiro_assinaturas a
set status = 'aguardando_pagamento',
    cancelado_em = null,
    cancelado_por = null,
    cancelado_cargo = null,
    atualizado_em = now()
from public.lojas l
where a.loja_id = l.id
  and a.status = 'cancelada'
  and l.plano_codigo is not null
  and l.assinatura_status <> 'sem_assinatura';

update public.financeiro_cobrancas c
set status = 'pendente',
    atualizado_em = now()
from public.financeiro_assinaturas a,
     public.lojas l
where c.assinatura_id = a.id
  and a.loja_id = l.id
  and c.status = 'cancelada'
  and l.plano_codigo is not null
  and l.assinatura_status <> 'sem_assinatura';

notify pgrst, 'reload schema';
