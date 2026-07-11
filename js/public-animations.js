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
  // VALISYS_MOBILE_IMPACT_GUARD: no celular a seção vira layout simples, sem travar rolagem.
  const mobileImpacto = window.matchMedia && window.matchMedia("(max-width: 760px)").matches;
  if (mobileImpacto) {
    const botoesMobile = [...document.querySelectorAll("[data-step]")];
    botoesMobile.forEach(botao => {
      botao.addEventListener("click", () => aplicarPasso(Number(botao.dataset.step || 0), 0.35));
    });
    aplicarPasso(0, 0.18);
    return;
  }

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


/* ===== ValiSys: cards animados estilo Webflow/Aluro ===== */
(function () {
  const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function ativarCardMotion() {
    const cards = [...document.querySelectorAll("[data-card-motion]")];

    cards.forEach((card, index) => {
      card.style.setProperty("--motion-index", String(index % 6));
      card.classList.add("tilt-card");
    });

    if (reduzirMovimento) {
      cards.forEach(card => card.classList.add("card-in-view"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("card-in-view");
        }
      });
    }, {
      threshold: 0.16,
      rootMargin: "0px 0px -8% 0px"
    });

    cards.forEach(card => observer.observe(card));

    if (window.matchMedia("(min-width: 761px)").matches) {
      cards.forEach(card => {
        card.addEventListener("pointermove", event => {
          const rect = card.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width;
          const y = (event.clientY - rect.top) / rect.height;

          const tiltY = (x - .5) * 7;
          const tiltX = (y - .5) * -7;

          card.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
          card.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);
          card.style.setProperty("--mx", `${(x * 100).toFixed(0)}%`);
          card.style.setProperty("--my", `${(y * 100).toFixed(0)}%`);
          card.classList.add("card-hovered");
        });

        card.addEventListener("pointerleave", () => {
          card.style.setProperty("--tilt-x", "0deg");
          card.style.setProperty("--tilt-y", "0deg");
          card.classList.remove("card-hovered");
        });
      });
    }
  }

  function ativarStackMobileAnimado() {
    const area = document.querySelector(".impact-stack-area");
    const cards = [...document.querySelectorAll(".impact-stack-card")];

    if (!area || cards.length === 0) return;
    if (!window.matchMedia("(max-width: 760px)").matches) return;
    if (reduzirMovimento) return;

    let ticking = false;

    function clamp(valor, min, max) {
      return Math.max(min, Math.min(max, valor));
    }

    function atualizar() {
      ticking = false;

      const viewport = window.innerHeight || document.documentElement.clientHeight;
      const areaRect = area.getBoundingClientRect();

      cards.forEach((card, index) => {
        const rect = card.getBoundingClientRect();
        const stickyTop = 76 + index * 20;

        const raw = (stickyTop - rect.top) / Math.max(rect.height * .72, 1);
        const progress = clamp(raw, 0, 1);
        const areaProgress = clamp((viewport * .82 - areaRect.top) / Math.max(areaRect.height, 1), 0, 1);

        const scale = 1 - progress * .045 - index * .004;
        const y = progress * (-8 - index * 3);
        const z = progress * (-18 - index * 8);
        const rx = progress * 3.5;
        const rz = (index % 2 === 0 ? -1 : 1) * progress * 1.15;
        const shine = .22 + areaProgress * .18;

        card.style.setProperty("--stack-scale", scale.toFixed(3));
        card.style.setProperty("--stack-y", `${y.toFixed(1)}px`);
        card.style.setProperty("--stack-z", `${z.toFixed(1)}px`);
        card.style.setProperty("--stack-rx", `${rx.toFixed(2)}deg`);
        card.style.setProperty("--stack-rz", `${rz.toFixed(2)}deg`);
        card.style.setProperty("--shine-opacity", shine.toFixed(2));

        card.classList.toggle("card-stacked-active", progress > .04 && progress < .96);
        card.classList.toggle("card-passed", progress > .82);
      });
    }

    function pedirAtualizacao() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(atualizar);
      }
    }

    window.addEventListener("scroll", pedirAtualizacao, { passive: true });
    window.addEventListener("resize", pedirAtualizacao);
    pedirAtualizacao();
  }

  function iniciar() {
    ativarCardMotion();
    ativarStackMobileAnimado();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
