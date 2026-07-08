const form = document.getElementById("login-form");
const cargoSelect = document.getElementById("cargo");
const senhaArea = document.getElementById("senha-area");
const senhaInput = document.getElementById("senha");

// Senhas do MVP localStorage.
// Depois, em banco real, isso NÃO deve ficar no front-end.
const senhasPorCargo = {
  encarregado: "enc123",
  gerente: "ger123",
  admin: "admin123"
};

cargoSelect.addEventListener("change", () => {
  const cargo = cargoSelect.value;

  if (senhasPorCargo[cargo]) {
    senhaArea.style.display = "block";
    senhaInput.required = true;
  } else {
    senhaArea.style.display = "none";
    senhaInput.required = false;
    senhaInput.value = "";
  }
});

form.addEventListener("submit", function(event) {
  event.preventDefault();

  const nome = document.getElementById("nome").value.trim();
  const cargo = cargoSelect.value;
  const senha = senhaInput.value;

  if (!nome || !cargo) {
    alert("Preencha nome e cargo.");
    return;
  }

  if (senhasPorCargo[cargo] && senha !== senhasPorCargo[cargo]) {
    alert("Senha incorreta para este cargo.");
    senhaInput.focus();
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
  window.location.href = "index.html";
});
