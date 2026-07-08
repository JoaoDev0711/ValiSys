const usuario = protegerPagina();
if (bloquearAdminEmAreaLoja()) throw new Error('Admin bloqueado na área da loja.');
const lojaAtual = protegerLojaSelecionada();

if (!podeGerenciarFuncionarios(usuario.cargo)) {
  alert("Somente gerente e admin podem acessar esta área.");
  window.location.href = "dashboard.html";
}

const lojaEl = document.getElementById("loja-usuarios-atual");
if (lojaEl && lojaAtual) lojaEl.innerText = lojaAtual.nome;

const formFuncionario = document.getElementById("form-funcionario");
const listaFuncionarios = document.getElementById("lista-funcionarios");
const areaUsuariosSistema = document.getElementById("area-usuarios-sistema");

if (areaUsuariosSistema) {
  areaUsuariosSistema.style.display = "none";
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
          <p><strong>Loja:</strong> ${esc(func.lojaNome || lojaAtual.nome)}</p>
          <p><strong>Código de acesso:</strong> ${esc(func.codigoAcesso || "Não informado")}</p>
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
  const confirmar = confirm("Remover funcionário desta loja?");

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
  const setor = document.getElementById("setorFuncionario")?.value.trim() || "";
  const codigoInformado = document.getElementById("codigoFuncionario").value.trim();

  if (!nome || !cargo) {
    alert("Informe nome e cargo do funcionário.");
    return;
  }

  try {
    const novo = await valisysDB.criarFuncionario({
      lojaId: lojaAtual.id,
      nome,
      cargo,
      setor,
      codigoAcesso: codigoInformado || gerarCodigoAcesso()
    });

    formFuncionario.reset();
    await renderizarFuncionarios();

    alert(`Funcionário salvo.\n\nNome: ${novo.nome}\nCargo: ${nomeCargo(novo.cargo)}\nSetor: ${novo.setor || "Geral"}\nCódigo: ${novo.codigoAcesso || "Não informado"}`);
  } catch (erro) {
    alert("Erro ao salvar funcionário: " + erro.message);
  }
});

renderizarFuncionarios();
