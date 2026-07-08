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

  carregarResumoInicial();
}

function carregarResumoInicial() {
  const lembretesArea = document.getElementById("lembretes-vencimento");
  const textoLembrete = document.getElementById("texto-lembrete");

  let lancamentos = JSON.parse(localStorage.getItem("lancamentos")) || [];

  // Promotor vê lembrete apenas dos produtos que ele lançou.
  // Encarregado, gerente e admin veem lembretes da equipe toda.
  if (!podeVerListaGeral(usuario.cargo)) {
    lancamentos = lancamentos.filter(item => item.usuarioId === usuario.id);
    textoLembrete.innerText = "Mostrando somente os produtos lançados por você.";
  } else {
    textoLembrete.innerText = "Mostrando os produtos lançados pela equipe.";
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const produtos = JSON.parse(localStorage.getItem("produtos")) || [];

  const lancamentosComDias = lancamentos.map(item => {
    const validade = parseDataLocal(item.validade);
    const dias = Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));

    const produtoLocal = produtos.find(p => p.ean === item.ean);

    return {
      ...item,
      dias,
      fotoFinal: item.foto || produtoLocal?.foto || ""
    };
  });

  const vencidos = lancamentosComDias.filter(item => item.dias < 0);
  const hojeLista = lancamentosComDias.filter(item => item.dias === 0);
  const seteDias = lancamentosComDias.filter(item => item.dias > 0 && item.dias <= 7);
  const trintaDias = lancamentosComDias.filter(item => item.dias > 7 && item.dias <= 30);

  document.getElementById("qtd-vencidos").innerText = vencidos.length;
  document.getElementById("qtd-hoje").innerText = hojeLista.length;
  document.getElementById("qtd-7dias").innerText = seteDias.length;
  document.getElementById("qtd-30dias").innerText = trintaDias.length;

  const prioridade = [...vencidos, ...hojeLista, ...seteDias, ...trintaDias]
    .sort((a, b) => a.dias - b.dias)
    .slice(0, 8);

  if (prioridade.length === 0) {
    lembretesArea.innerHTML = `
      <div class="empty-state">
        <span>✅</span>
        <p>Nenhum vencimento urgente encontrado.</p>
      </div>
    `;
    return;
  }

  lembretesArea.innerHTML = prioridade.map(item => {
    let etiqueta = "";
    let classe = "";

    if (item.dias < 0) {
      etiqueta = `Vencido há ${Math.abs(item.dias)} dia(s)`;
      classe = "danger";
    } else if (item.dias === 0) {
      etiqueta = "Vence hoje";
      classe = "danger";
    } else if (item.dias <= 7) {
      etiqueta = `Faltam ${item.dias} dia(s)`;
      classe = "warning";
    } else {
      etiqueta = `Faltam ${item.dias} dia(s)`;
      classe = "success";
    }

    return `
      <article class="lembrete-item">
        <div class="lembrete-foto">
          ${
            item.fotoFinal
              ? `<img src="${item.fotoFinal}" alt="${esc(item.nomeProduto)}">`
              : `<span>📦</span>`
          }
        </div>

        <div class="lembrete-info">
          <h3>${esc(item.nomeProduto)}</h3>
          <p>${esc(item.setor)} • Qtd: ${esc(item.quantidade)}</p>
          <p class="muted">Validade: ${esc(item.validade)}</p>
          <p class="muted">Lançado por: ${esc(item.usuarioNome)}</p>
        </div>

        <span class="badge ${classe}">${etiqueta}</span>
      </article>
    `;
  }).join("");
}
