const usuario = protegerPagina();
if (bloquearAdminEmAreaLoja()) throw new Error("Admin bloqueado na gestão da loja.");

if (!podeVerGestaoLoja(usuario.cargo)) {
  alert("Área disponível para gerente e encarregado.");
  window.location.href = "dashboard.html";
  throw new Error("Sem permissão para gestão da loja.");
}



const lojaAtual = protegerLojaSelecionada();

const gestaoLojaAtual = document.getElementById("gestao-loja-atual");
const gestaoSubtitulo = document.getElementById("gestao-loja-subtitulo");
const gestaoTitulo = document.getElementById("gestao-titulo");
const gestaoDescricao = document.getElementById("gestao-descricao");
const gestaoTextoVencimentos = document.getElementById("gestao-vencimentos-texto");

if (gestaoLojaAtual) gestaoLojaAtual.innerHTML = lojaInlineHTML(lojaAtual);
if (gestaoSubtitulo) gestaoSubtitulo.innerText = `${lojaAtual.grupo || "Sem grupo"} • ${lojaAtual.regiao || "Sem região"}`;

gestaoTitulo.innerText = usuario.cargo === "admin"
  ? "Administração da loja"
  : usuario.cargo === "gerente"
    ? "Gestão da loja"
    : "Gestão do encarregado";
gestaoDescricao.innerText = descricaoPermissaoGestao(usuario.cargo);
gestaoTextoVencimentos.innerText = usuario.cargo === "encarregado" && usuario.setor
  ? `Resumo filtrado pelo setor ${usuario.setor}.`
  : "Resumo de vencimentos ativos da loja.";

document.querySelectorAll("[data-gestao='gerente']").forEach(el => {
  if (!["gerente", "admin"].includes(usuario.cargo)) {
    el.style.display = "none";
  }
});

document.querySelectorAll("[data-role='produtos']").forEach(el => {
  if (!podeCadastrarProduto(usuario.cargo)) {
    el.style.display = "none";
  }
});

document.querySelectorAll("[data-role='funcionarios']").forEach(el => {
  if (!podeGerenciarFuncionarios(usuario.cargo)) {
    el.style.display = "none";
  }
});

function hojeISO() {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
}

function diasAte(validade) {
  const hoje = parseDataLocal(hojeISO());
  const data = parseDataLocal(validade);
  return Math.ceil((data - hoje) / (1000 * 60 * 60 * 24));
}

function contarPorCampo(lista, campo, fallback) {
  return lista.reduce((acc, item) => {
    const chave = String(item[campo] || fallback).trim() || fallback;
    acc[chave] = (acc[chave] || 0) + 1;
    return acc;
  }, {});
}

function renderizarGraficoBarras(container, dados, vazio = "Sem dados para mostrar.") {
  const entradas = Object.entries(dados)
    .filter(([, valor]) => Number(valor) > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  if (entradas.length === 0) {
    container.innerHTML = `<p class="muted">${vazio}</p>`;
    return;
  }

  const total = entradas.reduce((soma, [, valor]) => soma + Number(valor || 0), 0);
  const max = Math.max(...entradas.map(([, valor]) => valor), 1);

  container.innerHTML = entradas.map(([label, valor]) => {
    const pctBarra = Math.max(6, Math.round((valor / max) * 100));
    const pctTotal = total ? Math.round((valor / total) * 100) : 0;

    return `
      <div class="bar-row">
        <div class="bar-row-top">
          <span>${esc(label)}</span>
          <strong>${valor} • ${pctTotal}%</strong>
        </div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${pctBarra}%"></div>
        </div>
      </div>
    `;
  }).join("");
}

async function carregarGestao() {
  try {
    const limiteGestao = new Date();
    limiteGestao.setDate(limiteGestao.getDate() + 30);
    const limiteDataGestao = limiteGestao.toISOString().slice(0, 10);

    let lancamentos = await valisysDB.listarLancamentosDashboard({
      lojaId: lojaAtual.id,
      status: "ativo",
      limiteData: limiteDataGestao,
      limite: 160
    });

    if (usuario.cargo === "encarregado" && usuario.setor) {
      lancamentos = lancamentos.filter(item =>
        String(item.setor || "").toLowerCase() === String(usuario.setor || "").toLowerCase()
      );
    }

    const resumo = lancamentos.reduce((acc, item) => {
      const dias = diasAte(item.validade);

      if (dias < 0) acc.vencidos += 1;
      else if (dias === 0) acc.hoje += 1;
      else if (dias <= 7) acc.sete += 1;
      else if (dias <= 30) acc.trinta += 1;
      else acc.normal += 1;

      return acc;
    }, { vencidos: 0, hoje: 0, sete: 0, trinta: 0, normal: 0 });

    document.getElementById("gestao-vencidos").innerText = resumo.vencidos;
    document.getElementById("gestao-hoje").innerText = resumo.hoje;
    document.getElementById("gestao-7dias").innerText = resumo.sete;

    renderizarGraficoBarras(document.getElementById("gestao-grafico-prazos"), {
      "Vencidos": resumo.vencidos,
      "Vencem hoje": resumo.hoje,
      "Até 7 dias": resumo.sete,
      "Até 30 dias": resumo.trinta,
      "Sem urgência": resumo.normal
    });

    renderizarGraficoBarras(
      document.getElementById("gestao-grafico-setores"),
      contarPorCampo(lancamentos, "setor", "Sem setor")
    );

    if (["gerente", "admin"].includes(usuario.cargo)) {
      const funcionarios = await valisysDB.listarFuncionarios(lojaAtual.id, { limite: 80 });
      document.getElementById("gestao-equipe-qtd").innerText = funcionarios.length;

      const areaEquipe = document.getElementById("gestao-equipe-lista");

      if (funcionarios.length === 0) {
        areaEquipe.innerHTML = `<p class="muted">Nenhum funcionário cadastrado nesta loja.</p>`;
      } else {
        areaEquipe.innerHTML = funcionarios.map(func => `
          <div class="mini-row">
            <div>
              <strong>${esc(func.nome)}</strong>
              <p>${esc(nomeCargo(func.cargo))}${func.setor ? " • " + esc(func.setor) : ""}</p>
            </div>
            <span class="badge success">Ativo</span>
          </div>
        `).join("");
      }
    } else {
      document.getElementById("gestao-equipe-qtd").innerText = usuario.setor ? "Setor" : "-";
    }
  } catch (erro) {
    console.error(erro);
    alert("Erro ao carregar gestão da loja: " + erro.message);
  }
}

carregarGestao();
