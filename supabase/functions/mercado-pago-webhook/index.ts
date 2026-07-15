import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

const MP_API = "https://api.mercadopago.com";

function env(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Secret ${name} não configurado.`);
  return value;
}

function extrairPaymentId(url: URL, payload: Record<string, unknown>) {
  const queryId = url.searchParams.get("id") || url.searchParams.get("data.id");

  if (queryId) return queryId;

  const data = payload.data as Record<string, unknown> | undefined;
  const dataId = data?.id;

  if (dataId) return String(dataId);

  const id = payload.id;
  if (id) return String(id);

  return "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let payload: Record<string, unknown> = {};

    if (req.method === "POST") {
      try {
        payload = await req.json();
      } catch {
        payload = {};
      }
    }

    const topic = String(url.searchParams.get("topic") || url.searchParams.get("type") || payload.type || "");
    const paymentId = extrairPaymentId(url, payload);

    if (!paymentId) {
      return jsonResponse({ ok: true, ignorado: true, motivo: "Sem payment id." });
    }

    if (topic && !["payment", "merchant_order"].includes(topic)) {
      return jsonResponse({ ok: true, ignorado: true, topic });
    }

    const supabaseUrl = env("SUPABASE_URL");
    const serviceRole = env("SUPABASE_SERVICE_ROLE_KEY");
    const mpAccessToken = env("MP_ACCESS_TOKEN");

    const mpResponse = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
      headers: {
        "Authorization": `Bearer ${mpAccessToken}`
      }
    });

    const payment = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error("Mercado Pago webhook erro:", payment);
      return jsonResponse({ ok: false, erro: "Não foi possível consultar pagamento." }, 400);
    }

    const externalReference = String(payment.external_reference || payment.metadata?.cobranca_id || "");

    if (!externalReference) {
      return jsonResponse({ ok: true, ignorado: true, motivo: "Sem external_reference." });
    }

    const status = String(payment.status || "");
    const statusDetail = String(payment.status_detail || "");

    let statusCobranca = "aguardando_pagamento";
    let pagoEm: string | null = null;

    if (status === "approved") {
      statusCobranca = "pago";
      pagoEm = payment.date_approved || new Date().toISOString();
    } else if (["pending", "in_process", "authorized"].includes(status)) {
      statusCobranca = "aguardando_pagamento";
    } else if (["rejected", "cancelled", "refunded", "charged_back"].includes(status)) {
      statusCobranca = "pendente";
    }

    const supabase = createClient(supabaseUrl, serviceRole, {
      auth: { persistSession: false }
    });

    const updatePayload: Record<string, unknown> = {
      status: statusCobranca,
      meio_pagamento: "mercadopago",
      mercado_pago_payment_id: String(payment.id || paymentId),
      mercado_pago_status: status,
      mercado_pago_external_reference: externalReference,
      atualizado_em: new Date().toISOString()
    };

    if (pagoEm) updatePayload.pago_em = pagoEm;

    const { data: cobranca, error } = await supabase
      .from("financeiro_cobrancas")
      .update(updatePayload)
      .eq("id", externalReference)
      .select("id, loja_id, assinatura_id, status, vencimento")
      .single();

    if (error) {
      console.error(error);
      return jsonResponse({ ok: false, erro: "Não foi possível atualizar cobrança." }, 500);
    }

    if (statusCobranca === "pago" && cobranca?.loja_id) {
      await supabase
        .from("financeiro_assinaturas")
        .update({
          status: "ativa",
          atualizado_em: new Date().toISOString()
        })
        .eq("id", cobranca.assinatura_id);

      await supabase
        .from("lojas")
        .update({
          assinatura_status: "ativa",
          acesso_bloqueado: false,
          assinatura_vencimento: cobranca.vencimento
        })
        .eq("id", cobranca.loja_id);
    }

    return jsonResponse({
      ok: true,
      payment_id: paymentId,
      external_reference: externalReference,
      mercado_pago_status: status,
      status_detail: statusDetail,
      cobranca_status: statusCobranca
    });
  } catch (erro) {
    console.error(erro);
    return jsonResponse({
      ok: false,
      erro: erro instanceof Error ? erro.message : "Erro interno."
    }, 500);
  }
});
