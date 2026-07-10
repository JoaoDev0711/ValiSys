import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { enviarPushParaLoja, registrarEventoUnico } from "../_shared/push.ts";

function dataLocalISO(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function adicionarDias(data: Date, dias: number) {
  const nova = new Date(data);
  nova.setUTCDate(nova.getUTCDate() + dias);
  return nova;
}

function diferencaDias(validadeISO: string, hojeISO: string) {
  const validade = new Date(`${validadeISO}T00:00:00Z`);
  const hoje = new Date(`${hojeISO}T00:00:00Z`);
  return Math.round((validade.getTime() - hoje.getTime()) / 86400000);
}

function formatarData(dataIso: string) {
  if (!dataIso) return "";
  const [ano, mes, dia] = dataIso.split("-");
  return `${dia}/${mes}/${ano}`;
}

function classificar(dias: number) {
  if (dias < 0) {
    return {
      tipo: "produto_vencido",
      titulo: "Produto vencido",
      prefixo: "Vencido",
    };
  }

  if (dias === 0) {
    return {
      tipo: "vence_hoje",
      titulo: "Produto vence hoje",
      prefixo: "Vence hoje",
    };
  }

  if (dias <= 7) {
    return {
      tipo: "perto_vencer",
      titulo: "Produto perto do vencimento",
      prefixo: `Vence em ${dias} dia(s)`,
    };
  }

  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: "Secrets do Supabase não configuradas." }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const hoje = dataLocalISO();
    const limite = dataLocalISO(adicionarDias(new Date(), 7));

    const { data: lancamentos, error } = await supabase
      .from("lancamentos")
      .select("*, lojas(nome)")
      .eq("status", "ativo")
      .lte("validade", limite)
      .order("validade", { ascending: true });

    if (error) throw error;

    let analisados = 0;
    let notificados = 0;
    let duplicados = 0;
    let pushes = 0;

    for (const item of lancamentos || []) {
      analisados += 1;

      const dias = diferencaDias(item.validade, hoje);
      const alerta = classificar(dias);

      if (!alerta) continue;

      const lojaId = item.loja_id || null;
      const produto = item.nome_produto || "Produto";
      const lojaNome = item.lojas?.nome || "loja";
      const chave = `${alerta.tipo}:${item.id}:${hoje}`;

      const novoEvento = await registrarEventoUnico(
        supabase,
        chave,
        alerta.tipo,
        item.id,
        lojaId,
      );

      if (!novoEvento) {
        duplicados += 1;
        continue;
      }

      const mensagem = `${alerta.prefixo}: ${produto} em ${lojaNome}. Validade ${formatarData(item.validade)}.`;

      await supabase
        .from("notificacoes")
        .insert({
          loja_id: lojaId,
          tipo: alerta.tipo,
          titulo: alerta.titulo,
          mensagem,
          lancamento_id: item.id,
          produto,
          setor: item.setor || "",
          validade: item.validade || null,
          criado_por: "Sistema automático",
          lida: false,
        });

      const resultadoPush = await enviarPushParaLoja(supabase, lojaId, {
        title: alerta.titulo,
        body: mensagem,
        url: "./notificacoes.html",
        tag: chave,
        tipo: alerta.tipo,
        lojaId,
        lancamentoId: item.id,
      });

      pushes += resultadoPush.enviados;
      notificados += 1;
    }

    return jsonResponse({
      ok: true,
      hoje,
      limite,
      analisados,
      notificados,
      duplicados,
      pushes,
    });
  } catch (erro) {
    console.error(erro);
    return jsonResponse({ error: erro.message || "Erro ao verificar vencimentos." }, 500);
  }
});
