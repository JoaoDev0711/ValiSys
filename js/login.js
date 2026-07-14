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
const marcaPromotorArea = document.getElementById("marca-promotor-area");
const marcaPromotorSelect = document.getElementById("marcaPromotor");
const novaMarcaPromotorInput = document.getElementById("novaMarcaPromotor");
const toggleCodigoAcesso = document.getElementById("toggle-codigo-acesso");
const codigoAcessoInfo = document.getElementById("codigo-acesso-info");

const lojaAtual = getLojaAtual();
const usuarioAtual = getUsuarioLogado();

if (usuarioAtual?.cargo === "admin") {
  limparUsuarioLogado();
}


async function carregarMarcasPromotor() {
  if (!marcaPromotorSelect || !lojaAtual) return;

  marcaPromotorSelect.innerHTML = `<option value="">Carregando marcas...</option>`;

  try {
    const marcas = await valisysDB.listarMarcasPromotoria(lojaAtual.id);

    marcaPromotorSelect.innerHTML = `
      <option value="">Selecione uma marca</option>
      ${marcas.map(marca => `<option value="${esc(marca.nome)}">${esc(marca.nome)}</option>`).join("")}
    `;

    if (marcas.length === 0) {
      marcaPromotorSelect.innerHTML = `<option value="">Nenhuma marca cadastrada</option>`;
    }
  } catch (erro) {
    console.warn("Não foi possível carregar marcas de promotoria.", erro);
    marcaPromotorSelect.innerHTML = `<option value="">Digite a nova marca abaixo</option>`;
  }
}

function marcaPromotorEscolhida() {
  const nova = novaMarcaPromotorInput?.value.trim() || "";
  const selecionada = marcaPromotorSelect?.value.trim() || "";

  return nova || selecionada;
}

function atualizarAreaPromotor() {
  const cargo = cargoSelect.value;

  if (!marcaPromotorArea) return;

  marcaPromotorArea.style.display = cargo === "promotor" ? "block" : "none";

  if (cargo === "promotor") {
    carregarMarcasPromotor();
  } else {
    if (marcaPromotorSelect) marcaPromotorSelect.value = "";
    if (novaMarcaPromotorInput) novaMarcaPromotorInput.value = "";
  }
}


function configurarVisualizacaoCodigo() {
  if (!toggleCodigoAcesso || !senhaInput) return;

  toggleCodigoAcesso.addEventListener("click", () => {
    const visivel = senhaInput.type === "text";
    senhaInput.type = visivel ? "password" : "text";
    toggleCodigoAcesso.innerText = visivel ? "Mostrar" : "Ocultar";
  });
}

function atualizarNotaCodigo(cargo) {
  if (!codigoAcessoInfo || !senhaAjuda) return;

  if (cargo === "encarregado") {
    codigoAcessoInfo.style.display = "block";
    senhaAjuda.innerText = "Digite o código cadastrado para este encarregado. Use Mostrar para conferir antes de entrar.";
    return;
  }

  codigoAcessoInfo.style.display = "block";
  senhaAjuda.innerText = "Este perfil não exige código de acesso nesta loja.";
}

function configurarTiposDeAcesso() {
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
    <strong>Nenhuma loja selecionada</strong>
    <p>Selecione primeiro na loja desejada para abrir o login dela.</p>
  `;
  textoLogin.innerText = "Login operacional da loja.";
}

function atualizarCamposLogin() {
  const cargo = cargoSelect.value;

  atualizarAreaPromotor();

  nomeArea.style.display = "block";
  nomeInput.required = true;
  textoLogin.innerText = lojaAtual
    ? `Acesso da loja ${lojaAtual.nome}`
    : "Selecione primeiro a loja desejada para entrar.";

  if (cargo === "encarregado") {
    senhaArea.style.display = "block";
    senhaInput.required = true;
    senhaLabel.innerText = "Código de acesso";
    senhaInput.placeholder = "Código cadastrado para este encarregado";
    atualizarNotaCodigo(cargo);
    return;
  }

  if (cargo === "gerente" || cargo === "promotor") {
    senhaArea.style.display = "none";
    senhaInput.required = false;
    senhaInput.value = "";
    atualizarNotaCodigo(cargo);
    return;
  }

  senhaArea.style.display = "none";
  senhaInput.required = false;
  senhaInput.value = "";
}

configurarTiposDeAcesso();
configurarVisualizacaoCodigo();
cargoSelect.addEventListener("change", atualizarCamposLogin);
renderizarLojaLogin();
atualizarCamposLogin();

if (!lojaAtual) {
  setTimeout(() => {
    alert("Escolha uma loja antes de entrar.");
    window.location.href = "escolher-loja.html";
  }, 150);
}

form.addEventListener("submit", async function(event) {
  event.preventDefault();

  const cargo = cargoSelect.value;
  const nome = nomeInput.value.trim();
  const senha = senhaInput.value.trim();

  if (!lojaAtual) {
    alert("Selecione primeiro na loja desejada para entrar.");
    window.location.href = "escolher-loja.html";
    return;
  }

  if (!cargo) {
    alert("Selecione o tipo de acesso.");
    return;
  }

  if (!nome) {
    alert("Informe seu nome.");
    nomeInput.focus();
    return;
  }

  if (cargo === "encarregado" && !senha) {
    alert("Informe o código de acesso do encarregado.");
    senhaInput.focus();
    return;
  }

  const marcaPromotoria = cargo === "promotor" ? marcaPromotorEscolhida() : "";

  if (cargo === "promotor" && !marcaPromotoria) {
    alert("Selecione ou cadastre a marca da promotoria.");
    novaMarcaPromotorInput?.focus();
    return;
  }

  try {
    if (cargo === "promotor") {
      const promotor = await valisysDB.garantirPromotorComMarca({
        lojaId: lojaAtual.id,
        nome,
        marcaPromotoria
      });

      salvarJSONLocal("usuarioLogado", {
        id: promotor.id,
        nome: promotor.nome,
        cargo: "promotor",
        funcionarioId: promotor.id,
        lojaIdPadrao: lojaAtual.id,
        lojaNomePadrao: lojaAtual.nome,
        setor: promotor.setor || "Promotoria",
        marcaPromotoria: promotor.marcaPromotoria || marcaPromotoria,
        permiteCaixa: Boolean(promotor.permiteCaixa),
        criadoEm: new Date().toLocaleString("pt-BR")
      });

      setLojaAtual(lojaAtual);
      window.location.href = "dashboard.html";
      return;
    }

    const funcionario = await valisysDB.buscarFuncionarioPorNomeCargo(
      nome,
      cargo,
      lojaAtual.id,
      senha
    );

    if (!funcionario) {
      alert(cargo === "encarregado" ? "Encarregado ou código não encontrado para esta loja." : "Funcionário não encontrado para esta loja.");
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
      marcaPromotoria: funcionario.marcaPromotoria || "",
      permiteCaixa: Boolean(funcionario.permiteCaixa),
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
