const usuario = protegerPagina();
if (bloquearAdminEmAreaLoja()) throw new Error("Admin bloqueado na área da loja.");
const lojaAtual = protegerLojaSelecionada();

if (!podeGerenciarFuncionarios(usuario.cargo)) {
  alert("Somente gerente e admin podem gerenciar funcionários.");
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

let funcionariosCache = [];
let setoresCache = [];
let marcasCache = [];

async function carregarSetoresFuncionario() {
  if (!setorFuncionarioSelect || !lojaAtual) return;

  const valorAtual = setorFuncionarioSelect.value;

  try {
    setoresCache = await valisysDB.listarSetoresLoja(lojaAtual.id);

    setorFuncionarioSelect.innerHTML = `
      <option value="">Selecione o setor</option>
      ${setoresCache.map(setor => `<option value="${esc(setor.nome)}">${esc(setor.nome)}</option>`).join("")}
      <option value="Promotoria">Promotoria</option>
    `;

    if ([...setorFuncionarioSelect.options].some(op => op.value === valorAtual)) {
      setorFuncionarioSelect.value = valorAtual;
    }
  } catch (erro) {
    console.warn("Não foi possível carregar setores da loja.", erro);
  }
}

async function carregarMarcasFuncionario() {
  if (!marcaFuncionarioSelect || !lojaAtual) return;

  marcaFuncionarioSelect.innerHTML = `<option value="">Carregando marcas...</option>`;

  try {
    marcasCache = await valisysDB.listarMarcasPromotoria(lojaAtual.id);

    marcaFuncionarioSelect.innerHTML = `
      <option value="">Selecione a marca</option>
      ${marcasCache.map(marca => `<option value="${esc(marca.nome)}">${esc(marca.nome)}</option>`).join("")}
    `;

    if (marcasCache.length === 0) {
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

function opcoesSetores(valorAtual = "") {
  const base = setoresCache.length > 0
    ? setoresCache.map(setor => setor.nome)
    : ["Geral", "Mercearia", "Bebidas", "Frios e Laticínios", "Açougue", "Hortifruti", "Padaria", "Congelados", "Limpeza", "Higiene e Perfumaria", "Pet", "Outros"];

  const lista = [...new Set([...base, "Promotoria", valorAtual].filter(Boolean))];

  return lista.map(nome => `<option value="${esc(nome)}" ${nome === valorAtual ? "selected" : ""}>${esc(nome)}</option>`).join("");
}

function opcoesMarcas(valorAtual = "") {
  const nomes = marcasCache.map(marca => marca.nome);
  const lista = [...new Set([valorAtual, ...nomes].filter(Boolean))];

  if (lista.length === 0) {
    return `<option value="">Nenhuma marca cadastrada</option>`;
  }

  return `
    <option value="">Selecione a marca</option>
    ${lista.map(nome => `<option value="${esc(nome)}" ${nome === valorAtual ? "selected" : ""}>${esc(nome)}</option>`).join("")}
  `;
}

function atualizarUsuarioLogadoSeForEditado(funcionario) {
  const atual = getUsuarioLogado();

  if (!atual) return;

  const mesmoFuncionario = String(atual.funcionarioId || atual.id || "") === String(funcionario.id || "");

  if (!mesmoFuncionario) return;

  const atualizado = {
    ...atual,
    id: funcionario.id,
    funcionarioId: funcionario.id,
    nome: funcionario.nome,
    cargo: funcionario.cargo,
    setor: funcionario.setor || "",
    marcaPromotoria: funcionario.marcaPromotoria || "",
    lojaIdPadrao: funcionario.lojaId || atual.lojaIdPadrao,
    lojaNomePadrao: funcionario.lojaNome || atual.lojaNomePadrao
  };

  salvarJSONLocal("usuarioLogado", atualizado);
}

async function renderizarFuncionarios() {
  listaFuncionarios.innerHTML = `<div class="card"><p class="muted">Carregando funcionários...</p></div>`;

  try {
    await carregarSetoresFuncionario();
    await carregarMarcasFuncionario();

    funcionariosCache = await valisysDB.listarFuncionarios(lojaAtual.id);

    if (funcionariosCache.length === 0) {
      listaFuncionarios.innerHTML = `
        <div class="card">
          <p>Nenhum funcionário cadastrado para esta loja.</p>
        </div>
      `;
      return;
    }

    listaFuncionarios.innerHTML = funcionariosCache.map(func => `
      <article class="card funcionario-card" id="funcionario-card-${esc(func.id)}">
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
          <button type="button" onclick="abrirEditorFuncionario('${func.id}')">Gerenciar usuário</button>
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

function abrirEditorFuncionario(id) {
  const func = funcionariosCache.find(item => String(item.id) === String(id));

  if (!func) {
    alert("Funcionário não encontrado na lista.");
    return;
  }

  const antigo = document.getElementById("editor-funcionario-overlay");
  if (antigo) antigo.remove();

  const overlay = document.createElement("div");
  overlay.id = "editor-funcionario-overlay";
  overlay.className = "editor-funcionario-overlay";

  overlay.innerHTML = `
    <section class="editor-funcionario-modal">
      <div class="editor-funcionario-topo">
        <div>
          <span class="hero-pill">Gerenciar usuário</span>
          <h2>Editar ${esc(func.nome)}</h2>
          <p class="muted">Essa alteração atualiza o cadastro e também os lançamentos já feitos por esse usuário.</p>
        </div>
        <button type="button" class="icon-btn" onclick="fecharEditorFuncionario()">×</button>
      </div>

      <form id="form-editar-funcionario" class="form-editar-funcionario">
        <input type="hidden" id="editFuncionarioId" value="${esc(func.id)}">

        <label for="editNomeFuncionario">Nome</label>
        <input type="text" id="editNomeFuncionario" value="${esc(func.nome)}" required>

        <label for="editCargoFuncionario">Cargo</label>
        <select id="editCargoFuncionario" required>
          <option value="promotor" ${func.cargo === "promotor" ? "selected" : ""}>Promotor</option>
          <option value="encarregado" ${func.cargo === "encarregado" ? "selected" : ""}>Encarregado</option>
          <option value="gerente" ${func.cargo === "gerente" ? "selected" : ""}>Gerente</option>
        </select>

        <label for="editSetorFuncionario">Setor</label>
        <select id="editSetorFuncionario">
          ${opcoesSetores(func.setor || "Geral")}
        </select>

        <div id="editCodigoArea">
          <label for="editCodigoFuncionario">Código de acesso</label>
          <input type="text" id="editCodigoFuncionario" value="${esc(func.codigoAcesso || "")}" placeholder="Usado por encarregado">
        </div>

        <div id="editMarcaArea">
          <label for="editMarcaFuncionario">Marca da promotoria</label>
          <select id="editMarcaFuncionario">
            ${opcoesMarcas(func.marcaPromotoria || "")}
          </select>

          <label for="editNovaMarcaFuncionario">Nova marca</label>
          <input type="text" id="editNovaMarcaFuncionario" placeholder="Digite aqui caso queira cadastrar outra marca">
        </div>

        <label for="editStatusFuncionario">Status</label>
        <select id="editStatusFuncionario">
          <option value="ativo" selected>Ativo</option>
          <option value="inativo">Inativo</option>
        </select>

        <div class="editor-alerta">
          <strong>Atenção:</strong>
          ao salvar, o nome/cargo também muda nos produtos já lançados por esse funcionário nesta loja.
        </div>

        <div class="editor-funcionario-actions">
          <button type="button" onclick="fecharEditorFuncionario()">Cancelar</button>
          <button type="submit">Salvar alterações</button>
        </div>
      </form>
    </section>
  `;

  document.body.appendChild(overlay);

  const cargo = document.getElementById("editCargoFuncionario");
  cargo.addEventListener("change", atualizarCamposEditorFuncionario);
  atualizarCamposEditorFuncionario();

  document.getElementById("form-editar-funcionario").addEventListener("submit", salvarEdicaoFuncionario);
}

function atualizarCamposEditorFuncionario() {
  const cargo = document.getElementById("editCargoFuncionario")?.value || "";
  const setor = document.getElementById("editSetorFuncionario");
  const codigoArea = document.getElementById("editCodigoArea");
  const codigoInput = document.getElementById("editCodigoFuncionario");
  const marcaArea = document.getElementById("editMarcaArea");

  if (codigoArea) codigoArea.style.display = cargo === "encarregado" ? "block" : "none";

  if (cargo !== "encarregado" && codigoInput) {
    codigoInput.value = "";
  }

  if (setor) {
    if (cargo === "gerente") setor.value = "Geral";
    if (cargo === "promotor") setor.value = "Promotoria";
    setor.required = cargo === "encarregado";
  }

  if (marcaArea) {
    marcaArea.style.display = cargo === "promotor" ? "block" : "none";
  }
}

function fecharEditorFuncionario() {
  document.getElementById("editor-funcionario-overlay")?.remove();
}

async function salvarEdicaoFuncionario(event) {
  event.preventDefault();

  const id = document.getElementById("editFuncionarioId").value;
  const nome = document.getElementById("editNomeFuncionario").value.trim();
  const cargo = document.getElementById("editCargoFuncionario").value;
  const setor = document.getElementById("editSetorFuncionario").value;
  const codigo = document.getElementById("editCodigoFuncionario").value.trim();
  const marcaSelect = document.getElementById("editMarcaFuncionario")?.value.trim() || "";
  const marcaNova = document.getElementById("editNovaMarcaFuncionario")?.value.trim() || "";
  const marcaPromotoria = cargo === "promotor" ? (marcaNova || marcaSelect) : "";
  const ativo = document.getElementById("editStatusFuncionario").value === "ativo";

  if (!nome || !cargo) {
    alert("Informe nome e cargo.");
    return;
  }

  if (cargo === "encarregado" && !setor) {
    alert("Selecione o setor do encarregado.");
    return;
  }

  if (cargo === "promotor" && !marcaPromotoria) {
    alert("Selecione ou cadastre a marca da promotoria.");
    return;
  }

  const confirmar = await confirmarAcao(
    "Salvar alterações deste usuário e atualizar também os lançamentos já feitos por ele?",
    "Atualizar usuário globalmente?"
  );

  if (!confirmar) return;

  try {
    if (cargo === "promotor" && marcaPromotoria) {
      await valisysDB.criarMarcaPromotoria(lojaAtual.id, marcaPromotoria);
    }

    const resultado = await valisysDB.atualizarFuncionarioGlobal(id, {
      lojaId: lojaAtual.id,
      nome,
      cargo,
      setor: cargo === "promotor" ? "Promotoria" : (setor || "Geral"),
      codigoAcesso: cargo === "encarregado" ? codigo : "",
      marcaPromotoria,
      ativo
    });

    atualizarUsuarioLogadoSeForEditado(resultado.funcionario);

    fecharEditorFuncionario();
    await renderizarFuncionarios();

    alert("Usuário atualizado. Os lançamentos já feitos por ele também foram atualizados no sistema.");
  } catch (erro) {
    console.error(erro);
    alert("Erro ao atualizar usuário: " + erro.message);
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

window.abrirEditorFuncionario = abrirEditorFuncionario;
window.fecharEditorFuncionario = fecharEditorFuncionario;
window.salvarEdicaoFuncionario = salvarEdicaoFuncionario;
window.removerFuncionario = removerFuncionario;

carregarSetoresFuncionario();
renderizarFuncionarios();
