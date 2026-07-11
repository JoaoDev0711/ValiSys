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


const SETORES_PADRAO_LISTA = [
  "Geral",
  "Mercearia",
  "Bebidas",
  "Frios e Laticínios",
  "Açougue",
  "Hortifruti",
  "Padaria",
  "Congelados",
  "Limpeza",
  "Higiene e Perfumaria",
  "Pet",
  "Promotoria",
  "Outros"
];

function setoresComValorAtual(valorAtual = "") {
  return [...new Set([valorAtual, ...SETORES_PADRAO_LISTA].filter(Boolean))];
}

function opcoesSetorLista(valorAtual = "", incluirTodas = false) {
  const opcoes = setoresComValorAtual(valorAtual);

  return `
    ${incluirTodas ? `<option value="todos">Todos os setores</option>` : ""}
    ${opcoes.map(setor => `<option value="${esc(setor)}" ${setor === valorAtual ? "selected" : ""}>${esc(setor)}</option>`).join("")}
  `;
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
    await renderizarLista();
  } catch (erro) {
    alert("Erro ao atualizar setor: " + erro.message);
  }
}


async function iniciarLista() {
  await criarFiltroLoja();
  await renderizarLista();
}

async function criarFiltroLoja() {
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
        <option value="todas">Todas as lojas</option>
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
        ${opcoesSetorLista("", true)}
      </select>
    </div>
  `;

  card.appendChild(filtrosWrapper);

  document.getElementById("filtro-loja").addEventListener("change", renderizarLista);
  document.getElementById("filtro-status").addEventListener("change", renderizarLista);
  document.getElementById("filtro-setor").addEventListener("change", renderizarLista);
}

function pertenceAoUsuario(item) {
  return String(item.usuarioNome || "").toLowerCase() === String(usuario.nome || "").toLowerCase() &&
    item.usuarioCargo === usuario.cargo;
}

async function obterLancamentosFiltrados() {
  const termo = (filtro?.value || "").toLowerCase().trim();
  const filtroLoja = document.getElementById("filtro-loja")?.value || (lojaAtual?.id || "todas");
  const filtroStatus = document.getElementById("filtro-status")?.value || "ativo";
  const filtroSetor = document.getElementById("filtro-setor")?.value || "todos";

  let lancamentos = await valisysDB.listarLancamentos({
    lojaId: filtroLoja,
    status: filtroStatus
  });

  if (!ehListaGeral) {
    lancamentos = lancamentos.filter(pertenceAoUsuario);
  }

  if (ehListaGeral && usuario.cargo === "encarregado" && usuario.setor) {
    lancamentos = lancamentos.filter(item =>
      String(item.setor || "").toLowerCase() === String(usuario.setor || "").toLowerCase()
    );
  }

  if (filtroSetor && filtroSetor !== "todos") {
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

async function renderizarLista() {
  lista.innerHTML = `<div class="card"><p class="muted">Carregando lançamentos...</p></div>`;

  try {
    let lancamentos = await obterLancamentosFiltrados();

    if (lancamentos.length === 0) {
      const filtroLoja = document.getElementById("filtro-loja")?.value || "";
      const filtroStatus = document.getElementById("filtro-status")?.value || "";

      lista.innerHTML = `
        <div class="card">
          <p><strong>Nenhum lançamento encontrado.</strong></p>
          <p class="muted">Filtro de loja: ${esc(nomeFiltroLoja(filtroLoja))}</p>
          <p class="muted">Filtro de status: ${esc(filtroStatus)}</p>
          <p class="muted">Troque para "Todas as lojas" ou "Todos" em status para conferir.</p>
        </div>
      `;
      return;
    }

    lancamentos.sort((a, b) => parseDataLocal(a.validade) - parseDataLocal(b.validade));

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    lista.innerHTML = `
      <div class="card lista-resumo">
        <strong>${lancamentos.length} lançamento(s) encontrado(s)</strong>
        <p class="muted">Esses dados são compartilhados entre os aparelhos.</p>
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
  } catch (erro) {
    console.error(erro);
    lista.innerHTML = `
      <div class="card">
        <p class="danger">Erro ao carregar lançamentos do sistema.</p>
        <p class="muted">${esc(erro.message)}</p>
      </div>
    `;
  }
}

function nomeFiltroLoja(id) {
  if (!id || id === "todas") return "Todas as lojas";
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
  filtro.addEventListener("input", renderizarLista);
}

iniciarLista();
