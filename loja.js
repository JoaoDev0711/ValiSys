function getLojas() {
  let lojas = JSON.parse(localStorage.getItem("lojas")) || [];

  if (lojas.length === 0) {
    lojas = [
      {
        id: "loja-demo-1",
        nome: "Mercado Demonstração",
        responsavel: "Gerente Demonstração",
        criadaEm: new Date().toLocaleString("pt-BR")
      }
    ];

    localStorage.setItem("lojas", JSON.stringify(lojas));
  }

  return lojas;
}

function salvarLojas(lojas) {
  localStorage.setItem("lojas", JSON.stringify(lojas));
}

function getLojaAtual() {
  return JSON.parse(localStorage.getItem("lojaAtual"));
}

function setLojaAtual(loja) {
  localStorage.setItem("lojaAtual", JSON.stringify(loja));
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
