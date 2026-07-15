const valisysFinanceiro = {
  client() {
    return getDadosOnlineClient();
  },

  planosPadrao() {
    return [
      {
        id: "inicial",
        codigo: "inicial",
        nome: "Inicial",
        descricao: "Para pequenos controles de vencimento.",
        valorMensal: 49,
        limiteLojas: 1,
        limiteUsuarios: 3,
        recursos: [
          "1 loja",
          "Até 3 usuários",
          "Lançamento de produtos",
          "Lista de vencimentos",
          "Leitura de EAN",
          "Foto do produto"
        ],
        destaque: false
      },
      {
        id: "operacional",
        codigo: "operacional",
        nome: "Operacional",
        descricao: "Para operação diária com equipe, setores e notificações.",
        valorMensal: 79,
        limiteLojas: 1,
        limiteUsuarios: 10,
        recursos: [
          "Tudo do Inicial",
          "Usuários por cargo",
          "Lista Geral completa",
          "Comunicados internos",
          "Painel da loja",
          "Notificações"
        ],
        destaque: true
      },
      {
        id: "profissional",
        codigo: "profissional",
        nome: "Profissional",
        descricao: "Para gestão completa com histórico, relatórios e suporte.",
        valorMensal: 119,
        limiteLojas: 1,
        limiteUsuarios: 25,
        recursos: [
          "Tudo do Operacional",
          "Relatórios",
          "Histórico de retiradas",
          "Permissões avançadas",
          "Exportação dos dados",
          "Backup mensal"
        ],
        destaque: false
      }
    ];
  },

  planoDBParaApp(plano = {}) {
    const recursos = Array.isArray(plano.recursos)
      ? plano.recursos
      : (() => {
          try {
            const parsed = JSON.parse(plano.recursos || "[]");
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })();

    return {
      id: plano.id || plano.codigo,
      codigo: plano.codigo || plano.id,
      nome: plano.nome || "",
      descricao: plano.descricao || "",
      valorMensal: Number(plano.valor_mensal ?? plano.valorMensal ?? 0),
      limiteLojas: Number(plano.limite_lojas ?? plano.limiteLojas ?? 1),
      limiteUsuarios: Number(plano.limite_usuarios ?? plano.limiteUsuarios ?? 0),
      recursos,
      destaque: Boolean(plano.destaque),
      ativo: plano.ativo !== false
    };
  },

  assinaturaDBParaApp(assinatura = {}) {
    if (!assinatura) return null;

    const plano = assinatura.plano || assinatura.financeiro_planos || assinatura.plano_info || null;

    return {
      id: assinatura.id || "",
      lojaId: assinatura.loja_id || assinatura.lojaId || "",
      planoId: assinatura.plano_id || assinatura.planoId || "",
      plano: plano ? this.planoDBParaApp(plano) : null,
      status: assinatura.status || "pendente",
      ciclo: assinatura.ciclo || "mensal",
      inicioEm: assinatura.inicio_em || assinatura.inicioEm || "",
      proximoVencimento: assinatura.proximo_vencimento || assinatura.proximoVencimento || "",
      canceladoEm: assinatura.cancelado_em || assinatura.canceladoEm || "",
      canceladoPor: assinatura.cancelado_por || assinatura.canceladoPor || "",
      criadoEm: assinatura.criado_em || assinatura.criadoEm || ""
    };
  },

  cobrancaDBParaApp(cobranca = {}) {
    return {
      id: cobranca.id || "",
      assinaturaId: cobranca.assinatura_id || cobranca.assinaturaId || "",
      lojaId: cobranca.loja_id || cobranca.lojaId || "",
      competencia: cobranca.competencia || "",
      descricao: cobranca.descricao || "",
      valor: Number(cobranca.valor || 0),
      vencimento: cobranca.vencimento || "",
      status: cobranca.status || "pendente",
      linkPagamento: cobranca.link_pagamento || cobranca.linkPagamento || "",
      boletoUrl: cobranca.boleto_url || cobranca.boletoUrl || "",
      linhaDigitavel: cobranca.linha_digitavel || cobranca.linhaDigitavel || "",
      pixCopiaCola: cobranca.pix_copia_cola || cobranca.pixCopiaCola || "",
      pagoEm: cobranca.pago_em || cobranca.pagoEm || "",
      meioPagamento: cobranca.meio_pagamento || cobranca.meioPagamento || "",
      mercadoPagoPreferenceId: cobranca.mercado_pago_preference_id || cobranca.mercadoPagoPreferenceId || "",
      mercadoPagoPaymentId: cobranca.mercado_pago_payment_id || cobranca.mercadoPagoPaymentId || "",
      mercadoPagoStatus: cobranca.mercado_pago_status || cobranca.mercadoPagoStatus || "",
      mercadoPagoInitPoint: cobranca.mercado_pago_init_point || cobranca.mercadoPagoInitPoint || "",
      mercadoPagoSandboxInitPoint: cobranca.mercado_pago_sandbox_init_point || cobranca.mercadoPagoSandboxInitPoint || ""
    };
  },

  meioPagamentoDBParaApp(meio = {}) {
    return {
      id: meio.id || "",
      tipo: meio.tipo || "outro",
      nome: meio.nome || "",
      descricao: meio.descricao || "",
      chavePix: meio.chave_pix || meio.chavePix || "",
      pixNomeRecebedor: meio.pix_nome_recebedor || meio.pixNomeRecebedor || "",
      linkPagamento: meio.link_pagamento || meio.linkPagamento || "",
      boletoUrl: meio.boleto_url || meio.boletoUrl || "",
      linhaDigitavel: meio.linha_digitavel || meio.linhaDigitavel || "",
      dadosBancarios: meio.dados_bancarios || meio.dadosBancarios || "",
      instrucoes: meio.instrucoes || "",
      ativo: meio.ativo !== false
    };
  },

  extrairJsonRpc(data) {
    if (Array.isArray(data)) return data[0] || {};
    return data || {};
  },

  async listarPlanos() {
    const db = this.client();

    try {
      const { data, error } = await db
        .from("financeiro_planos")
        .select("id, codigo, nome, descricao, valor_mensal, limite_lojas, limite_usuarios, recursos, destaque, ativo, ordem")
        .eq("ativo", true)
        .order("ordem", { ascending: true });

      if (error) throw error;

      const planos = (data || []).map(this.planoDBParaApp.bind(this));
      return planos.length ? planos : this.planosPadrao();
    } catch (erro) {
      console.warn("Planos financeiros ainda não estão no banco. Usando planos locais para visualização.", erro);
      return this.planosPadrao();
    }
  },

  async carregarMinhaAssinatura(lojaId) {
    const db = this.client();

    const { data, error } = await db.rpc("valisys_financeiro_minha_assinatura", {
      p_loja_id: lojaId
    });

    if (error) throw error;

    const payload = this.extrairJsonRpc(data);

    return {
      assinatura: payload.assinatura ? this.assinaturaDBParaApp(payload.assinatura) : null,
      cobrancas: (payload.cobrancas || []).map(this.cobrancaDBParaApp.bind(this)),
      meiosPagamento: (payload.meios_pagamento || []).map(this.meioPagamentoDBParaApp.bind(this))
    };
  },

  async assinarPlano({ lojaId, planoCodigo, usuarioNome = "" }) {
    const db = this.client();

    const { data, error } = await db.rpc("valisys_financeiro_assinar_plano", {
      p_loja_id: lojaId,
      p_plano_codigo: planoCodigo,
      p_criado_por: usuarioNome
    });

    if (error) throw error;

    const payload = this.extrairJsonRpc(data);

    return {
      assinatura: payload.assinatura ? this.assinaturaDBParaApp(payload.assinatura) : null,
      cobrancas: (payload.cobrancas || []).map(this.cobrancaDBParaApp.bind(this)),
      meiosPagamento: (payload.meios_pagamento || []).map(this.meioPagamentoDBParaApp.bind(this))
    };
  },

  async registrarSolicitacaoPagamento({ cobrancaId, meioId, usuarioNome = "", usuarioCargo = "" }) {
    const db = this.client();

    const { data, error } = await db.rpc("valisys_financeiro_registrar_solicitacao_pagamento", {
      p_cobranca_id: cobrancaId,
      p_meio_id: meioId,
      p_usuario_nome: usuarioNome,
      p_usuario_cargo: usuarioCargo
    });

    if (error) throw error;

    return this.extrairJsonRpc(data);
  },

  async cancelarAssinatura({ lojaId, usuarioNome = "", usuarioCargo = "" }) {
    const db = this.client();

    const { data, error } = await db.rpc("valisys_financeiro_cancelar_assinatura", {
      p_loja_id: lojaId,
      p_cancelado_por: usuarioNome,
      p_cancelado_cargo: usuarioCargo
    });

    if (error) throw error;

    const payload = this.extrairJsonRpc(data);

    return {
      assinatura: payload.assinatura ? this.assinaturaDBParaApp(payload.assinatura) : null,
      cobrancas: (payload.cobrancas || []).map(this.cobrancaDBParaApp.bind(this)),
      meiosPagamento: (payload.meios_pagamento || []).map(this.meioPagamentoDBParaApp.bind(this))
    };
  },

  async criarPagamentoMercadoPago({ cobrancaId, lojaId, usuarioNome = "" }) {
    const db = this.client();

    const { data, error } = await db.functions.invoke("mercado-pago-create-payment", {
      body: {
        cobrancaId,
        lojaId,
        usuarioNome,
        origem: location.origin
      }
    });

    if (error) throw error;
    if (!data?.ok) throw new Error(data?.erro || "Não foi possível gerar pagamento no Mercado Pago.");

    return data;
  }
};
