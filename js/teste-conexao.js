const btn = document.getElementById("btn-testar");
const resultado = document.getElementById("resultado-teste");

btn.addEventListener("click", async () => {
  resultado.innerHTML = `<div class="card"><p class="muted">Testando sistema...</p></div>`;

  try {
    await valisysDB.testarConexao();

    const lojasAntes = await valisysDB.listarLojas();

    const lojaTeste = await valisysDB.criarLoja({
      nome: `Teste sistema ${new Date().toLocaleTimeString("pt-BR")}`,
      responsavel: "Teste automático"
    });

    const lojasDepois = await valisysDB.listarLojas();

    resultado.innerHTML = `
      <div class="card">
        <h2>Conexão OK</h2>
        <p>O site conseguiu ler e gravar no sistema.</p>
        <p><strong>Lojas antes:</strong> ${lojasAntes.length}</p>
        <p><strong>Loja criada:</strong> ${esc(lojaTeste.nome)}</p>
        <p><strong>Lojas depois:</strong> ${lojasDepois.length}</p>
        <p class="muted">Agora abra o sistema > painel de dados > lojas e veja se essa loja apareceu.</p>
      </div>
    `;
  } catch (erro) {
    console.error(erro);

    resultado.innerHTML = `
      <div class="card">
        <h2 class="danger">Falhou</h2>
        <p>O site não conseguiu conectar/gravar no sistema.</p>
        <p><strong>Erro:</strong> ${esc(erro.message)}</p>
        <p class="muted">
          Confira js/dados-config.js, se o SQL foi rodado e se as policies/RLS não estão bloqueando insert/select.
        </p>
      </div>
    `;
  }
});
