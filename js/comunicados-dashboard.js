/*
  ValiSys - mostra comunicado dentro do card "Controle do mercado"
*/

(function () {
  function criarAreaAviso() {
    const welcome = document.querySelector(".welcome-card");
    if (!welcome || document.getElementById("comunicado-dashboard-inline")) return;

    const aviso = document.createElement("div");
    aviso.id = "comunicado-dashboard-inline";
    aviso.className = "comunicado-dashboard-inline";
    aviso.innerHTML = `
      <div class="comunicado-inline-topo">
        <span> Aviso da equipe</span>
        <strong id="comunicado-inline-titulo">Nenhum aviso recente</strong>
      </div>
      <p id="comunicado-inline-mensagem">Quando a gerência enviar um comunicado, ele aparece aqui.</p>
      <small id="comunicado-inline-autor"></small>
    `;

    welcome.appendChild(aviso);
  }

  function renderizar(lista) {
    const titulo = document.getElementById("comunicado-inline-titulo");
    const mensagem = document.getElementById("comunicado-inline-mensagem");
    const autor = document.getElementById("comunicado-inline-autor");

    if (!titulo || !mensagem || !autor) return;

    const item = lista?.[0];

    if (!item) {
      titulo.textContent = "Nenhum aviso recente";
      mensagem.textContent = "Quando a gerência enviar um comunicado, ele aparece aqui.";
      autor.textContent = "";
      return;
    }

    titulo.textContent = item.titulo || "Aviso da equipe";
    mensagem.textContent = item.mensagem || "";
    autor.textContent = `Enviado por ${item.criado_por || "Equipe"}${item.criado_por_cargo ? " • " + ValiSysComunicados.cargoNome(item.criado_por_cargo) : ""}`;
  }

  async function carregar() {
    const loja = ValiSysComunicados.lojaAtual();
    if (!loja) return;

    try {
      const lista = await ValiSysComunicados.listarComunicados(loja.id);
      renderizar(lista);
    } catch (erro) {
      console.warn("Erro ao carregar aviso da equipe.", erro);
    }
  }

  function iniciar() {
    criarAreaAviso();
    setTimeout(carregar, 900);
    setInterval(carregar, 180000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
