const form = document.getElementById("login-form");
const cargoSelect = document.getElementById("cargo");
const senhaArea = document.getElementById("senha-area");
const senhaInput = document.getElementById("senha");
const btnLoginFuncionario = document.getElementById("btn-login-funcionario");

// Senhas do MVP front-end.
// Na versão final com Supabase Auth, isso deve virar login real.
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
  btnLoginFuncionario.style.display = "none";
}

form.addEventListener("submit", async function(event) {
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

  try {
    const funcionario = await valisysDB.buscarFuncionarioPorNomeCargo(nome, cargo);

    const usuario = {
      id: funcionario?.id || gerarIdLocal("usuario-sessao"),
      nome,
      cargo,
      funcionarioId: funcionario?.id || "",
      lojaIdPadrao: funcionario?.lojaId || "",
      lojaNomePadrao: funcionario?.lojaNome || "",
      criadoEm: new Date().toLocaleString("pt-BR")
    };

    salvarJSONLocal("usuarioLogado", usuario);

    if (funcionario?.lojaId) {
      setLojaAtual({
        id: funcionario.lojaId,
        nome: funcionario.lojaNome || "Loja vinculada",
        responsavel: ""
      });

      window.location.href = "dashboard.html";
      return;
    }

    window.location.href = "escolher-loja.html";
  } catch (erro) {
    console.error(erro);
    alert("Erro ao consultar funcionário no Supabase: " + erro.message);
  }
});
