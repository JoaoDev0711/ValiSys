import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

type CancelBody = {
  lojaId?: string;
  usuarioNome?: string;
  usuarioCargo?: string;
};

function requiredEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Variável ${name} não disponível na Edge Function.`);
  }

  return value;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ ok: false, erro: "Método não permitido." }, 405);
  }

  try {
    const body = await req.json() as CancelBody;
    const lojaId = String(body.lojaId || "").trim();

    if (!lojaId) {
      return jsonResponse({ ok: false, erro: "Loja não informada." }, 400);
    }

    const supabase = createClient(
      requiredEnv("SUPABASE_URL"),
      requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const { data: assinatura, error: assinaturaErro } = await supabase
      .from("financeiro_assinaturas")
      .select("id, loja_id, status")
      .eq("loja_id", lojaId)
      .maybeSingle();

    if (assinaturaErro) {
      return jsonResponse({
        ok: false,
        erro: `Erro ao consultar assinatura: ${assinaturaErro.message}`
      }, 500);
    }

    if (!assinatura) {
      return jsonResponse({
        ok: false,
        erro: "Nenhuma assinatura foi encontrada para esta loja."
      }, 404);
    }

    const { error: atualizarAssinaturaErro } = await supabase
      .from("financeiro_assinaturas")
      .update({
        status: "cancelada",
        atualizado_em: new Date().toISOString()
      })
      .eq("id", assinatura.id);

    if (atualizarAssinaturaErro) {
      return jsonResponse({
        ok: false,
        erro: `Erro ao cancelar assinatura: ${atualizarAssinaturaErro.message}`
      }, 500);
    }

    const { error: cobrancasErro } = await supabase
      .from("financeiro_cobrancas")
      .update({
        status: "cancelada",
        atualizado_em: new Date().toISOString()
      })
      .eq("assinatura_id", assinatura.id)
      .in("status", ["pendente", "aguardando_pagamento", "vencida"]);

    if (cobrancasErro) {
      console.error("Erro ao cancelar cobranças:", cobrancasErro);
    }

    const { error: lojaErro } = await supabase
      .from("lojas")
      .update({
        plano_codigo: null,
        assinatura_status: "cancelada",
        acesso_bloqueado: false,
        assinatura_vencimento: null
      })
      .eq("id", lojaId);

    if (lojaErro) {
      console.error("Erro ao atualizar loja:", lojaErro);
    }

    return jsonResponse({
      ok: true,
      assinatura: {
        ...assinatura,
        status: "cancelada",
        cancelado_por: body.usuarioNome || "",
        cancelado_cargo: body.usuarioCargo || ""
      }
    });
  } catch (erro) {
    console.error(erro);

    return jsonResponse({
      ok: false,
      erro: erro instanceof Error ? erro.message : "Erro interno ao cancelar assinatura."
    }, 500);
  }
});
