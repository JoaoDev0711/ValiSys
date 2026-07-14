
(function () {
  function paginaAtual() {
    return location.pathname.split("/").pop() || "index.html";
  }

  function deveExibir() {
    const pagina = paginaAtual();
    const paginasIgnoradas = new Set([
      "index.html",
      "login.html",
      "admin-login.html",
      "escolher-loja.html",
      "teste-conexao.html"
    ]);

    if (paginasIgnoradas.has(pagina)) return false;
    if (typeof getUsuarioLogado !== "function") return false;

    return Boolean(getUsuarioLogado());
  }

  function criarBarra() {
    if (!deveExibir()) return;
    if (document.querySelector(".quick-actions-bar")) return;

    const usuario = getUsuarioLogado();
    const inicio = usuario?.cargo === "admin" ? "admin-dashboard.html" : "dashboard.html";

    const bar = document.createElement("nav");
    bar.className = "quick-actions-bar";
    bar.setAttribute("aria-label", "Ações rápidas");

    bar.innerHTML = `
      <a class="primary" href="${inicio}">Início</a>
      <a href="tutorial.html">Tutorial</a>
      <a href="notas-atualizacao.html">Novidades</a>
      <button type="button" data-action="reload">Atualizar</button>
      <button type="button" data-action="logout">Sair</button>
    `;

    bar.addEventListener("click", async (event) => {
      const btn = event.target.closest("button[data-action]");
      if (!btn) return;

      const action = btn.dataset.action;

      if (action === "reload") {
        location.reload();
        return;
      }

      if (action === "logout" && typeof sair === "function") {
        await sair();
      }
    });

    document.body.appendChild(bar);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", criarBarra);
  } else {
    criarBarra();
  }
})();
