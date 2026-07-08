const usuario = protegerPagina();
const lojaAtual = protegerLojaSelecionada();

if (!podeGerenciarFuncionarios(usuario.cargo)) {
  alert("Somente gerente e admin podem acessar esta área.");
  window.location.href = "dashboard.html";
}

const lojaEl = document.getElementById("loja-usuarios-atual");
if (lojaEl && lojaAtual) lojaEl.innerText = lojaAtual.nome;

const formFuncionario = document.getElementById("form-funcionario");
const listaFuncionarios = document.getElementById("lista-funcionarios");
const listaUsuarios = document.getElementById("lista-usuarios");
const areaUsuariosSistema = document.getElementById("area-usuarios-sistema");

if (!podeGerenciarUsuarios(usuario.cargo) && areaUsuariosSistema) {
  areaUsuariosSistema.style.display = "none";
}

function getFuncionarios() {
  return lerJSONLocal("funcionarios", []);
}

function salvarFuncionarios(funcionarios) {
  salvarJSONLocal("funcionarios", funcionarios);
}

function gerarCodigoAcesso() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function renderizarFuncionarios() {
  const funcionarios = getFuncionarios()
    .filter(func => func.lojaId === lojaAtual.id)
    .sort((a, b) => a.nome.localeCompare(b.nome));

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
        <p><strong>Loja:</strong> ${esc(func.lojaNome)}</p>
        <p><strong>Código de acesso:</strong> ${esc(func.codigoAcesso)}</p>
        <p class="muted">Criado em: ${esc(func.criadoEm || "Não informado")}</p>
      </div>

      <div class="card-actions stack-actions">
        <button onclick="preencherLogin('${func.id}')">Separar para login</button>
        <button class="btn-danger" onclick="removerFuncionario('${func.id}')">Remover funcionário</button>
      </div>
    </article>
  `).join("");
}

function renderizarUsuariosSistema() {
  if (!podeGerenciarUsuarios(usuario.cargo)) {
    return;
  }

  const usuarios = lerJSONLocal("usuarios", []);

  if (usuarios.length === 0) {
    listaUsuarios.innerHTML = `<div class="card"><p>Nenhum usuário entrou no sistema ainda.</p></div>`;
    return;
  }

  listaUsuarios.innerHTML = usuarios.map(user => `
    <article class="card">
      <h3>${esc(user.nome)}</h3>
      <p><strong>Cargo:</strong> ${esc(nomeCargo(user.cargo))}</p>
      ${user.lojaNomePadrao ? `<p><strong>Loja padrão:</strong> ${esc(user.lojaNomePadrao)}</p>` : ""}
      ${user.funcionarioId ? `<p><strong>Origem:</strong> Funcionário cadastrado</p>` : ""}
      <p><strong>Criado em:</strong> ${esc(user.criadoEm || "Não informado")}</p>
    </article>
  `).join("");
}

function preencherLogin(id) {
  const funcionarios = getFuncionarios();
  const funcionario = funcionarios.find(func => func.id === id);

  if (!funcionario) {
    alert("Funcionário não encontrado.");
    return;
  }

  salvarJSONLocal("funcionarioLoginRapido", {
    nome: funcionario.nome,
    cargo: funcionario.cargo,
    codigoAcesso: funcionario.codigoAcesso,
    lojaId: funcionario.lojaId,
    lojaNome: funcionario.lojaNome
  });

  alert("Funcionário separado para login. Vá na tela de login e clique em preencher funcionário cadastrado.");
}

function removerFuncionario(id) {
  const confirmar = confirm("Remover funcionário desta loja?");

  if (!confirmar) return;

  const funcionarios = getFuncionarios().filter(func => func.id !== id);
  salvarFuncionarios(funcionarios);
  renderizarFuncionarios();
}

formFuncionario.addEventListener("submit", event => {
  event.preventDefault();

  const nome = document.getElementById("nomeFuncionario").value.trim();
  const cargo = document.getElementById("cargoFuncionario").value;
  const codigoInformado = document.getElementById("codigoFuncionario").value.trim();

  if (!nome || !cargo) {
    alert("Informe nome e cargo do funcionário.");
    return;
  }

  const funcionarios = getFuncionarios();
  const existe = funcionarios.some(func =>
    func.lojaId === lojaAtual.id &&
    func.nome.toLowerCase() === nome.toLowerCase() &&
    func.cargo === cargo
  );

  if (existe) {
    alert("Esse funcionário já está cadastrado nesta loja com este cargo.");
    return;
  }

  const novo = {
    id: gerarIdLocal("funcionario"),
    nome,
    cargo,
    codigoAcesso: codigoInformado || gerarCodigoAcesso(),
    lojaId: lojaAtual.id,
    lojaNome: lojaAtual.nome,
    criadoPor: usuario.nome,
    criadoEm: new Date().toLocaleString("pt-BR")
  };

  funcionarios.push(novo);
  salvarFuncionarios(funcionarios);

  formFuncionario.reset();
  renderizarFuncionarios();

  alert(`Funcionário cadastrado.\n\nNome: ${novo.nome}\nCargo: ${nomeCargo(novo.cargo)}\nCódigo: ${novo.codigoAcesso}`);
});

renderizarFuncionarios();
renderizarUsuariosSistema();
