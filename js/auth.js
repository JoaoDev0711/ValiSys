const MAIN_PAGE = "dashboard.html";

function getUsuarioLogado() {
  return JSON.parse(localStorage.getItem("usuarioLogado"));
}

function protegerPagina() {
  const usuario = getUsuarioLogado();

  if (!usuario) {
    window.location.href = "login.html";
    return null;
  }

  return usuario;
}

async function sair() {
  const confirmar = await confirmarAcao(
    "Você realmente quer sair do sistema?",
    "Sair do sistema"
  );

  if (!confirmar) return;

  const usuario = getUsuarioLogado();

  localStorage.removeItem("usuarioLogado");
  localStorage.removeItem("lojaAtual");

  window.location.href = usuario?.cargo === "admin" ? "admin-login.html" : "escolher-loja.html";
}

function podeVerListaGeral(cargo) {
  return ["encarregado", "gerente", "admin"].includes(cargo);
}

function podeCadastrarProduto(cargo) {
  return ["gerente", "admin"].includes(cargo);
}

function podeGerenciarUsuarios(cargo) {
  return cargo === "admin";
}

function nomeCargo(cargo) {
  const cargos = {
    promotor: "Promotor",
    encarregado: "Encarregado",
    gerente: "Gerente",
    admin: "Admin"
  };

  return cargos[cargo] || cargo;
}

function esc(valor) {
  return String(valor || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseDataLocal(dataISO) {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

function gerarIdLocal(prefixo = "id") {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `${prefixo}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function lerJSONLocal(chave, fallback = []) {
  try {
    const valor = JSON.parse(localStorage.getItem(chave));
    return valor ?? fallback;
  } catch (erro) {
    console.warn(`Erro ao ler ${chave} do localStorage.`, erro);
    return fallback;
  }
}

function salvarJSONLocal(chave, valor) {
  localStorage.setItem(chave, JSON.stringify(valor));
}


function podeExcluirLoja(cargo) {
  return cargo === "admin";
}

function podeVerNotificacoes(cargo) {
  return ["encarregado", "gerente", "admin"].includes(cargo);
}


function podeGerenciarFuncionarios(cargo) {
  return ["gerente", "admin"].includes(cargo);
}


function limparUsuarioLogado() {
  localStorage.removeItem("usuarioLogado");
}

function bloquearAdminEmAreaLoja() {
  // Admin pode administrar uma loja quando veio pela Dashboard Admin.
  // A seleção pública de loja continua limpando o usuário antes do login operacional.
  return false;
}


function podeVerGestaoLoja(cargo) {
  return ["gerente", "encarregado", "admin"].includes(cargo);
}

function descricaoPermissaoGestao(cargo) {
  if (cargo === "admin") {
    return "Visão administrativa completa da loja selecionada.";
  }

  if (cargo === "gerente") {
    return "Visão completa da loja, equipe, produtos e vencimentos.";
  }

  if (cargo === "encarregado") {
    return "Visão operacional da loja com foco no setor e nos vencimentos.";
  }

  return "Acesso operacional.";
}


async function trocarLojaComConfirmacao() {
  const confirmar = await confirmarAcao(
    "Ao trocar de loja, o usuário atual será desconectado para evitar registros no mercado errado.",
    "Trocar loja?"
  );

  if (!confirmar) return;

  localStorage.removeItem("usuarioLogado");
  localStorage.removeItem("lojaAtual");
  window.location.href = "escolher-loja.html";
}
