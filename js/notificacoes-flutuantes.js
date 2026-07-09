/*
  ValiSys - Notificação discreta no canto
  Mostra avisos internos sem poluir a tela.
*/

(function () {
  let intervalo = null;

  function permitido(usuario) {
    return usuario && typeof podeVerNotificacoes === "function" && podeVerNotificacoes(usuario.cargo);
  }

  function criarContainer() {
    let box = document.getElementById("notificacao-flutuante");

    if (box) return box;

    box = document.createElement("a");
    box.id = "notificacao-flutuante";
    box.href = "notificacoes.html";
    box.className = "notificacao-flutuante";
    box.innerHTML = `
      <span class="notif-floating-icon">${window.svgIconHTML ? window.svgIconHTML("bell") : "!"}</span>
      <span class="notif-floating-text">
        <strong id="notif-floating-title">Notificação</strong>
        <small id="notif-floating-desc">Você tem aviso interno.</small>
      </span>
      <span class="notif-floating-count" id="notif-floating-count">0</span>
    `;

    document.body.appendChild(box);
    return box;
  }

  async function atualizarNotificacaoFlutuante() {
    try {
      const usuario = typeof getUsuarioLogado === "function" ? getUsuarioLogado() : null;
      const loja = typeof getLojaAtual === "function" ? getLojaAtual() : null;

      if (!permitido(usuario) || !loja || typeof valisysDB === "undefined" || location.pathname.includes("notificacoes.html")) {
        const atual = document.getElementById("notificacao-flutuante");
        if (atual) atual.classList.remove("active");
        return;
      }

      const notificacoes = await valisysDB.listarNotificacoes(loja.id);
      const novas = notificacoes.filter(item => !item.lida);

      const box = criarContainer();

      if (novas.length === 0) {
        box.classList.remove("active");
        return;
      }

      const primeira = novas[0];

      box.querySelector("#notif-floating-title").innerText = novas.length === 1
        ? "Nova notificação"
        : `${novas.length} notificações`;

      box.querySelector("#notif-floating-desc").innerText = primeira?.titulo || "Abrir avisos internos";
      box.querySelector("#notif-floating-count").innerText = novas.length;
      box.classList.add("active");
    } catch (erro) {
      console.warn("Não foi possível carregar notificação flutuante.", erro);
    }
  }

  window.mostrarToastNotificacao = function (mensagem = "Notificação enviada.") {
    let toast = document.getElementById("toast-notificacao-simples");

    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast-notificacao-simples";
      toast.className = "toast-notificacao-simples";
      document.body.appendChild(toast);
    }

    toast.innerText = mensagem;
    toast.classList.add("active");

    setTimeout(() => toast.classList.remove("active"), 3200);
  };

  function iniciar() {
    atualizarNotificacaoFlutuante();

    if (intervalo) clearInterval(intervalo);
    intervalo = setInterval(atualizarNotificacaoFlutuante, 60000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
