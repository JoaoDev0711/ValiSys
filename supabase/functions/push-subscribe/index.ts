import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

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
    const body = await req.json();

    const subscription = body.subscription || {};
    const keys = subscription.keys || {};
    const usuario = body.usuario || {};
    const loja = body.loja || {};

    if (!subscription.endpoint || !keys.p256dh || !keys.auth) {
      return jsonResponse({ error: "Inscrição push inválida." }, 400);
    }

    const payload = {
      endpoint: subscription.endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      usuario_id: String(usuario.id || ""),
      usuario_nome: String(usuario.nome || ""),
      usuario_cargo: String(usuario.cargo || ""),
      usuario_setor: String(usuario.setor || ""),
      loja_id: loja.id || null,
      loja_nome: String(loja.nome || ""),
      user_agent: String(body.userAgent || ""),
      ativo: true,
      atualizado_em: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("push_subscriptions")
      .upsert(payload, { onConflict: "endpoint" })
      .select("id")
      .single();

    if (error) throw error;

    return jsonResponse({ ok: true, id: data.id });
  } catch (erro) {
    console.error(erro);
    return jsonResponse({ error: erro.message || "Erro ao salvar inscrição push." }, 500);
  }
});
