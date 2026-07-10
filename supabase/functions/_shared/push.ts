import webpush from "npm:web-push@3.6.7";

type SupabaseClient = any;

type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  tipo?: string;
  lojaId?: string | null;
  lancamentoId?: string | null;
};

export function configurarWebPush() {
  const publicKey = Deno.env.get("VAPID_PUBLIC_KEY") || "";
  const privateKey = Deno.env.get("VAPID_PRIVATE_KEY") || "";
  const subject = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@valisys.local";

  if (!publicKey || !privateKey) {
    throw new Error("Configure VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY nas secrets do Supabase.");
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export async function enviarPushParaLoja(
  supabase: SupabaseClient,
  lojaId: string | null,
  payload: PushPayload,
) {
  configurarWebPush();

  let query = supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("ativo", true);

  if (lojaId) {
    query = query.eq("loja_id", lojaId);
  }

  const { data, error } = await query;

  if (error) throw error;

  const inscricoes = data || [];
  let enviados = 0;
  let removidos = 0;

  for (const item of inscricoes) {
    try {
      await webpush.sendNotification(
        {
          endpoint: item.endpoint,
          keys: {
            p256dh: item.p256dh,
            auth: item.auth,
          },
        },
        JSON.stringify(payload),
      );

      enviados += 1;
    } catch (erro) {
      const statusCode = erro?.statusCode || erro?.status || 0;

      if ([404, 410].includes(Number(statusCode))) {
        await supabase
          .from("push_subscriptions")
          .update({ ativo: false, atualizado_em: new Date().toISOString() })
          .eq("id", item.id);

        removidos += 1;
      } else {
        console.warn("Falha ao enviar push:", erro);
      }
    }
  }

  return {
    total: inscricoes.length,
    enviados,
    removidos,
  };
}

export async function registrarEventoUnico(
  supabase: SupabaseClient,
  chaveUnica: string,
  tipo: string,
  lancamentoId: string | null,
  lojaId: string | null,
) {
  const { error } = await supabase
    .from("push_eventos_enviados")
    .insert({
      chave_unica: chaveUnica,
      tipo,
      lancamento_id: lancamentoId,
      loja_id: lojaId,
    });

  if (error) {
    const codigo = String(error.code || "");
    const mensagem = String(error.message || "");

    if (codigo === "23505" || mensagem.toLowerCase().includes("duplicate")) {
      return false;
    }

    throw error;
  }

  return true;
}
