const formAdmin = document.getElementById("admin-login-form");
const senhaAdminInput = document.getElementById("senhaAdmin");

const senhaAdmin = "admin123";

formAdmin.addEventListener("submit", event => {
  event.preventDefault();

  const senha = senhaAdminInput.value.trim();

  if (senha !== senhaAdmin) {
    alert("Senha do admin incorreta.");
    senhaAdminInput.focus();
    return;
  }

  // Admin é separado da operação da loja.
  // Ao entrar como admin, não mantém loja selecionada nem usuário de loja.
  limparLojaAtual();
  salvarJSONLocal("usuarioLogado", {
    id: "admin-geral",
    nome: "Admin",
    cargo: "admin",
    funcionarioId: "",
    lojaIdPadrao: "",
    lojaNomePadrao: "",
    setor: "",
    criadoEm: new Date().toLocaleString("pt-BR")
  });

  window.location.href = "admin-dashboard.html";
});
