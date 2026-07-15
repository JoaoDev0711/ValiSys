import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

type Body = {
  cobrancaId?: string;
  lojaId?: string;
  usuarioNome?: string;
  origem?: string;
};

const MP_API = "https://api.mercadopago.com";

function env(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Secret ${name} não configurado.`);
  return value;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return jsonResponse({ ok: false, erro: "Método não permitido." }, 405);
    }

    const body = await req.json() as Body;
    const cobrancaId = body.cobrancaId;
    const lojaId = body.lojaId;

    if (!cobrancaId || !lojaId) {
      return jsonResponse({ ok: false, erro: "Cobrança ou loja não informada." }, 400);
    }

    const supabaseUrl = env("SUPABASE_URL");
    const serviceRole = env("SUPABASE_SERVICE_ROLE_KEY");
    const mpAccessToken = env("MP_ACCESS_TOKEN");

    const supabase = createClient(supabaseUrl, serviceRole, {
      auth: { persistSession: false }
    });

    const { data: cobranca, error: cobrancaErro } = await supabase
      .from("financeiro_cobrancas")
      .select("id, loja_id, descricao, valor, vencimento, status")
      .eq("id", cobrancaId)
      .eq("loja_id", lojaId)
      .single();

    if (cobrancaErro || !cobranca) {
      return jsonResponse({ ok: false, erro: "Cobrança não encontrada." }, 404);
    }

    if (["pago", "recebido", "cancelada"].includes(String(cobranca.status))) {
      return jsonResponse({ ok: false, erro: "Cobrança não está disponível para pagamento." }, 400);
    }

    const siteUrl = Deno.env.get("SITE_URL") || body.origem || "https://joaodev0711.github.io/ValiSys";
    const functionBaseUrl = Deno.env.get("FUNCTION_BASE_URL") || `${supabaseUrl}/functions/v1`;
    const externalReference = String(cobranca.id);

    const preferencePayload = {
      external_reference: externalReference,
      notification_url: `${functionBaseUrl}/mercado-pago-webhook`,
      items: [
        {
          id: cobranca.id,
          title: cobranca.descricao || "Mensalidade ValiSys",
          description: "Assinatura ValiSys",
          quantity: 1,
          currency_id: "BRL",
          unit_price: Number(cobranca.valor || 0)
        }
      ],
      back_urls: {
        success: `${siteUrl}/minha-assinatura.html?mp=success`,
        pending: `${siteUrl}/minha-assinatura.html?mp=pending`,
        failure: `${siteUrl}/minha-assinatura.html?mp=failure`
      },
      auto_return: "approved",
      metadata: {
        cobranca_id: cobranca.id,
        loja_id: lojaId,
        usuario_nome: body.usuarioNome || ""
      }
    };

    const mpResponse = await fetch(`${MP_API}/checkout/preferences`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${mpAccessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(preferencePayload)
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error("Mercado Pago erro:", mpData);
      return jsonResponse({
        ok: false,
        erro: "Mercado Pago recusou a criação do pagamento.",
        detalhes: mpData
      }, 400);
    }

    await supabase
      .from("financeiro_cobrancas")
      .update({
        status: "aguardando_pagamento",
        meio_pagamento: "mercadopago",
        mercado_pago_preference_id: mpData.id || null,
        mercado_pago_external_reference: externalReference,
        mercado_pago_init_point: mpData.init_point || null,
        mercado_pago_sandbox_init_point: mpData.sandbox_init_point || null,
        atualizado_em: new Date().toISOString()
      })
      .eq("id", cobranca.id);

    return jsonResponse({
      ok: true,
      preference_id: mpData.id,
      init_point: mpData.init_point,
      sandbox_init_point: mpData.sandbox_init_point,
      external_reference: externalReference
    });
  } catch (erro) {
    console.error(erro);
    return jsonResponse({
      ok: false,
      erro: erro instanceof Error ? erro.message : "Erro interno."
    }, 500);
  }
});
