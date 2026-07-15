import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

const MP_API = "https://api.mercadopago.com";

function requiredEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Variável ${name} não configurada.`);
  return value;
}

function paymentIdFrom(
  url: URL,
  payload: Record<string, unknown>
) {
  const queryId =
    url.searchParams.get("data.id") ||
    url.searchParams.get("id");

  if (queryId) return queryId;

  const data =
    payload.data as Record<string, unknown> | undefined;

  return String(data?.id || payload.id || "");
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

    const paymentId = paymentIdFrom(url, payload);

    if (!paymentId) {
      return jsonResponse({
        ok: true,
        ignorado: true,
        motivo: "Sem payment id."
      });
    }

    const mpResponse = await fetch(
      `${MP_API}/v1/payments/${paymentId}`,
      {
        headers: {
          "Authorization":
            `Bearer ${requiredEnv("MP_ACCESS_TOKEN")}`
        }
      }
    );

    const payment = await mpResponse.json();

    if (!mpResponse.ok) {
      return jsonResponse({
        ok: false,
        erro:
          "Não foi possível consultar o pagamento no Mercado Pago."
      }, 400);
    }

    const externalReference = String(
      payment.external_reference ||
      payment.metadata?.cobranca_id ||
      ""
    );

    if (!externalReference) {
      return jsonResponse({
        ok: true,
        ignorado: true,
        motivo: "Pagamento sem referência externa."
      });
    }

    const mercadoPagoStatus = String(payment.status || "");
    let cobrancaStatus = "aguardando_pagamento";
    let pagoEm: string | null = null;

    if (mercadoPagoStatus === "approved") {
      cobrancaStatus = "pago";
      pagoEm =
        payment.date_approved ||
        new Date().toISOString();
    } else if (
      ["rejected", "cancelled", "refunded", "charged_back"]
        .includes(mercadoPagoStatus)
    ) {
      cobrancaStatus = "pendente";
    }

    const supabase = createClient(
      requiredEnv("SUPABASE_URL"),
      requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );

    const updatePayload: Record<string, unknown> = {
      status: cobrancaStatus,
      meio_pagamento: "mercadopago",
      mercado_pago_payment_id:
        String(payment.id || paymentId),
      mercado_pago_status: mercadoPagoStatus,
      mercado_pago_external_reference:
        externalReference,
      atualizado_em: new Date().toISOString()
    };

    if (pagoEm) {
      updatePayload.pago_em = pagoEm;
    }

    const { data: cobranca, error: updateErro } =
      await supabase
        .from("financeiro_cobrancas")
        .update(updatePayload)
        .eq("id", externalReference)
        .select(
          "id, loja_id, assinatura_id, status, vencimento"
        )
        .maybeSingle();

    if (updateErro) {
      return jsonResponse({
        ok: false,
        erro:
          `Permissão/atualização da cobrança: ` +
          updateErro.message
      }, 500);
    }

    if (cobrancaStatus === "pago" && cobranca) {
      const { data: assinatura } = await supabase
        .from("financeiro_assinaturas")
        .select("id, status")
        .eq("id", cobranca.assinatura_id)
        .maybeSingle();

      if (assinatura && assinatura.status !== "cancelada") {
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
    }

    return jsonResponse({
      ok: true,
      payment_id: paymentId,
      external_reference: externalReference,
      mercado_pago_status: mercadoPagoStatus,
      cobranca_status: cobrancaStatus
    });
  } catch (erro) {
    console.error(erro);

    return jsonResponse({
      ok: false,
      erro:
        erro instanceof Error
          ? erro.message
          : "Erro interno no webhook."
    }, 500);
  }
});
