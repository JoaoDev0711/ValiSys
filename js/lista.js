const usuario = protegerPagina();
if (bloquearAdministradorEmAreaLoja()) throw new Error("Administrador bloqueado na área da loja.");
const lojaAtual = protegerLojaSelecionada();

const lojaListaEl = document.getElementById("loja-lista-atual");
if (lojaListaEl && lojaAtual) lojaListaEl.innerHTML = lojaInlineHTML(lojaAtual);

const lista = document.getElementById("lista");
const filtro = document.getElementById("filtro");

const paginaAtual = window.location.pathname;
const ehListaGeral = paginaAtual.includes("lista-geral");

if (ehListaGeral && !podeVerListaGeral(usuario.cargo)) {
  alert("Você não tem permissão para acessar a lista completa.");
  window.location.href = "dashboard.html";
}

const LIMITE_PAGINA = 30;
const TEMPO_CACHE_MS = 45000;

const estadoLista = {
  lojaId: lojaAtual?.id || "",
  status: "ativo",
  termo: "",
  itens: [],
  cursor: null,
  temMais: false,
  carregando: false,
  requestId: 0,
  renderizouCache: false
};

let lojasCache = lojaAtual ? [lojaAtual] : [];
let timerBuscaLista = null;

function textoSeguro(valor) {
  return String(valor ?? "");
}

function htmlSeguro(valor) {
  return textoSeguro(valor)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function dataLocal(valor) {
  if (!valor) return new Date("2099-12-31T00:00:00");
  const partes = String(valor).split("-").map(Number);
  if (partes.length >= 3 && partes.every(Boolean)) {
    return new Date(partes[0], partes[1] - 1, partes[2]);
  }
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? new Date("2099-12-31T00:00:00") : data;
}

function chaveCacheLista() {
  return `valisys-lista-paginada:${ehListaGeral ? "geral" : "meus"}:${estadoLista.lojaId}:${estadoLista.status}:${estadoLista.termo}:${usuario.nome}:${usuario.cargo}`;
}

function salvarCacheLista() {
  try {
    const payload = {
      tempo: Date.now(),
      itens: estadoLista.itens.slice(0, LIMITE_PAGINA),
      cursor: estadoLista.cursor,
      temMais: estadoLista.temMais
    };

    sessionStorage.setItem(chaveCacheLista(), JSON.stringify(payload));
  } catch {
    // Cache é apenas apoio de experiência.
  }
}

function carregarCacheLista() {
  try {
    const bruto = sessionStorage.getItem(chaveCacheLista());
    if (!bruto) return null;

    const cache = JSON.parse(bruto);
    if (!cache || !Array.isArray(cache.itens)) return null;
    if (Date.now() - Number(cache.tempo || 0) > TEMPO_CACHE_MS) return null;

    return cache;
  } catch {
    return null;
  }
}

function limparCacheListaAtual() {
  try {
    sessionStorage.removeItem(chaveCacheLista());
  } catch {
    // Opcional.
  }
}

function prazoHTML(item) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const validade = dataLocal(item.validade);
  validade.setHours(0, 0, 0, 0);

  const diff = Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));

  if (diff < 0) return `<span class="badge danger">Vencido há ${Math.abs(diff)} dia(s)</span>`;
  if (diff === 0) return `<span class="badge danger">Vence hoje</span>`;
  if (diff <= 7) return `<span class="badge warning">Vence em ${diff} dia(s)</span>`;
  return `<span class="badge success">Vence em ${diff} dia(s)</span>`;
}

function estadoVazioHTML() {
  return `
    <div class="card">
      <p><strong>Nenhum lançamento encontrado.</strong></p>
      <p class="muted">Ajuste a busca, status ou loja e tente novamente.</p>
      <button type="button" onclick="recarregarLista()">Atualizar lista</button>
    </div>
  `;
}

function loadingHTML(texto = "Carregando lista...") {
  return `
    <div class="card lista-loading-fluido">
      <div class="loading-linha"></div>
      <div class="loading-linha menor"></div>
      <p class="muted">${htmlSeguro(texto)}</p>
    </div>
  `;
}

function erroAmigavel(erro) {
  const mensagem = String(erro?.message || "").toLowerCase();

  if (mensagem.includes("timeout") || mensagem.includes("canceling statement")) {
    return "A consulta demorou mais que o normal. Tente novamente.";
  }

  if (mensagem.includes("failed to fetch") || mensagem.includes("network")) {
    return "A conexão oscilou. Verifique a internet e tente novamente.";
  }

  if (mensagem.includes("function") || mensagem.includes("rpc") || mensagem.includes("schema cache")) {
    return "A função da Lista Geral ainda não está disponível no Supabase. Rode o SQL principal atualizado.";
  }

  return "Não foi possível atualizar a lista agora. Tente novamente em alguns segundos.";
}

function renderizarResumo(origem = "") {
  const total = estadoLista.itens.length;
  const detalhe = origem || (estadoLista.temMais ? "Lista paginada. Carregue mais quando precisar." : "Lista atualizada.");

  return `
    <div class="card lista-resumo">
      <strong>${total} lançamento(s) carregado(s)</strong>
      <p class="muted">${htmlSeguro(detalhe)}</p>
      ${estadoLista.temMais ? `<p class="muted">Mostrando ${LIMITE_PAGINA} por página para manter o sistema rápido.</p>` : ""}
    </div>
  `;
}

function renderizarCard(item) {
  const statusItem = item.status || "ativo";
  const podeRetirar = statusItem !== "retirado";
  const podeReativar = statusItem === "retirado" && ["encarregado", "gerente", "admin"].includes(usuario.cargo);
  const lojaNome = item.lojaNome || lojaAtual?.nome || "Loja atual";

  return `
    <article class="card lancamento-card ${statusItem === "retirado" ? "item-retirado" : ""}">
      <div class="lancamento-topo lancamento-topo-com-foto">
        <div class="foto-box-lista">
          ${item.foto
            ? `<img class="produto-thumb-lista" src="${htmlSeguro(item.foto)}" alt="Foto de ${htmlSeguro(item.nomeProduto || "produto")}" loading="lazy" decoding="async" onerror="this.style.display='none'; this.nextElementSibling.style.display='grid';">`
            : ""}
          <div class="produto-thumb-lista produto-thumb-placeholder" style="${item.foto ? "display:none;" : ""}">Sem foto</div>
        </div>
        <div class="lancamento-titulo">
          <h3>${htmlSeguro(item.nomeProduto || "Produto sem nome")}</h3>
          <p class="muted">${htmlSeguro(lojaNome)}</p>
        </div>
        <div class="badges-line">
          ${prazoHTML(item)}
          ${statusItem === "retirado" ? `<span class="badge neutral">Retirado</span>` : ""}
        </div>
      </div>

      <div class="info-grid">
        <p><strong>EAN:</strong> ${htmlSeguro(item.ean || "Não informado")}</p>
        ${item.marca ? `<p><strong>Marca:</strong> ${htmlSeguro(item.marca)}</p>` : ""}
        ${(item.gramagem || item.quantidadePadrao) ? `<p><strong>Gramagem:</strong> ${htmlSeguro(item.gramagem || item.quantidadePadrao)}</p>` : ""}
        ${item.sabor ? `<p><strong>Sabor/variação:</strong> ${htmlSeguro(item.sabor)}</p>` : ""}
        <p><strong>Setor:</strong> ${htmlSeguro(item.setor || "Não informado")}</p>
        <p><strong>Qtd. lançada:</strong> ${htmlSeguro(item.quantidade)}${item.isCaixa ? " caixa(s)" : " item(ns)"}</p>
        <p><strong>Validade:</strong> ${htmlSeguro(item.validade || "Não informada")}</p>
        <p><strong>Lançado por:</strong> ${htmlSeguro(item.usuarioNome || "Não informado")} (${htmlSeguro(nomeCargo(item.usuarioCargo || ""))})</p>
        ${item.retiradoEm ? `<p><strong>Retirado em:</strong> ${htmlSeguro(item.retiradoEm)} por ${htmlSeguro(item.retiradoPor || "não informado")}</p>` : ""}
      </div>

      <div class="card-actions stack-actions">
        ${podeRetirar ? `<button type="button" onclick="marcarRetirado('${htmlSeguro(item.id)}')">Marcar como retirado</button>` : ""}
        ${podeReativar ? `<button type="button" onclick="reativarItem('${htmlSeguro(item.id)}')">Reativar item</button>` : ""}
        <button type="button" class="btn-danger" onclick="apagarLancamento('${htmlSeguro(item.id)}')">Apagar lançamento</button>
      </div>
    </article>
  `;
}

function renderizarLista({ origem = "" } = {}) {
  if (!lista) return;

  if (estadoLista.itens.length === 0) {
    lista.innerHTML = estadoVazioHTML();
    return;
  }

  lista.innerHTML = `
    ${renderizarResumo(origem)}
    ${estadoLista.itens.map(renderizarCard).join("")}
    ${estadoLista.temMais ? `
      <div class="card">
        <button type="button" id="btn-carregar-mais-lista" onclick="carregarMaisLista()">Carregar mais</button>
      </div>
    ` : ""}
  `;
}

function renderizarErro(erro) {
  if (!lista) return;

  const texto = erroAmigavel(erro);

  if (estadoLista.itens.length > 0) {
    const aviso = document.createElement("div");
    aviso.className = "card aviso-lista-fluida warning";
    aviso.innerHTML = `
      <p>${htmlSeguro(texto)}</p>
      <button type="button" class="secondary" onclick="recarregarLista()">Tentar novamente</button>
    `;
    lista.prepend(aviso);
    return;
  }

  lista.innerHTML = `
    <div class="card">
      <p><strong>A Lista Geral não atualizou agora.</strong></p>
      <p class="muted">${htmlSeguro(texto)}</p>
      <button type="button" onclick="recarregarLista()">Tentar novamente</button>
    </div>
  `;
}

async function buscarPagina({ reset = false, usarCache = true } = {}) {
  if (!lista || estadoLista.carregando) return;

  if (!estadoLista.lojaId) {
    lista.innerHTML = `
      <div class="card">
        <p><strong>Escolha uma loja para carregar a lista.</strong></p>
        <p class="muted">A Lista Geral trabalha por loja para manter o sistema estável.</p>
      </div>
    `;
    return;
  }

  const requestId = ++estadoLista.requestId;
  estadoLista.carregando = true;

  if (reset) {
    estadoLista.cursor = null;
    estadoLista.temMais = false;
    estadoLista.itens = [];

    const cache = usarCache ? carregarCacheLista() : null;

    if (cache && cache.itens.length) {
      estadoLista.itens = cache.itens;
      estadoLista.cursor = cache.cursor || null;
      estadoLista.temMais = Boolean(cache.temMais);
      renderizarLista({ origem: "Dados recentes em cache. Atualizando..." });
    } else {
      lista.innerHTML = loadingHTML("Atualizando Lista Geral...");
    }
  } else {
    const btn = document.getElementById("btn-carregar-mais-lista");
    if (btn) {
      btn.disabled = true;
      btn.innerText = "Carregando...";
    }
  }

  try {
    const resultado = await valisysDB.listarLancamentosPaginado({
      lojaId: estadoLista.lojaId,
      status: estadoLista.status,
      termo: estadoLista.termo,
      cursor: reset ? null : estadoLista.cursor,
      limite: LIMITE_PAGINA,
      usuarioNome: ehListaGeral ? "" : usuario.nome,
      usuarioCargo: ehListaGeral ? "" : usuario.cargo,
      setor: ehListaGeral && usuario.cargo === "encarregado" ? (usuario.setor || "") : ""
    });

    if (requestId !== estadoLista.requestId) return;

    const novosItens = resultado.itens || [];

    estadoLista.itens = reset ? novosItens : [...estadoLista.itens, ...novosItens];
    estadoLista.cursor = resultado.cursor || null;
    estadoLista.temMais = Boolean(resultado.temMais);

    salvarCacheLista();
    renderizarLista({ origem: "Dados atualizados." });
  } catch (erro) {
    console.error(erro);
    if (requestId === estadoLista.requestId) renderizarErro(erro);
  } finally {
    if (requestId === estadoLista.requestId) estadoLista.carregando = false;
  }
}

function sincronizarFiltros() {
  estadoLista.status = document.getElementById("filtro-status")?.value || "ativo";
  estadoLista.lojaId = document.getElementById("filtro-loja")?.value || lojaAtual?.id || "";
  estadoLista.termo = (filtro?.value || "").trim();
}

async function recarregarLista() {
  sincronizarFiltros();
  limparCacheListaAtual();
  await buscarPagina({ reset: true, usarCache: false });
}

async function carregarMaisLista() {
  sincronizarFiltros();
  await buscarPagina({ reset: false, usarCache: false });
}

window.recarregarLista = recarregarLista;
window.carregarMaisLista = carregarMaisLista;

async function preencherLojasEmSegundoPlano(select) {
  if (!ehListaGeral || !select) return;

  try {
    const lojas = await valisysDB.listarLojas();
    lojasCache = lojas.length ? lojas : lojasCache;

    const valorAtual = select.value || lojaAtual?.id || "";
    select.innerHTML = lojasCache.map(loja => `
      <option value="${htmlSeguro(loja.id)}" ${loja.id === valorAtual ? "selected" : ""}>
        ${htmlSeguro(loja.nome)}
      </option>
    `).join("");
  } catch (erro) {
    console.warn("Não foi possível atualizar lista de lojas agora.", erro);
  }
}

function criarFiltrosListaGeral() {
  if (!ehListaGeral) return;

  const card = filtro?.closest(".card");
  if (!card || document.getElementById("filtro-loja")) return;

  const filtrosWrapper = document.createElement("div");
  filtrosWrapper.className = "lista-filtros lista-filtros-profissional";

  filtrosWrapper.innerHTML = `
    <div>
      <label for="filtro-loja">Loja</label>
      <select id="filtro-loja">
        ${lojasCache.map(loja => `
          <option value="${htmlSeguro(loja.id)}" ${lojaAtual && loja.id === lojaAtual.id ? "selected" : ""}>
            ${htmlSeguro(loja.nome)}
          </option>
        `).join("")}
      </select>
    </div>

    <div>
      <label for="filtro-status">Status</label>
      <select id="filtro-status">
        <option value="ativo">Somente ativos</option>
        <option value="retirado">Somente retirados</option>
        <option value="todos">Todos</option>
      </select>
    </div>

    <div>
      <label>&nbsp;</label>
      <button type="button" onclick="recarregarLista()">Atualizar lista</button>
    </div>
  `;

  card.appendChild(filtrosWrapper);

  const filtroLoja = document.getElementById("filtro-loja");
  const filtroStatus = document.getElementById("filtro-status");

  filtroLoja?.addEventListener("change", recarregarLista);
  filtroStatus?.addEventListener("change", recarregarLista);

  preencherLojasEmSegundoPlano(filtroLoja);
}

function configurarBusca() {
  if (!filtro) return;

  filtro.addEventListener("input", () => {
    clearTimeout(timerBuscaLista);
    timerBuscaLista = setTimeout(() => {
      sincronizarFiltros();
      limparCacheListaAtual();
      buscarPagina({ reset: true, usarCache: false });
    }, 450);
  });
}

async function marcarRetirado(id) {
  const confirmar = await confirmarAcao("Marcar este item como retirado da área de venda?");

  if (!confirmar) return;

  try {
    await valisysDB.marcarRetirado(id, usuario.nome);
    await recarregarLista();
  } catch (erro) {
    alert("Não foi possível marcar como retirado agora. Tente novamente.");
    console.error(erro);
  }
}

async function reativarItem(id) {
  const confirmar = await confirmarAcao("Reativar este item na lista de ativos?");

  if (!confirmar) return;

  try {
    await valisysDB.reativarLancamento(id);
    await recarregarLista();
  } catch (erro) {
    alert("Não foi possível reativar o item agora. Tente novamente.");
    console.error(erro);
  }
}

async function apagarLancamento(id) {
  const confirmar = await confirmarAcao("Essa ação remove o registro do banco.", "Apagar este lançamento?", "perigo");

  if (!confirmar) return;

  try {
    await valisysDB.apagarLancamento(id);
    alert("Lançamento apagado.");
    await recarregarLista();
  } catch (erro) {
    alert("Não foi possível apagar o lançamento agora. Tente novamente.");
    console.error(erro);
  }
}

window.marcarRetirado = marcarRetirado;
window.reativarItem = reativarItem;
window.apagarLancamento = apagarLancamento;

async function iniciarLista() {
  if (ehListaGeral) criarFiltrosListaGeral();

  configurarBusca();
  sincronizarFiltros();
  await buscarPagina({ reset: true, usarCache: true });
}

iniciarLista();
