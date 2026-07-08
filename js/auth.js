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

function sair() {
  localStorage.removeItem("usuarioLogado");
  localStorage.removeItem("lojaAtual");
  window.location.href = "login.html";
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
  const usuario = getUsuarioLogado();

  if (usuario && usuario.cargo === "admin") {
    alert("Admin não entra na área operacional da loja. Escolha a loja e entre como funcionário/gerente/encarregado/promotor.");
    window.location.href = "admin-dashboard.html";
    return true;
  }

  return false;
}
