/*
  ValiSys - envio de comunicado pela Gestão da Loja
*/

(function () {
  const PERMITIDOS = ["gerente", "encarregado", "admin"];

  function iniciar() {
    const usuario = ValiSysComunicados.usuarioAtual();
    const loja = ValiSysComunicados.lojaAtual();
    const form = document.getElementById("form-comunicado-equipe");
    const status = document.getElementById("status-comunicado-equipe");

    if (!form || !usuario || !loja) return;

    if (!PERMITIDOS.includes(usuario.cargo)) {
      form.innerHTML = `
        <div class="empty-state">
          <span>🔒</span>
          <p>Somente gerente, encarregado ou admin pode enviar aviso para a equipe.</p>
        </div>
      `;
      return;
    }

    form.addEventListener("submit", async event => {
      event.preventDefault();

      const tituloEl = document.getElementById("comunicadoTitulo");
      const textoEl = document.getElementById("comunicadoTexto");
      const botao = form.querySelector("button");

      const titulo = String(tituloEl.value || "Aviso da equipe").trim();
      const mensagem = String(textoEl.value || "").trim();

      if (!mensagem || mensagem.length < 3) {
        alert("Digite uma mensagem para enviar.");
        return;
      }

      botao.disabled = true;
      botao.textContent = "Enviando...";
      if (status) status.textContent = "Salvando comunicado e enviando push externo...";

      try {
        const resposta = await ValiSysComunicados.chamarFunction("send-team-message", {
          lojaId: loja.id,
          titulo,
          mensagem,
          tipo: "aviso",
          criadoPor: usuario.nome,
          criadoPorCargo: usuario.cargo
        });

        textoEl.value = "";
        const push = resposta.push || {};
        const enviados = Number(push.enviados || 0);

        if (status) {
          status.textContent = enviados > 0
            ? `Aviso enviado no dashboard e por push para ${enviados} aparelho(s).`
            : "Aviso apareceu no dashboard, mas nenhum aparelho recebeu push. Confira se a equipe ativou o sino.";
        }

        alert(enviados > 0
          ? `Aviso enviado no site e por push para ${enviados} aparelho(s).`
          : "Aviso salvo no site, mas nenhum aparelho recebeu push."
        );
      } catch (erro) {
        console.error(erro);
        if (status) status.textContent = "Erro ao enviar aviso.";
        alert("Erro ao enviar aviso: " + erro.message);
      } finally {
        setTimeout(() => {
          botao.disabled = false;
          botao.textContent = "Enviar aviso externo";
        }, 900);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
