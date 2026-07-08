const form = document.getElementById("login-form");

form.addEventListener("submit", function(event) {
  event.preventDefault();

  const nome = document.getElementById("nome").value.trim();
  const cargo = document.getElementById("cargo").value;

  if (!nome || !cargo) {
    alert("Preencha nome e cargo.");
    return;
  }

  const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

  let usuario = usuarios.find(u =>
    u.nome.toLowerCase() === nome.toLowerCase() && u.cargo === cargo
  );

  if (!usuario) {
    usuario = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      nome,
      cargo,
      criadoEm: new Date().toLocaleString("pt-BR")
    };

    usuarios.push(usuario);
    localStorage.setItem("usuarios", JSON.stringify(usuarios));
  }

  localStorage.setItem("usuarioLogado", JSON.stringify(usuario));
  window.location.href = "main.html";
});
