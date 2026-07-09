const usuario = getUsuarioLogado();

if (!usuario || usuario.cargo !== "admin") {
  alert("Área exclusiva do admin.");
  window.location.href = "admin-login.html";
  throw new Error("Área exclusiva do admin.");
}



const formLojaAdmin = document.getElementById("form-loja-admin");
const nomeLojaAdmin = document.getElementById("nomeLojaAdmin");
const responsavelLojaAdmin = document.getElementById("responsavelLojaAdmin");
const grupoLojaAdmin = document.getElementById("grupoLojaAdmin");
const regiaoLojaAdmin = document.getElementById("regiaoLojaAdmin");
const corLojaAdmin = document.getElementById("corLojaAdmin");
const imagemLojaAdmin = document.getElementById("imagemLojaAdmin");
const previewImagemLojaAdmin = document.getElementById("previewImagemLojaAdmin");
const listaLojasAdmin = document.getElementById("lista-lojas-admin");
const qtdLojasAdmin = document.getElementById("qtd-lojas-admin");
const qtdLojasInativasAdmin = document.getElementById("qtd-lojas-inativas-admin");
const qtdLancamentosAdmin = document.getElementById("qtd-lancamentos-admin");
const qtdVencidosAdmin = document.getElementById("qtd-vencidos-admin");

const filtroGrupoAdmin = document.getElementById("filtroGrupoAdmin");
const filtroRegiaoAdmin = document.getElementById("filtroRegiaoAdmin");
const filtroStatusAdmin = document.getElementById("filtroStatusAdmin");

const graficoSituacaoLojas = document.getElementById("grafico-situacao-lojas");
const graficoVencimentosAdmin = document.getElementById("grafico-vencimentos-admin");
const graficoGruposAdmin = document.getElementById("grafico-grupos-admin");
const graficoRegioesAdmin = document.getElementById("grafico-regioes-admin");
const adminPercentuais = document.getElementById("admin-percentuais");
const adminLojaAtual = document.getElementById("admin-loja-atual");

let imagemLojaBase64 = "";
let lojasAdminCache = [];
let lancamentosAdminCache = [];

function normalizarFiltro(valor) {
  return String(valor || "").trim().toLowerCase();
}

function hojeLocalISO() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function diasAteValidade(validadeISO) {
  const hoje = parseDataLocal(hojeLocalISO());
  const validade = parseDataLocal(validadeISO);
  const diff = validade.getTime() - hoje.getTime();

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function porcentagem(valor, total) {
  if (!total) return 0;

  return Math.round((Number(valor || 0) / total) * 100);
}

function contarPorCampo(lista, campo, fallback) {
  return lista.reduce((acc, item) => {
    const chave = String(item[campo] || fallback).trim() || fallback;
    acc[chave] = (acc[chave] || 0) + 1;
    return acc;
  }, {});
}

function montarOptions(select, valores, textoTodos, valorTodos) {
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

function atualizarFiltrosAdmin() {
  montarOptions(
    filtroGrupoAdmin,
    lojasAdminCache.map(loja => loja.grupo || "Sem grupo"),
    "Todos os grupos",
    "todos"
  );

  montarOptions(
    filtroRegiaoAdmin,
    lojasAdminCache.map(loja => loja.regiao || "Sem região"),
    "Todas as regiões",
    "todas"
  );
}

function lojasFiltradasAdmin() {
  const grupo = filtroGrupoAdmin.value;
  const regiao = filtroRegiaoAdmin.value;
  const status = filtroStatusAdmin.value;

  return lojasAdminCache.filter(loja => {
    const grupoLoja = loja.grupo || "Sem grupo";
    const regiaoLoja = loja.regiao || "Sem região";
    const statusLoja = loja.status || "ativa";

    const passaGrupo = grupo === "todos" || normalizarFiltro(grupoLoja) === normalizarFiltro(grupo);
    const passaRegiao = regiao === "todas" || normalizarFiltro(regiaoLoja) === normalizarFiltro(regiao);
    const passaStatus = status === "todos" || statusLoja === status;

    return passaGrupo && passaRegiao && passaStatus;
  });
}

function renderizarGraficoBarras(container, dados, vazio = "Sem dados para mostrar.") {
  if (!container) return;

  const entradas = Object.entries(dados)
    .filter(([, valor]) => Number(valor) > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const total = entradas.reduce((soma, [, valor]) => soma + Number(valor || 0), 0);

  if (entradas.length === 0) {
    container.innerHTML = `<p class="muted">${vazio}</p>`;
    return;
  }

  const max = Math.max(...entradas.map(([, valor]) => valor), 1);

  container.innerHTML = entradas.map(([label, valor]) => {
    const pctBarra = Math.max(6, Math.round((valor / max) * 100));
    const pctTotal = porcentagem(valor, total);

    return `
      <div class="bar-row">
        <div class="bar-row-top">
          <span>${esc(label)}</span>
          <strong>${valor} • ${pctTotal}%</strong>
        </div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${pctBarra}%"></div>
        </div>
      </div>
    `;
  }).join("");
}

function renderizarPizza(container, dados, vazio = "Sem dados para mostrar.") {
  if (!container) return;

  const entradas = Object.entries(dados)
    .filter(([, valor]) => Number(valor) > 0);

  const total = entradas.reduce((soma, [, valor]) => soma + Number(valor || 0), 0);

  if (total === 0 || entradas.length === 0) {
    container.innerHTML = `<p class="muted">${vazio}</p>`;
    return;
  }

  const cores = [
    "var(--primary)",
    "var(--warning)",
    "var(--danger)",
    "var(--primary-strong)",
    "#7b8f5a",
    "#b9a64c",
    "#8b6f47"
  ];

  let inicio = 0;

  const fatias = entradas.map(([, valor], index) => {
    const graus = (Number(valor) / total) * 360;
    const fim = inicio + graus;
    const trecho = `${cores[index % cores.length]} ${inicio}deg ${fim}deg`;
    inicio = fim;
    return trecho;
  }).join(", ");

  container.innerHTML = `
    <div class="pie-chart" style="background: conic-gradient(${fatias})">
      <div class="pie-hole">
        <strong>${total}</strong>
        <span>Total</span>
      </div>
    </div>

    <div class="pie-legend">
      ${entradas.map(([label, valor], index) => `
        <div class="pie-legend-item">
          <span class="pie-dot" style="background:${cores[index % cores.length]}"></span>
          <p>${esc(label)}</p>
          <strong>${porcentagem(valor, total)}%</strong>
        </div>
      `).join("")}
    </div>
  `;
}

function calcularResumoVencimentos() {
  const ativos = lancamentosAdminCache.filter(item => item.status === "ativo");

  return ativos.reduce((acc, item) => {
    const dias = diasAteValidade(item.validade);

    if (dias < 0) acc.vencidos += 1;
    else if (dias === 0) acc.hoje += 1;
    else if (dias <= 7) acc.seteDias += 1;
    else if (dias <= 30) acc.trintaDias += 1;
    else acc.normal += 1;

    return acc;
  }, {
    vencidos: 0,
    hoje: 0,
    seteDias: 0,
    trintaDias: 0,
    normal: 0
  });
}

function renderizarPercentuaisAdmin() {
  const totalLojas = lojasAdminCache.length;
  const ativas = lojasAdminCache.filter(loja => (loja.status || "ativa") === "ativa").length;
  const inativas = totalLojas - ativas;
  const ativosLancamentos = lancamentosAdminCache.filter(item => item.status === "ativo");
  const resumo = calcularResumoVencimentos();
  const totalVencimentosCriticos = resumo.vencidos + resumo.hoje + resumo.seteDias;

  adminPercentuais.innerHTML = `
    <div class="admin-kpi-grid">
      <div class="admin-kpi">
        <span>Operação ativa</span>
        <strong>${porcentagem(ativas, totalLojas)}%</strong>
        <p>${ativas} de ${totalLojas || 0} lojas ativas</p>
      </div>

      <div class="admin-kpi">
        <span>Serviço parado</span>
        <strong>${porcentagem(inativas, totalLojas)}%</strong>
        <p>${inativas} loja(s) desativada(s)</p>
      </div>

      <div class="admin-kpi">
        <span>Itens críticos</span>
        <strong>${porcentagem(totalVencimentosCriticos, ativosLancamentos.length)}%</strong>
        <p>Vencidos, hoje ou até 7 dias</p>
      </div>
    </div>
  `;
}

function renderizarGraficosAdmin() {
  const ativas = lojasAdminCache.filter(loja => (loja.status || "ativa") === "ativa").length;
  const inativas = lojasAdminCache.filter(loja => (loja.status || "ativa") !== "ativa").length;
  const resumo = calcularResumoVencimentos();

  // Um indicador = um gráfico. Sem duplicar pizza e barra para o mesmo dado.
  renderizarPizza(graficoSituacaoLojas, {
    "Ativas": ativas,
    "Desativadas": inativas
  });

  renderizarGraficoBarras(graficoVencimentosAdmin, {
    "Vencidos": resumo.vencidos,
    "Vencem hoje": resumo.hoje,
    "Até 7 dias": resumo.seteDias,
    "Até 30 dias": resumo.trintaDias,
    "Sem urgência": resumo.normal
  });

  renderizarGraficoBarras(
    graficoGruposAdmin,
    contarPorCampo(lojasAdminCache, "grupo", "Sem grupo")
  );

  renderizarGraficoBarras(
    graficoRegioesAdmin,
    contarPorCampo(lojasAdminCache, "regiao", "Sem região")
  );

  renderizarPercentuaisAdmin();
}

function renderizarLojaAtualAdmin() {
  const lojaAtual = getLojaAtual();

  if (!lojaAtual) {
    adminLojaAtual.innerHTML = `
      <div class="empty-admin-store">
        <p>Nenhuma loja selecionada para administrar.</p>
        <a href="escolher-loja.html" class="quick-admin-btn">Escolher loja</a>
      </div>
    `;
    return;
  }

  aplicarTemaLoja(lojaAtual);

  adminLojaAtual.innerHTML = `
    <div class="admin-current-store-card">
      ${logoLojaHTML(lojaAtual, "loja-logo-dashboard")}
      <div>
        <strong>${esc(lojaAtual.nome)}</strong>
        <p>Grupo/Rede: ${esc(lojaAtual.grupo || "Sem grupo")}</p>
        <p>Região: ${esc(lojaAtual.regiao || "Sem região")}</p>
        ${lojaAtual.corTema ? `<p>Cor da rede: <span class="color-mini" style="background:${esc(lojaAtual.corTema)}"></span></p>` : ""}
      </div>
    </div>

    <div class="admin-current-actions">
      <a href="login.html" class="quick-admin-btn">Entrar na loja selecionada</a>
      <a href="escolher-loja.html" class="quick-admin-btn">Trocar loja</a>
      <a href="admin-dashboard.html" class="quick-admin-btn">Continuar no admin</a>
    </div>
  `;
}

function renderizarListaFiltradaAdmin() {
  const lojas = lojasFiltradasAdmin();

  if (lojas.length === 0) {
    listaLojasAdmin.innerHTML = `
      <div class="card">
        <p>Nenhuma loja encontrada com estes filtros.</p>
      </div>
    `;
    return;
  }

  listaLojasAdmin.innerHTML = lojas.map(loja => {
    const status = loja.status || "ativa";
    const ativa = status === "ativa";
    const cor = normalizarHexCor(loja.corTema) || "#2f7d4f";

    return `
      <article class="card loja-card loja-card-com-logo ${ativa ? "" : "loja-inativa"}" style="border-left: 5px solid ${esc(cor)}">
        ${logoLojaHTML(loja, "loja-logo-card")}

        <div class="loja-card-info">
          <div class="loja-title-row">
            <h3>${esc(loja.nome)}</h3>
            <span class="status-pill ${ativa ? "status-ativo" : "status-inativo"}">
              ${ativa ? "Ativa" : "Desativada"}
            </span>
          </div>

          <p class="muted">Responsável: ${esc(loja.responsavel || "Não informado")}</p>
          <p><strong>Grupo/Rede:</strong> ${esc(loja.grupo || "Sem grupo")}</p>
          <p><strong>Região:</strong> ${esc(loja.regiao || "Sem região")}</p>
          <p><strong>Cor:</strong> <span class="color-mini" style="background:${esc(cor)}"></span></p>
          <p class="muted">Código interno: ${esc(String(loja.id).slice(0, 8))}</p>
        </div>

        <div class="loja-actions">
          ${
            ativa
              ? `<button type="button" onclick="administrarLoja('${loja.id}')">Administrar esta loja</button>`
              : `<button type="button" class="secondary" disabled>Loja desativada</button>`
          }

          <button type="button" class="secondary" onclick="editarDadosLoja('${loja.id}')">
            Editar dados
          </button>

          <label class="btn-file">
            Trocar imagem
            <input type="file" accept="image/*" onchange="trocarImagemLojaAdmin('${loja.id}', this)">
          </label>

          ${
            ativa
              ? `<button type="button" class="btn-warning" onclick="alterarStatusLojaAdmin('${loja.id}', 'inativa')">Desativar serviço</button>`
              : `<button type="button" onclick="alterarStatusLojaAdmin('${loja.id}', 'ativa')">Ativar serviço</button>`
          }
        </div>
      </article>
    `;
  }).join("");
}

if (imagemLojaAdmin) {
  imagemLojaAdmin.addEventListener("change", async () => {
    const arquivo = imagemLojaAdmin.files[0];

    if (!arquivo) {
      imagemLojaBase64 = "";
      previewImagemLojaAdmin.innerHTML = "";
      return;
    }

    try {
      imagemLojaBase64 = await comprimirImagemLoja(arquivo);

      previewImagemLojaAdmin.innerHTML = `
        <div class="loja-preview-box">
          <img src="${imagemLojaBase64}" alt="Prévia da imagem da loja">
          <span>Imagem selecionada</span>
        </div>
      `;
    } catch (erro) {
      alert(erro.message);
      imagemLojaAdmin.value = "";
      imagemLojaBase64 = "";
      previewImagemLojaAdmin.innerHTML = "";
    }
  });
}

async function renderizarLojasAdmin() {
  listaLojasAdmin.innerHTML = `<div class="card"><p class="muted">Carregando dados administrativos...</p></div>`;

  try {
    lojasAdminCache = await valisysDB.listarTodasLojas();

    try {
      lancamentosAdminCache = await valisysDB.listarTodosLancamentos({ status: "todos" });
    } catch (erroLancamentos) {
      console.warn("Não foi possível carregar lançamentos gerais.", erroLancamentos);
      lancamentosAdminCache = [];
    }

    const ativas = lojasAdminCache.filter(loja => (loja.status || "ativa") === "ativa").length;
    const inativas = lojasAdminCache.filter(loja => (loja.status || "ativa") !== "ativa").length;
    const ativosLancamentos = lancamentosAdminCache.filter(item => item.status === "ativo");
    const vencidos = ativosLancamentos.filter(item => diasAteValidade(item.validade) < 0).length;

    qtdLojasAdmin.innerText = ativas;
    qtdLojasInativasAdmin.innerText = inativas;
    qtdLancamentosAdmin.innerText = ativosLancamentos.length;
    qtdVencidosAdmin.innerText = vencidos;

    atualizarFiltrosAdmin();
    renderizarGraficosAdmin();
    renderizarLojaAtualAdmin();

    if (lojasAdminCache.length === 0) {
      listaLojasAdmin.innerHTML = `
        <div class="card">
          <p>Nenhuma loja cadastrada ainda.</p>
        </div>
      `;
      return;
    }

    renderizarListaFiltradaAdmin();
  } catch (erro) {
    console.error(erro);
    listaLojasAdmin.innerHTML = `
      <div class="card">
        <p class="danger">Erro ao carregar lojas.</p>
        <p class="muted">${esc(erro.message)}</p>
      </div>
    `;
  }
}

async function administrarLoja(id) {
  try {
    const loja = lojasAdminCache.find(item => item.id === id);

    if (!loja) {
      alert("Loja não encontrada.");
      return;
    }

    if ((loja.status || "ativa") !== "ativa") {
      alert("Esta loja está desativada. Ative o serviço antes de administrar.");
      return;
    }

    // Admin vindo da Dashboard Admin continua como admin.
    // Reforça a sessão para não cair como funcionário/promotor por usuário antigo.
    setLojaAtual(loja);

    salvarJSONLocal("usuarioLogado", {
      id: usuario.id || "admin-geral",
      nome: usuario.nome || "Admin",
      cargo: "admin",
      funcionarioId: "",
      lojaIdPadrao: loja.id,
      lojaNomePadrao: loja.nome,
      setor: "",
      modoAdminLoja: true,
      criadoEm: usuario.criadoEm || new Date().toLocaleString("pt-BR")
    });

    alert("Loja selecionada para administração como admin.");
    window.location.href = "dashboard.html";
  } catch (erro) {
    alert("Erro ao abrir loja: " + erro.message);
  }
}

async function editarDadosLoja(id) {
  const loja = lojasAdminCache.find(item => item.id === id);

  if (!loja) {
    alert("Loja não encontrada.");
    return;
  }

  const dados = await abrirModalEdicaoLoja(loja);

  if (!dados) return;

  if (dados.corTema && !normalizarHexCor(dados.corTema)) {
    alert("Cor inválida. Use o formato #RRGGBB. Exemplo: #2f7d4f");
    return;
  }

  try {
    await valisysDB.atualizarDadosLoja(id, dados);

    alert("Dados da loja atualizados.");
    await renderizarLojasAdmin();
  } catch (erro) {
    alert("Erro ao editar loja: " + erro.message);
  }
}

async function trocarImagemLojaAdmin(id, input) {
  const arquivo = input.files && input.files[0];

  if (!arquivo) return;

  try {
    const imagem = await comprimirImagemLoja(arquivo);
    await valisysDB.atualizarImagemLoja(id, imagem);
    alert("Imagem da loja atualizada.");
    await renderizarLojasAdmin();
  } catch (erro) {
    alert("Erro ao atualizar imagem: " + erro.message);
  } finally {
    input.value = "";
  }
}

async function alterarStatusLojaAdmin(id, status) {
  const texto = status === "ativa" ? "ativar" : "desativar";
  const confirmar = await confirmarAcao(`Deseja ${texto} o serviço desta loja?`, "Alterar status da loja");

  if (!confirmar) return;

  try {
    await valisysDB.alternarStatusLoja(id, status);
    alert(status === "ativa" ? "Serviço ativado." : "Serviço desativado.");
    await renderizarLojasAdmin();
  } catch (erro) {
    alert("Erro ao alterar status: " + erro.message);
  }
}

formLojaAdmin.addEventListener("submit", async event => {
  event.preventDefault();

  const nome = nomeLojaAdmin.value.trim();
  const responsavel = responsavelLojaAdmin.value.trim();
  const grupo = grupoLojaAdmin.value.trim();
  const regiao = regiaoLojaAdmin.value.trim();
  const corTema = normalizarHexCor(corLojaAdmin?.value || "") || "#2f7d4f";

  if (!nome) {
    alert("Informe o nome da loja.");
    return;
  }

  try {
    await valisysDB.criarLoja({
      nome,
      responsavel,
      grupo,
      regiao,
      corTema,
      imagem: imagemLojaBase64
    });

    formLojaAdmin.reset();
    if (corLojaAdmin) corLojaAdmin.value = "#2f7d4f";
    imagemLojaBase64 = "";
    previewImagemLojaAdmin.innerHTML = "";

    alert("Loja cadastrada.");
    await renderizarLojasAdmin();
  } catch (erro) {
    alert("Erro ao cadastrar loja: " + erro.message);
  }
});

[filtroGrupoAdmin, filtroRegiaoAdmin, filtroStatusAdmin].forEach(filtro => {
  filtro.addEventListener("change", renderizarListaFiltradaAdmin);
});

renderizarLojasAdmin();
