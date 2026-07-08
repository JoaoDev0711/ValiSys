const usuario = protegerPagina();
const lojaAtual = protegerLojaSelecionada();

const lojaListaEl = document.getElementById("loja-lista-atual");
if (lojaListaEl && lojaAtual) lojaListaEl.innerText = lojaAtual.nome;

const lista = document.getElementById("lista");
const filtro = document.getElementById("filtro");

const paginaAtual = window.location.pathname;
const ehListaGeral = paginaAtual.includes("lista-geral");

if (ehListaGeral && !podeVerListaGeral(usuario.cargo)) {
  alert("Você não tem permissão para acessar a lista completa.");
  window.location.href = "dashboard.html";
}

let lojasCache = [];

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
  `;

  card.appendChild(filtrosWrapper);

  document.getElementById("filtro-loja").addEventListener("change", renderizarLista);
  document.getElementById("filtro-status").addEventListener("change", renderizarLista);
}

function pertenceAoUsuario(item) {
  return String(item.usuarioNome || "").toLowerCase() === String(usuario.nome || "").toLowerCase() &&
    item.usuarioCargo === usuario.cargo;
}

async function obterLancamentosFiltrados() {
  const termo = (filtro?.value || "").toLowerCase().trim();
  const filtroLoja = document.getElementById("filtro-loja")?.value || (lojaAtual?.id || "todas");
  const filtroStatus = document.getElementById("filtro-status")?.value || "ativo";

  let lancamentos = await valisysDB.listarLancamentos({
    lojaId: filtroLoja,
    status: filtroStatus
  });

  if (!ehListaGeral) {
    lancamentos = lancamentos.filter(pertenceAoUsuario);
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
        ${item.fabricante || ""}
        ${item.sabor || ""}
        ${item.categoria || ""}
        ${item.status || ""}
      `.toLowerCase();

      return texto.includes(termo);
    });
  }

  return lancamentos;
}

async function renderizarLista() {
  lista.innerHTML = `<div class="card"><p class="muted">Carregando lançamentos do Supabase...</p></div>`;

  try {
    let lancamentos = await obterLancamentosFiltrados();

    if (lancamentos.length === 0) {
      const filtroLoja = document.getElementById("filtro-loja")?.value || "";
      const filtroStatus = document.getElementById("filtro-status")?.value || "";

      lista.innerHTML = `
        <div class="card">
          <p><strong>Nenhum lançamento encontrado no Supabase.</strong></p>
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
        <strong>${lancamentos.length} lançamento(s) encontrado(s) no Supabase</strong>
        <p class="muted">Esses dados vêm do banco online, não do celular.</p>
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

        const podeNotificar = podeVerNotificacoes(usuario.cargo) && diff <= 0 && statusItem !== "retirado";
        const podeRetirar = statusItem !== "retirado";
        const podeReativar = statusItem === "retirado" && ["encarregado", "gerente", "admin"].includes(usuario.cargo);

        return `
          <article class="card lancamento-card ${statusItem === "retirado" ? "item-retirado" : ""}">
            <div class="lancamento-topo">
              <div>
                <h3>${esc(item.nomeProduto)}</h3>
                <p class="muted">${esc(item.lojaNome || "Loja não informada")}</p>
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
              ${item.fabricante ? `<p><strong>Fabricante:</strong> ${esc(item.fabricante)}</p>` : ""}
              ${item.sabor ? `<p><strong>Sabor/variação:</strong> ${esc(item.sabor)}</p>` : ""}
              ${item.categoria ? `<p><strong>Categoria:</strong> ${esc(item.categoria)}</p>` : ""}
              <p><strong>Setor:</strong> ${esc(item.setor)}</p>
              <p><strong>Qtd. lançada:</strong> ${esc(item.quantidade)}</p>
              <p><strong>Validade:</strong> ${esc(item.validade)}</p>
              <p><strong>Lançado por:</strong> ${esc(item.usuarioNome)} (${esc(nomeCargo(item.usuarioCargo))})</p>
              ${item.retiradoEm ? `<p><strong>Retirado em:</strong> ${esc(item.retiradoEm)} por ${esc(item.retiradoPor || "não informado")}</p>` : ""}
            </div>

            <div class="card-actions stack-actions">
              ${podeRetirar ? `<button onclick="marcarRetirado('${item.id}')">Marcar como retirado</button>` : ""}
              ${podeReativar ? `<button onclick="reativarItem('${item.id}')">Reativar item</button>` : ""}
              ${podeNotificar ? `<button class="btn-warning" onclick="notificarGerencia('${item.id}')">Notificar gerente/encarregado</button>` : ""}
              <button class="btn-danger" onclick="apagarLancamento('${item.id}')">Apagar lançamento</button>
            </div>
          </article>
        `;
      }).join("")}
    `;
  } catch (erro) {
    console.error(erro);
    lista.innerHTML = `
      <div class="card">
        <p class="danger">Erro ao carregar lançamentos do Supabase.</p>
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
  const confirmar = confirm("Marcar este item como retirado da área de venda?");

  if (!confirmar) return;

  try {
    await valisysDB.marcarRetirado(id, usuario.nome);
    await renderizarLista();
  } catch (erro) {
    alert("Erro ao marcar como retirado: " + erro.message);
  }
}

async function reativarItem(id) {
  const confirmar = confirm("Reativar este item na lista de ativos?");

  if (!confirmar) return;

  try {
    await valisysDB.reativarLancamento(id);
    await renderizarLista();
  } catch (erro) {
    alert("Erro ao reativar item: " + erro.message);
  }
}

async function notificarGerencia(id) {
  try {
    const todos = await valisysDB.listarLancamentos({ lojaId: "todas", status: "todos" });
    const item = todos.find(l => l.id === id);

    if (!item) {
      alert("Lançamento não encontrado.");
      return;
    }

    const confirmar = confirm(
      `Criar aviso interno no Supabase?\n\nProduto: ${item.nomeProduto}\nLoja: ${item.lojaNome}\nValidade: ${item.validade}`
    );

    if (!confirmar) return;

    await valisysDB.criarNotificacao({
      tipo: "vencimento_hoje",
      lojaId: item.lojaId,
      lojaNome: item.lojaNome,
      titulo: "Produto vencendo hoje",
      mensagem: `${item.nomeProduto} está vencendo hoje ou já venceu. Verificar setor ${item.setor}.`,
      lancamentoId: item.id,
      produto: item.nomeProduto,
      setor: item.setor,
      validade: item.validade,
      criadoPor: `${usuario.nome} (${nomeCargo(usuario.cargo)})`
    });

    alert("Aviso interno salvo no Supabase.");
  } catch (erro) {
    alert("Erro ao notificar: " + erro.message);
  }
}

async function apagarLancamento(id) {
  const confirmar = confirm("Deseja apagar este lançamento do Supabase?");

  if (!confirmar) return;

  try {
    await valisysDB.apagarLancamento(id);
    await renderizarLista();
  } catch (erro) {
    alert("Erro ao apagar lançamento: " + erro.message);
  }
}

if (filtro) {
  filtro.addEventListener("input", renderizarLista);
}

iniciarLista();
