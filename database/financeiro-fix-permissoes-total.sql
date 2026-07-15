-- ValiSys - Correção total de permissões do financeiro
-- Execute este arquivo sozinho no Supabase SQL Editor.

-- O service_role ignora RLS, mas ainda precisa de privilégios SQL
-- quando as tabelas foram criadas manualmente sem grants.

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete
on table public.financeiro_assinaturas
to service_role;

grant select, insert, update, delete
on table public.financeiro_cobrancas
to service_role;

grant select, insert, update, delete
on table public.financeiro_pagamento_solicitacoes
to service_role;

grant select, insert, update, delete
on table public.financeiro_meios_pagamento
to service_role;

grant select, insert, update, delete
on table public.financeiro_planos
to service_role;

grant select, update
on table public.lojas
to service_role;

-- Planos e meios podem ser lidos pela interface.
grant select
on table public.financeiro_planos
to anon, authenticated;

grant select
on table public.financeiro_meios_pagamento
to anon, authenticated;

-- Funções usadas pelo front.
grant execute on function
public.valisys_financeiro_minha_assinatura(uuid)
to anon, authenticated, service_role;

grant execute on function
public.valisys_financeiro_assinar_plano(uuid, text, text)
to anon, authenticated, service_role;

grant execute on function
public.valisys_financeiro_registrar_solicitacao_pagamento(uuid, uuid, text, text)
to anon, authenticated, service_role;

grant execute on function
public.valisys_financeiro_cancelar_assinatura(uuid, text, text)
to anon, authenticated, service_role;

grant execute on function
public.valisys_financeiro_mp_obter_cobranca(uuid, uuid)
to anon, authenticated, service_role;

grant execute on function
public.valisys_financeiro_mp_registrar_preferencia(uuid, text, text, text)
to anon, authenticated, service_role;

grant execute on function
public.valisys_financeiro_mp_confirmar_pagamento(uuid, text, text, text, timestamptz)
to anon, authenticated, service_role;

-- Garante que as funções security definer executem como postgres.
alter function public.valisys_financeiro_minha_assinatura(uuid)
owner to postgres;

alter function public.valisys_financeiro_assinar_plano(uuid, text, text)
owner to postgres;

alter function public.valisys_financeiro_registrar_solicitacao_pagamento(uuid, uuid, text, text)
owner to postgres;

alter function public.valisys_financeiro_cancelar_assinatura(uuid, text, text)
owner to postgres;

alter function public.valisys_financeiro_mp_obter_cobranca(uuid, uuid)
owner to postgres;

alter function public.valisys_financeiro_mp_registrar_preferencia(uuid, text, text, text)
owner to postgres;

alter function public.valisys_financeiro_mp_confirmar_pagamento(uuid, text, text, text, timestamptz)
owner to postgres;

alter function public.valisys_financeiro_minha_assinatura(uuid)
security definer;

alter function public.valisys_financeiro_assinar_plano(uuid, text, text)
security definer;

alter function public.valisys_financeiro_registrar_solicitacao_pagamento(uuid, uuid, text, text)
security definer;

alter function public.valisys_financeiro_cancelar_assinatura(uuid, text, text)
security definer;

alter function public.valisys_financeiro_mp_obter_cobranca(uuid, uuid)
security definer;

alter function public.valisys_financeiro_mp_registrar_preferencia(uuid, text, text, text)
security definer;

alter function public.valisys_financeiro_mp_confirmar_pagamento(uuid, text, text, text, timestamptz)
security definer;

alter function public.valisys_financeiro_minha_assinatura(uuid)
set search_path = public, pg_temp;

alter function public.valisys_financeiro_assinar_plano(uuid, text, text)
set search_path = public, pg_temp;

alter function public.valisys_financeiro_registrar_solicitacao_pagamento(uuid, uuid, text, text)
set search_path = public, pg_temp;

alter function public.valisys_financeiro_cancelar_assinatura(uuid, text, text)
set search_path = public, pg_temp;

alter function public.valisys_financeiro_mp_obter_cobranca(uuid, uuid)
set search_path = public, pg_temp;

alter function public.valisys_financeiro_mp_registrar_preferencia(uuid, text, text, text)
set search_path = public, pg_temp;

alter function public.valisys_financeiro_mp_confirmar_pagamento(uuid, text, text, text, timestamptz)
set search_path = public, pg_temp;

notify pgrst, 'reload schema';

-- Verificação final: os dois resultados devem ser true.
select
  has_table_privilege(
    'service_role',
    'public.financeiro_cobrancas',
    'SELECT'
  ) as service_role_pode_ler_cobrancas,
  has_table_privilege(
    'service_role',
    'public.financeiro_cobrancas',
    'UPDATE'
  ) as service_role_pode_atualizar_cobrancas;
