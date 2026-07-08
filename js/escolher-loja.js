const usuario = getUsuarioLogado();

const listaLojas = document.getElementById("lista-lojas");
const filtroGrupoLoja = document.getElementById("filtroGrupoLoja");
const filtroRegiaoLoja = document.getElementById("filtroRegiaoLoja");

let lojasCache = [];

function normalizarFiltro(valor) {
  return String(valor || "").trim().toLowerCase();
}

function montarOptions(select, valores, textoTodos, valorTodos) {
  if (!select) return;

  const valorAtual = select.value || valorTodos;
  const unicos = [...new Set(valores.map(v => String(v || "").trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "pt-BR"));

  select.innerHTML = `
    <option value="${valorTodos}">${textoTodos}</option>
    ${unicos.map(valor => `<option value="${esc(valor)}">${esc(valor)}</option>`).join("")}
  `;

  if ([...select.options].some(op => op.value === valorAtual)) {
    select.value = valorAtual;
  }
}

function atualizarFiltrosLoja() {
  montarOptions(
    filtroGrupoLoja,
    lojasCache.map(loja => loja.grupo || "Sem grupo"),
    "Todos os grupos",
    "todos"
  );

  montarOptions(
    filtroRegiaoLoja,
    lojasCache.map(loja => loja.regiao || "Sem região"),
    "Todas as regiões",
    "todas"
  );
}

function lojasFiltradas() {
  const grupo = filtroGrupoLoja?.value || "todos";
  const regiao = filtroRegiaoLoja?.value || "todas";

  return lojasCache.filter(loja => {
    const grupoLoja = loja.grupo || "Sem grupo";
    const regiaoLoja = loja.regiao || "Sem região";

    const passaGrupo = grupo === "todos" || normalizarFiltro(grupoLoja) === normalizarFiltro(grupo);
    const passaRegiao = regiao === "todas" || normalizarFiltro(regiaoLoja) === normalizarFiltro(regiao);

    return passaGrupo && passaRegiao;
  });
}

function renderizarListaLojas() {
  const lojas = lojasFiltradas();

  if (lojas.length === 0) {
    listaLojas.innerHTML = `
      <div class="card">
        <p>Nenhuma loja encontrada com estes filtros.</p>
        <p class="muted">Troque o grupo ou a região para ver outras lojas disponíveis.</p>
      </div>
    `;
    return;
  }

  listaLojas.innerHTML = lojas.map(loja => `
    <article class="card loja-card loja-card-com-logo">
      ${logoLojaHTML(loja, "loja-logo-card")}

      <div class="loja-card-info">
        <h3>${esc(loja.nome)}</h3>
        <p class="muted">Responsável: ${esc(loja.responsavel || "Não informado")}</p>
        <p><strong>Grupo/Rede:</strong> ${esc(loja.grupo || "Sem grupo")}</p>
        <p><strong>Região:</strong> ${esc(loja.regiao || "Sem região")}</p>
      </div>

      <div class="loja-actions">
        <button type="button" onclick="selecionarLoja('${loja.id}')">Usar esta loja</button>
      </div>
    </article>
  `).join("");
}

async function renderizarLojas() {
  listaLojas.innerHTML = `<div class="card"><p class="muted">Carregando lojas...</p></div>`;

  try {
    // A seleção de loja mostra apenas lojas ativas.
    lojasCache = await valisysDB.listarLojas();

    if (lojasCache.length === 0) {
      listaLojas.innerHTML = `
        <div class="card">
          <p>Nenhuma loja ativa cadastrada.</p>
          <p class="muted">Entre como admin para cadastrar ou ativar uma loja.</p>
        </div>
      `;
      return;
    }

    atualizarFiltrosLoja();
    renderizarListaLojas();
  } catch (erro) {
    console.error(erro);
    listaLojas.innerHTML = `
      <div class="card">
        <p class="danger">Erro ao carregar lojas.</p>
        <p class="muted">${esc(erro.message)}</p>
        <p class="muted">Verifique a conexão e tente novamente.</p>
      </div>
    `;
  }
}

async function selecionarLoja(id) {
  try {
    const loja = lojasCache.find(item => item.id === id);

    if (!loja) {
      alert("Loja não encontrada.");
      return;
    }

    const confirmar = confirm(`Confirmar loja atual?\n\n${loja.nome}`);

    if (!confirmar) return;

    setLojaAtual(loja);

    // Escolher loja nunca pode aproveitar login de admin.
    // Depois de escolher a loja, entra pelo login operacional da loja.
    if (usuario && usuario.cargo === "admin") {
      limparUsuarioLogado();
      window.location.href = "login.html";
      return;
    }

    if (!usuario) {
      window.location.href = "login.html";
      return;
    }

    window.location.href = "login.html";
  } catch (erro) {
    alert("Erro ao selecionar loja: " + erro.message);
  }
}

[filtroGrupoLoja, filtroRegiaoLoja].forEach(filtro => {
  if (filtro) {
    filtro.addEventListener("change", renderizarListaLojas);
  }
});

renderizarLojas();
