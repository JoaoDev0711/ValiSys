import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { enviarPushParaLoja } from "../_shared/push.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Método não permitido." }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: "Secrets do Supabase não configuradas." }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const body = await req.json().catch(() => ({}));

    const lojaId = body.lojaId || null;

    const { count, error: countError } = await supabase
      .from("push_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("ativo", true);

    if (countError) throw countError;

    const resultadoPush = await enviarPushParaLoja(supabase, lojaId, {
      title: "Teste ValiSys",
      body: "Se você recebeu isto, o push externo está funcionando.",
      url: "./dashboard.html",
      tag: `teste-push-${Date.now()}`,
      tipo: "teste_push",
      lojaId,
      lancamentoId: null,
    });

    return jsonResponse({
      ok: true,
      modo: "teste_push_externo",
      aparelhos_ativos_total: count || 0,
      lojaId,
      push: resultadoPush,
    });
  } catch (erro) {
    console.error(erro);
    return jsonResponse({
      ok: false,
      error: erro.message || "Erro ao enviar teste push.",
      detalhe: String(erro),
    }, 500);
  }
});
