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


function excluirLojaPorId(id) {
  const lojas = getLojas();
  const loja = lojas.find(item => item.id === id);

  if (!loja) {
    return {
      ok: false,
      mensagem: "Loja não encontrada."
    };
  }

  const lancamentos = lerJSONLocal("lancamentos", []);
  const temLancamentos = lancamentos.some(item => item.lojaId === id);

  if (temLancamentos) {
    return {
      ok: false,
      mensagem: "Essa loja possui lançamentos. Para evitar perder histórico, ela não foi excluída."
    };
  }

  const filtradas = lojas.filter(item => item.id !== id);
  salvarLojas(filtradas);

  const atual = getLojaAtual();

  if (atual && atual.id === id) {
    limparLojaAtual();
  }

  return {
    ok: true,
    mensagem: "Loja excluída com sucesso."
  };
}
