/*
  ValiSys - Notificações Push pelo navegador

  Para funcionar de verdade:
  1) Rodar database/push-notifications.sql no Supabase.
  2) Gerar chaves VAPID.
  3) Colar a chave pública em VALISYS_PUSH_PUBLIC_KEY.
  4) Fazer deploy das Edge Functions em supabase/functions.
*/

const VALISYS_PUSH_PUBLIC_KEY = "COLE_AQUI_SUA_CHAVE_PUBLICA_VAPID";

(function () {
  const SUPORTA_PUSH = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

  function pushConfigurado() {
    return (
      typeof VALISYS_PUSH_PUBLIC_KEY === "string" &&
      VALISYS_PUSH_PUBLIC_KEY &&
      !VALISYS_PUSH_PUBLIC_KEY.includes("COLE_AQUI")
    );
  }

  function getClienteSupabaseSeguro() {
    if (typeof getDadosOnlineClient !== "function") return null;

    try {
      return getDadosOnlineClient();
    } catch (erro) {
      return null;
    }
  }

  function getUsuarioSeguro() {
    try {
      if (typeof getUsuarioLogado === "function") return getUsuarioLogado();
      return JSON.parse(localStorage.getItem("usuarioLogado") || "null");
    } catch (erro) {
      return null;
    }
  }

  function getLojaSeguro() {
    try {
      if (typeof getLojaAtual === "function") return getLojaAtual();
      return JSON.parse(localStorage.getItem("lojaAtual") || "null");
    } catch (erro) {
      return null;
    }
  }

  function urlBase64ParaUint8Array(base64String) {
    const padding = "=".repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  function getFunctionUrl(nome) {
    if (typeof VALISYS_DADOS_URL !== "string") return "";
    return `${VALISYS_DADOS_URL.replace(/\/$/, "")}/functions/v1/${nome}`;
  }

  async function chamarFunction(nome, payload) {
    if (typeof VALISYS_DADOS_PUBLIC_KEY !== "string") {
      throw new Error("Chave pública Supabase não encontrada.");
    }

    const resposta = await fetch(getFunctionUrl(nome), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": VALISYS_DADOS_PUBLIC_KEY,
        "Authorization": `Bearer ${VALISYS_DADOS_PUBLIC_KEY}`
      },
      body: JSON.stringify(payload || {})
    });

    const texto = await resposta.text();
    let json = {};

    try {
      json = texto ? JSON.parse(texto) : {};
    } catch (erro) {
      json = { mensagem: texto };
    }

    if (!resposta.ok) {
      throw new Error(json.error || json.mensagem || "Erro na função de push.");
    }

    return json;
  }

  function criarWidget() {
    if (document.querySelector("[data-push-widget]")) return;

    const usuario = getUsuarioSeguro();

    if (!usuario) return;

    const widget = document.createElement("aside");
    widget.className = "push-widget";
    widget.setAttribute("data-push-widget", "true");

    widget.innerHTML = `
      <button type="button" class="push-widget-toggle" data-push-toggle aria-label="Notificações push">
        🔔
      </button>

      <div class="push-widget-card" data-push-card>
        <div>
          <strong>Notificações do celular</strong>
          <p data-push-status>Receba avisos quando produtos forem lançados, estiverem perto de vencer ou vencidos.</p>
        </div>

        <button type="button" data-push-ativar>Ativar notificações</button>
      </div>
    `;

    document.body.appendChild(widget);

    const card = widget.querySelector("[data-push-card]");
    const status = widget.querySelector("[data-push-status]");
    const ativar = widget.querySelector("[data-push-ativar]");
    const toggle = widget.querySelector("[data-push-toggle]");

    toggle.addEventListener("click", () => {
      widget.classList.toggle("open");
    });

    ativar.addEventListener("click", async () => {
      ativar.disabled = true;
      status.textContent = "Ativando notificações...";

      try {
        await ativarPush();
        status.textContent = "Notificações ativadas neste aparelho.";
        ativar.textContent = "Ativado";
      } catch (erro) {
        console.warn(erro);
        status.textContent = erro.message || "Não foi possível ativar as notificações.";
        ativar.disabled = false;
      }
    });

    atualizarEstadoWidget(widget);
  }

  async function atualizarEstadoWidget(widget) {
    const status = widget.querySelector("[data-push-status]");
    const ativar = widget.querySelector("[data-push-ativar]");

    if (!SUPORTA_PUSH) {
      status.textContent = "Este navegador não suporta push.";
      ativar.disabled = true;
      return;
    }

    if (!pushConfigurado()) {
      status.textContent = "Push pronto no site. Falta configurar a chave VAPID pública.";
      ativar.textContent = "Configurar VAPID";
      ativar.disabled = true;
      return;
    }

    if (Notification.permission === "denied") {
      status.textContent = "Notificação bloqueada no navegador. Libere nas configurações do site.";
      ativar.disabled = true;
      return;
    }

    const registro = await navigator.serviceWorker.ready.catch(() => null);
    const inscricao = registro ? await registro.pushManager.getSubscription() : null;

    if (inscricao) {
      status.textContent = "Notificações ativadas neste aparelho.";
      ativar.textContent = "Ativado";
      ativar.disabled = true;
    }
  }

  async function ativarPush() {
    if (!SUPORTA_PUSH) {
      throw new Error("Este navegador não suporta notificação push.");
    }

    if (!pushConfigurado()) {
      throw new Error("Configure a chave pública VAPID em js/push-notifications.js.");
    }

    const permissao = await Notification.requestPermission();

    if (permissao !== "granted") {
      throw new Error("Permissão de notificação não concedida.");
    }

    const registro = await navigator.serviceWorker.ready;

    let inscricao = await registro.pushManager.getSubscription();

    if (!inscricao) {
      inscricao = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ParaUint8Array(VALISYS_PUSH_PUBLIC_KEY)
      });
    }

    const usuario = getUsuarioSeguro();
    const loja = getLojaSeguro();

    await chamarFunction("push-subscribe", {
      subscription: inscricao.toJSON(),
      usuario: {
        id: usuario?.id || usuario?.nome || "",
        nome: usuario?.nome || "Usuário",
        cargo: usuario?.cargo || "",
        setor: usuario?.setor || ""
      },
      loja: {
        id: loja?.id || null,
        nome: loja?.nome || ""
      },
      userAgent: navigator.userAgent
    });

    return true;
  }

  async function enviarProdutoLancado(lancamento) {
    try {
      if (!lancamento || !lancamento.id) return false;

      const loja = getLojaSeguro();

      await chamarFunction("notify-product", {
        tipo: "produto_lancado",
        lancamentoId: lancamento.id,
        lojaId: lancamento.lojaId || loja?.id || null
      });

      return true;
    } catch (erro) {
      console.warn("Push de produto lançado não enviado:", erro);
      return false;
    }
  }

  window.valisysPush = {
    ativarPush,
    enviarProdutoLancado
  };

  document.addEventListener("DOMContentLoaded", criarWidget);
})();
