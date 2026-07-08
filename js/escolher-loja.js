const usuario = protegerPagina();

const listaLojas = document.getElementById("lista-lojas");
const formLoja = document.getElementById("form-loja");
const formNovaLojaArea = document.getElementById("form-nova-loja-area");

if (!podeCadastrarLoja(usuario.cargo)) {
  formNovaLojaArea.style.display = "none";
}

function renderizarLojas() {
  const lojas = getLojas();

  if (lojas.length === 0) {
    listaLojas.innerHTML = `<div class="card"><p>Nenhuma loja cadastrada.</p></div>`;
    return;
  }

  listaLojas.innerHTML = lojas.map(loja => `
    <article class="card loja-card">
      <div>
        <h3>${esc(loja.nome)}</h3>
        <p class="muted">Responsável: ${esc(loja.responsavel || "Não informado")}</p>
        <p class="muted">Criada em: ${esc(loja.criadaEm || "Não informado")}</p>
      </div>

      <div class="loja-actions">
        <button onclick="selecionarLoja('${loja.id}')">Usar esta loja</button>
        ${
          podeExcluirLoja(usuario.cargo)
            ? `<button class="btn-danger btn-outline" onclick="excluirLoja('${loja.id}')">Excluir loja</button>`
            : ""
        }
      </div>
    </article>
  `).join("");
}

function selecionarLoja(id) {
  const lojas = getLojas();
  const loja = lojas.find(item => item.id === id);

  if (!loja) {
    alert("Loja não encontrada.");
    return;
  }

  const confirmar = confirm(`Confirmar loja atual?\n\n${loja.nome}\n\nTodos os próximos lançamentos serão vinculados a ela.`);

  if (!confirmar) return;

  setLojaAtual(loja);
  window.location.href = "dashboard.html";
}

function excluirLoja(id) {
  if (!podeExcluirLoja(usuario.cargo)) {
    alert("Somente admin pode excluir lojas.");
    return;
  }

  const lojas = getLojas();
  const loja = lojas.find(item => item.id === id);

  if (!loja) {
    alert("Loja não encontrada.");
    return;
  }

  const confirmar = confirm(`Excluir loja?\n\n${loja.nome}\n\nA loja só será excluída se não tiver lançamentos vinculados.`);

  if (!confirmar) return;

  const resultado = excluirLojaPorId(id);
  alert(resultado.mensagem);
  renderizarLojas();
}

if (formLoja) {
  formLoja.addEventListener("submit", event => {
    event.preventDefault();

    const nome = document.getElementById("nomeLoja").value.trim();
    const responsavel = document.getElementById("responsavelLoja").value.trim();

    if (!nome) {
      alert("Informe o nome da loja.");
      return;
    }

    const lojas = getLojas();

    const novaLoja = {
      id: gerarIdLocal("loja"),
      nome,
      responsavel,
      criadaEm: new Date().toLocaleString("pt-BR")
    };

    lojas.push(novaLoja);
    salvarLojas(lojas);

    formLoja.reset();
    renderizarLojas();
  });
}

renderizarLojas();
