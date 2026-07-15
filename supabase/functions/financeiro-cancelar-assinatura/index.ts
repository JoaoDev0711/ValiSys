import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

type CancelBody = {
  lojaId?: string;
  usuarioNome?: string;
  usuarioCargo?: string;
};

function requiredEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Variável ${name} não configurada.`);
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
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );

    const { data, error } = await supabase.rpc(
      "valisys_financeiro_cancelar_assinatura",
      {
        p_loja_id: lojaId,
        p_cancelado_por: body.usuarioNome || "",
        p_cancelado_cargo: body.usuarioCargo || ""
      }
    );

    if (error) {
      return jsonResponse({
        ok: false,
        erro: `RPC de cancelamento: ${error.message}`
      }, 500);
    }

    if (data?.ok === false) {
      return jsonResponse({
        ok: false,
        erro: data.erro || "Cancelamento não concluído."
      }, 400);
    }

    return jsonResponse({
      ok: true,
      assinatura: null,
      cobrancas: [],
      modo: "gratuito"
    });
  } catch (erro) {
    console.error(erro);

    return jsonResponse({
      ok: false,
      erro:
        erro instanceof Error
          ? erro.message
          : "Erro interno ao cancelar assinatura."
    }, 500);
  }
});
