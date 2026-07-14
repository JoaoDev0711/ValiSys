(function () {
  function paginaAtual() {
    return location.pathname.split("/").pop() || "index.html";
  }

  function usuarioAtual() {
    try {
      return typeof getUsuarioLogado === "function" ? getUsuarioLogado() : null;
    } catch {
      return null;
    }
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
    return Boolean(usuarioAtual());
  }

  function ativoPara(href) {
    const pagina = paginaAtual();
    if (!href) return false;

    if (href === pagina) return true;

    const usuario = usuarioAtual();
    if (href === "dashboard.html" && pagina === "dashboard.html" && usuario?.cargo !== "admin") return true;
    if (href === "admin-dashboard.html" && pagina === "admin-dashboard.html") return true;

    return false;
  }

  function linkClasse(href) {
    return ativoPara(href) ? ' class="is-active"' : "";
  }

  function criarBarra() {
    if (!deveExibir()) return;
    if (document.querySelector(".quick-actions-bar")) return;

    const usuario = usuarioAtual();
    const inicio = usuario?.cargo === "admin" ? "admin-dashboard.html" : "dashboard.html";
    const pagina = paginaAtual();

    const bar = document.createElement("nav");
    bar.className = "quick-actions-bar";
    bar.setAttribute("aria-label", "Ações rápidas");

    bar.innerHTML = `
      <a${linkClasse(inicio)} href="${inicio}">Início</a>
      <a${linkClasse("tutorial.html")} href="tutorial.html">Tutorial</a>
      <a${linkClasse("notas-atualizacao.html")} href="notas-atualizacao.html">Novidades</a>
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
