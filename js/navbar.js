/*
  ValiSys - Navbar lateral global
  Faz o botão  funcionar em todas as telas sem depender do JS específico da página.
*/

(function () {
  function preencherUsuarioSidebar() {
    try {
      const usuario = typeof getUsuarioLogado === "function" ? getUsuarioLogado() : null;
      const nomeEl = document.getElementById("sidebar-nome");
      const cargoEl = document.getElementById("sidebar-cargo");

      if (!usuario) return;

      if (nomeEl) nomeEl.innerText = usuario.nome || "Usuário";

      if (cargoEl && typeof nomeCargo === "function") {
        const marcaTexto = usuario.cargo === "promotor" && usuario.marcaPromotoria
          ? ` • Marca: ${usuario.marcaPromotoria}`
          : "";

        cargoEl.innerText = `${nomeCargo(usuario.cargo)}${usuario.setor ? " • " + usuario.setor : ""}${marcaTexto}`;
      }
    } catch (erro) {
      console.warn("Não foi possível preencher usuário na navbar.", erro);
    }
  }

  function iniciarNavbarGlobal() {
    const menuBtn = document.getElementById("menu-btn");
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");

    preencherUsuarioSidebar();

    if (!menuBtn || !sidebar || !overlay) return;

    if (menuBtn.dataset.navbarPronta === "true") return;
    menuBtn.dataset.navbarPronta = "true";

    const abrir = () => {
      sidebar.classList.add("active");
      overlay.classList.add("active");
      document.body.classList.add("menu-aberto");
    };

    const fechar = () => {
      sidebar.classList.remove("active");
      overlay.classList.remove("active");
      document.body.classList.remove("menu-aberto");
    };

    menuBtn.addEventListener("click", event => {
      event.preventDefault();

      if (sidebar.classList.contains("active")) {
        fechar();
      } else {
        abrir();
      }
    });

    overlay.addEventListener("click", fechar);

    sidebar.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        const href = link.getAttribute("href") || "";

        if (href.startsWith("#")) {
          fechar();
        }
      });
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        fechar();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarNavbarGlobal);
  } else {
    iniciarNavbarGlobal();
  }
})();
