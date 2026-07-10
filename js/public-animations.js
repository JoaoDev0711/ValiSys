/*
  ValiSys - Animações do site público
  - Revelação suave ao rolar
  - Seção "travada" usando position: sticky + progresso do scroll
*/

(function () {
  const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function ativarReveals() {
    const elementos = document.querySelectorAll(`
      .hero-copy-redesign,
      .coverflow-area,
      .feature-grid-redesign article,
      .workflow-line article,
      .split-card-redesign,
      .management-card,
      .cta-redesign,
      .importance-copy,
      .importance-scene,
      .importance-steps button
    `);

    elementos.forEach((el, index) => {
      el.classList.add("scroll-reveal");
      el.style.setProperty("--reveal-delay", `${Math.min(index * 45, 260)}ms`);
    });

    if (reduzirMovimento) {
      elementos.forEach(el => el.classList.add("visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.18,
      rootMargin: "0px 0px -8% 0px"
    });

    elementos.forEach(el => observer.observe(el));
  }

  const dadosImpacto = [
    {
      titulo: "Produto vencendo hoje",
      status: "Atenção",
      produto: "Leite integral",
      texto: "Frios e Laticínios • vence hoje • 8 unidades",
      cor: "danger"
    },
    {
      titulo: "Equipe notificada",
      status: "Aviso enviado",
      produto: "Notificação interna",
      texto: "Encarregado e gerente recebem o alerta no painel.",
      cor: "warning"
    },
    {
      titulo: "Retirada registrada",
      status: "Conferido",
      produto: "Produto retirado",
      texto: "A ação fica registrada para acompanhamento da loja.",
      cor: "success"
    },
    {
      titulo: "Prejuízo evitado",
      status: "Controle ativo",
      produto: "Painel atualizado",
      texto: "O resumo mostra o que ainda vence hoje, em 7 dias e em 30 dias.",
      cor: "control"
    }
  ];

  function ativarSecaoTravada() {
    const secao = document.querySelector(".importance-pin-section");
    const title = document.getElementById("importanceTitle");
    const status = document.getElementById("importanceStatus");
    const cardTitle = document.getElementById("importanceCardTitle");
    const cardText = document.getElementById("importanceCardText");
    const progressBar = document.getElementById("importanceProgressBar");
    const steps = [...document.querySelectorAll("#importanceSteps button")];
    const floats = [...document.querySelectorAll("[data-importance-float]")];
    const phone = document.querySelector(".importance-phone");
    const mobileLayout = window.matchMedia("(max-width: 760px)");

    if (!secao || !title || !status || !cardTitle || !cardText || !progressBar) return;

    let passoAtual = -1;

    function aplicarPasso(index, progress = 0) {
      const item = dadosImpacto[index] || dadosImpacto[0];

      if (passoAtual !== index) {
        passoAtual = index;

        title.textContent = item.titulo;
        status.textContent = item.status;
        cardTitle.textContent = item.produto;
        cardText.textContent = item.texto;

        phone?.setAttribute("data-impact", item.cor);

        steps.forEach((btn, btnIndex) => {
          btn.classList.toggle("active", btnIndex === index);
        });

        floats.forEach((float, floatIndex) => {
          float.classList.toggle("active", floatIndex === index);
        });
      }

      progressBar.style.width = `${Math.max(8, Math.min(progress * 100, 100))}%`;
    }

    function calcular() {
      if (mobileLayout.matches) {
        aplicarPasso(Math.max(passoAtual, 0), (Math.max(passoAtual, 0) + 1) / dadosImpacto.length);
        return;
      }

      const rect = secao.getBoundingClientRect();
      const total = secao.offsetHeight - window.innerHeight;

      if (total <= 0) {
        aplicarPasso(0, 0);
        return;
      }

      const perc = Math.min(Math.max((-rect.top) / total, 0), 1);
      const index = Math.min(dadosImpacto.length - 1, Math.floor(perc * dadosImpacto.length));
      aplicarPasso(index, perc);
    }

    steps.forEach((btn, index) => {
      btn.addEventListener("click", () => {
        if (mobileLayout.matches) {
          aplicarPasso(index, (index + 1) / dadosImpacto.length);
          return;
        }

        const total = secao.offsetHeight - window.innerHeight;
        const alvo = secao.offsetTop + (total * (index / dadosImpacto.length)) + 8;

        window.scrollTo({
          top: alvo,
          behavior: reduzirMovimento ? "auto" : "smooth"
        });
      });
    });

    aplicarPasso(0, 0.18);
    calcular();
    window.addEventListener("scroll", calcular, { passive: true });
    window.addEventListener("resize", calcular);
    if (mobileLayout.addEventListener) {
      mobileLayout.addEventListener("change", calcular);
    }
  }

  ativarReveals();
  ativarSecaoTravada();
})();
