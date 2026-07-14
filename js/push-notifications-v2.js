/*
  ValiSys - Notificações Push pelo navegador
  Versão otimizada: não deixa botão ativo depois que o aparelho já está inscrito.
*/

const VALISYS_PUSH_PUBLIC_KEY = "BIW4knHLKLF65FEIR_ndLGXfXCS13MtruNHLqYmRyRlzRCdoI3ImN1gO0oQVHkTybXf5fGdwpMVPHDtQptPoFZs";

(function () {
  const VALISYS_PUSH_V2_CACHE_FIX = true;
  const SUPORTA_PUSH = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  const STORAGE_PUSH_ATIVO = "valisysPushAtivoV2";

  function pushConfigurado() {
    return (
      typeof VALISYS_PUSH_PUBLIC_KEY === "string" &&
      VALISYS_PUSH_PUBLIC_KEY &&
      !VALISYS_PUSH_PUBLIC_KEY.includes("COLE_AQUI")
    );
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

  function aparelhoJaAtivado() {
    return localStorage.getItem(STORAGE_PUSH_ATIVO) === "true" && Notification?.permission === "granted";
  }

  function removerWidget() {
    const widget = document.querySelector("[data-push-widget]");
    if (widget) widget.remove();
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
    if (!SUPORTA_PUSH) return;
    if (!pushConfigurado()) { removerWidget(); return; }
    if (!getUsuarioSeguro()) return;
    if (aparelhoJaAtivado()) return;
    if (document.querySelector("[data-push-widget]")) return;

    const widget = document.createElement("aside");
    widget.className = "push-widget";
    widget.setAttribute("data-push-widget", "true");

    widget.innerHTML = `
      <button type="button" class="push-widget-toggle" data-push-toggle aria-label="Ativar notificações">
        🔔
      </button>

      <div class="push-widget-card" data-push-card>
        <div>
          <strong>Ativar notificações</strong>
          <p data-push-status>Receba avisos de produtos lançados, próximos do vencimento e vencidos.</p>
        </div>

        <button type="button" data-push-ativar>Ativar no celular</button>
      </div>
    `;

    document.body.appendChild(widget);

    const status = widget.querySelector("[data-push-status]");
    const ativar = widget.querySelector("[data-push-ativar]");
    const toggle = widget.querySelector("[data-push-toggle]");

    toggle.addEventListener("click", () => {
      widget.classList.toggle("open");
    });

    if (Notification.permission === "denied") {
      status.textContent = "Notificação bloqueada no navegador. Libere nas configurações do site.";
      ativar.disabled = true;
      return;
    }

    ativar.addEventListener("click", async () => {
      ativar.disabled = true;
      status.textContent = "Ativando...";

      try {
        await ativarPush();
        localStorage.setItem(STORAGE_PUSH_ATIVO, "true");
        status.textContent = "Notificações ativadas.";
        widget.classList.add("push-widget-saindo");
        setTimeout(removerWidget, 450);
      } catch (erro) {
        console.warn(erro);
        status.textContent = erro.message || "Não foi possível ativar.";
        ativar.disabled = false;
      }
    });
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

  function iniciarLeve() {
    if (window.requestIdleCallback) {
      window.requestIdleCallback(criarWidget, { timeout: 2500 });
    } else {
      setTimeout(criarWidget, 1200);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarLeve);
  } else {
    iniciarLeve();
  }
})();
