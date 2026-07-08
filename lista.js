const usuario = protegerPagina();
const lista = document.getElementById("lista");
const filtro = document.getElementById("filtro");

let lancamentosBase = JSON.parse(localStorage.getItem("lancamentos")) || [];

const paginaAtual = window.location.pathname;

if (paginaAtual.includes("lista-geral")) {
  if (!podeVerListaGeral(usuario.cargo)) {
    alert("Você não tem permissão para acessar a lista completa.");
    window.location.href = "index.html";
  }
} else {
  lancamentosBase = lancamentosBase.filter(item => item.usuarioId === usuario.id);
}

function renderizarLista() {
  const termo = (filtro?.value || "").toLowerCase().trim();
  const produtos = JSON.parse(localStorage.getItem("produtos")) || [];

  let lancamentos = lancamentosBase.filter(item => {
    const texto = `
      ${item.nomeProduto}
      ${item.ean}
      ${item.setor}
      ${item.usuarioNome}
    `.toLowerCase();

    return texto.includes(termo);
  });

  if (lancamentos.length === 0) {
    lista.innerHTML = `<div class="card"><p>Nenhum lançamento encontrado.</p></div>`;
    return;
  }

  lancamentos.sort((a, b) => parseDataLocal(a.validade) - parseDataLocal(b.validade));

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  lista.innerHTML = lancamentos.map(item => {
    const validade = parseDataLocal(item.validade);
    const diff = Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));

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
      <article class="card">
        <h3>${esc(item.nomeProduto)}</h3>
        <p><strong>EAN:</strong> ${esc(item.ean)}</p>
        ${marcaFinal ? `<p><strong>Marca:</strong> ${esc(marcaFinal)}</p>` : ""}
        ${fabricanteFinal ? `<p><strong>Fabricante:</strong> ${esc(fabricanteFinal)}</p>` : ""}
        ${saborFinal ? `<p><strong>Sabor/variação:</strong> ${esc(saborFinal)}</p>` : ""}
        <p><strong>Setor:</strong> ${esc(item.setor)}</p>
        <p><strong>Quantidade:</strong> ${esc(item.quantidade)}</p>
        <p><strong>Validade:</strong> ${esc(item.validade)}</p>
        <p><strong>Lançado por:</strong> ${esc(item.usuarioNome)} (${esc(nomeCargo(item.usuarioCargo))})</p>
        <p>${status}</p>
        ${
          (() => {
            const fotoFinal = item.foto || produtoLocalLista?.foto || "";
            return fotoFinal ? `<img class="produto-img" src="${fotoFinal}" alt="${esc(item.nomeProduto)}">` : "";
          })()
        }
        <div class="card-actions">
          <button class="btn-danger" onclick="apagarLancamento('${item.id}')">Apagar lançamento</button>
        </div>
      </article>
    `;
  }).join("");
}

function apagarLancamento(id) {
  const confirmar = confirm("Deseja apagar este lançamento?");

  if (!confirmar) return;

  let todos = JSON.parse(localStorage.getItem("lancamentos")) || [];

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
  localStorage.setItem("lancamentos", JSON.stringify(todos));

  lancamentosBase = todos;

  if (!window.location.pathname.includes("lista-geral")) {
    lancamentosBase = lancamentosBase.filter(item => item.usuarioId === usuario.id);
  }

  renderizarLista();
}

if (filtro) {
  filtro.addEventListener("input", renderizarLista);
}

renderizarLista();
