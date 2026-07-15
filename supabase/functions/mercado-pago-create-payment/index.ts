import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

type PaymentBody = {
  cobrancaId?: string;
  lojaId?: string;
  usuarioNome?: string;
  siteUrl?: string;
};

const MP_API = "https://api.mercadopago.com";

function requiredEnv(name: string) {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(`Variável ${name} não configurada.`);
  }

  return value;
}

function normalizeSiteUrl(value: string) {
  return value.replace(/\/+$/, "");
}

function mercadoPagoError(payload: Record<string, unknown>) {
  const message = String(payload.message || payload.error || "Erro não informado pelo Mercado Pago.");
  const cause = Array.isArray(payload.cause)
    ? payload.cause.map((item) => {
        const row = item as Record<string, unknown>;
        return String(row.description || row.code || "");
      }).filter(Boolean).join(" | ")
    : "";

  return cause ? `${message}: ${cause}` : message;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ ok: false, erro: "Método não permitido." }, 405);
  }

  try {
    const body = await req.json() as PaymentBody;
    const cobrancaId = String(body.cobrancaId || "").trim();
    const lojaId = String(body.lojaId || "").trim();

    if (!cobrancaId || !lojaId) {
      return jsonResponse({
        ok: false,
        erro: "Cobrança ou loja não informada."
      }, 400);
    }

    const supabaseUrl = requiredEnv("SUPABASE_URL");
    const serviceRole = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const mpAccessToken = requiredEnv("MP_ACCESS_TOKEN");

    const supabase = createClient(supabaseUrl, serviceRole, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: cobranca, error: cobrancaErro } = await supabase
      .from("financeiro_cobrancas")
      .select("id, loja_id, descricao, valor, vencimento, status")
      .eq("id", cobrancaId)
      .eq("loja_id", lojaId)
      .maybeSingle();

    if (cobrancaErro) {
      return jsonResponse({
        ok: false,
        erro: `Erro ao consultar cobrança: ${cobrancaErro.message}`
      }, 500);
    }

    if (!cobranca) {
      return jsonResponse({
        ok: false,
        erro: "Cobrança não encontrada para a loja selecionada."
      }, 404);
    }

    if (["pago", "recebido", "cancelada"].includes(String(cobranca.status))) {
      return jsonResponse({
        ok: false,
        erro: `Cobrança indisponível. Status atual: ${cobranca.status}.`
      }, 400);
    }

    const valor = Number(cobranca.valor || 0);

    if (!Number.isFinite(valor) || valor <= 0) {
      return jsonResponse({
        ok: false,
        erro: "A cobrança está sem valor válido."
      }, 400);
    }

    const siteUrl = normalizeSiteUrl(
      Deno.env.get("SITE_URL") ||
      body.siteUrl ||
      "https://joaodev0711.github.io/ValiSys"
    );

    const notificationUrl = `${supabaseUrl}/functions/v1/mercado-pago-webhook`;
    const externalReference = String(cobranca.id);

    const preferencePayload = {
      external_reference: externalReference,
      notification_url: notificationUrl,
      items: [
        {
          id: externalReference,
          title: cobranca.descricao || "Mensalidade ValiSys",
          description: "Assinatura ValiSys",
          quantity: 1,
          currency_id: "BRL",
          unit_price: valor
        }
      ],
      back_urls: {
        success: `${siteUrl}/minha-assinatura.html?mp=success`,
        pending: `${siteUrl}/minha-assinatura.html?mp=pending`,
        failure: `${siteUrl}/minha-assinatura.html?mp=failure`
      },
      auto_return: "approved",
      metadata: {
        cobranca_id: externalReference,
        loja_id: lojaId,
        usuario_nome: body.usuarioNome || ""
      }
    };

    const mpResponse = await fetch(`${MP_API}/checkout/preferences`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${mpAccessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `valisys-${externalReference}`
      },
      body: JSON.stringify(preferencePayload)
    });

    const mpText = await mpResponse.text();
    let mpData: Record<string, unknown> = {};

    try {
      mpData = mpText ? JSON.parse(mpText) : {};
    } catch {
      mpData = { message: mpText || "Resposta inválida do Mercado Pago." };
    }

    if (!mpResponse.ok) {
      const erroMp = mercadoPagoError(mpData);
      console.error("Mercado Pago:", mpResponse.status, mpData);

      return jsonResponse({
        ok: false,
        erro: `Mercado Pago (${mpResponse.status}): ${erroMp}`
      }, 400);
    }

    const initPoint = String(mpData.init_point || "");
    const sandboxInitPoint = String(mpData.sandbox_init_point || "");
    const preferenceId = String(mpData.id || "");

    if (!initPoint && !sandboxInitPoint) {
      return jsonResponse({
        ok: false,
        erro: "O Mercado Pago criou a preferência, mas não retornou o link de pagamento."
      }, 500);
    }

    const updateCompleto = await supabase
      .from("financeiro_cobrancas")
      .update({
        status: "aguardando_pagamento",
        meio_pagamento: "mercadopago",
        link_pagamento: initPoint || sandboxInitPoint,
        mercado_pago_preference_id: preferenceId || null,
        mercado_pago_external_reference: externalReference,
        mercado_pago_init_point: initPoint || null,
        mercado_pago_sandbox_init_point: sandboxInitPoint || null,
        atualizado_em: new Date().toISOString()
      })
      .eq("id", externalReference);

    let avisoBanco = "";

    if (updateCompleto.error) {
      console.error("Update completo falhou:", updateCompleto.error);

      const updateBasico = await supabase
        .from("financeiro_cobrancas")
        .update({
          status: "aguardando_pagamento",
          meio_pagamento: "mercadopago",
          link_pagamento: initPoint || sandboxInitPoint,
          atualizado_em: new Date().toISOString()
        })
        .eq("id", externalReference);

      if (updateBasico.error) {
        avisoBanco = `Pagamento criado, mas não foi possível atualizar a cobrança: ${updateBasico.error.message}`;
      } else {
        avisoBanco = "Pagamento criado usando compatibilidade com a estrutura atual do banco.";
      }
    }

    return jsonResponse({
      ok: true,
      preference_id: preferenceId,
      init_point: initPoint,
      sandbox_init_point: sandboxInitPoint,
      external_reference: externalReference,
      aviso: avisoBanco
    });
  } catch (erro) {
    console.error(erro);

    return jsonResponse({
      ok: false,
      erro: erro instanceof Error ? erro.message : "Erro interno ao criar pagamento."
    }, 500);
  }
});
