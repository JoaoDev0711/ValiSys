
(function () {
  const TUTORIAL_VERSION = "minimal-v1";

  function getUsuarioSeguro() {
    try {
      return typeof getUsuarioLogado === "function" ? getUsuarioLogado() : null;
    } catch {
      return null;
    }
  }

  function paginaAtual() {
    return location.pathname.split("/").pop() || "index.html";
  }

  function passosPorCargo(usuario) {
    const cargo = usuario?.cargo || "operador";

    const base = [
      {
        titulo: "Escolha a loja correta",
        texto: "Todos os registros ficam vinculados à loja selecionada. Troque de loja sempre que estiver em outra unidade."
      },
      {
        titulo: "Confira seu perfil",
        texto: "As opções aparecem conforme o cargo: promotor, encarregado, gerente ou admin."
      },
      {
        titulo: "Registre produtos com atenção",
        texto: "No lançamento, confira nome, EAN, marca, gramagem, setor, quantidade e validade antes de salvar."
      },
      {
        titulo: "Use a lista certa",
        texto: "Meus lançamentos mostra o que você registrou. Lista Geral mostra a operação da equipe quando seu cargo permite."
      }
    ];

    if (cargo === "promotor") {
      return [
        ...base,
        {
          titulo: "Promotoria",
          texto: "Seu acesso fica vinculado à marca informada. Use Meus lançamentos para acompanhar o que foi registrado por você."
        }
      ];
    }

    if (cargo === "encarregado") {
      return [
        ...base,
        {
          titulo: "Acompanhamento do setor",
          texto: "Priorize vencidos, vencem hoje e próximos 7 dias. Use a Lista Geral para acompanhar a rotina operacional."
        }
      ];
    }

    if (cargo === "gerente" || cargo === "admin") {
      return [
        ...base,
        {
          titulo: "Gestão e assinatura",
          texto: "Acesse Gestão da loja, Usuários, Planos e Minha assinatura para manter a operação organizada."
        },
        {
          titulo: "Comunicados",
          texto: "Use comunicados para orientar a equipe sem depender de mensagens soltas fora do sistema."
        }
      ];
    }

    return base;
  }

  function criarModal() {
    let modal = document.getElementById("valisys-onboarding-modal");
    if (modal) return modal;

    modal = document.createElement("div");
    modal.id = "valisys-onboarding-modal";
    modal.className = "valisys-modal";
    modal.setAttribute("aria-hidden", "true");

    document.body.appendChild(modal);
    return modal;
  }

  function fecharTutorial() {
    const modal = document.getElementById("valisys-onboarding-modal");
    if (!modal) return;
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
  }

  function abrirTutorial(forcar = false) {
    const usuario = getUsuarioSeguro();
    if (!usuario) return;

    const modal = criarModal();
    const passos = passosPorCargo(usuario);
    const pagina = paginaAtual();
    const inicio = usuario.cargo === "admin" ? "admin-dashboard.html" : "dashboard.html";

    modal.innerHTML = `
      <section class="valisys-modal-card" role="dialog" aria-modal="true" aria-labelledby="tutorial-titulo">
        <div class="valisys-modal-header">
          <div>
            <p class="muted">Primeiros passos</p>
            <h2 id="tutorial-titulo">Como usar o ValiSys</h2>
          </div>
          <button type="button" class="secondary small-btn" data-close>Tutorial depois</button>
        </div>

        <p>
          Este guia aparece no primeiro acesso para ajudar qualquer pessoa da loja a entender o fluxo principal.
        </p>

        <div class="valisys-steps">
          ${passos.map((passo, index) => `
            <article class="valisys-step">
              <strong>${index + 1}. ${esc(passo.titulo)}</strong>
              <span>${esc(passo.texto)}</span>
            </article>
          `).join("")}
        </div>

        <div class="valisys-actions">
          <a class="button-link" href="tutorial.html">Abrir tutorial completo</a>
          <a class="inline-link" href="notas-atualizacao.html">Ver atualizações</a>
          <button type="button" data-close>Entendi</button>
        </div>
      </section>
    `;

    modal.querySelectorAll("[data-close]").forEach(btn => {
      btn.addEventListener("click", () => {
        localStorage.setItem(`valisys_tutorial_${TUTORIAL_VERSION}_${usuario.cargo}`, "ok");
        fecharTutorial();
      });
    });

    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");

    if (forcar) {
      localStorage.setItem(`valisys_tutorial_${TUTORIAL_VERSION}_${usuario.cargo}`, "ok");
    }
  }

  window.abrirTutorialValiSys = abrirTutorial;
  window.fecharTutorialValiSys = fecharTutorial;

  function iniciarAutomatico() {
    const usuario = getUsuarioSeguro();
    if (!usuario) return;

    const pagina = paginaAtual();
    if (!["dashboard.html", "admin-dashboard.html"].includes(pagina)) return;

    const chave = `valisys_tutorial_${TUTORIAL_VERSION}_${usuario.cargo}`;
    if (localStorage.getItem(chave) === "ok") return;

    setTimeout(() => abrirTutorial(false), 700);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarAutomatico);
  } else {
    iniciarAutomatico();
  }
})();
