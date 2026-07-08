function getLojas() {
  let lojas = lerJSONLocal("lojas", []);

  if (lojas.length === 0) {
    lojas = [
      {
        id: "loja-demo-1",
        nome: "Mercado Demonstração",
        responsavel: "Gerente Demonstração",
        criadaEm: new Date().toLocaleString("pt-BR")
      }
    ];

    salvarJSONLocal("lojas", lojas);
  }

  return lojas;
}

function salvarLojas(lojas) {
  salvarJSONLocal("lojas", lojas);
}

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
