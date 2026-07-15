const usuario = protegerPagina();
if (bloquearAdminEmAreaLoja()) throw new Error("Admin bloqueado na área da loja.");
const lojaAtual = protegerLojaSelecionada();

const lojaPlanosAtual = document.getElementById("loja-planos-atual");
const planosLista = document.getElementById("planos-lista");
const assinaturaResumo = document.getElementById("assinatura-resumo-planos");

if (lojaPlanosAtual && lojaAtual) lojaPlanosAtual.innerHTML = lojaInlineHTML(lojaAtual);

if (usuario.cargo !== "admin") {
  alert("Área exclusiva da administração geral.");
  window.location.href = usuario.cargo === "admin" ? "admin-dashboard.html" : "dashboard.html";
  throw new Error("Área financeira restrita.");
}

let assinaturaAtual = null;

function moedaBR(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function statusAssinaturaTexto(status = "") {
  const mapa = {
    ativa: "Ativa",
    pendente: "Pendente",
    aguardando_pagamento: "Aguardando pagamento",
    vencida: "Vencida",
    cancelada: "Cancelada",
    teste: "Teste"
  };

  return mapa[status] || status || "Sem assinatura";
}

function renderizarResumoAssinatura() {
  if (!assinaturaResumo) return;

  if (!assinaturaAtual) {
    assinaturaResumo.innerHTML = `
      <div class="finance-status-card pendente">
        <strong>Sem plano ativo</strong>
        <p>Escolha um plano para gerar a assinatura da loja e as cobranças dos próximos 12 meses.</p>
      </div>
    `;
    return;
  }

  assinaturaResumo.innerHTML = `
    <div class="finance-status-card ${esc(assinaturaAtual.status)}">
      <strong>Plano atual: ${esc(assinaturaAtual.plano?.nome || "Plano")}</strong>
      <p>Status: ${esc(statusAssinaturaTexto(assinaturaAtual.status))}</p>
      <p>Próximo vencimento: ${esc(assinaturaAtual.proximoVencimento || "não definido")}</p>
      <a class="inline-link" href="minha-assinatura.html">Ver minha assinatura</a>
    </div>
  `;
}

function renderizarPlanos(planos) {
  if (!planosLista) return;

  planosLista.innerHTML = planos.map(plano => {
    const atual = assinaturaAtual?.plano?.codigo === plano.codigo;

    return `
      <article class="card plano-card ${plano.destaque ? "destaque" : ""}">
        ${plano.destaque ? `<span class="plano-tag">Mais indicado</span>` : ""}
        <h2>${esc(plano.nome)}</h2>
        <p class="muted">${esc(plano.descricao)}</p>

        <div class="plano-preco">
          <strong>${moedaBR(plano.valorMensal)}</strong>
          <span>/mês por loja</span>
        </div>

        <ul class="plano-recursos">
          ${(plano.recursos || []).map(recurso => `<li>${esc(recurso)}</li>`).join("")}
        </ul>

        <button type="button" ${atual ? "disabled" : ""} onclick="selecionarPlano('${esc(plano.codigo)}')">
          ${atual ? "Plano atual" : "Escolher plano"}
        </button>
      </article>
    `;
  }).join("");
}

async function selecionarPlano(codigo) {
  const confirmar = await confirmarAcao(
    "Ao confirmar, o sistema cria ou atualiza a assinatura da loja e gera as cobranças dos próximos 12 meses.",
    "Selecionar este plano?"
  );

  if (!confirmar) return;

  try {
    await valisysFinanceiro.assinarPlano({
      lojaId: lojaAtual.id,
      planoCodigo: codigo,
      usuarioNome: usuario.nome
    });

    alert("Plano selecionado. A assinatura ficará aguardando pagamento até a confirmação do Mercado Pago.");
    window.location.href = "minha-assinatura.html";
  } catch (erro) {
    console.error(erro);
    alert("Não foi possível atualizar o plano. Execute o SQL principal no Supabase e tente novamente.");
  }
}

window.selecionarPlano = selecionarPlano;

async function iniciarPlanos() {
  if (planosLista) planosLista.innerHTML = `<div class="card"><p class="muted">Carregando planos...</p></div>`;

  try {
    const [planos, assinatura] = await Promise.all([
      valisysFinanceiro.listarPlanos(),
      valisysFinanceiro.carregarMinhaAssinatura(lojaAtual.id).catch(() => ({ assinatura: null }))
    ]);

    assinaturaAtual = assinatura.assinatura || null;
    renderizarResumoAssinatura();
    renderizarPlanos(planos);
  } catch (erro) {
    console.error(erro);
    const planos = await valisysFinanceiro.listarPlanos();
    assinaturaAtual = null;
    renderizarResumoAssinatura();
    renderizarPlanos(planos);
  }
}

iniciarPlanos();
