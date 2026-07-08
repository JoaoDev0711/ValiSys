const usuario = protegerPagina();

if (usuario) {
  const lojaAtual = protegerLojaSelecionada();

  if (!lojaAtual) {
    throw new Error("Loja não selecionada.");
  }

  document.getElementById("welcome-title").innerText = `Olá, ${usuario.nome}`;
  document.getElementById("welcome-role").innerText = `Cargo: ${nomeCargo(usuario.cargo)}`;

  document.getElementById("sidebar-nome").innerText = usuario.nome;
  document.getElementById("sidebar-cargo").innerText = nomeCargo(usuario.cargo);

  const lojaNomeEl = document.getElementById("loja-atual-nome");
  if (lojaNomeEl) lojaNomeEl.innerText = lojaAtual.nome;

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
  const lojaAtual = getLojaAtual();

  // Compatibilidade com dados antigos sem lojaId.
  lancamentos = lancamentos.filter(item => !item.lojaId || item.lojaId === lojaAtual.id);

  if (!podeVerListaGeral(usuario.cargo)) {
    lancamentos = lancamentos.filter(item => item.usuarioId === usuario.id);
    textoLembrete.innerText = "Mostrando somente os produtos lançados por você.";
  } else {
    textoLembrete.innerText = "Mostrando os produtos lançados pela equipe desta loja.";
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
      marcaFinal: item.marca || produtoLocal?.marca || "",
      fabricanteFinal: item.fabricante || produtoLocal?.fabricante || "",
      saborFinal: item.sabor || produtoLocal?.sabor || "",
      categoriaFinal: produtoLocal?.categoria || "",
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

  const grupos = [
    {
      titulo: "🚨 Vencidos",
      descricao: "Produtos que já passaram da validade",
      itens: vencidos.sort((a, b) => a.dias - b.dias),
      classe: "danger",
      vazio: "Nenhum produto vencido."
    },
    {
      titulo: "📅 Vencem hoje",
      descricao: "Itens que precisam de ação imediata",
      itens: hojeLista.sort((a, b) => a.nomeProduto.localeCompare(b.nomeProduto)),
      classe: "danger",
      vazio: "Nenhum produto vence hoje."
    },
    {
      titulo: "⏳ Até 7 dias",
      descricao: "Produtos próximos do vencimento",
      itens: seteDias.sort((a, b) => a.dias - b.dias),
      classe: "warning",
      vazio: "Nenhum produto vence em até 7 dias."
    },
    {
      titulo: "🗓️ Até 30 dias",
      descricao: "Produtos para acompanhar com calma",
      itens: trintaDias.sort((a, b) => a.dias - b.dias),
      classe: "success",
      vazio: "Nenhum produto vence em até 30 dias."
    }
  ];

  const gruposComItens = grupos.filter(grupo => grupo.itens.length > 0);

  if (gruposComItens.length === 0) {
    lembretesArea.innerHTML = `
      <div class="empty-state">
        <span>✅</span>
        <p>Nenhum vencimento urgente encontrado.</p>
      </div>
    `;
    return;
  }

  lembretesArea.innerHTML = gruposComItens.map(grupo => renderizarGrupoLembrete(grupo)).join("");
}

function renderizarGrupoLembrete(grupo) {
  const subgrupos = agruparPorDias(grupo.itens);
  const total = grupo.itens.length;

  return `
    <section class="grupo-lembrete ${grupo.classe}">
      <div class="grupo-lembrete-topo">
        <div>
          <h3>${grupo.titulo}</h3>
          <p>${grupo.descricao}</p>
        </div>
        <span class="badge ${grupo.classe}">${total} item(ns)</span>
      </div>

      <div class="grupo-dias">
        ${subgrupos.map(subgrupo => renderizarSubgrupoDias(subgrupo, grupo.classe)).join("")}
      </div>
    </section>
  `;
}

function agruparPorDias(itens) {
  const mapa = {};

  itens.forEach(item => {
    let chave = "";

    if (item.dias < 0) {
      chave = `Vencido há ${Math.abs(item.dias)} dia(s)`;
    } else if (item.dias === 0) {
      chave = "Vence hoje";
    } else {
      chave = `Faltam ${item.dias} dia(s)`;
    }

    if (!mapa[chave]) {
      mapa[chave] = {
        titulo: chave,
        dias: item.dias,
        itens: []
      };
    }

    mapa[chave].itens.push(item);
  });

  return Object.values(mapa).sort((a, b) => a.dias - b.dias);
}

function renderizarSubgrupoDias(subgrupo, classe) {
  const itensHTML = subgrupo.itens
    .sort((a, b) => a.nomeProduto.localeCompare(b.nomeProduto))
    .slice(0, 8)
    .map(item => renderizarItemLembrete(item))
    .join("");

  const restante = subgrupo.itens.length > 8
    ? `<p class="muted mais-itens">+ ${subgrupo.itens.length - 8} item(ns) neste prazo.</p>`
    : "";

  return `
    <details class="subgrupo-dia" open>
      <summary>
        <strong>${esc(subgrupo.titulo)}</strong>
        <span class="badge ${classe}">${subgrupo.itens.length}</span>
      </summary>

      <div class="subgrupo-itens">
        ${itensHTML}
        ${restante}
      </div>
    </details>
  `;
}

function renderizarItemLembrete(item) {
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
        ${(item.marcaFinal || item.fabricanteFinal || item.saborFinal) ? `<p>${esc([item.marcaFinal, item.fabricanteFinal, item.saborFinal].filter(Boolean).join(" • "))}</p>` : ""}
        <p>${esc(item.setor)} • Qtd: ${esc(item.quantidade)}</p>
        <p class="muted">Validade: ${esc(item.validade)}</p>
        <p class="muted">Lançado por: ${esc(item.usuarioNome)}</p>
      </div>
    </article>
  `;
}
