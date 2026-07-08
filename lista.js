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

    // Se o lançamento antigo não tinha loja, vincula na loja atual só para não sumir.
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

  const lojas = getLojas();

  const label = document.createElement("label");
  label.setAttribute("for", "filtro-loja");
  label.innerText = "Filtrar loja";

  const select = document.createElement("select");
  select.id = "filtro-loja";

  select.innerHTML = `
    <option value="todas">Todas as lojas deste aparelho</option>
    ${lojas.map(loja => `
      <option value="${esc(loja.id)}">${esc(loja.nome)}</option>
    `).join("")}
  `;

  // Deixa "todas" por padrão para o lançamento nunca parecer que sumiu.
  // A loja continua salva corretamente no lançamento.
  select.value = "todas";

  card.appendChild(label);
  card.appendChild(select);

  select.addEventListener("change", renderizarLista);
}

function obterLancamentosFiltrados() {
  const termo = (filtro?.value || "").toLowerCase().trim();
  const filtroLoja = document.getElementById("filtro-loja")?.value || "todas";
  const produtos = lerJSONLocal("produtos", []);
  let lancamentos = normalizarLancamentos();

  if (!ehListaGeral) {
    // Meus lançamentos: tenta pelo id e também pelo nome/cargo para evitar sumir após relogar.
    lancamentos = lancamentos.filter(item =>
      item.usuarioId === usuario.id ||
      (
        String(item.usuarioNome || "").toLowerCase() === String(usuario.nome || "").toLowerCase() &&
        item.usuarioCargo === usuario.cargo
      )
    );
  }

  if (filtroLoja !== "todas") {
    lancamentos = lancamentos.filter(item => item.lojaId === filtroLoja);
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
    const todos = normalizarLancamentos();
    lista.innerHTML = `
      <div class="card">
        <p><strong>Nenhum lançamento encontrado com este filtro.</strong></p>
        <p class="muted">Total salvo neste aparelho: ${todos.length}</p>
        <p class="muted">Troque o filtro para "Todas as lojas deste aparelho" ou confira se você está logado com o mesmo nome/cargo usado no lançamento.</p>
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
      <p class="muted">Os lançamentos aparecem com a loja salva no momento do cadastro.</p>
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

      let status = "";

      if (diff < 0) {
        status = `<span class="badge danger">Vencido há ${Math.abs(diff)} dia(s)</span>`;
      } else if (diff === 0) {
        status = `<span class="badge danger">Vence hoje</span>`;
      } else if (diff <= 7) {
        status = `<span class="badge warning">Vence em ${diff} dia(s)</span>`;
      } else {
        status = `<span class="badge success">Vence em ${diff} dia(s)</span>`;
      }

      return `
        <article class="card lancamento-card">
          <div class="lancamento-topo">
            <div>
              <h3>${esc(item.nomeProduto)}</h3>
              <p class="muted">${esc(item.lojaNome || "Loja não informada")}</p>
            </div>
            ${status}
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
          </div>

          <div class="card-actions">
            <button class="btn-danger" onclick="apagarLancamento('${item.id}')">Apagar lançamento</button>
          </div>
        </article>
      `;
    }).join("")}
  `;
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
