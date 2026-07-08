const usuario = protegerPagina();

if (!podeGerenciarUsuarios(usuario.cargo)) {
  alert("Apenas admin pode acessar usuários.");
  window.location.href = "index.html";
}

const listaUsuarios = document.getElementById("lista-usuarios");
const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

if (usuarios.length === 0) {
  listaUsuarios.innerHTML = `<div class="card"><p>Nenhum usuário encontrado.</p></div>`;
} else {
  listaUsuarios.innerHTML = usuarios.map(user => `
    <article class="card">
      <h3>${esc(user.nome)}</h3>
      <p><strong>Cargo:</strong> ${esc(nomeCargo(user.cargo))}</p>
      <p><strong>Criado em:</strong> ${esc(user.criadoEm || "Não informado")}</p>
      <p><strong>ID:</strong> ${esc(user.id)}</p>
    </article>
  `).join("");
}
