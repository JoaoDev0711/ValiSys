import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { enviarPushParaLoja } from "../_shared/push.ts";


function fimDoDiaBrasilISO() {
  // Mantém o comunicado visível somente no dia do envio.
  // Brasil padrão UTC-3: fim do dia local = 02:59:59.999 UTC do dia seguinte.
  const agora = new Date();
  const brasilMs = agora.getTime() - 3 * 60 * 60 * 1000;
  const brasil = new Date(brasilMs);

  const ano = brasil.getUTCFullYear();
  const mes = brasil.getUTCMonth();
  const dia = brasil.getUTCDate();

  const fimBrasilComoUtc = new Date(Date.UTC(ano, mes, dia + 1, 2, 59, 59, 999));
  return fimBrasilComoUtc.toISOString();
}


function limparTexto(valor: unknown, limite = 300) {
  return String(valor || "").trim().slice(0, limite);
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

    const body = await req.json();
    const lojaId = body.lojaId || null;
    const titulo = limparTexto(body.titulo || "Aviso da equipe", 80);
    const mensagem = limparTexto(body.mensagem, 360);
    const criadoPor = limparTexto(body.criadoPor || "Equipe", 80);
    const criadoPorCargo = limparTexto(body.criadoPorCargo || "", 40);
    const tipo = limparTexto(body.tipo || "aviso", 40);
    const expiraEm = fimDoDiaBrasilISO();

    if (!lojaId) {
      return jsonResponse({ error: "lojaId é obrigatório." }, 400);
    }

    if (!mensagem || mensagem.length < 3) {
      return jsonResponse({ error: "Mensagem muito curta." }, 400);
    }

    const cargosPermitidos = ["gerente", "encarregado", "admin"];

    if (!cargosPermitidos.includes(criadoPorCargo)) {
      return jsonResponse({ error: "Cargo sem permissão para enviar comunicado." }, 403);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: comunicado, error } = await supabase
      .from("comunicados_equipe")
      .insert({
        loja_id: lojaId,
        titulo,
        mensagem,
        tipo,
        criado_por: criadoPor,
        criado_por_cargo: criadoPorCargo,
        ativo: true,
        expira_em: expiraEm,
      })
      .select("*")
      .single();

    if (error) throw error;

    const resultadoPush = await enviarPushParaLoja(supabase, lojaId, {
      title: titulo,
      body: `${mensagem} — ${criadoPor}`,
      url: "./dashboard.html",
      tag: `comunicado-${comunicado.id}`,
      tipo: "comunicado_equipe",
      lojaId,
      lancamentoId: null,
    });

    return jsonResponse({
      ok: true,
      modo: "comunicado_equipe_push_externo",
      comunicado,
      push: resultadoPush,
    });
  } catch (erro) {
    console.error(erro);
    return jsonResponse({ error: erro.message || "Erro ao enviar comunicado." }, 500);
  }
});
