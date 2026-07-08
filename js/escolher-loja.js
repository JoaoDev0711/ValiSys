const usuario = protegerPagina();

const listaLojas = document.getElementById("lista-lojas");
const formLoja = document.getElementById("form-loja");
const formNovaLojaArea = document.getElementById("form-nova-loja-area");

if (!podeCadastrarLoja(usuario.cargo)) {
  formNovaLojaArea.style.display = "none";
}

async function renderizarLojas() {
  listaLojas.innerHTML = `<div class="card"><p class="muted">Carregando lojas do Supabase...</p></div>`;

  try {
    const lojas = await valisysDB.listarLojas();

    if (lojas.length === 0) {
      listaLojas.innerHTML = `<div class="card"><p>Nenhuma loja cadastrada no Supabase.</p></div>`;
      return;
    }

    listaLojas.innerHTML = lojas.map(loja => `
      <article class="card loja-card">
        <div>
          <h3>${esc(loja.nome)}</h3>
          <p class="muted">Responsável: ${esc(loja.responsavel || "Não informado")}</p>
          <p class="muted">ID Supabase: ${esc(loja.id)}</p>
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
  } catch (erro) {
    console.error(erro);
    listaLojas.innerHTML = `
      <div class="card">
        <p class="danger">Erro ao carregar lojas do Supabase.</p>
        <p class="muted">${esc(erro.message)}</p>
        <p class="muted">Confira a URL/chave em js/supabase-config.js e se as tabelas foram criadas.</p>
      </div>
    `;
  }
}

async function selecionarLoja(id) {
  try {
    const lojas = await valisysDB.listarLojas();
    const loja = lojas.find(item => item.id === id);

    if (!loja) {
      alert("Loja não encontrada no Supabase.");
      return;
    }

    const confirmar = confirm(`Confirmar loja atual?\n\n${loja.nome}\n\nTodos os próximos lançamentos serão vinculados a ela.`);

    if (!confirmar) return;

    setLojaAtual(loja);
    window.location.href = "dashboard.html";
  } catch (erro) {
    alert("Erro ao selecionar loja: " + erro.message);
  }
}

async function excluirLoja(id) {
  if (!podeExcluirLoja(usuario.cargo)) {
    alert("Somente admin pode excluir lojas.");
    return;
  }

  const confirmar = confirm("Excluir loja do Supabase?\n\nA loja só será excluída se não tiver lançamentos vinculados.");

  if (!confirmar) return;

  try {
    await valisysDB.excluirLoja(id);
    alert("Loja excluída com sucesso.");
    await renderizarLojas();
  } catch (erro) {
    alert(erro.message);
  }
}

if (formLoja) {
  formLoja.addEventListener("submit", async event => {
    event.preventDefault();

    const nome = document.getElementById("nomeLoja").value.trim();
    const responsavel = document.getElementById("responsavelLoja").value.trim();

    if (!nome) {
      alert("Informe o nome da loja.");
      return;
    }

    try {
      await valisysDB.criarLoja({ nome, responsavel });
      formLoja.reset();
      await renderizarLojas();
      alert("Loja salva no Supabase.");
    } catch (erro) {
      alert("Erro ao salvar loja no Supabase: " + erro.message);
    }
  });
}

renderizarLojas();
