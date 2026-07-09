/*
  ValiSys - Coverflow público
  Slider visual com imagens/telas uma atrás da outra.
*/

(function () {
  const stage = document.getElementById("publicCoverflow");
  const dotsBox = document.getElementById("coverflowDots");

  if (!stage) return;

  const slides = [...stage.querySelectorAll(".coverflow-slide")];

  if (slides.length === 0) return;

  let atual = 0;
  let timer = null;

  function posicaoClasse(index) {
    const total = slides.length;
    const diff = (index - atual + total) % total;

    if (diff === 0) return "active";
    if (diff === 1) return "right-1";
    if (diff === 2) return "right-2";
    if (diff === total - 1) return "left-1";
    if (diff === total - 2) return "left-2";

    return "hidden";
  }

  function renderizar() {
    slides.forEach((slide, index) => {
      slide.className = `coverflow-slide ${posicaoClasse(index)}`;
    });

    if (dotsBox) {
      dotsBox.innerHTML = slides.map((_, index) => `
        <button type="button" class="${index === atual ? "active" : ""}" aria-label="Ver slide ${index + 1}"></button>
      `).join("");

      [...dotsBox.querySelectorAll("button")].forEach((button, index) => {
        button.addEventListener("click", () => {
          atual = index;
          renderizar();
          reiniciar();
        });
      });
    }
  }

  function proximo() {
    atual = (atual + 1) % slides.length;
    renderizar();
  }

  function reiniciar() {
    if (timer) clearInterval(timer);
    timer = setInterval(proximo, 3600);
  }

  slides.forEach((slide, index) => {
    slide.addEventListener("click", () => {
      atual = index;
      renderizar();
      reiniciar();
    });
  });

  renderizar();
  reiniciar();

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (timer) clearInterval(timer);
      return;
    }

    reiniciar();
  });
})();
