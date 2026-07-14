const usuario = getUsuarioLogado();

if (!usuario || usuario.cargo !== "admin") {
  alert("Área exclusiva da administração.");
  window.location.href = "admin-login.html";
  throw new Error("Área exclusiva da administração.");
}



const formLojaAdmin = document.getElementById("form-loja-admin");
const nomeLojaAdmin = document.getElementById("nomeLojaAdmin");
const responsavelLojaAdmin = document.getElementById("responsavelLojaAdmin");
const grupoLojaAdmin = document.getElementById("grupoLojaAdmin");
const regiaoLojaAdmin = document.getElementById("regiaoLojaAdmin");
const corLojaAdmin = document.getElementById("corLojaAdmin");
const imagemLojaAdmin = document.getElementById("imagemLojaAdmin");
const previewImagemLojaAdmin = document.getElementById("previewImagemLojaAdmin");
const setoresLojaAdminLista = document.getElementById("setoresLojaAdminLista");
const setorOutroAdminArea = document.getElementById("setorOutroAdminArea");
const novoSetorAdmin = document.getElementById("novoSetorAdmin");
const btnAdicionarSetorAdmin = document.getElementById("btnAdicionarSetorAdmin");
const gerentesPreCadastroAdmin = document.getElementById("gerentesPreCadastroAdmin");
const encarregadosPreCadastroAdmin = document.getElementById("encarregadosPreCadastroAdmin");
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
const listaSacAdmin = document.getElementById("lista-sac-admin");
const btnAtualizarSacAdmin = document.getElementById("btnAtualizarSacAdmin");
const chatSacAdminPainel = document.getElementById("chatSacAdminPainel");

let imagemLojaBase64 = "";
let lojasAdminCache = [];
let lancamentosAdminCache = [];


function lerLinhasTextarea(valor) {
  return String(valor || "")
    .split(/\n|,/)
    .map(item => item.trim())
    .filter(Boolean);
}

function setoresBaseAdmin() {
  return valisysDB.setoresPadraoLoja
    ? valisysDB.setoresPadraoLoja()
    : ["Geral", "Mercearia", "Bebidas", "Frios e Laticínios", "Açougue", "Hortifruti", "Padaria", "Congelados", "Limpeza", "Higiene e Perfumaria", "Pet", "Outros"];
}

function setorIdSeguro(nome) {
  return String(nome || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || "setor";
}

function renderizarSelecaoSetores(container, selecionados = [], customizados = []) {
  if (!container) return;

  const base = setoresBaseAdmin();
  const todos = [...new Set([...base, ...customizados].map(item => String(item || "").trim()).filter(Boolean))];

  const selecionadosPadrao = base.filter(item => item !== "Outros");

  const selecionadosSet = new Set(
    (selecionados.length ? selecionados : selecionadosPadrao)
      .map(item => String(item || "").trim())
      .filter(Boolean)
  );

  container.innerHTML = todos.map(nome => {
    const id = `setor-${setorIdSeguro(nome)}-${container.id || "admin"}`;
    const marcado = selecionadosSet.has(nome) ? "checked" : "";

    return `
      <label class="setor-check" for="${esc(id)}">
        <input type="checkbox" id="${esc(id)}" value="${esc(nome)}" ${marcado}>
        <span>${esc(nome)}</span>
      </label>
    `;
  }).join("");

  atualizarAreaOutroSetor(container);
}

function setoresSelecionadosDoContainer(container) {
  if (!container) return [];

  const marcados = [...container.querySelectorAll("input[type='checkbox']:checked")]
    .map(input => input.value.trim())
    .filter(valor => valor && valor !== "Outros");

  return [...new Set(marcados)];
}

function atualizarAreaOutroSetor(container = setoresLojaAdminLista) {
  if (!container || !setorOutroAdminArea) return;

  const outrosMarcado = [...container.querySelectorAll("input[type='checkbox']:checked")]
    .some(input => input.value === "Outros");

  setorOutroAdminArea.style.display = outrosMarcado ? "block" : "none";
}

function adicionarSetorPersonalizadoAdmin(container = setoresLojaAdminLista, input = novoSetorAdmin) {
  if (!container || !input) return;

  const nome = input.value.trim();

  if (!nome) {
    alert("Digite o nome do setor.");
    return;
  }

  const existentes = [...container.querySelectorAll("input[type='checkbox']")]
    .map(item => item.value.trim().toLowerCase());

  if (existentes.includes(nome.toLowerCase())) {
    alert("Esse setor já está na lista.");
    input.value = "";
    return;
  }

  const selecionados = setoresSelecionadosDoContainer(container);
  selecionados.push(nome);

  const customizados = [...container.querySelectorAll("input[type='checkbox']")]
    .map(item => item.value.trim())
    .filter(Boolean);

  renderizarSelecaoSetores(container, selecionados, [...customizados, nome]);
  input.value = "";
}

function setoresFormularioAdmin() {
  const setores = setoresSelecionadosDoContainer(setoresLojaAdminLista);

  return setores.length > 0 ? setores : setoresBaseAdmin().filter(item => item !== "Outros");
}

function funcionariosPreCadastroAdmin(setores = []) {
  const funcionarios = [];

  lerLinhasTextarea(gerentesPreCadastroAdmin?.value || "").forEach(nome => {
    funcionarios.push({
      nome,
      cargo: "gerente",
      setor: "Geral",
      codigoAcesso: ""
    });
  });

  String(encarregadosPreCadastroAdmin?.value || "")
    .split(/\n/)
    .map(linha => linha.trim())
    .filter(Boolean)
    .forEach(linha => {
      const partes = linha.split("|").map(parte => parte.trim());
      const nome = partes[0] || "";
      const setor = partes[1] || setores.find(item => item !== "Geral") || "Mercearia";
      const codigoAcesso = partes[2] || "";

      if (nome) {
        funcionarios.push({
          nome,
          cargo: "encarregado",
          setor,
          codigoAcesso
        });
      }
    });

  return funcionarios;
}

if (setoresLojaAdminLista) {
  renderizarSelecaoSetores(setoresLojaAdminLista);

  setoresLojaAdminLista.addEventListener("change", () => atualizarAreaOutroSetor(setoresLojaAdminLista));
}

if (btnAdicionarSetorAdmin) {
  btnAdicionarSetorAdmin.addEventListener("click", () => adicionarSetorPersonalizadoAdmin());
}

if (novoSetorAdmin) {
  novoSetorAdmin.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      adicionarSetorPersonalizadoAdmin();
    }
  });
}


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

          <button type="button" class="btn-danger" onclick="excluirLojaAdmin('${loja.id}')">
            Excluir loja
          </button>
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
      lancamentosAdminCache = await valisysDB.listarTodosLancamentos({ status: "todos", limite: 260 });
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


async function abrirModalEdicaoLoja(loja) {
  const setoresAtuais = await valisysDB.listarSetoresLoja(loja.id)
    .then(lista => lista.map(item => item.nome))
    .catch(() => []);

  return new Promise(resolve => {
    let modal = document.getElementById("modal-editar-loja-admin");

    if (!modal) {
      modal = document.createElement("div");
      modal.id = "modal-editar-loja-admin";
      modal.className = "produto-popup-overlay";
      modal.innerHTML = `
        <div class="produto-popup-card">
          <button type="button" class="produto-popup-fechar" id="fechar-editar-loja-admin">×</button>
          <h2>Editar loja</h2>
          <form id="form-editar-loja-admin">
            <label for="editarLojaNome">Nome</label>
            <input type="text" id="editarLojaNome" required>

            <label for="editarLojaResponsavel">Responsável</label>
            <input type="text" id="editarLojaResponsavel">

            <label for="editarLojaGrupo">Grupo/Rede</label>
            <input type="text" id="editarLojaGrupo">

            <label for="editarLojaRegiao">Região</label>
            <input type="text" id="editarLojaRegiao">

            <label for="editarLojaCor">Cor</label>
            <input type="color" id="editarLojaCor" value="#2f7d4f">

            <label>Setores da loja</label>
            <div id="editarLojaSetoresLista" class="setores-selecao"></div>

            <div id="editarSetorOutroArea" class="setor-outro-area" style="display:none;">
              <label for="editarNovoSetor">Adicionar outro setor</label>
              <div class="input-action-row">
                <input type="text" id="editarNovoSetor" placeholder="Ex: Adega, Depósito, Rotisseria">
                <button type="button" class="secondary" id="editarBtnAdicionarSetor">Adicionar</button>
              </div>
            </div>

            <button type="submit">Salvar alterações</button>
          </form>
        </div>
      `;

      document.body.appendChild(modal);
    }

    const fechar = resultado => {
      modal.classList.remove("active");
      resolve(resultado);
    };

    const form = modal.querySelector("#form-editar-loja-admin");
    const fecharBtn = modal.querySelector("#fechar-editar-loja-admin");
    const listaSetores = modal.querySelector("#editarLojaSetoresLista");
    const areaOutro = modal.querySelector("#editarSetorOutroArea");
    const inputOutro = modal.querySelector("#editarNovoSetor");
    const btnOutro = modal.querySelector("#editarBtnAdicionarSetor");

    modal.querySelector("#editarLojaNome").value = loja.nome || "";
    modal.querySelector("#editarLojaResponsavel").value = loja.responsavel || "";
    modal.querySelector("#editarLojaGrupo").value = loja.grupo || "";
    modal.querySelector("#editarLojaRegiao").value = loja.regiao || "";
    modal.querySelector("#editarLojaCor").value = normalizarHexCor(loja.corTema) || "#2f7d4f";

    const customizados = setoresAtuais.filter(setor => !setoresBaseAdmin().includes(setor));
    renderizarSelecaoSetores(listaSetores, setoresAtuais, customizados);

    const atualizarAreaOutroEdicao = () => {
      const outrosMarcado = [...listaSetores.querySelectorAll("input[type='checkbox']:checked")]
        .some(input => input.value === "Outros");

      areaOutro.style.display = outrosMarcado ? "block" : "none";
    };

    listaSetores.onchange = atualizarAreaOutroEdicao;
    atualizarAreaOutroEdicao();

    btnOutro.onclick = () => {
      const nome = inputOutro.value.trim();

      if (!nome) {
        alert("Digite o nome do setor.");
        return;
      }

      const existentes = [...listaSetores.querySelectorAll("input[type='checkbox']")]
        .map(item => item.value.trim().toLowerCase());

      if (existentes.includes(nome.toLowerCase())) {
        alert("Esse setor já está na lista.");
        inputOutro.value = "";
        return;
      }

      const selecionados = setoresSelecionadosDoContainer(listaSetores);
      selecionados.push(nome);

      const todosAtuais = [...listaSetores.querySelectorAll("input[type='checkbox']")]
        .map(item => item.value.trim())
        .filter(Boolean);

      renderizarSelecaoSetores(listaSetores, selecionados, [...todosAtuais, nome]);
      inputOutro.value = "";
      atualizarAreaOutroEdicao();
    };

    inputOutro.onkeydown = event => {
      if (event.key === "Enter") {
        event.preventDefault();
        btnOutro.click();
      }
    };

    fecharBtn.onclick = () => fechar(null);

    modal.onclick = event => {
      if (event.target === modal) fechar(null);
    };

    form.onsubmit = event => {
      event.preventDefault();

      fechar({
        nome: modal.querySelector("#editarLojaNome").value.trim(),
        responsavel: modal.querySelector("#editarLojaResponsavel").value.trim(),
        grupo: modal.querySelector("#editarLojaGrupo").value.trim(),
        regiao: modal.querySelector("#editarLojaRegiao").value.trim(),
        corTema: modal.querySelector("#editarLojaCor").value,
        setores: setoresSelecionadosDoContainer(listaSetores)
      });
    };

    modal.classList.add("active");
  });
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
    const setores = dados.setores || [];
    delete dados.setores;

    await valisysDB.atualizarDadosLoja(id, dados);

    if (setores.length > 0) {
      await valisysDB.salvarSetoresLoja(id, setores);
    }

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

async function excluirLojaAdmin(id) {
  const loja = lojasAdminCache.find(item => item.id === id);
  const nome = loja?.nome || "esta loja";

  const confirmar = await confirmarAcao(
    `Deseja excluir ${nome}? Ela será removida da dashboard e da seleção de lojas.`,
    "Excluir loja"
  );

  if (!confirmar) return;

  try {
    await valisysDB.excluirLoja(id);

    lojasAdminCache = lojasAdminCache.filter(item => item.id !== id);
    alert("Loja excluída.");
    await renderizarLojasAdmin();
  } catch (erro) {
    alert("Erro ao excluir loja: " + erro.message);
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
    const setores = setoresFormularioAdmin();
    const lojaCriada = await valisysDB.criarLoja({
      nome,
      responsavel,
      grupo,
      regiao,
      corTema,
      imagem: imagemLojaBase64
    });

    await valisysDB.salvarSetoresLoja(lojaCriada.id, setores);

    const preFuncionarios = funcionariosPreCadastroAdmin(setores);
    if (preFuncionarios.length > 0) {
      await valisysDB.criarFuncionariosEmLote(lojaCriada.id, preFuncionarios);
    }

    formLojaAdmin.reset();
    if (corLojaAdmin) corLojaAdmin.value = "#2f7d4f";
    if (setoresLojaAdminLista) renderizarSelecaoSetores(setoresLojaAdminLista);
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


let conversaSacSelecionada = "";
const chaveAtendenteSac = "valisysSacAtendenteNome";
const chaveHorarioSac = "valisysSacHorarioAtendimento";

function horarioPadraoSac() {
  return localStorage.getItem(chaveHorarioSac) || "Segunda a sexta, 08h às 18h. Sábado, 08h às 12h.";
}

function atendentePadraoSac() {
  return localStorage.getItem(chaveAtendenteSac) || "";
}

async function renderizarSacAdmin() {
  if (!listaSacAdmin) return;

  listaSacAdmin.innerHTML = `
    <div class="card">
      <p class="muted">Carregando conversas...</p>
    </div>
  `;

  try {
    const conversas = await valisysDB.listarConversasChatSac({ limite: 120 });

    if (conversas.length === 0) {
      listaSacAdmin.innerHTML = `
        <div class="sac-empty">
          <p>Nenhuma conversa no SAC Online.</p>
          <small>Quando alguém chamar pelo chat do site público, aparece aqui.</small>
        </div>
      `;

      if (chatSacAdminPainel) {
        chatSacAdminPainel.innerHTML = `
          <div class="chat-admin-empty">
            <p>Nenhuma conversa selecionada.</p>
            <small>As mensagens enviadas pelo site aparecem aqui.</small>
          </div>
        `;
      }

      return;
    }

    listaSacAdmin.innerHTML = conversas.map(item => `
      <button type="button" class="chat-conversa-item ${item.sessaoId === conversaSacSelecionada ? "active" : ""}" onclick="abrirConversaSacAdmin('${item.sessaoId}')">
        <span>
          <strong>${esc(item.nome || "Visitante")}</strong>
          <small>${esc(item.contato || "Sem contato")}</small>
        </span>
        ${item.naoLidas > 0 ? `<em>${item.naoLidas}</em>` : ""}
        <p>${esc(item.ultimaMensagem || "")}</p>
      </button>
    `).join("");

    if (!conversaSacSelecionada && conversas[0]) {
      conversaSacSelecionada = conversas[0].sessaoId;
      await abrirConversaSacAdmin(conversaSacSelecionada, false);
    }
  } catch (erro) {
    console.error(erro);
    listaSacAdmin.innerHTML = `
      <div class="card">
        <p class="danger">Erro ao carregar chat do SAC Online.</p>
        <p class="muted">${esc(erro.message)}</p>
        <p class="small muted">O chat usa a tabela notificacoes. Verifique se o SQL base do sistema já foi rodado.</p>
      </div>
    `;
  }
}

async function abrirConversaSacAdmin(sessaoId, atualizarLista = true) {
  conversaSacSelecionada = sessaoId;

  if (!chatSacAdminPainel) return;

  chatSacAdminPainel.innerHTML = `
    <div class="chat-admin-empty">
      <p>Carregando conversa...</p>
    </div>
  `;

  try {
    const mensagens = await valisysDB.listarMensagensChatSac(sessaoId);
    const primeira = mensagens[0] || {};
    const nome = primeira.nome || "Visitante";
    const contato = primeira.contato || "Sem contato";

    chatSacAdminPainel.innerHTML = `
      <div class="chat-admin-top chat-admin-top-assumir">
        <div>
          <h3>${esc(nome)}</h3>
          <p class="muted">${esc(contato)}</p>
        </div>

        <div class="chat-assumir-box">
          <label>
            Quem vai assumir
            <input type="text" id="nomeAtendenteSac" placeholder="Ex: João" value="${esc(atendentePadraoSac())}">
          </label>

          <label>
            Horário de atendimento
            <input type="text" id="horarioAtendimentoSac" value="${esc(horarioPadraoSac())}">
          </label>

          <div class="chat-assumir-actions">
            <button type="button" class="secondary" onclick="assumirConversaSacAdmin('${sessaoId}')">Assumir chat</button>
            <button type="button" class="btn-danger" onclick="apagarConversaSacAdmin('${sessaoId}')">Apagar conversa</button>
          </div>
        </div>
      </div>

      <div class="chat-admin-mensagens" id="chatAdminMensagens">
        ${mensagens.map(item => `
          <div class="chat-message ${item.autor === "admin" ? "bot" : "user"}">
            <small>${item.autor === "admin" ? esc(item.atendente || "Admin") : esc(item.nome || "Cliente")}</small>
            <p>${esc(item.mensagem)}</p>
          </div>
        `).join("")}
      </div>

      <form class="chat-admin-form" onsubmit="responderConversaSacAdmin(event, '${sessaoId}')">
        <textarea id="respostaSacAdmin" rows="2" placeholder="Digite sua resposta..." required></textarea>
        <button type="submit">Responder</button>
      </form>
    `;

    const caixa = document.getElementById("chatAdminMensagens");
    if (caixa) caixa.scrollTop = caixa.scrollHeight;

    await valisysDB.marcarChatSacComoLido(sessaoId);

    if (atualizarLista) {
      await renderizarSacAdmin();
    }
  } catch (erro) {
    console.error(erro);
    chatSacAdminPainel.innerHTML = `
      <div class="chat-admin-empty">
        <p class="danger">Erro ao abrir conversa.</p>
        <small>${esc(erro.message)}</small>
      </div>
    `;
  }
}

async function responderConversaSacAdmin(event, sessaoId) {
  event.preventDefault();

  const campo = document.getElementById("respostaSacAdmin");
  const mensagem = campo.value.trim();
  const nomeAtendente = document.getElementById("nomeAtendenteSac")?.value.trim() || atendentePadraoSac() || "ValiSys";

  if (!mensagem) return;

  localStorage.setItem(chaveAtendenteSac, nomeAtendente);

  const mensagens = await valisysDB.listarMensagensChatSac(sessaoId);
  const primeira = mensagens[0] || {};

  try {
    await valisysDB.criarMensagemChatSac({
      sessaoId,
      nome: primeira.nome || "Visitante",
      contato: primeira.contato || "",
      mensagem,
      autor: "admin",
      atendente: nomeAtendente
    });

    campo.value = "";
    await abrirConversaSacAdmin(sessaoId, true);
  } catch (erro) {
    alert("Erro ao responder SAC: " + erro.message);
  }
}

async function assumirConversaSacAdmin(sessaoId) {
  const campoNome = document.getElementById("nomeAtendenteSac");
  const campoHorario = document.getElementById("horarioAtendimentoSac");

  const nomeAtendente = campoNome?.value.trim() || "";
  const horario = campoHorario?.value.trim() || horarioPadraoSac();

  if (!nomeAtendente) {
    alert("Informe o nome de quem vai assumir o chat.");
    campoNome?.focus();
    return;
  }

  localStorage.setItem(chaveAtendenteSac, nomeAtendente);
  localStorage.setItem(chaveHorarioSac, horario);

  try {
    const mensagens = await valisysDB.listarMensagensChatSac(sessaoId);
    const primeira = mensagens[0] || {};

    const mensagemAutomatica = `Olá! Aqui é ${nomeAtendente}. Assumi seu atendimento no SAC Online do ValiSys.\n\nNosso horário de atendimento é: ${horario}\n\nPode me explicar o que precisa que vou te ajudar por aqui.`;

    await valisysDB.criarMensagemChatSac({
      sessaoId,
      nome: primeira.nome || "Visitante",
      contato: primeira.contato || "",
      mensagem: mensagemAutomatica,
      autor: "admin",
      atendente: nomeAtendente
    });

    await abrirConversaSacAdmin(sessaoId, true);
  } catch (erro) {
    alert("Erro ao assumir chat: " + erro.message);
  }
}

async function apagarConversaSacAdmin(sessaoId) {
  const confirmar = await confirmarAcao("Apagar toda esta conversa do SAC?", "Apagar conversa", "perigo");

  if (!confirmar) return;

  try {
    await valisysDB.apagarConversaChatSac(sessaoId);
    conversaSacSelecionada = "";
    await renderizarSacAdmin();
  } catch (erro) {
    alert("Erro ao apagar conversa: " + erro.message);
  }
}

window.abrirConversaSacAdmin = abrirConversaSacAdmin;
window.responderConversaSacAdmin = responderConversaSacAdmin;
window.assumirConversaSacAdmin = assumirConversaSacAdmin;
window.apagarConversaSacAdmin = apagarConversaSacAdmin;

if (btnAtualizarSacAdmin) {
  btnAtualizarSacAdmin.addEventListener("click", async () => {
    await renderizarSacAdmin();

    if (conversaSacSelecionada) {
      await abrirConversaSacAdmin(conversaSacSelecionada, false);
    }
  });
}


renderizarLojasAdmin();
renderizarSacAdmin();
