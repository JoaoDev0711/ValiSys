const usuario = getUsuarioLogado();

const listaLojas = document.getElementById("lista-lojas");
const formLoja = document.getElementById("form-loja");
const formNovaLojaArea = document.getElementById("form-nova-loja-area");
const imagemLojaInput = document.getElementById("imagemLoja");
const previewImagemLoja = document.getElementById("previewImagemLoja");

let imagemLojaBase64 = "";

if (!usuario || !podeCadastrarLoja(usuario.cargo)) {
  formNovaLojaArea.style.display = "none";
}

function usuarioPodeExcluirLoja() {
  return usuario && podeExcluirLoja(usuario.cargo);
}

function usuarioPodeEditarLoja() {
  return usuario && podeCadastrarLoja(usuario.cargo);
}

if (imagemLojaInput) {
  imagemLojaInput.addEventListener("change", async () => {
    const arquivo = imagemLojaInput.files[0];

    if (!arquivo) {
      imagemLojaBase64 = "";
      previewImagemLoja.innerHTML = "";
      return;
    }

    try {
      imagemLojaBase64 = await comprimirImagemLoja(arquivo);

      previewImagemLoja.innerHTML = `
        <div class="loja-preview-box">
          <img src="${imagemLojaBase64}" alt="Prévia da imagem da loja">
          <span>Imagem selecionada</span>
        </div>
      `;
    } catch (erro) {
      alert(erro.message);
      imagemLojaInput.value = "";
      imagemLojaBase64 = "";
      previewImagemLoja.innerHTML = "";
    }
  });
}

async function renderizarLojas() {
  listaLojas.innerHTML = `<div class="card"><p class="muted">Carregando lojas...</p></div>`;

  try {
    const lojas = await valisysDB.listarLojas();

    if (lojas.length === 0) {
      listaLojas.innerHTML = `
        <div class="card">
          <p>Nenhuma loja cadastrada.</p>
          ${usuario?.cargo === "admin" ? `<p class="muted">Use o formulário acima para cadastrar a primeira loja.</p>` : `<p class="muted">Peça para um admin ou gerente cadastrar a loja.</p>`}
        </div>
      `;
      return;
    }

    listaLojas.innerHTML = lojas.map(loja => `
      <article class="card loja-card loja-card-com-logo">
        ${logoLojaHTML(loja, "loja-logo-card")}

        <div class="loja-card-info">
          <h3>${esc(loja.nome)}</h3>
          <p class="muted">Responsável: ${esc(loja.responsavel || "Não informado")}</p>
          <p class="muted">Código interno: ${esc(String(loja.id).slice(0, 8))}</p>
        </div>

        <div class="loja-actions">
          <button type="button" onclick="selecionarLoja('${loja.id}')">Usar esta loja</button>
          ${
            usuarioPodeEditarLoja()
              ? `
                <label class="btn-file">
                  Trocar imagem
                  <input type="file" accept="image/*" onchange="trocarImagemLoja('${loja.id}', this)">
                </label>
              `
              : ""
          }
          ${
            usuarioPodeExcluirLoja()
              ? `<button type="button" class="btn-danger btn-outline" onclick="excluirLoja('${loja.id}')">Remover loja</button>`
              : ""
          }
        </div>
      </article>
    `).join("");
  } catch (erro) {
    console.error(erro);
    listaLojas.innerHTML = `
      <div class="card">
        <p class="danger">Erro ao carregar lojas.</p>
        <p class="muted">${esc(erro.message)}</p>
        <p class="muted">Verifique a conexão e tente novamente.</p>
      </div>
    `;
  }
}

async function selecionarLoja(id) {
  try {
    const lojas = await valisysDB.listarLojas();
    const loja = lojas.find(item => item.id === id);

    if (!loja) {
      alert("Loja não encontrada.");
      return;
    }

    const confirmar = confirm(`Confirmar loja atual?\n\n${loja.nome}`);

    if (!confirmar) return;

    setLojaAtual(loja);

    if (!usuario) {
      window.location.href = "login.html";
      return;
    }

    window.location.href = "dashboard.html";
  } catch (erro) {
    alert("Erro ao selecionar loja: " + erro.message);
  }
}

async function trocarImagemLoja(id, input) {
  const arquivo = input.files && input.files[0];

  if (!arquivo) return;

  try {
    const imagem = await comprimirImagemLoja(arquivo);
    await valisysDB.atualizarImagemLoja(id, imagem);
    alert("Imagem da loja atualizada.");
    await renderizarLojas();
  } catch (erro) {
    alert("Erro ao atualizar imagem: " + erro.message);
  } finally {
    input.value = "";
  }
}

async function excluirLoja(id) {
  if (!usuarioPodeExcluirLoja()) {
    alert("Somente admin pode remover lojas.");
    return;
  }

  const confirmar = confirm("Remover loja da lista?\n\nEla ficará inativa para não quebrar histórico.");

  if (!confirmar) return;

  try {
    await valisysDB.excluirLoja(id);
    alert("Loja removida da lista com sucesso.");
    await renderizarLojas();
  } catch (erro) {
    alert(erro.message);
  }
}

if (formLoja) {
  formLoja.addEventListener("submit", async event => {
    event.preventDefault();

    if (!usuario || !podeCadastrarLoja(usuario.cargo)) {
      alert("Entre como gerente ou admin para cadastrar lojas.");
      return;
    }

    const nome = document.getElementById("nomeLoja").value.trim();
    const responsavel = document.getElementById("responsavelLoja").value.trim();

    if (!nome) {
      alert("Informe o nome da loja.");
      return;
    }

    try {
      await valisysDB.criarLoja({
        nome,
        responsavel,
        imagem: imagemLojaBase64
      });

      formLoja.reset();
      imagemLojaBase64 = "";
      if (previewImagemLoja) previewImagemLoja.innerHTML = "";

      await renderizarLojas();
      alert("Loja salva com sucesso.");
    } catch (erro) {
      alert("Erro ao salvar loja: " + erro.message);
    }
  });
}

renderizarLojas();
