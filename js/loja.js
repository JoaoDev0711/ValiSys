function getLojaAtual() {
  return lerJSONLocal("lojaAtual", null);
}

function setLojaAtual(loja) {
  salvarJSONLocal("lojaAtual", loja);
}

function limparLojaAtual() {
  localStorage.removeItem("lojaAtual");
}

function protegerLojaSelecionada() {
  const loja = getLojaAtual();

  if (!loja) {
    window.location.href = "escolher-loja.html";
    return null;
  }

  return loja;
}

function podeCadastrarLoja(cargo) {
  return ["gerente", "admin"].includes(cargo);
}

async function carregarLojasSupabase() {
  return await valisysDB.listarLojas();
}
