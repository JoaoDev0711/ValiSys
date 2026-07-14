/*
  ValiSys - Modais internos do sistema
  Evita janelas externas do navegador para avisos e confirmações.
*/

(function () {
  function garantirModal() {
    let modal = document.getElementById("site-modal");

    if (modal) return modal;

    modal = document.createElement("div");
    modal.id = "site-modal";
    modal.className = "site-modal";
    modal.innerHTML = `
      <div class="site-modal-backdrop" data-modal-close="true"></div>
      <div class="site-modal-box" role="dialog" aria-modal="true" aria-labelledby="site-modal-title">
        <div class="site-modal-icon" id="site-modal-icon">!</div>
        <h2 id="site-modal-title">Aviso</h2>
        <p id="site-modal-message"></p>
        <div class="site-modal-actions">
          <button type="button" class="secondary" id="site-modal-cancel">Cancelar</button>
          <button type="button" id="site-modal-ok">Confirmar</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    return modal;
  }

  function abrirModal({ titulo = "Aviso", mensagem = "", tipo = "aviso", confirmar = false, textoOk = "OK", textoCancelar = "Cancelar" } = {}) {
    return new Promise(resolve => {
      const modal = garantirModal();

      const tituloEl = modal.querySelector("#site-modal-title");
      const mensagemEl = modal.querySelector("#site-modal-message");
      const iconEl = modal.querySelector("#site-modal-icon");
      const btnOk = modal.querySelector("#site-modal-ok");
      const btnCancelar = modal.querySelector("#site-modal-cancel");
      const backdrop = modal.querySelector(".site-modal-backdrop");

      tituloEl.innerText = titulo;
      mensagemEl.innerText = String(mensagem || "");
      iconEl.innerText = tipo === "perigo" ? "!" : tipo === "sucesso" ? "" : "?";
      iconEl.className = `site-modal-icon modal-${tipo}`;

      btnOk.innerText = textoOk;
      btnCancelar.innerText = textoCancelar;
      btnCancelar.style.display = confirmar ? "inline-flex" : "none";

      modal.classList.add("active");

      function fechar(resultado) {
        modal.classList.remove("active");

        btnOk.removeEventListener("click", okHandler);
        btnCancelar.removeEventListener("click", cancelHandler);
        backdrop.removeEventListener("click", cancelHandler);
        document.removeEventListener("keydown", keyHandler);

        resolve(resultado);
      }

      function okHandler() {
        fechar(true);
      }

      function cancelHandler() {
        fechar(false);
      }

      function keyHandler(event) {
        if (event.key === "Escape") {
          fechar(false);
        }

        if (event.key === "Enter" && !event.shiftKey) {
          fechar(true);
        }
      }

      btnOk.addEventListener("click", okHandler);
      btnCancelar.addEventListener("click", cancelHandler);
      backdrop.addEventListener("click", cancelHandler);
      document.addEventListener("keydown", keyHandler);

      setTimeout(() => btnOk.focus(), 50);
    });
  }

  window.avisoSite = function (mensagem, titulo = "Aviso", tipo = "aviso") {
    return abrirModal({
      titulo,
      mensagem,
      tipo,
      confirmar: false,
      textoOk: "Entendi"
    });
  };

  window.confirmarAcao = function (mensagem, titulo = "Confirmar ação", tipo = "aviso") {
    return abrirModal({
      titulo,
      mensagem,
      tipo,
      confirmar: true,
      textoOk: "Confirmar",
      textoCancelar: "Cancelar"
    });
  };

  // Faz alert() virar modal interno sem quebrar códigos antigos.
  window.alert = function (mensagem) {
    avisoSite(mensagem);
  };
})();
