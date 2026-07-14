const usuario = protegerPagina();
if (bloquearAdminEmAreaLoja()) throw new Error('Admin bloqueado na área da loja.');

if (usuario) {
  const lojaAtual = protegerLojaSelecionada();

  if (!lojaAtual) {
    throw new Error("Loja não selecionada.");
  }

  const marcaTextoPromotor = usuario.cargo === "promotor" && usuario.marcaPromotoria
    ? ` • Marca: ${usuario.marcaPromotoria}`
    : "";

  document.getElementById("welcome-title").innerText = `Olá, ${usuario.nome}`;
  document.getElementById("welcome-role").innerText = `Cargo: ${nomeCargo(usuario.cargo)}${usuario.setor ? " • Setor: " + usuario.setor : ""}${marcaTextoPromotor}`;

  document.getElementById("sidebar-nome").innerText = usuario.nome;
  document.getElementById("sidebar-cargo").innerText = `${nomeCargo(usuario.cargo)}${usuario.setor ? " • " + usuario.setor : ""}${marcaTextoPromotor}`;

  const lojaNomeEl = document.getElementById("loja-atual-nome");
  if (lojaNomeEl) lojaNomeEl.innerText = lojaAtual.nome;

  const lojaLogoEl = document.getElementById("loja-atual-logo");
  if (lojaLogoEl) lojaLogoEl.innerHTML = logoLojaHTML(lojaAtual, "loja-logo-dashboard");


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

  document.querySelectorAll("[data-role='funcionarios']").forEach(el => {
    if (!podeGerenciarFuncionarios(usuario.cargo)) {
      el.style.display = "none";
    }
  });

  document.querySelectorAll("[data-role='admin']").forEach(el => {
    if (usuario.cargo !== "admin") {
      el.style.display = "none";
    }
  });

  document.querySelectorAll("[data-role='gestao-loja']").forEach(el => {
    if (!podeVerGestaoLoja(usuario.cargo)) {
      el.style.display = "none";
    }
  });

  prepararLembretesSobDemanda();
}


function prepararLembretesSobDemanda() {
  const bloco = document.querySelector(".lembretes-collapse");
  const lembretesArea = document.getElementById("lembretes-vencimento");
  const textoLembrete = document.getElementById("texto-lembrete");

  ["qtd-vencidos", "qtd-hoje", "qtd-7dias", "qtd-30dias"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerText = "—";
  });

  if (textoLembrete) {
    textoLembrete.innerText = "Abra esta área somente quando precisar carregar os vencimentos.";
  }

  if (lembretesArea) {
    lembretesArea.innerHTML = `
      <div class="empty-state">
        <span>⚡</span>
        <p>Lembretes em modo leve.</p>
        <p class="muted">Para acelerar o dashboard, os vencimentos só são buscados quando você abre esta área.</p>
      </div>
    `;
  }

  if (!bloco) return;

  bloco.open = false;
  bloco.dataset.carregado = "false";

  bloco.addEventListener("toggle", () => {
    if (bloco.open && bloco.dataset.carregado !== "true") {
      bloco.dataset.carregado = "true";
      carregarResumoInicial();
    }
  });
}


async function carregarResumoInicial() {
  const lembretesArea = document.getElementById("lembretes-vencimento");
  const textoLembrete = document.getElementById("texto-lembrete");

  if (!lembretesArea) return;

  lembretesArea.innerHTML = `<div class="card"><p class="muted">Carregando vencimentos próximos...</p></div>`;

  try {
    const lojaAtual = getLojaAtual();

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const limite = new Date(hoje);
    limite.setDate(limite.getDate() + 30);
    const limiteISO = limite.toISOString().slice(0, 10);

    let lancamentos = await valisysDB.listarLancamentosDashboard({
      lojaId: lojaAtual.id,
      status: "ativo",
      limiteData: limiteISO,
      limite: 120
    });

    if (!podeVerListaGeral(usuario.cargo)) {
      lancamentos = lancamentos.filter(item =>
        String(item.usuarioNome || "").toLowerCase() === String(usuario.nome || "").toLowerCase() &&
        item.usuarioCargo === usuario.cargo
      );
      if (textoLembrete) textoLembrete.innerText = "Mostrando somente vencimentos próximos lançados por você.";
    } else if (usuario.cargo === "encarregado" && usuario.setor) {
      lancamentos = lancamentos.filter(item =>
        String(item.setor || "").toLowerCase() === String(usuario.setor || "").toLowerCase()
      );
      if (textoLembrete) textoLembrete.innerText = `Mostrando vencimentos próximos do setor ${usuario.setor}.`;
    } else {
      if (textoLembrete) textoLembrete.innerText = "Mostrando vencimentos próximos da equipe.";
    }

    const lancamentosComDias = lancamentos.map(item => {
      const validade = parseDataLocal(item.validade);
      const dias = Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));

      return {
        ...item,
        dias,
        marcaFinal: item.marca || "",
        gramagemFinal: item.gramagem || item.quantidadePadrao || "",
        saborFinal: item.sabor || "",
        categoriaFinal: item.categoria || "",
        fotoFinal: item.foto || ""
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
        classe: "danger"
      },
      {
        titulo: "📅 Vencem hoje",
        descricao: "Itens que precisam de ação imediata",
        itens: hojeLista.sort((a, b) => a.nomeProduto.localeCompare(b.nomeProduto)),
        classe: "danger"
      },
      {
        titulo: "⏳ Até 7 dias",
        descricao: "Produtos próximos do vencimento",
        itens: seteDias.sort((a, b) => a.dias - b.dias),
        classe: "warning"
      },
      {
        titulo: "🗓️ Até 30 dias",
        descricao: "Produtos para acompanhar com calma",
        itens: trintaDias.sort((a, b) => a.dias - b.dias),
        classe: "success"
      }
    ];

    const gruposComItens = grupos.filter(grupo => grupo.itens.length > 0);

    if (gruposComItens.length === 0) {
      lembretesArea.innerHTML = `
        <div class="empty-state">
          <span>✅</span>
          <p>Nenhum vencimento próximo encontrado nesta loja.</p>
          <p class="muted">O dashboard carrega somente itens vencidos ou até 30 dias para ficar rápido.</p>
          <a class="mini-link" href="lista-geral.html">Ver Lista Geral</a>
        </div>
      `;
      return;
    }

    const avisoLimite = lancamentosComDias.length >= 320
      ? `<p class="muted mais-itens">Mostrando os primeiros 120 itens próximos. Use a Lista completa para buscar mais.</p>`
      : "";

    lembretesArea.innerHTML = avisoLimite + gruposComItens.map(grupo => renderizarGrupoLembrete(grupo)).join("");
  } catch (erro) {
    console.error(erro);
    document.getElementById("qtd-vencidos").innerText = "—";
    document.getElementById("qtd-hoje").innerText = "—";
    document.getElementById("qtd-7dias").innerText = "—";
    document.getElementById("qtd-30dias").innerText = "—";

    const mensagem = String(erro.message || "");

    lembretesArea.innerHTML = `
      <div class="card">
        <p class="danger">Não foi possível atualizar os lembretes agora, O restante do sistema permanece disponível.</p>
        <p class="muted">${esc(mensagem.includes("timeout") ? "O banco demorou demais para responder. Execute o SQL principal para criar os índices e tente novamente." : mensagem)}</p>
        <a class="mini-link" href="lista-geral.html">Abrir Lista Geral</a>
      </div>
    `;
  }
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
        ${(item.marcaFinal || item.gramagemFinal || item.saborFinal) ? `<p>${esc([item.marcaFinal, item.gramagemFinal, item.saborFinal].filter(Boolean).join(" • "))}</p>` : ""}
        <p>${esc(item.setor)} • Qtd: ${esc(item.quantidade)}${item.isCaixa ? " caixa(s)" : " item(ns)"}</p>
        <p class="muted">Validade: ${esc(item.validade)}</p>
        <p class="muted">Lançado por: ${esc(item.usuarioNome)}</p>
      </div>
    </article>
  `;
}

