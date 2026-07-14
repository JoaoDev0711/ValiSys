const formAdministrador = document.getElementById("admin-login-form");
const senhaAdministradorInput = document.getElementById("senhaAdmin");

const senhaAdministrador = "admin123";

formAdministrador.addEventListener("submit", event => {
  event.preventDefault();

  const senha = senhaAdministradorInput.value.trim();

  if (senha !== senhaAdministrador) {
    alert("Senha administrativa incorreta.");
    senhaAdministradorInput.focus();
    return;
  }

  // Administrador é separado da operação da loja.
  // No acesso administrativo, não mantém loja selecionada nem usuário de loja.
  limparLojaAtual();
  salvarJSONLocal("usuarioLogado", {
    id: "admin-geral",
    nome: "Administrador",
    cargo: "admin",
    funcionarioId: "",
    lojaIdPadrao: "",
    lojaNomePadrao: "",
    setor: "",
    criadoEm: new Date().toLocaleString("pt-BR")
  });

  window.location.href = "admin-dashboard.html";
});
