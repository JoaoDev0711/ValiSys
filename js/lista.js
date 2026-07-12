const usuario = protegerPagina();
if (bloquearAdminEmAreaLoja()) throw new Error('Admin bloqueado na área da loja.');
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

let lojasCache = [];
let setoresListaCache = [];
const LIMITE_LISTA_LANCAMENTOS = 30;
let listaJaCarregada = false;
let timerBuscaLista = null;
let carregamentoAtualLista = 0;
let listaRenderizadaDoCache = false;


async function carregarSetoresFiltroLista(lojaId = "") {
  if (!ehListaGeral) return [];

  const lojaFiltro = lojaId || document.getElementById("filtro-loja")?.value || lojaAtual?.id || "";

  if (!lojaFiltro || lojaFiltro === "todas") {
    setoresListaCache = [];
    return setoresListaCache;
  }

  try {
    const setores = await valisysDB.listarSetoresLoja(lojaFiltro);

    setoresListaCache = [...new Set((setores || [])
      .map(setor => setor.nome)
      .filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "pt-BR"));
  } catch (erro) {
    console.warn("Não foi possível carregar setores cadastrados.", erro);
    setoresListaCache = [];
  }

  return setoresListaCache;
}

function opcoesSetorLista(valorAtual = "", incluirTodas = false) {
  const opcoes = [...new Set([valorAtual, ...setoresListaCache, "Outros"].filter(Boolean))];

  return `
    ${incluirTodas ? `<option value="todos">Todos os setores</option>` : ""}
    ${opcoes.map(setor => `<option value="${esc(setor)}" ${setor === valorAtual ? "selected" : ""}>${esc(setor)}</option>`).join("")}
  `;
}

async function atualizarSelectFiltroSetor(lojaId = "") {
  if (!ehListaGeral) return;

  const select = document.getElementById("filtro-setor");
  if (!select) return;

  const valorAtual = select.value || "todos";
  const lojaFiltro = lojaId || document.getElementById("filtro-loja")?.value || lojaAtual?.id || "";

  select.disabled = true;

  if (!lojaFiltro || lojaFiltro === "todas") {
    setoresListaCache = [];
    select.innerHTML = `<option value="todos">Todos os setores</option>`;
    select.disabled = false;
    return;
  }

  select.innerHTML = `<option value="todos">Carregando setores...</option>`;

  await carregarSetoresFiltroLista(lojaFiltro);

  select.innerHTML = opcoesSetorLista("", true);

  if ([...select.options].some(opcao => opcao.value === valorAtual)) {
    select.value = valorAtual;
  }

  select.disabled = false;
}

function toggleSetorManualLista(id) {
  const select = document.getElementById(`setor-lista-${id}`);
  const area = document.getElementById(`setor-manual-lista-area-${id}`);
  const input = document.getElementById(`setor-manual-lista-${id}`);

  if (!select || !area || !input) return;

  const mostrar = select.value === "Outros";
  area.style.display = mostrar ? "block" : "none";
  input.required = mostrar;

  if (!mostrar) {
    input.value = "";
  }
}

async function salvarSetorLancamento(id) {
  const select = document.getElementById(`setor-lista-${id}`);
  const input = document.getElementById(`setor-manual-lista-${id}`);

  if (!select) return;

  const setorSelecionado = select.value;
  const setorManual = input?.value.trim() || "";
  const setorFinal = setorSelecionado === "Outros" ? setorManual : setorSelecionado;

  if (!setorFinal) {
    alert("Informe o setor do produto.");
    input?.focus();
    return;
  }

  const confirmar = await confirmarAcao(`Novo setor: ${setorFinal}`, "Salvar setor do lançamento?");

  if (!confirmar) return;

  try {
    await valisysDB.atualizarSetorLancamento(id, setorFinal);
    await carregarSetoresFiltroLista(document.getElementById("filtro-loja")?.value || lojaAtual?.id || "");
    await renderizarLista();
  } catch (erro) {
    alert("Erro ao atualizar setor: " + erro.message);
  }
}


async function iniciarLista() {
  if (ehListaGeral) {
    await criarFiltroLoja();

    const cache = carregarListaCacheSessao();

    if (cache && cache.itens?.length) {
      listaRenderizadaDoCache = true;
      renderizarLancamentos(cache.itens, {
        origem: `Dados em cache • ${formatarTempoCache(cache.tempo)}`,
        avisoLimite: cache.itens.length >= LIMITE_LISTA_LANCAMENTOS
      });
    } else {
      renderizarEstadoListaFluido("Abrindo Lista Geral. Buscando dados sem travar a tela...");
    }

    setTimeout(() => carregarListaManual({ silencioso: Boolean(cache?.itens?.length) }), 120);
    return;
  }

  await renderizarLista();
}

async function carregarListaManual({ silencioso = false } = {}) {
  listaJaCarregada = true;
  await renderizarLista({ usarCachePrimeiro: silencioso });
}

window.carregarListaManual = carregarListaManual;

async function criarFiltroLoja() {
  if (!ehListaGeral) return;

  const card = filtro?.closest(".card");

  if (!card || document.getElementById("filtro-loja")) return;

  try {
    lojasCache = await valisysDB.listarLojas();
  } catch (erro) {
    console.error(erro);
    lojasCache = lojaAtual ? [lojaAtual] : [];
  }

  const filtrosWrapper = document.createElement("div");
  filtrosWrapper.className = "lista-filtros";

  filtrosWrapper.innerHTML = `
    <div>
      <label for="filtro-loja">Loja</label>
      <select id="filtro-loja">
        ${lojasCache.map(loja => `
          <option value="${esc(loja.id)}" ${lojaAtual && loja.id === lojaAtual.id ? "selected" : ""}>
            ${esc(loja.nome)}
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
      <label for="filtro-setor">Setor</label>
      <select id="filtro-setor">
        <option value="todos">Carregando setores...</option>
      </select>
    </div>

    <div>
      <label>&nbsp;</label>
      <button type="button" onclick="carregarListaManual()">Atualizar lista</button>
    </div>
  `;

  card.appendChild(filtrosWrapper);

  document.getElementById("filtro-loja").addEventListener("change", async event => {
    await atualizarSelectFiltroSetor(event.target.value);
    listaJaCarregada = true;
    await renderizarLista();
  });

  document.getElementById("filtro-status").addEventListener("change", () => {
    listaJaCarregada = true;
    renderizarLista();
  });

  document.getElementById("filtro-setor").addEventListener("change", () => {
    listaJaCarregada = true;
    renderizarLista();
  });

  await atualizarSelectFiltroSetor(document.getElementById("filtro-loja").value);
}

function pertenceAoUsuario(item) {
  return String(item.usuarioNome || "").toLowerCase() === String(usuario.nome || "").toLowerCase() &&
    item.usuarioCargo === usuario.cargo;
}

function listaCacheChaveAtual() {
  const filtroLojaSelecionado = document.getElementById("filtro-loja")?.value || lojaAtual?.id || "";
  const filtroStatus = document.getElementById("filtro-status")?.value || "ativo";
  const filtroSetor = document.getElementById("filtro-setor")?.value || "todos";

  return `lista:${filtroLojaSelecionado}:${filtroStatus}:${filtroSetor}`;
}

function carregarListaCacheSessao() {
  try {
    const bruto = sessionStorage.getItem(listaCacheChaveAtual()) ||
      localStorage.getItem(`valisys-lista-cache:${listaCacheChaveAtual()}`);

    if (!bruto) return null;

    const cache = JSON.parse(bruto);
    if (!cache || !cache.itens) return null;

    return {
      itens: cache.itens || [],
      tempo: cache.tempo || 0
    };
  } catch {
    return null;
  }
}

function salvarListaCacheSessao(itens) {
  try {
    const payload = JSON.stringify({
      tempo: Date.now(),
      itens
    });

    sessionStorage.setItem(listaCacheChaveAtual(), payload);
    localStorage.setItem(`valisys-lista-cache:${listaCacheChaveAtual()}`, payload);
  } catch {
    // Cache opcional.
  }
}

function formatarTempoCache(tempo) {
  if (!tempo) return "cache anterior";

  const segundos = Math.max(1, Math.round((Date.now() - tempo) / 1000));

  if (segundos < 60) return `atualizado há ${segundos}s`;

  const minutos = Math.round(segundos / 60);
  return `atualizado há ${minutos}min`;
}

function promessaComTimeout(promessa, ms = 8500) {
  let timer;

  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const erro = new Error("Tempo de resposta excedido. Mantendo a tela estável.");
      erro.codigo = "timeout_lista";
      reject(erro);
    }, ms);
  });

  return Promise.race([promessa, timeout]).finally(() => clearTimeout(timer));
}

function renderizarEstadoListaFluido(mensagem = "Atualizando lista em segundo plano...") {
  if (!lista) return;

  lista.innerHTML = `
    <div class="card lista-loading-fluido">
      <div class="loading-linha"></div>
      <div class="loading-linha menor"></div>
      <p class="muted">${esc(mensagem)}</p>
    </div>
  `;
}

function renderizarAvisoLista(texto, tipo = "muted") {
  const avisoAntigo = document.getElementById("aviso-lista-fluida");
  if (avisoAntigo) avisoAntigo.remove();

  const aviso = document.createElement("div");
  aviso.id = "aviso-lista-fluida";
  aviso.className = `card aviso-lista-fluida ${tipo}`;
  aviso.innerHTML = `
    <p>${esc(texto)}</p>
    <button type="button" class="secondary" onclick="carregarListaManual()">Atualizar agora</button>
  `;

  lista?.prepend(aviso);
}

function erroOperacionalLista(erro) {
  const texto = String(erro?.message || "");

  if (erro?.codigo === "timeout_lista" || texto.toLowerCase().includes("timeout")) {
    return "O Supabase demorou para responder. Mantive a tela aberta e você pode tentar atualizar novamente.";
  }

  if (texto.toLowerCase().includes("failed to fetch") || texto.toLowerCase().includes("network")) {
    return "Falha de internet ou conexão instável. Mantive a tela aberta para não interromper a operação.";
  }

  return "Não foi possível atualizar agora. A tela continua funcionando; tente novamente em alguns segundos.";
}

async function obterLancamentosFiltrados() {
  const termo = (filtro?.value || "").toLowerCase().trim();
  const filtroLojaSelecionado = document.getElementById("filtro-loja")?.value || lojaAtual?.id || "";
  const filtroLoja = filtroLojaSelecionado && filtroLojaSelecionado !== "todas"
    ? filtroLojaSelecionado
    : (lojaAtual?.id || "");
  const filtroStatus = document.getElementById("filtro-status")?.value || "ativo";
  const filtroSetor = document.getElementById("filtro-setor")?.value || "todos";

  let lancamentos = await valisysDB.listarLancamentos({
    lojaId: filtroLoja,
    status: filtroStatus,
    limite: LIMITE_LISTA_LANCAMENTOS
  });

  if (!ehListaGeral) {
    lancamentos = lancamentos.filter(pertenceAoUsuario);
  }

  if (ehListaGeral && usuario.cargo === "encarregado" && usuario.setor) {
    lancamentos = lancamentos.filter(item =>
      String(item.setor || "").toLowerCase() === String(usuario.setor || "").toLowerCase()
    );
  }

  if (ehListaGeral && filtroSetor && filtroSetor !== "todos") {
    lancamentos = lancamentos.filter(item =>
      String(item.setor || "").toLowerCase() === String(filtroSetor || "").toLowerCase()
    );
  }

  if (termo) {
    lancamentos = lancamentos.filter(item => {
      const texto = `
        ${item.nomeProduto}
        ${item.ean}
        ${item.setor}
        ${item.usuarioNome}
        ${item.lojaNome}
        ${item.marca || ""}
        ${item.gramagem || item.quantidadePadrao || ""}
        ${item.sabor || ""}
        ${item.categoria || ""}
        ${item.status || ""}
        ${item.quantidadePadrao || ""}
        ${item.porcao || ""}
        ${item.embalagem || ""}
        ${item.origem || ""}
        ${item.paises || ""}
        ${item.lojas || ""}
        ${item.ingredientes || ""}
        ${item.alergicos || ""}
        ${item.rastros || ""}
        ${item.nutriscore || ""}
        ${item.ecoscore || ""}
        ${item.nova || ""}
        ${item.fonte || ""}
      `.toLowerCase();

      return texto.includes(termo);
    });
  }

  return lancamentos;
}

async function renderizarLista({ usarCachePrimeiro = false } = {}) {
  const cicloAtual = ++carregamentoAtualLista;

  if (!usarCachePrimeiro) {
    const cache = carregarListaCacheSessao();

    if (cache && cache.itens?.length) {
      renderizarLancamentos(cache.itens, {
        origem: `Dados em cache • ${formatarTempoCache(cache.tempo)}`,
        avisoLimite: cache.itens.length >= LIMITE_LISTA_LANCAMENTOS
      });
    } else {
      renderizarEstadoListaFluido();
    }
  }

  try {
    const lancamentos = await promessaComTimeout(obterLancamentosFiltrados(), 8500);

    if (cicloAtual !== carregamentoAtualLista) return;

    salvarListaCacheSessao(lancamentos);
    renderizarLancamentos(lancamentos, {
      origem: "Dados atualizados agora",
      avisoLimite: lancamentos.length >= LIMITE_LISTA_LANCAMENTOS
    });
  } catch (erro) {
    console.error(erro);

    if (cicloAtual !== carregamentoAtualLista) return;

    const cache = carregarListaCacheSessao();

    if (cache && cache.itens?.length) {
      renderizarLancamentos(cache.itens, {
        origem: `Usando cache • ${formatarTempoCache(cache.tempo)}`,
        avisoLimite: cache.itens.length >= LIMITE_LISTA_LANCAMENTOS
      });
      renderizarAvisoLista(erroOperacionalLista(erro), "warning");
      return;
    }

    lista.innerHTML = `
      <div class="card">
        <p><strong>Não foi possível atualizar a Lista Geral agora.</strong></p>
        <p class="muted">${esc(erroOperacionalLista(erro))}</p>
        <button type="button" onclick="carregarListaManual()">Tentar novamente</button>
      </div>
    `;
  }
}

function renderizarLancamentos(lancamentos, { origem = "", avisoLimite = false } = {}) {
  if (lancamentos.length === 0) {
      const filtroLoja = document.getElementById("filtro-loja")?.value || "";
      const filtroStatus = document.getElementById("filtro-status")?.value || "";

      lista.innerHTML = `
        <div class="card">
          <p><strong>Nenhum lançamento encontrado.</strong></p>
          <p class="muted">Filtro de loja: ${esc(nomeFiltroLoja(filtroLoja))}</p>
          <p class="muted">Filtro de status: ${esc(filtroStatus)}</p>
          <p class="muted">Troque o status, setor ou loja para conferir outros registros.</p>
          <button type="button" onclick="carregarListaManual()">Atualizar novamente</button>
        </div>
      `;
      return;
    }

    lancamentos.sort((a, b) => parseDataLocal(a.validade) - parseDataLocal(b.validade));

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const limiteAvisoLista = avisoLimite
      ? `<p class="muted">Mostrando até ${LIMITE_LISTA_LANCAMENTOS} registros por carregamento para manter rápido.</p>`
      : "";

    lista.innerHTML = `
      <div class="card lista-resumo">
        <strong>${lancamentos.length} lançamento(s) carregado(s)</strong>
        <p class="muted">${esc(origem || "Carregamento fluido operacional")}</p>
        ${limiteAvisoLista}
      </div>

      ${lancamentos.map(item => {
        const validade = parseDataLocal(item.validade);
        const diff = Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));

        const statusItem = item.status || "ativo";

        let statusPrazo = "";

        if (diff < 0) {
          statusPrazo = `<span class="badge danger">Vencido há ${Math.abs(diff)} dia(s)</span>`;
        } else if (diff === 0) {
          statusPrazo = `<span class="badge danger">Vence hoje</span>`;
        } else if (diff <= 7) {
          statusPrazo = `<span class="badge warning">Vence em ${diff} dia(s)</span>`;
        } else {
          statusPrazo = `<span class="badge success">Vence em ${diff} dia(s)</span>`;
        }

        const podeNotificar = diff <= 0 && statusItem !== "retirado";
        const podeRetirar = statusItem !== "retirado";
        const podeReativar = statusItem === "retirado" && ["encarregado", "gerente", "admin"].includes(usuario.cargo);

        return `
          <article class="card lancamento-card ${statusItem === "retirado" ? "item-retirado" : ""}">
            <div class="lancamento-topo">
              <div>
                <h3>${esc(item.nomeProduto)}</h3>
                <p class="muted">${lojaInlineHTML({
                  nome: item.lojaNome || "Loja não informada",
                  imagem: item.lojaImagem || "",
                  corTema: item.lojaCorTema || ""
                }, "loja-inline-small")}</p>
              </div>
              <div class="badges-line">
                ${statusPrazo}
                ${statusItem === "retirado" ? `<span class="badge neutral">Retirado</span>` : ""}
              </div>
            </div>

            ${item.foto ? `<img class="produto-img" src="${item.foto}" alt="${esc(item.nomeProduto)}">` : ""}

            <div class="info-grid">
              <p><strong>EAN:</strong> ${esc(item.ean)}</p>
              ${item.marca ? `<p><strong>Marca:</strong> ${esc(item.marca)}</p>` : ""}
              ${(item.gramagem || item.quantidadePadrao) ? `<p><strong>Gramagem:</strong> ${esc(item.gramagem || item.quantidadePadrao)}</p>` : ""}
              ${item.sabor ? `<p><strong>Sabor/variação:</strong> ${esc(item.sabor)}</p>` : ""}
              ${item.categoria ? `<p><strong>Categoria:</strong> ${esc(item.categoria)}</p>` : ""}
              <p><strong>Setor atual:</strong> ${esc(item.setor || "Não informado")}</p>
              <p><strong>Qtd. lançada:</strong> ${esc(item.quantidade)}${item.isCaixa ? " caixa(s)" : " item(ns)"}</p>
              <p><strong>Validade:</strong> ${esc(item.validade)}</p>
              <p><strong>Lançado por:</strong> ${esc(item.usuarioNome)} (${esc(nomeCargo(item.usuarioCargo))})</p>
              ${item.retiradoEm ? `<p><strong>Retirado em:</strong> ${esc(item.retiradoEm)} por ${esc(item.retiradoPor || "não informado")}</p>` : ""}
            </div>

            ${ehListaGeral ? `
              <div class="setor-editor-lista">
                <label for="setor-lista-${esc(item.id)}">Alterar setor</label>
                <div class="setor-editor-row">
                  <select id="setor-lista-${esc(item.id)}" onchange="toggleSetorManualLista('${item.id}')">
                    ${opcoesSetorLista(item.setor || "Geral")}
                  </select>
                  <button type="button" class="secondary" onclick="salvarSetorLancamento('${item.id}')">Salvar setor</button>
                </div>
                <div id="setor-manual-lista-area-${esc(item.id)}" class="setor-manual-lista-area" style="display:${item.setor === "Outros" ? "block" : "none"};">
                  <input id="setor-manual-lista-${esc(item.id)}" type="text" placeholder="Digite o setor manual">
                </div>
              </div>
            ` : ""}

            <div class="card-actions stack-actions">
              ${podeRetirar ? `<button type="button" onclick="marcarRetirado('${item.id}')">Marcar como retirado</button>` : ""}
              ${podeReativar ? `<button type="button" onclick="reativarItem('${item.id}')">Reativar item</button>` : ""}
              ${podeNotificar ? `` : ""}
              <button type="button" class="btn-danger" onclick="apagarLancamento('${item.id}')">Apagar lançamento</button>
            </div>
          </article>
        `;
      }).join("")}
    `;

}

function nomeFiltroLoja(id) {
  if (!id || id === "todas") return "Loja atual";
  const loja = lojasCache.find(item => item.id === id);
  return loja ? loja.nome : "Loja não encontrada";
}

async function marcarRetirado(id) {
  const confirmar = await confirmarAcao("Marcar este item como retirado da área de venda?");

  if (!confirmar) return;

  try {
    await valisysDB.marcarRetirado(id, usuario.nome);
    await renderizarLista();
  } catch (erro) {
    alert("Erro ao marcar como retirado: " + erro.message);
  }
}

async function reativarItem(id) {
  const confirmar = await confirmarAcao("Reativar este item na lista de ativos?");

  if (!confirmar) return;

  try {
    await valisysDB.reativarLancamento(id);
    await renderizarLista();
  } catch (erro) {
    alert("Erro ao reativar item: " + erro.message);
  }
}

async function apagarLancamento(id) {
  const confirmar = await confirmarAcao("Essa ação remove o registro do banco.", "Apagar este lançamento?", "perigo");

  if (!confirmar) return;

  try {
    await valisysDB.apagarLancamento(id);
    alert("Lançamento apagado.");
    await renderizarLista();
  } catch (erro) {
    alert("Erro ao apagar lançamento: " + erro.message);
  }
}

window.toggleSetorManualLista = toggleSetorManualLista;
window.salvarSetorLancamento = salvarSetorLancamento;

if (filtro) {
  filtro.addEventListener("input", () => {
    if (!listaJaCarregada) return;

    clearTimeout(timerBuscaLista);
    timerBuscaLista = setTimeout(renderizarLista, 350);
  });
}

iniciarLista();
