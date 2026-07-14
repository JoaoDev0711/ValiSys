const formContratacao = document.getElementById("contratacao-form");
const statusContratacao = document.getElementById("contratacao-status");

const campos = {
  tipo: document.getElementById("tipoOperacao"),
  nome: document.getElementById("nomeLojaContratacao"),
  grupo: document.getElementById("grupoContratacao"),
  regiao: document.getElementById("regiaoContratacao"),
  responsavel: document.getElementById("responsavelContratacao"),
  email: document.getElementById("emailContratacao"),
  telefone: document.getElementById("telefoneContratacao"),
  qtdLojas: document.getElementById("qtdLojasContratacao"),
  observacoes: document.getElementById("observacoesContratacao")
};

const resumo = {
  nome: document.getElementById("resumoNomeLoja"),
  tipo: document.getElementById("resumoTipo"),
  grupo: document.getElementById("resumoGrupo"),
  regiao: document.getElementById("resumoRegiao"),
  responsavel: document.getElementById("resumoResponsavel"),
  qtdLojas: document.getElementById("resumoQtdLojas")
};

const CHAVE_PRE_CADASTRO = "valisysPreCadastroComercial";

function usuarioAdminLogado() {
  try {
    const usuario = getUsuarioLogado();
    return usuario?.cargo === "admin" ? usuario : null;
  } catch {
    return null;
  }
}

function textoOuPadrao(valor, padrao) {
  const texto = String(valor || "").trim();
  return texto || padrao;
}

function lerDadosFormulario() {
  return {
    tipo: campos.tipo.value || "loja",
    nome: campos.nome.value.trim(),
    grupo: campos.grupo.value.trim(),
    regiao: campos.regiao.value.trim(),
    responsavel: campos.responsavel.value.trim(),
    email: campos.email.value.trim(),
    telefone: campos.telefone.value.trim(),
    qtdLojas: Math.max(1, Number(campos.qtdLojas.value || 1)),
    observacoes: campos.observacoes.value.trim(),
    criadoEm: new Date().toISOString()
  };
}

function salvarRascunho() {
  const dados = lerDadosFormulario();
  localStorage.setItem(CHAVE_PRE_CADASTRO, JSON.stringify(dados));
  renderizarResumo(dados);
  return dados;
}

function carregarRascunho() {
  try {
    const dados = JSON.parse(localStorage.getItem(CHAVE_PRE_CADASTRO));
    if (!dados) return;

    campos.tipo.value = dados.tipo || "loja";
    campos.nome.value = dados.nome || "";
    campos.grupo.value = dados.grupo || "";
    campos.regiao.value = dados.regiao || "";
    campos.responsavel.value = dados.responsavel || "";
    campos.email.value = dados.email || "";
    campos.telefone.value = dados.telefone || "";
    campos.qtdLojas.value = dados.qtdLojas || 1;
    campos.observacoes.value = dados.observacoes || "";
  } catch {
    // Rascunho local é opcional.
  }
}

function renderizarResumo(dados = lerDadosFormulario()) {
  resumo.nome.innerText = textoOuPadrao(dados.nome, "Loja não informada");
  resumo.tipo.innerText = dados.tipo === "grupo" ? "Grupo ou rede" : "Loja única";
  resumo.grupo.innerText = textoOuPadrao(dados.grupo, dados.tipo === "grupo" ? "Grupo não informado" : "Não informado");
  resumo.regiao.innerText = textoOuPadrao(dados.regiao, "Não informada");
  resumo.responsavel.innerText = textoOuPadrao(dados.responsavel, "Não informado");
  resumo.qtdLojas.innerText = String(dados.qtdLojas || 1);
}

function ajustarTelaAdmin() {
  const box = document.getElementById("contratacao-admin-box");
  const admin = usuarioAdminLogado();

  if (!box) return;

  if (admin) {
    box.innerHTML = `
      <strong>Administração conectada</strong>
      <p>Ao continuar, a loja principal será cadastrada e selecionada para escolha do plano.</p>
    `;
    return;
  }

  box.innerHTML = `
    <strong>Pré-cadastro comercial</strong>
    <p>Os dados ficam salvos neste aparelho. A administração pode entrar depois e concluir o cadastro da loja.</p>
  `;
}

async function criarLojaComoAdmin(dados) {
  const admin = usuarioAdminLogado();
  if (!admin) return null;

  const loja = await valisysDB.criarLoja({
    nome: dados.nome,
    responsavel: dados.responsavel,
    regiao: dados.regiao,
    grupo: dados.grupo,
    corTema: "#2f7d4f",
    imagem: ""
  });

  setLojaAtual(loja);
  localStorage.setItem("valisysPreCadastroComercialUltimaLoja", JSON.stringify({
    ...dados,
    lojaId: loja.id,
    lojaNome: loja.nome,
    criadoPor: admin.nome,
    criadaEm: new Date().toISOString()
  }));

  return loja;
}

Object.values(campos).forEach(campo => {
  campo.addEventListener("input", () => {
    salvarRascunho();
    if (campos.tipo.value === "loja" && !campos.grupo.value.trim()) {
      campos.qtdLojas.value = Math.max(1, Number(campos.qtdLojas.value || 1));
    }
  });

  campo.addEventListener("change", salvarRascunho);
});

formContratacao.addEventListener("submit", async event => {
  event.preventDefault();

  const dados = salvarRascunho();

  if (!dados.nome) {
    alert("Informe o nome da loja principal.");
    campos.nome.focus();
    return;
  }

  if (!dados.responsavel) {
    alert("Informe o responsável pela implantação.");
    campos.responsavel.focus();
    return;
  }

  const admin = usuarioAdminLogado();

  if (!admin) {
    statusContratacao.innerText = "Pré-cadastro salvo. Entre na administração para cadastrar a loja e escolher o plano.";
    await confirmarAcao(
      "Pré-cadastro salvo. Para escolher o plano e gerar assinatura, acesse a administração.",
      "Dados salvos"
    );
    window.location.href = "admin-login.html";
    return;
  }

  try {
    statusContratacao.innerText = "Cadastrando loja principal...";
    await criarLojaComoAdmin(dados);
    statusContratacao.innerText = "Loja cadastrada. Abrindo planos...";
    window.location.href = "planos.html";
  } catch (erro) {
    console.error(erro);
    statusContratacao.innerText = "Não foi possível cadastrar a loja agora.";
    alert("Não foi possível cadastrar a loja: " + erro.message);
  }
});

carregarRascunho();
renderizarResumo();
ajustarTelaAdmin();
