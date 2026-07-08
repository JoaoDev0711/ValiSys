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
const linkTrocarLoja = document.getElementById("link-trocar-loja");
const voltarLogin = document.getElementById("voltar-login");

const lojaAtual = getLojaAtual();
const usuarioAtual = getUsuarioLogado();

if (lojaAtual && usuarioAtual?.cargo === "admin") {
  limparUsuarioLogado();
}

const senhaAdmin = "admin123";

function configurarTiposDeAcesso() {
  if (lojaAtual) {
    cargoSelect.innerHTML = `
      <option value="">Selecione</option>
      <option value="promotor">Promotor da loja</option>
      <option value="encarregado">Encarregado da loja</option>
      <option value="gerente">Gerente da loja</option>
    `;

    if (linkTrocarLoja) linkTrocarLoja.innerText = "Trocar loja";
    if (voltarLogin) {
      voltarLogin.href = "escolher-loja.html";
      voltarLogin.innerText = "← Trocar loja";
    }

    return;
  }

  cargoSelect.innerHTML = `
    <option value="admin">Admin geral</option>
  `;
  cargoSelect.value = "admin";

  if (linkTrocarLoja) linkTrocarLoja.innerText = "Sou funcionário: escolher loja";
  if (voltarLogin) {
    voltarLogin.href = "index.html";
    voltarLogin.innerText = "← Voltar para o site";
  }
}

function renderizarLojaLogin() {
  if (!lojaLoginCard) return;

  if (lojaAtual) {
    lojaLoginCard.innerHTML = `
      <div class="mini-info-loja">
        ${logoLojaHTML(lojaAtual, "loja-logo-mini")}
        <div>
          <strong>Login da loja</strong>
          <p>${esc(lojaAtual.nome)}</p>
          <small>${esc(lojaAtual.grupo || "Sem grupo")} • ${esc(lojaAtual.regiao || "Sem região")}</small>
        </div>
      </div>
    `;
    textoLogin.innerText = "Entre com um usuário desta loja.";
    return;
  }

  lojaLoginCard.innerHTML = `
    <strong>Acesso administrativo</strong>
    <p>Funcionário precisa clicar primeiro na loja desejada.</p>
  `;
  textoLogin.innerText = "Área de acesso do admin geral.";
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
    senhaAjuda.innerText = "Admin entra apenas na área administrativa.";
    textoLogin.innerText = "Área de acesso do admin geral.";
    return;
  }

  nomeArea.style.display = "block";
  nomeInput.required = true;
  textoLogin.innerText = lojaAtual
    ? `Login da loja ${lojaAtual.nome}`
    : "Clique primeiro na loja desejada para entrar.";

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

configurarTiposDeAcesso();
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
    if (lojaAtual) {
      alert("Admin não entra pelo login da loja. Troque para o acesso geral do admin.");
      return;
    }

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
    alert("Clique primeiro na loja desejada para entrar.");
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

        setLojaAtual(lojaAtual);
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
      ...lojaAtual,
      id: funcionario.lojaId || lojaAtual.id,
      nome: funcionario.lojaNome || lojaAtual.nome
    });

    window.location.href = "dashboard.html";
  } catch (erro) {
    console.error(erro);
    alert("Erro ao entrar: " + erro.message);
  }
});
