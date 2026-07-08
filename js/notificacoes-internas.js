const usuario = protegerPagina();
const lojaAtual = protegerLojaSelecionada();

if (!podeVerNotificacoes(usuario.cargo)) {
  alert("Você não tem permissão para ver notificações internas.");
  window.location.href = "dashboard.html";
}

const lojaEl = document.getElementById("loja-notificacao-atual");
if (lojaEl && lojaAtual) lojaEl.innerText = lojaAtual.nome;

const lista = document.getElementById("lista-notificacoes");

function renderizarNotificacoes() {
  const notificacoes = lerJSONLocal("notificacoes", [])
    .filter(item => !item.lojaId || item.lojaId === lojaAtual.id);

  if (notificacoes.length === 0) {
    lista.innerHTML = `
      <div class="card">
        <p>Nenhum aviso interno encontrado para esta loja.</p>
      </div>
    `;
    return;
  }

  lista.innerHTML = notificacoes.map(item => {
    const lida = (item.lidaPor || []).includes(usuario.id);

    return `
      <article class="card notificacao-card ${lida ? "notificacao-lida" : ""}">
        <div class="lancamento-topo">
          <div>
            <h3>${esc(item.titulo)}</h3>
            <p class="muted">${esc(item.lojaNome || lojaAtual.nome)} • ${esc(item.criadoEm)}</p>
          </div>
          ${lida ? `<span class="badge neutral">Lida</span>` : `<span class="badge warning">Nova</span>`}
        </div>

        <p>${esc(item.mensagem)}</p>

        <div class="info-grid">
          ${item.produto ? `<p><strong>Produto:</strong> ${esc(item.produto)}</p>` : ""}
          ${item.setor ? `<p><strong>Setor:</strong> ${esc(item.setor)}</p>` : ""}
          ${item.validade ? `<p><strong>Validade:</strong> ${esc(item.validade)}</p>` : ""}
          ${item.criadoPor ? `<p><strong>Criado por:</strong> ${esc(item.criadoPor)}</p>` : ""}
        </div>

        <div class="card-actions stack-actions">
          ${!lida ? `<button onclick="marcarLida('${item.id}')">Marcar como lida</button>` : ""}
          ${usuario.cargo === "admin" ? `<button class="btn-danger" onclick="apagarNotificacao('${item.id}')">Apagar aviso</button>` : ""}
        </div>
      </article>
    `;
  }).join("");
}

function marcarLida(id) {
  const notificacoes = lerJSONLocal("notificacoes", []);

  const atualizadas = notificacoes.map(item => {
    if (item.id !== id) return item;

    const lidaPor = item.lidaPor || [];

    if (!lidaPor.includes(usuario.id)) {
      lidaPor.push(usuario.id);
    }

    return {
      ...item,
      lidaPor
    };
  });

  salvarJSONLocal("notificacoes", atualizadas);
  renderizarNotificacoes();
}

function apagarNotificacao(id) {
  if (usuario.cargo !== "admin") {
    alert("Somente admin pode apagar avisos.");
    return;
  }

  const confirmar = confirm("Apagar este aviso interno?");

  if (!confirmar) return;

  const notificacoes = lerJSONLocal("notificacoes", []).filter(item => item.id !== id);
  salvarJSONLocal("notificacoes", notificacoes);
  renderizarNotificacoes();
}

renderizarNotificacoes();
