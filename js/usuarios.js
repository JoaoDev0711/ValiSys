const usuario = protegerPagina();
if (bloquearAdminEmAreaLoja()) throw new Error('Admin bloqueado na área da loja.');
const lojaAtual = protegerLojaSelecionada();

if (!podeGerenciarFuncionarios(usuario.cargo)) {
  alert("Somente gerente e admin podem cadastrar funcionários.");
  window.location.href = "dashboard.html";
}

const lojaEl = document.getElementById("loja-usuarios-atual");
if (lojaEl && lojaAtual) lojaEl.innerHTML = lojaInlineHTML(lojaAtual);

const formFuncionario = document.getElementById("form-funcionario");
const listaFuncionarios = document.getElementById("lista-funcionarios");
const areaUsuariosSistema = document.getElementById("area-usuarios-sistema");

if (areaUsuariosSistema) {
  areaUsuariosSistema.style.display = "none";
}

const cargoFuncionarioSelect = document.getElementById("cargoFuncionario");
const setorFuncionarioSelect = document.getElementById("setorFuncionario");
const codigoFuncionarioArea = document.getElementById("codigoFuncionarioArea");
const codigoFuncionarioInput = document.getElementById("codigoFuncionario");
const marcaFuncionarioArea = document.getElementById("marcaFuncionarioArea");
const marcaFuncionarioSelect = document.getElementById("marcaFuncionario");
const novaMarcaFuncionarioInput = document.getElementById("novaMarcaFuncionario");


async function carregarMarcasFuncionario() {
  if (!marcaFuncionarioSelect || !lojaAtual) return;

  marcaFuncionarioSelect.innerHTML = `<option value="">Carregando marcas...</option>`;

  try {
    const marcas = await valisysDB.listarMarcasPromotoria(lojaAtual.id);

    marcaFuncionarioSelect.innerHTML = `
      <option value="">Selecione a marca</option>
      ${marcas.map(marca => `<option value="${esc(marca.nome)}">${esc(marca.nome)}</option>`).join("")}
    `;

    if (marcas.length === 0) {
      marcaFuncionarioSelect.innerHTML = `<option value="">Nenhuma marca cadastrada</option>`;
    }
  } catch (erro) {
    console.warn("Não foi possível carregar marcas.", erro);
    marcaFuncionarioSelect.innerHTML = `<option value="">Digite a nova marca abaixo</option>`;
  }
}

function marcaFuncionarioEscolhida() {
  const nova = novaMarcaFuncionarioInput?.value.trim() || "";
  const selecionada = marcaFuncionarioSelect?.value.trim() || "";

  return nova || selecionada;
}

function atualizarCamposFuncionario() {
  const cargo = cargoFuncionarioSelect?.value || "";

  if (codigoFuncionarioArea) {
    codigoFuncionarioArea.style.display = cargo === "encarregado" ? "block" : "none";
  }

  if (codigoFuncionarioInput) {
    codigoFuncionarioInput.required = false;

    if (cargo !== "encarregado") {
      codigoFuncionarioInput.value = "";
    }
  }

  if (setorFuncionarioSelect) {
    if (cargo === "gerente") {
      setorFuncionarioSelect.value = "Geral";
    }

    if (cargo === "promotor") {
      setorFuncionarioSelect.value = "Promotoria";
    }

    setorFuncionarioSelect.required = cargo === "encarregado";
  }

  if (marcaFuncionarioArea) {
    marcaFuncionarioArea.style.display = cargo === "promotor" ? "block" : "none";
  }

  if (cargo === "promotor") {
    carregarMarcasFuncionario();
  } else {
    if (marcaFuncionarioSelect) marcaFuncionarioSelect.value = "";
    if (novaMarcaFuncionarioInput) novaMarcaFuncionarioInput.value = "";
  }
}

if (cargoFuncionarioSelect) {
  cargoFuncionarioSelect.addEventListener("change", atualizarCamposFuncionario);
  atualizarCamposFuncionario();
}


function gerarCodigoAcesso() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

async function renderizarFuncionarios() {
  listaFuncionarios.innerHTML = `<div class="card"><p class="muted">Carregando funcionários...</p></div>`;

  try {
    const funcionarios = await valisysDB.listarFuncionarios(lojaAtual.id);

    if (funcionarios.length === 0) {
      listaFuncionarios.innerHTML = `
        <div class="card">
          <p>Nenhum funcionário cadastrado para esta loja.</p>
        </div>
      `;
      return;
    }

    listaFuncionarios.innerHTML = funcionarios.map(func => `
      <article class="card funcionario-card">
        <div>
          <h3>${esc(func.nome)}</h3>
          <p><strong>Cargo:</strong> ${esc(nomeCargo(func.cargo))}</p>
          <p><strong>Setor:</strong> ${esc(func.setor || "Geral")}</p>
          ${func.cargo === "promotor" ? `<p><strong>Marca da promotoria:</strong> ${esc(func.marcaPromotoria || "Será escolhida no primeiro login")}</p>` : ""}
          <p><strong>Loja:</strong> ${lojaInlineHTML({ ...lojaAtual, nome: func.lojaNome || lojaAtual.nome }, "loja-inline-small")}</p>
          ${func.cargo === "encarregado" ? `<p><strong>Código de acesso:</strong> ${esc(func.codigoAcesso || "Não informado")}</p>` : `<p><strong>Código de acesso:</strong> Não usa</p>`}
          <p class="muted">Código interno: ${esc(String(func.id).slice(0, 8))}</p>
        </div>

        <div class="card-actions stack-actions">
          <button type="button" class="btn-danger" onclick="removerFuncionario('${func.id}')">Remover funcionário</button>
        </div>
      </article>
    `).join("");
  } catch (erro) {
    console.error(erro);
    listaFuncionarios.innerHTML = `
      <div class="card">
        <p class="danger">Erro ao carregar funcionários.</p>
        <p class="muted">${esc(erro.message)}</p>
      </div>
    `;
  }
}

async function removerFuncionario(id) {
  const confirmar = await confirmarAcao("Remover funcionário desta loja?", "Remover funcionário?", "perigo");

  if (!confirmar) return;

  try {
    await valisysDB.removerFuncionario(id);
    await renderizarFuncionarios();
  } catch (erro) {
    alert("Erro ao remover funcionário: " + erro.message);
  }
}

formFuncionario.addEventListener("submit", async event => {
  event.preventDefault();

  const nome = document.getElementById("nomeFuncionario").value.trim();
  const cargo = document.getElementById("cargoFuncionario").value;
  const setor = document.getElementById("setorFuncionario")?.value || "";
  const codigoInformado = document.getElementById("codigoFuncionario")?.value.trim() || "";
  const codigoFinal = cargo === "encarregado" ? (codigoInformado || gerarCodigoAcesso()) : "";
  const marcaPromotoria = cargo === "promotor" ? marcaFuncionarioEscolhida() : "";

  if (!nome || !cargo) {
    alert("Informe nome e cargo do funcionário.");
    return;
  }

  if (cargo === "encarregado" && !setor) {
    alert("Selecione o setor do encarregado.");
    return;
  }

  if (cargo === "promotor" && !marcaPromotoria) {
    alert("Selecione ou cadastre a marca da promotoria.");
    novaMarcaFuncionarioInput?.focus();
    return;
  }

  try {
    if (cargo === "promotor") {
      await valisysDB.criarMarcaPromotoria(lojaAtual.id, marcaPromotoria);
    }

    const novo = await valisysDB.criarFuncionario({
      lojaId: lojaAtual.id,
      nome,
      cargo,
      setor: cargo === "promotor" ? "Promotoria" : (setor || "Geral"),
      codigoAcesso: codigoFinal,
      marcaPromotoria
    });

    formFuncionario.reset();
    atualizarCamposFuncionario();
    await renderizarFuncionarios();

    alert(`Funcionário salvo.\n\nNome: ${novo.nome}\nCargo: ${nomeCargo(novo.cargo)}\nSetor: ${novo.setor || "Geral"}${novo.cargo === "promotor" ? "\nMarca: " + (novo.marcaPromotoria || marcaPromotoria) : ""}\nCódigo: ${novo.cargo === "encarregado" ? (novo.codigoAcesso || "Não informado") : "Não usa"}`);
  } catch (erro) {
    alert("Erro ao salvar funcionário: " + erro.message);
  }
});

renderizarFuncionarios();
