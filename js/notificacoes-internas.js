const usuario = protegerPagina();
const lojaAtual = protegerLojaSelecionada();

if (!podeVerNotificacoes(usuario.cargo)) {
  alert("Você não tem permissão para ver notificações internas.");
  window.location.href = "dashboard.html";
}

const lojaEl = document.getElementById("loja-notificacao-atual");
if (lojaEl && lojaAtual) lojaEl.innerText = lojaAtual.nome;

const lista = document.getElementById("lista-notificacoes");

async function renderizarNotificacoes() {
  lista.innerHTML = `<div class="card"><p class="muted">Carregando notificações do Supabase...</p></div>`;

  try {
    const notificacoes = await valisysDB.listarNotificacoes(lojaAtual.id);

    if (notificacoes.length === 0) {
      lista.innerHTML = `
        <div class="card">
          <p>Nenhum aviso interno encontrado no Supabase para esta loja.</p>
        </div>
      `;
      return;
    }

    lista.innerHTML = notificacoes.map(item => {
      const lida = Boolean(item.lida);

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
  } catch (erro) {
    console.error(erro);
    lista.innerHTML = `
      <div class="card">
        <p class="danger">Erro ao carregar notificações do Supabase.</p>
        <p class="muted">${esc(erro.message)}</p>
      </div>
    `;
  }
}

async function marcarLida(id) {
  try {
    await valisysDB.marcarNotificacaoLida(id);
    await renderizarNotificacoes();
  } catch (erro) {
    alert("Erro ao marcar como lida: " + erro.message);
  }
}

async function apagarNotificacao(id) {
  if (usuario.cargo !== "admin") {
    alert("Somente admin pode apagar avisos.");
    return;
  }

  const confirmar = confirm("Apagar este aviso interno do Supabase?");

  if (!confirmar) return;

  try {
    await valisysDB.apagarNotificacao(id);
    await renderizarNotificacoes();
  } catch (erro) {
    alert("Erro ao apagar aviso: " + erro.message);
  }
}

renderizarNotificacoes();
