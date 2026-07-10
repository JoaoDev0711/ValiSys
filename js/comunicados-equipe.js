/*
  ValiSys - Comunicados da equipe
  Aparece no dashboard e também dispara push externo.
*/

(function () {
  const PERMITIDOS = ["gerente", "encarregado", "admin"];

  function usuarioAtual() {
    try {
      return typeof getUsuarioLogado === "function" ? getUsuarioLogado() : JSON.parse(localStorage.getItem("usuarioLogado") || "null");
    } catch {
      return null;
    }
  }

  function lojaAtual() {
    try {
      return typeof getLojaAtual === "function" ? getLojaAtual() : JSON.parse(localStorage.getItem("lojaAtual") || "null");
    } catch {
      return null;
    }
  }

  function cargoNome(cargo) {
    if (typeof nomeCargo === "function") return nomeCargo(cargo);
    return cargo || "";
  }

  function escLocal(valor) {
    if (typeof esc === "function") return esc(valor);

    return String(valor || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function functionUrl(nome) {
    return `${VALISYS_DADOS_URL.replace(/\/$/, "")}/functions/v1/${nome}`;
  }

  async function chamarFunction(nome, payload) {
    const resposta = await fetch(functionUrl(nome), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": VALISYS_DADOS_PUBLIC_KEY,
        "Authorization": `Bearer ${VALISYS_DADOS_PUBLIC_KEY}`
      },
      body: JSON.stringify(payload || {})
    });

    const texto = await resposta.text();
    let json = {};

    try {
      json = texto ? JSON.parse(texto) : {};
    } catch {
      json = { mensagem: texto };
    }

    if (!resposta.ok) {
      throw new Error(json.error || json.mensagem || "Erro ao enviar comunicado.");
    }

    return json;
  }

  async function listarComunicados(lojaId) {
    const db = getDadosOnlineClient();

    const { data, error } = await db
      .from("comunicados_equipe")
      .select("*")
      .eq("loja_id", lojaId)
      .eq("ativo", true)
      .order("criado_em", { ascending: false })
      .limit(3);

    if (error) throw error;

    return data || [];
  }

  function montarCardBase() {
    if (document.getElementById("comunicado-equipe-card")) return;

    const welcome = document.querySelector(".welcome-card");
    if (!welcome) return;

    const section = document.createElement("section");
    section.className = "comunicado-equipe-card";
    section.id = "comunicado-equipe-card";

    section.innerHTML = `
      <div class="comunicado-topo">
        <div>
          <span class="comunicado-label">Comunicado da equipe</span>
          <h2 id="comunicado-titulo">Nenhum comunicado recente</h2>
        </div>
        <span class="comunicado-icone">📣</span>
      </div>

      <p id="comunicado-mensagem" class="comunicado-mensagem">Quando gerente ou encarregado enviar um aviso, ele aparece aqui.</p>
      <p id="comunicado-autor" class="comunicado-autor"></p>

      <form id="form-comunicado-equipe" class="comunicado-form" style="display:none;">
        <label for="comunicadoTexto">Enviar aviso para a equipe</label>
        <textarea id="comunicadoTexto" maxlength="300" rows="3" placeholder="Ex: Bom trabalho equipe! Atenção aos produtos próximos da validade hoje."></textarea>
        <div class="comunicado-form-actions">
          <input id="comunicadoTitulo" maxlength="70" placeholder="Título do aviso" value="Aviso da equipe">
          <button type="submit">Enviar aviso externo</button>
        </div>
      </form>
    `;

    welcome.insertAdjacentElement("afterend", section);
  }

  function renderComunicado(lista) {
    const titulo = document.getElementById("comunicado-titulo");
    const mensagem = document.getElementById("comunicado-mensagem");
    const autor = document.getElementById("comunicado-autor");

    if (!titulo || !mensagem || !autor) return;

    const primeiro = lista?.[0];

    if (!primeiro) {
      titulo.textContent = "Nenhum comunicado recente";
      mensagem.textContent = "Quando gerente ou encarregado enviar um aviso, ele aparece aqui.";
      autor.textContent = "";
      return;
    }

    titulo.textContent = primeiro.titulo || "Aviso da equipe";
    mensagem.textContent = primeiro.mensagem || "";
    autor.textContent = `Enviado por ${primeiro.criado_por || "Equipe"}${primeiro.criado_por_cargo ? " • " + cargoNome(primeiro.criado_por_cargo) : ""}`;
  }

  function liberarFormulario(usuario) {
    const form = document.getElementById("form-comunicado-equipe");

    if (!form) return;

    if (!PERMITIDOS.includes(usuario?.cargo)) {
      form.style.display = "none";
      return;
    }

    form.style.display = "grid";

    form.addEventListener("submit", async event => {
      event.preventDefault();

      const loja = lojaAtual();
      const textoEl = document.getElementById("comunicadoTexto");
      const tituloEl = document.getElementById("comunicadoTitulo");

      const mensagem = String(textoEl.value || "").trim();
      const titulo = String(tituloEl.value || "Aviso da equipe").trim();

      if (!mensagem || mensagem.length < 3) {
        alert("Digite uma mensagem para enviar.");
        return;
      }

      const botao = form.querySelector("button");
      botao.disabled = true;
      botao.textContent = "Enviando...";

      try {
        const resposta = await chamarFunction("send-team-message", {
          lojaId: loja.id,
          titulo,
          mensagem,
          tipo: "aviso",
          criadoPor: usuario.nome,
          criadoPorCargo: usuario.cargo
        });

        textoEl.value = "";
        botao.textContent = "Enviado";

        await carregarComunicados();

        const push = resposta.push || {};
        const enviados = Number(push.enviados || 0);

        if (enviados > 0) {
          alert(`Aviso enviado no site e por push para ${enviados} aparelho(s).`);
        } else {
          alert("Aviso apareceu no site, mas nenhum aparelho recebeu push. Confira se a equipe ativou o sino.");
        }
      } catch (erro) {
        console.error(erro);
        alert("Erro ao enviar aviso: " + erro.message);
      } finally {
        setTimeout(() => {
          botao.disabled = false;
          botao.textContent = "Enviar aviso externo";
        }, 900);
      }
    }, { once: true });
  }

  async function carregarComunicados() {
    const loja = lojaAtual();

    if (!loja) return;

    try {
      const comunicados = await listarComunicados(loja.id);
      renderComunicado(comunicados);
    } catch (erro) {
      console.warn("Erro ao carregar comunicados.", erro);
    }
  }

  function iniciar() {
    const usuario = usuarioAtual();

    if (!usuario) return;

    montarCardBase();
    liberarFormulario(usuario);
    carregarComunicados();

    setInterval(carregarComunicados, 120000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
