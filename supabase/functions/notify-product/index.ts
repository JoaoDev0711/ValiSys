import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { enviarPushParaLoja, registrarEventoUnico } from "../_shared/push.ts";

function formatarData(dataIso: string) {
  if (!dataIso) return "";
  const [ano, mes, dia] = dataIso.split("-");
  return `${dia}/${mes}/${ano}`;
}

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

    const tipo = body.tipo || "produto_lancado";
    const lancamentoId = body.lancamentoId || null;

    if (!lancamentoId) {
      return jsonResponse({ error: "lancamentoId é obrigatório." }, 400);
    }

    const { data: lancamento, error } = await supabase
      .from("lancamentos")
      .select("*, lojas(nome)")
      .eq("id", lancamentoId)
      .single();

    if (error) throw error;

    const lojaId = body.lojaId || lancamento.loja_id || null;
    const chave = `${tipo}:${lancamento.id}`;

    const novoEvento = await registrarEventoUnico(
      supabase,
      chave,
      tipo,
      lancamento.id,
      lojaId,
    );

    if (!novoEvento) {
      return jsonResponse({ ok: true, duplicado: true });
    }

    const lojaNome = lancamento.lojas?.nome || "loja";
    const produto = lancamento.nome_produto || "Produto";
    const validade = formatarData(lancamento.validade);

    const titulo = "Produto lançado no ValiSys";
    const mensagem = `${produto} foi lançado em ${lojaNome} com validade ${validade}.`;

    const resultadoPush = await enviarPushParaLoja(supabase, lojaId, {
      title: titulo,
      body: mensagem,
      url: "./dashboard.html",
      tag: chave,
      tipo,
      lojaId,
      lancamentoId: lancamento.id,
    });

    return jsonResponse({
      ok: true,
      modo: "push_externo",
      mensagem,
      push: resultadoPush,
    });
  } catch (erro) {
    console.error(erro);
    return jsonResponse({ error: erro.message || "Erro ao notificar produto." }, 500);
  }
});
