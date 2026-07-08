const form = document.getElementById("login-form");
const cargoSelect = document.getElementById("cargo");
const senhaArea = document.getElementById("senha-area");
const senhaInput = document.getElementById("senha");
const btnLoginFuncionario = document.getElementById("btn-login-funcionario");

// Senhas do MVP localStorage.
// Depois, em banco real, isso NÃO deve ficar no front-end.
const senhasPorCargo = {
  encarregado: "enc123",
  gerente: "ger123",
  admin: "admin123"
};

function atualizarSenhaCargo() {
  const cargo = cargoSelect.value;

  if (senhasPorCargo[cargo]) {
    senhaArea.style.display = "block";
    senhaInput.required = true;
  } else {
    senhaArea.style.display = "none";
    senhaInput.required = false;
    senhaInput.value = "";
  }
}

cargoSelect.addEventListener("change", atualizarSenhaCargo);

if (btnLoginFuncionario) {
  btnLoginFuncionario.addEventListener("click", () => {
    const funcionario = lerJSONLocal("funcionarioLoginRapido", null);

    if (!funcionario) {
      alert("Nenhum funcionário separado para login rápido. Cadastre/selecione um funcionário na tela Usuários.");
      return;
    }

    document.getElementById("nome").value = funcionario.nome;
    cargoSelect.value = funcionario.cargo;
    atualizarSenhaCargo();

    if (senhasPorCargo[funcionario.cargo]) {
      alert(`Funcionário preenchido.\n\nCargo com senha geral do protótipo.\nCódigo do funcionário: ${funcionario.codigoAcesso}`);
    } else {
      alert(`Funcionário preenchido.\n\nCódigo do funcionário: ${funcionario.codigoAcesso}`);
    }
  });
}

function buscarFuncionarioLocal(nome, cargo) {
  const funcionarios = lerJSONLocal("funcionarios", []);

  return funcionarios.find(func =>
    func.nome.toLowerCase() === nome.toLowerCase() &&
    func.cargo === cargo
  ) || null;
}

form.addEventListener("submit", function(event) {
  event.preventDefault();

  const nome = document.getElementById("nome").value.trim();
  const cargo = cargoSelect.value;
  const senha = senhaInput.value;

  if (!nome || !cargo) {
    alert("Preencha nome e cargo.");
    return;
  }

  if (senhasPorCargo[cargo] && senha !== senhasPorCargo[cargo]) {
    alert("Senha incorreta para este cargo.");
    senhaInput.focus();
    return;
  }

  const funcionario = buscarFuncionarioLocal(nome, cargo);
  const usuarios = lerJSONLocal("usuarios", []);

  let usuario = usuarios.find(u =>
    u.nome.toLowerCase() === nome.toLowerCase() && u.cargo === cargo
  );

  if (!usuario) {
    usuario = {
      id: gerarIdLocal("usuario"),
      nome,
      cargo,
      criadoEm: new Date().toLocaleString("pt-BR")
    };

    usuarios.push(usuario);
  }

  if (funcionario) {
    usuario.funcionarioId = funcionario.id;
    usuario.lojaIdPadrao = funcionario.lojaId;
    usuario.lojaNomePadrao = funcionario.lojaNome;
    usuario.codigoAcesso = funcionario.codigoAcesso;

    // Se ele é funcionário vinculado a uma loja, já deixa a loja selecionada.
    setLojaAtual({
      id: funcionario.lojaId,
      nome: funcionario.lojaNome,
      responsavel: ""
    });
  }

  salvarJSONLocal("usuarios", usuarios);
  salvarJSONLocal("usuarioLogado", usuario);

  if (funcionario) {
    window.location.href = "dashboard.html";
  } else {
    window.location.href = "escolher-loja.html";
  }
});
