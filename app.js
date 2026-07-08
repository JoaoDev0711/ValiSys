const usuario = protegerPagina();

if (usuario) {
  document.getElementById("welcome-title").innerText = `Olá, ${usuario.nome}`;
  document.getElementById("welcome-role").innerText = `Cargo: ${nomeCargo(usuario.cargo)}`;

  document.getElementById("sidebar-nome").innerText = usuario.nome;
  document.getElementById("sidebar-cargo").innerText = nomeCargo(usuario.cargo);

  const menuBtn = document.getElementById("menu-btn");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");

  menuBtn.addEventListener("click", () => {
    sidebar.classList.add("active");
    overlay.classList.add("active");
  });

  overlay.addEventListener("click", () => {
    sidebar.classList.remove("active");
    overlay.classList.remove("active");
  });

  document.querySelectorAll("[data-role='lista-geral']").forEach(el => {
    if (!podeVerListaGeral(usuario.cargo)) {
      el.style.display = "none";
    }
  });

  document.querySelectorAll("[data-role='produtos']").forEach(el => {
    if (!podeCadastrarProduto(usuario.cargo)) {
      el.style.display = "none";
    }
  });

  document.querySelectorAll("[data-role='usuarios']").forEach(el => {
    if (!podeGerenciarUsuarios(usuario.cargo)) {
      el.style.display = "none";
    }
  });
}
