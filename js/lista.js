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

criarFiltroLoja();

function normalizarLancamentos() {
  const todos = lerJSONLocal("lancamentos", []);
  let mudou = false;

  const normalizados = todos.map(item => {
    const copia = { ...item };

    if (!copia.id) {
      copia.id = gerarIdLocal("lancamento");
      mudou = true;
    }

    if (!copia.lojaId && lojaAtual) {
      copia.lojaId = lojaAtual.id;
      copia.lojaNome = lojaAtual.nome;
      mudou = true;
    }

    if (!copia.lojaNome && lojaAtual && copia.lojaId === lojaAtual.id) {
      copia.lojaNome = lojaAtual.nome;
      mudou = true;
    }

    if (!copia.usuarioId && usuario) {
      copia.usuarioId = usuario.id;
      copia.usuarioNome = usuario.nome;
      copia.usuarioCargo = usuario.cargo;
      mudou = true;
    }

    if (!copia.status) {
      copia.status = "ativo";
      mudou = true;
    }

    return copia;
  });

  if (mudou) {
    salvarJSONLocal("lancamentos", normalizados);
  }

  return normalizados;
}

function criarFiltroLoja() {
  const card = filtro?.closest(".card");

  if (!card || document.getElementById("filtro-loja")) return;

  const filtrosWrapper = document.createElement("div");
  filtrosWrapper.className = "lista-filtros";

  const lojas = getLojas();

  filtrosWrapper.innerHTML = `
    <div>
      <label for="filtro-loja">Loja</label>
      <select id="filtro-loja">
        <option value="todas">Todas as lojas</option>
        ${lojas.map(loja => `
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
  return item.usuarioId === usuario.id ||
    (
      String(item.usuarioNome || "").toLowerCase() === String(usuario.nome || "").toLowerCase() &&
      item.usuarioCargo === usuario.cargo
    );
}

function obterLancamentosFiltrados() {
  const termo = (filtro?.value || "").toLowerCase().trim();
  const filtroLoja = document.getElementById("filtro-loja")?.value || (lojaAtual?.id || "todas");
  const filtroStatus = document.getElementById("filtro-status")?.value || "ativo";
  const produtos = lerJSONLocal("produtos", []);
  let lancamentos = normalizarLancamentos();

  if (!ehListaGeral) {
    lancamentos = lancamentos.filter(pertenceAoUsuario);
  }

  if (filtroLoja !== "todas") {
    lancamentos = lancamentos.filter(item => item.lojaId === filtroLoja);
  }

  if (filtroStatus !== "todos") {
    lancamentos = lancamentos.filter(item => (item.status || "ativo") === filtroStatus);
  }

  if (termo) {
    lancamentos = lancamentos.filter(item => {
      const produtoLocal = produtos.find(p => p.ean === item.ean);

      const texto = `
        ${item.nomeProduto}
        ${item.ean}
        ${item.setor}
        ${item.usuarioNome}
        ${item.lojaNome}
        ${item.marca || produtoLocal?.marca || ""}
        ${item.fabricante || produtoLocal?.fabricante || ""}
        ${item.sabor || produtoLocal?.sabor || ""}
        ${produtoLocal?.categoria || ""}
        ${item.status || ""}
      `.toLowerCase();

      return texto.includes(termo);
    });
  }

  return lancamentos;
}

function renderizarLista() {
  const produtos = lerJSONLocal("produtos", []);
  let lancamentos = obterLancamentosFiltrados();

  if (lancamentos.length === 0) {
    const total = normalizarLancamentos().length;
    const filtroLoja = document.getElementById("filtro-loja")?.value || "";
    const filtroStatus = document.getElementById("filtro-status")?.value || "";

    lista.innerHTML = `
      <div class="card">
        <p><strong>Nenhum lançamento encontrado.</strong></p>
        <p class="muted">Total salvo neste aparelho: ${total}</p>
        <p class="muted">Filtro de loja: ${esc(nomeFiltroLoja(filtroLoja))}</p>
        <p class="muted">Filtro de status: ${esc(filtroStatus)}</p>
        <p class="muted">Troque para "Todas as lojas" ou "Todos" em status para conferir se o item está em outra loja ou foi retirado.</p>
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
      <p class="muted">Loja e status estão sendo aplicados pelos filtros acima.</p>
    </div>

    ${lancamentos.map(item => {
      const produtoLocal = produtos.find(p => p.ean === item.ean);
      const validade = parseDataLocal(item.validade);
      const diff = Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));

      const marcaFinal = item.marca || produtoLocal?.marca || "";
      const fabricanteFinal = item.fabricante || produtoLocal?.fabricante || "";
      const saborFinal = item.sabor || produtoLocal?.sabor || "";
      const categoriaFinal = item.categoria || produtoLocal?.categoria || "";
      const quantidadePadrao = item.quantidadePadrao || produtoLocal?.quantidadePadrao || "";
      const embalagemFinal = item.embalagem || produtoLocal?.embalagem || "";
      const fotoFinal = item.foto || produtoLocal?.foto || "";
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

          ${fotoFinal ? `<img class="produto-img" src="${fotoFinal}" alt="${esc(item.nomeProduto)}">` : ""}

          <div class="info-grid">
            <p><strong>EAN:</strong> ${esc(item.ean)}</p>
            ${marcaFinal ? `<p><strong>Marca:</strong> ${esc(marcaFinal)}</p>` : ""}
            ${fabricanteFinal ? `<p><strong>Fabricante:</strong> ${esc(fabricanteFinal)}</p>` : ""}
            ${saborFinal ? `<p><strong>Sabor/variação:</strong> ${esc(saborFinal)}</p>` : ""}
            ${categoriaFinal ? `<p><strong>Categoria:</strong> ${esc(categoriaFinal)}</p>` : ""}
            ${quantidadePadrao ? `<p><strong>Qtd. padrão:</strong> ${esc(quantidadePadrao)}</p>` : ""}
            ${embalagemFinal ? `<p><strong>Embalagem:</strong> ${esc(embalagemFinal)}</p>` : ""}
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
}

function nomeFiltroLoja(id) {
  if (!id || id === "todas") return "Todas as lojas";
  const loja = getLojas().find(item => item.id === id);
  return loja ? loja.nome : "Loja não encontrada";
}

function atualizarLancamento(id, callback) {
  const todos = normalizarLancamentos();
  const indice = todos.findIndex(item => item.id === id);

  if (indice === -1) {
    alert("Lançamento não encontrado.");
    return;
  }

  todos[indice] = callback(todos[indice]);
  salvarJSONLocal("lancamentos", todos);
  renderizarLista();
}

function marcarRetirado(id) {
  const confirmar = confirm("Marcar este item como retirado da área de venda?");

  if (!confirmar) return;

  atualizarLancamento(id, item => ({
    ...item,
    status: "retirado",
    retiradoEm: new Date().toLocaleString("pt-BR"),
    retiradoPor: usuario.nome,
    retiradoPorCargo: usuario.cargo
  }));
}

function reativarItem(id) {
  const confirmar = confirm("Reativar este item na lista de ativos?");

  if (!confirmar) return;

  atualizarLancamento(id, item => ({
    ...item,
    status: "ativo",
    retiradoEm: "",
    retiradoPor: "",
    retiradoPorCargo: ""
  }));
}

function notificarGerencia(id) {
  const todos = normalizarLancamentos();
  const item = todos.find(l => l.id === id);

  if (!item) {
    alert("Lançamento não encontrado.");
    return;
  }

  const confirmar = confirm(
    `Criar aviso interno para gerência?\n\nProduto: ${item.nomeProduto}\nLoja: ${item.lojaNome}\nValidade: ${item.validade}`
  );

  if (!confirmar) return;

  criarNotificacaoInterna({
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

  alert("Aviso interno criado para gerente/encarregado/admin.");
}

function apagarLancamento(id) {
  const confirmar = confirm("Deseja apagar este lançamento?");

  if (!confirmar) return;

  let todos = normalizarLancamentos();
  const item = todos.find(l => l.id === id);

  if (!item) return;

  const podeApagar =
    item.usuarioId === usuario.id ||
    ["encarregado", "gerente", "admin"].includes(usuario.cargo);

  if (!podeApagar) {
    alert("Você não tem permissão para apagar este lançamento.");
    return;
  }

  todos = todos.filter(l => l.id !== id);
  salvarJSONLocal("lancamentos", todos);
  renderizarLista();
}

if (filtro) {
  filtro.addEventListener("input", renderizarLista);
}

renderizarLista();
