const form = document.getElementById("login-form");
const cargoSelect = document.getElementById("cargo");
const senhaArea = document.getElementById("senha-area");
const senhaInput = document.getElementById("senha");
const senhaLabel = document.getElementById("senha-label");
const senhaAjuda = document.getElementById("senha-ajuda");
const nomeInput = document.getElementById("nome");
const nomeArea = document.getElementById("nome-area");
const lojaLoginCard = document.getElementById("loja-login-card");
const textoLogin = document.getElementById("texto-login");

const lojaAtual = getLojaAtual();

const senhaAdmin = "admin123";

function renderizarLojaLogin() {
  if (!lojaLoginCard) return;

  if (lojaAtual) {
    lojaLoginCard.innerHTML = `
      <div class="mini-info-loja">
        ${logoLojaHTML(lojaAtual, "loja-logo-mini")}
        <div>
          <strong>Loja selecionada</strong>
          <p>${esc(lojaAtual.nome)}</p>
        </div>
      </div>
    `;
    return;
  }

  lojaLoginCard.innerHTML = `
    <strong>Nenhuma loja selecionada</strong>
    <p>Funcionários precisam escolher a loja antes de entrar.</p>
  `;
}

function atualizarCamposLogin() {
  const cargo = cargoSelect.value;

  if (cargo === "admin") {
    nomeArea.style.display = "none";
    nomeInput.required = false;
    nomeInput.value = "Admin";

    senhaArea.style.display = "block";
    senhaInput.required = true;
    senhaLabel.innerText = "Senha do admin";
    senhaInput.placeholder = "Digite a senha do admin";
    senhaAjuda.innerText = "Admin entra pelo acesso geral e depois escolhe a loja.";
    textoLogin.innerText = "Acesso geral do sistema.";
    return;
  }

  nomeArea.style.display = "block";
  nomeInput.required = true;
  textoLogin.innerText = "Acesso de funcionário da loja.";

  if (["gerente", "encarregado"].includes(cargo)) {
    senhaArea.style.display = "block";
    senhaInput.required = true;
    senhaLabel.innerText = "Código de acesso";
    senhaInput.placeholder = "Código cadastrado para este funcionário";
    senhaAjuda.innerText = "Gerente e encarregado usam o código cadastrado na loja.";
    return;
  }

  if (cargo === "promotor") {
    senhaArea.style.display = "none";
    senhaInput.required = false;
    senhaInput.value = "";
    senhaAjuda.innerText = "";
    return;
  }

  senhaArea.style.display = "none";
  senhaInput.required = false;
  senhaInput.value = "";
}

cargoSelect.addEventListener("change", atualizarCamposLogin);
renderizarLojaLogin();
atualizarCamposLogin();

form.addEventListener("submit", async function(event) {
  event.preventDefault();

  const cargo = cargoSelect.value;
  const nome = cargo === "admin" ? "Admin" : nomeInput.value.trim();
  const senha = senhaInput.value.trim();

  if (!cargo) {
    alert("Selecione o tipo de acesso.");
    return;
  }

  if (cargo === "admin") {
    if (senha !== senhaAdmin) {
      alert("Senha do admin incorreta.");
      senhaInput.focus();
      return;
    }

    salvarJSONLocal("usuarioLogado", {
      id: "admin-geral",
      nome: "Admin",
      cargo: "admin",
      funcionarioId: "",
      lojaIdPadrao: "",
      lojaNomePadrao: "",
      setor: "",
      criadoEm: new Date().toLocaleString("pt-BR")
    });

    window.location.href = "admin-dashboard.html";
    return;
  }

  if (!lojaAtual) {
    alert("Escolha a loja antes de entrar como funcionário.");
    window.location.href = "escolher-loja.html";
    return;
  }

  if (!nome) {
    alert("Informe seu nome.");
    nomeInput.focus();
    return;
  }

  if (["gerente", "encarregado"].includes(cargo) && !senha) {
    alert("Informe o código de acesso.");
    senhaInput.focus();
    return;
  }

  try {
    const funcionario = await valisysDB.buscarFuncionarioPorNomeCargo(
      nome,
      cargo,
      lojaAtual.id,
      senha
    );

    if (!funcionario) {
      if (cargo === "promotor") {
        const confirmar = confirm(
          "Promotor não encontrado no cadastro desta loja.\n\nDeseja entrar mesmo assim como promotor temporário?"
        );

        if (!confirmar) return;

        salvarJSONLocal("usuarioLogado", {
          id: gerarIdLocal("promotor"),
          nome,
          cargo,
          funcionarioId: "",
          lojaIdPadrao: lojaAtual.id,
          lojaNomePadrao: lojaAtual.nome,
          setor: "",
          criadoEm: new Date().toLocaleString("pt-BR")
        });

        window.location.href = "dashboard.html";
        return;
      }

      alert("Funcionário ou código não encontrado para esta loja.");
      return;
    }

    salvarJSONLocal("usuarioLogado", {
      id: funcionario.id,
      nome: funcionario.nome,
      cargo: funcionario.cargo,
      funcionarioId: funcionario.id,
      lojaIdPadrao: funcionario.lojaId,
      lojaNomePadrao: funcionario.lojaNome,
      setor: funcionario.setor || "",
      criadoEm: new Date().toLocaleString("pt-BR")
    });

    setLojaAtual({
      id: funcionario.lojaId || lojaAtual.id,
      nome: funcionario.lojaNome || lojaAtual.nome,
      responsavel: ""
    });

    window.location.href = "dashboard.html";
  } catch (erro) {
    console.error(erro);
    alert("Erro ao entrar: " + erro.message);
  }
});
