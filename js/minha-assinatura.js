const usuario = protegerPagina();
if (bloquearAdminEmAreaLoja()) throw new Error("Admin bloqueado na área da loja.");
const lojaAtual = protegerLojaSelecionada();

const lojaAssinaturaAtual = document.getElementById("loja-assinatura-atual");
const assinaturaResumo = document.getElementById("assinatura-resumo");
const cobrancasLista = document.getElementById("cobrancas-12-meses");
const modalPagamento = document.getElementById("modal-pagamento");
const modalPagamentoConteudo = document.getElementById("modal-pagamento-conteudo");

if (lojaAssinaturaAtual && lojaAtual) lojaAssinaturaAtual.innerHTML = lojaInlineHTML(lojaAtual);

if (!["gerente", "admin"].includes(usuario.cargo)) {
  alert("Somente gerente ou admin podem acessar a assinatura da loja.");
  window.location.href = "dashboard.html";
  throw new Error("Área financeira restrita.");
}

let assinaturaAtual = null;
let cobrancasCache = [];
let meiosCache = [];

function moedaBR(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function dataBR(dataISO = "") {
  if (!dataISO) return "—";
  const partes = String(dataISO).slice(0, 10).split("-");
  if (partes.length !== 3) return dataISO;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function mesCompetencia(dataISO = "") {
  if (!dataISO) return "—";
  const data = parseDataLocal(String(dataISO).slice(0, 10));
  return data.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric"
  });
}

function statusTexto(status = "") {
  const mapa = {
    ativa: "Ativa",
    pendente: "Pendente",
    aguardando_pagamento: "Aguardando pagamento",
    vencida: "Vencida",
    cancelada: "Cancelada",
    pago: "Pago",
    recebido: "Recebido",
    teste: "Teste"
  };

  return mapa[status] || status || "Pendente";
}

function statusClasse(status = "") {
  if (["pago", "recebido", "ativa"].includes(status)) return "pago";
  if (["vencida", "cancelada"].includes(status)) return "vencida";
  if (["aguardando_pagamento"].includes(status)) return "aguardando";
  return "pendente";
}

function renderizarAssinatura() {
  if (!assinaturaResumo) return;

  if (!assinaturaAtual) {
    assinaturaResumo.innerHTML = `
      <div class="finance-status-card pendente">
        <strong>Esta loja ainda não tem assinatura.</strong>
        <p>Escolha um plano para gerar as cobranças dos próximos 12 meses.</p>
        <a class="button-link" href="planos.html">Ver planos</a>
      </div>
    `;
    return;
  }

  assinaturaResumo.innerHTML = `
    <div class="finance-status-card ${statusClasse(assinaturaAtual.status)}">
      <div>
        <span class="finance-label">Plano atual</span>
        <h2>${esc(assinaturaAtual.plano?.nome || "Plano")}</h2>
        <p>${esc(assinaturaAtual.plano?.descricao || "")}</p>
      </div>

      <div class="finance-info-grid">
        <p><strong>Status:</strong> ${esc(statusTexto(assinaturaAtual.status))}</p>
        <p><strong>Valor:</strong> ${moedaBR(assinaturaAtual.plano?.valorMensal || 0)} / mês</p>
        <p><strong>Próximo vencimento:</strong> ${dataBR(assinaturaAtual.proximoVencimento)}</p>
        <p><strong>Ciclo:</strong> ${esc(assinaturaAtual.ciclo || "mensal")}</p>
      </div>

      <a class="inline-link" href="planos.html">Trocar plano</a>
    </div>
  `;
}

function renderizarCobrancas() {
  if (!cobrancasLista) return;

  if (!assinaturaAtual) {
    cobrancasLista.innerHTML = `
      <div class="card">
        <p class="muted">Nenhuma cobrança disponível enquanto a loja não tiver plano.</p>
      </div>
    `;
    return;
  }

  if (!cobrancasCache.length) {
    cobrancasLista.innerHTML = `
      <div class="card">
        <p><strong>Nenhuma cobrança encontrada.</strong></p>
        <p class="muted">Abra a página de planos e selecione um plano para gerar os próximos 12 meses.</p>
        <a class="button-link" href="planos.html">Ver planos</a>
      </div>
    `;
    return;
  }

  cobrancasLista.innerHTML = cobrancasCache.map(cobranca => {
    const paga = ["pago", "recebido"].includes(cobranca.status);
    const classe = statusClasse(cobranca.status);

    return `
      <article class="card cobranca-card ${classe}">
        <div>
          <span class="finance-label">${esc(mesCompetencia(cobranca.competencia))}</span>
          <h3>${esc(cobranca.descricao || "Mensalidade ValiSys")}</h3>
          <p class="muted">Vencimento: ${dataBR(cobranca.vencimento)}</p>
        </div>

        <div class="cobranca-meta">
          <strong>${moedaBR(cobranca.valor)}</strong>
          <span class="badge-finance ${classe}">${esc(statusTexto(cobranca.status))}</span>
        </div>

        ${paga ? `
          <p class="muted">Pagamento registrado em ${dataBR(cobranca.pagoEm)}.</p>
        ` : `
          <button type="button" onclick="abrirPagamento('${esc(cobranca.id)}')">Pagar</button>
        `}
      </article>
    `;
  }).join("");
}

function fecharPagamento() {
  if (!modalPagamento) return;
  modalPagamento.classList.remove("active");
  modalPagamento.setAttribute("aria-hidden", "true");
  if (modalPagamentoConteudo) modalPagamentoConteudo.innerHTML = "";
}

window.fecharPagamento = fecharPagamento;

function detalhesMeioHTML(meio, cobranca) {
  const valor = moedaBR(cobranca.valor);

  if (meio.tipo === "pix") {
    return `
      <div class="payment-details">
        <p><strong>Valor:</strong> ${valor}</p>
        ${meio.chavePix ? `<p><strong>Chave PIX:</strong> <code>${esc(meio.chavePix)}</code></p>` : ""}
        ${meio.pixNomeRecebedor ? `<p><strong>Recebedor:</strong> ${esc(meio.pixNomeRecebedor)}</p>` : ""}
        ${cobranca.pixCopiaCola ? `<p><strong>PIX copia e cola:</strong></p><textarea readonly>${esc(cobranca.pixCopiaCola)}</textarea>` : ""}
        ${meio.instrucoes ? `<p class="muted">${esc(meio.instrucoes)}</p>` : ""}
        ${meio.chavePix ? `<button type="button" class="secondary" onclick="copiarTexto('${esc(meio.chavePix)}')">Copiar chave PIX</button>` : ""}
      </div>
    `;
  }

  if (meio.tipo === "boleto") {
    return `
      <div class="payment-details">
        <p><strong>Valor:</strong> ${valor}</p>
        ${cobranca.linhaDigitavel || meio.linhaDigitavel ? `<p><strong>Linha digitável:</strong></p><textarea readonly>${esc(cobranca.linhaDigitavel || meio.linhaDigitavel)}</textarea>` : ""}
        ${cobranca.boletoUrl || meio.boletoUrl ? `<a class="button-link" target="_blank" rel="noopener" href="${esc(cobranca.boletoUrl || meio.boletoUrl)}">Abrir boleto</a>` : ""}
        ${meio.instrucoes ? `<p class="muted">${esc(meio.instrucoes)}</p>` : ""}
      </div>
    `;
  }

  if (meio.tipo === "link" || meio.tipo === "cartao") {
    const link = cobranca.linkPagamento || meio.linkPagamento;

    return `
      <div class="payment-details">
        <p><strong>Valor:</strong> ${valor}</p>
        ${link ? `<a class="button-link" target="_blank" rel="noopener" href="${esc(link)}">Abrir link de pagamento</a>` : ""}
        ${meio.instrucoes ? `<p class="muted">${esc(meio.instrucoes)}</p>` : ""}
      </div>
    `;
  }

  if (meio.tipo === "transferencia") {
    return `
      <div class="payment-details">
        <p><strong>Valor:</strong> ${valor}</p>
        ${meio.dadosBancarios ? `<p><strong>Dados bancários:</strong></p><textarea readonly>${esc(meio.dadosBancarios)}</textarea>` : ""}
        ${meio.instrucoes ? `<p class="muted">${esc(meio.instrucoes)}</p>` : ""}
      </div>
    `;
  }

  return `
    <div class="payment-details">
      <p><strong>Valor:</strong> ${valor}</p>
      ${meio.instrucoes ? `<p class="muted">${esc(meio.instrucoes)}</p>` : ""}
    </div>
  `;
}

async function escolherMeioPagamento(cobrancaId, meioId) {
  const cobranca = cobrancasCache.find(item => item.id === cobrancaId);
  const meio = meiosCache.find(item => item.id === meioId);

  if (!cobranca || !meio || !modalPagamentoConteudo) return;

  try {
    await valisysFinanceiro.registrarSolicitacaoPagamento({
      cobrancaId,
      meioId,
      usuarioNome: usuario.nome,
      usuarioCargo: usuario.cargo
    });
  } catch (erro) {
    console.warn("Não foi possível registrar solicitação de pagamento. Mostrando instruções mesmo assim.", erro);
  }

  modalPagamentoConteudo.innerHTML = `
    <div class="payment-modal-header">
      <div>
        <span class="finance-label">Pagamento</span>
        <h2>${esc(meio.nome)}</h2>
      </div>
      <button type="button" class="secondary small-btn" onclick="fecharPagamento()">Fechar</button>
    </div>

    ${detalhesMeioHTML(meio, cobranca)}

    <div class="payment-warning">
      <strong>Depois do pagamento</strong>
      <p>O pagamento pode precisar de conferência manual. Quando for confirmado, o status da cobrança será atualizado.</p>
    </div>
  `;
}

window.escolherMeioPagamento = escolherMeioPagamento;

function abrirPagamento(cobrancaId) {
  const cobranca = cobrancasCache.find(item => item.id === cobrancaId);

  if (!cobranca || !modalPagamento || !modalPagamentoConteudo) return;

  const meiosAtivos = meiosCache.filter(meio => meio.ativo);

  modalPagamento.classList.add("active");
  modalPagamento.setAttribute("aria-hidden", "false");

  modalPagamentoConteudo.innerHTML = `
    <div class="payment-modal-header">
      <div>
        <span class="finance-label">Escolha como pagar</span>
        <h2>${moedaBR(cobranca.valor)}</h2>
        <p class="muted">${esc(cobranca.descricao || "Mensalidade")} • vencimento ${dataBR(cobranca.vencimento)}</p>
      </div>
      <button type="button" class="secondary small-btn" onclick="fecharPagamento()">Fechar</button>
    </div>

    ${meiosAtivos.length ? `
      <div class="payment-methods">
        ${meiosAtivos.map(meio => `
          <button type="button" class="payment-method-btn" onclick="escolherMeioPagamento('${esc(cobranca.id)}', '${esc(meio.id)}')">
            <strong>${esc(meio.nome)}</strong>
            <span>${esc(meio.descricao || meio.tipo)}</span>
          </button>
        `).join("")}
      </div>
    ` : `
      <div class="card no-shadow">
        <p><strong>Nenhum meio de pagamento ativo.</strong></p>
        <p class="muted">Configure PIX, boleto, link ou transferência na tabela financeiro_meios_pagamento.</p>
      </div>
    `}
  `;
}

window.abrirPagamento = abrirPagamento;

async function copiarTexto(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    alert("Copiado.");
  } catch {
    alert("Não foi possível copiar automaticamente.");
  }
}

window.copiarTexto = copiarTexto;

async function carregarAssinatura() {
  if (assinaturaResumo) assinaturaResumo.innerHTML = `<div class="card"><p class="muted">Carregando assinatura...</p></div>`;
  if (cobrancasLista) cobrancasLista.innerHTML = `<div class="card"><p class="muted">Carregando cobranças...</p></div>`;

  try {
    const dados = await valisysFinanceiro.carregarMinhaAssinatura(lojaAtual.id);

    assinaturaAtual = dados.assinatura;
    cobrancasCache = dados.cobrancas || [];
    meiosCache = dados.meiosPagamento || [];

    renderizarAssinatura();
    renderizarCobrancas();
  } catch (erro) {
    console.error(erro);

    if (assinaturaResumo) {
      assinaturaResumo.innerHTML = `
        <div class="finance-status-card vencida">
          <strong>Não foi possível carregar a assinatura.</strong>
          <p>Rode o SQL principal atualizado no Supabase para criar o módulo financeiro.</p>
          <a class="button-link" href="planos.html">Ver planos</a>
        </div>
      `;
    }

    if (cobrancasLista) cobrancasLista.innerHTML = "";
  }
}

carregarAssinatura();
