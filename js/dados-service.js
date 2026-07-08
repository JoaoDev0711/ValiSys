/*
  ValiSys - Serviço de dados online
  Nesta versão, lojas, funcionários, produtos, lançamentos e notificações
  são salvos na base online do sistema.
*/

const valisysDB = {
  client() {
    return getDadosOnlineClient();
  },

  async testarConexao() {
    const db = this.client();

    const { error } = await db
      .from("lojas")
      .select("id")
      .limit(1);

    if (error) throw error;

    return true;
  },

  async listarLojas() {
    const db = this.client();

    const { data, error } = await db
      .from("lojas")
      .select("*")
      .eq("status", "ativa")
      .order("nome", { ascending: true });

    if (error) throw error;

    return (data || []).map(this.lojaDBParaApp);
  },

  async listarTodasLojas() {
    const db = this.client();

    const { data, error } = await db
      .from("lojas")
      .select("*")
      .order("nome", { ascending: true });

    if (error) throw error;

    return (data || []).map(this.lojaDBParaApp);
  },

  async criarLoja({ nome, responsavel, imagem = "", regiao = "", grupo = "", corTema = "" }) {
    const db = this.client();

    const payloadCompleto = {
      nome,
      responsavel,
      imagem,
      regiao,
      grupo,
      cor_tema: corTema,
      status: "ativa"
    };

    let resposta = await db
      .from("lojas")
      .insert(payloadCompleto)
      .select()
      .single();

    // Compatibilidade: se a base ainda não tiver imagem/regiao/grupo,
    // tenta salvar com os campos antigos para não travar.
    if (resposta.error) {
      const mensagem = String(resposta.error.message || "");

      if (mensagem.includes("imagem") || mensagem.includes("regiao") || mensagem.includes("grupo") || mensagem.includes("cor_tema")) {
        const payloadBasico = {
          nome,
          responsavel,
          status: "ativa"
        };

        resposta = await db
          .from("lojas")
          .insert(payloadBasico)
          .select()
          .single();
      }
    }

    if (resposta.error) throw resposta.error;

    return this.lojaDBParaApp(resposta.data);
  },

  async atualizarImagemLoja(id, imagem) {
    const db = this.client();

    const { data, error } = await db
      .from("lojas")
      .update({ imagem })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    const atual = getLojaAtual();
    if (atual && atual.id === id) {
      setLojaAtual(this.lojaDBParaApp(data));
    }

    return this.lojaDBParaApp(data);
  },

  async atualizarDadosLoja(id, dados) {
    const db = this.client();

    const payload = {};

    if ("nome" in dados) payload.nome = dados.nome;
    if ("responsavel" in dados) payload.responsavel = dados.responsavel;
    if ("regiao" in dados) payload.regiao = dados.regiao;
    if ("grupo" in dados) payload.grupo = dados.grupo;
    if ("imagem" in dados) payload.imagem = dados.imagem;
    if ("corTema" in dados) payload.cor_tema = dados.corTema;

    const { data, error } = await db
      .from("lojas")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    const atual = getLojaAtual();
    if (atual && atual.id === id) {
      setLojaAtual(this.lojaDBParaApp(data));
    }

    return this.lojaDBParaApp(data);
  },

  async alternarStatusLoja(id, status) {
    const db = this.client();

    const novoStatus = status === "ativa" ? "ativa" : "inativa";

    const { data, error } = await db
      .from("lojas")
      .update({ status: novoStatus })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    const atual = getLojaAtual();
    if (atual && atual.id === id && novoStatus !== "ativa") {
      limparLojaAtual();
    } else if (atual && atual.id === id) {
      setLojaAtual(this.lojaDBParaApp(data));
    }

    return this.lojaDBParaApp(data);
  },

  async excluirLoja(id) {
    return await this.alternarStatusLoja(id, "inativa");
  },

  async listarFuncionarios(lojaId) {
    const db = this.client();

    const { data, error } = await db
      .from("funcionarios")
      .select("*, lojas(nome, grupo, regiao, imagem, cor_tema)")
      .eq("loja_id", lojaId)
      .eq("ativo", true)
      .order("nome", { ascending: true });

    if (error) throw error;

    return (data || []).map(this.funcionarioDBParaApp);
  },

  async criarFuncionario({ lojaId, nome, cargo, setor = "", codigoAcesso }) {
    const db = this.client();

    const payload = {
      loja_id: lojaId,
      nome,
      cargo,
      setor,
      codigo_acesso: codigoAcesso || ""
    };

    let resposta = await db
      .from("funcionarios")
      .insert(payload)
      .select("*, lojas(nome, grupo, regiao, imagem, cor_tema)")
      .single();

    if (resposta.error && String(resposta.error.message || "").includes("setor")) {
      delete payload.setor;

      resposta = await db
        .from("funcionarios")
        .insert(payload)
        .select("*, lojas(nome, grupo, regiao, imagem, cor_tema)")
        .single();
    }

    if (resposta.error) throw resposta.error;

    return this.funcionarioDBParaApp(resposta.data);
  },

  async removerFuncionario(id) {
    const db = this.client();

    const { error } = await db
      .from("funcionarios")
      .update({ ativo: false })
      .eq("id", id);

    if (error) throw error;

    return true;
  },

  async buscarFuncionarioPorNomeCargo(nome, cargo, lojaId = "", codigoAcesso = "") {
    const db = this.client();

    let query = db
      .from("funcionarios")
      .select("*, lojas(nome, responsavel)")
      .ilike("nome", nome)
      .eq("cargo", cargo)
      .eq("ativo", true)
      .limit(10);

    if (lojaId) {
      query = query.eq("loja_id", lojaId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const funcionarios = (data || []).map(this.funcionarioDBParaApp);

    if (funcionarios.length === 0) {
      return null;
    }

    if (codigoAcesso) {
      return funcionarios.find(func =>
        String(func.codigoAcesso || "").trim() === String(codigoAcesso || "").trim()
      ) || null;
    }

    return funcionarios[0] || null;
  },

  async listarFuncionariosParaLogin(lojaId) {
    const db = this.client();

    const { data, error } = await db
      .from("funcionarios")
      .select("id, nome, cargo, setor, loja_id, codigo_acesso, ativo, criado_em, lojas(nome)")
      .eq("loja_id", lojaId)
      .eq("ativo", true)
      .order("nome", { ascending: true });

    if (error) throw error;

    return (data || []).map(this.funcionarioDBParaApp);
  },

  async listarProdutos() {
    const db = this.client();

    const { data, error } = await db
      .from("produtos")
      .select("*")
      .order("nome", { ascending: true });

    if (error) throw error;

    return (data || []).map(this.produtoDBParaApp);
  },

  async buscarProdutoPorEAN(ean) {
    const db = this.client();

    const { data, error } = await db
      .from("produtos")
      .select("*")
      .eq("ean", ean)
      .maybeSingle();

    if (error) throw error;

    return data ? this.produtoDBParaApp(data) : null;
  },

  async salvarProduto(produto) {
    const db = this.client();

    const payload = {
      ean: produto.ean,
      nome: produto.nome,
      marca: produto.marca || "",
      fabricante: produto.fabricante || "",
      sabor: produto.sabor || "",
      categoria: produto.categoria || "",
      quantidade_padrao: produto.quantidadePadrao || "",
      porcao: produto.porcao || "",
      embalagem: produto.embalagem || "",
      origem: produto.origem || "",
      paises: produto.paises || "",
      lojas_encontradas: produto.lojas || "",
      ingredientes: produto.ingredientes || "",
      alergicos: produto.alergicos || "",
      rastros: produto.rastros || "",
      nutriscore: produto.nutriscore || "",
      ecoscore: produto.ecoscore || "",
      nova: produto.nova || "",
      foto: produto.foto || "",
      fonte: produto.fonte || "sistema"
    };

    const { data, error } = await db
      .from("produtos")
      .upsert(payload, { onConflict: "ean" })
      .select()
      .single();

    if (error) throw error;

    return this.produtoDBParaApp(data);
  },

  async criarLancamento(item) {
    const db = this.client();

    let produtoId = null;

    if (item.ean) {
      try {
        const produto = await this.buscarProdutoPorEAN(item.ean);
        produtoId = produto?.id || null;
      } catch (erroProduto) {
        console.warn("Não foi possível vincular produto_id. O lançamento será salvo mesmo assim.", erroProduto);
      }
    }

    const { data, error } = await db
      .from("lancamentos")
      .insert({
        loja_id: item.lojaId,
        produto_id: produtoId,
        ean: item.ean,
        nome_produto: item.nomeProduto,
        marca: item.marca || "",
        fabricante: item.fabricante || "",
        sabor: item.sabor || "",
        categoria: item.categoria || "",
        setor: item.setor,
        quantidade: item.quantidade,
        validade: item.validade,
        foto: item.foto || "",
        status: item.status || "ativo",
        usuario_nome: item.usuarioNome || "",
        usuario_cargo: item.usuarioCargo || ""
      })
      .select("*, lojas(nome, grupo, regiao, imagem, cor_tema)")
      .single();

    if (error) throw error;

    return this.lancamentoDBParaApp(data);
  },

  async listarTodosLancamentos({ status = "todos" } = {}) {
    const db = this.client();

    let query = db
      .from("lancamentos")
      .select("*, lojas(nome, grupo, regiao, imagem, cor_tema)")
      .order("validade", { ascending: true });

    if (status && status !== "todos") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map(this.lancamentoDBParaApp);
  },

  async contarFuncionariosAtivos() {
    const db = this.client();

    const { count, error } = await db
      .from("funcionarios")
      .select("id", { count: "exact", head: true })
      .eq("ativo", true);

    if (error) throw error;

    return count || 0;
  },

  async listarLancamentos({ lojaId = "", status = "ativo" } = {}) {
    const db = this.client();

    let query = db
      .from("lancamentos")
      .select("*, lojas(nome, grupo, regiao, imagem, cor_tema)")
      .order("validade", { ascending: true });

    if (lojaId && lojaId !== "todas") {
      query = query.eq("loja_id", lojaId);
    }

    if (status && status !== "todos") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map(this.lancamentoDBParaApp);
  },

  async marcarRetirado(id, usuarioNome) {
    const db = this.client();

    const { data, error } = await db
      .from("lancamentos")
      .update({
        status: "retirado",
        retirado_em: new Date().toISOString(),
        retirado_por: usuarioNome
      })
      .eq("id", id)
      .select("*, lojas(nome, grupo, regiao, imagem, cor_tema)")
      .single();

    if (error) throw error;

    return this.lancamentoDBParaApp(data);
  },

  async reativarLancamento(id) {
    const db = this.client();

    const { data, error } = await db
      .from("lancamentos")
      .update({
        status: "ativo",
        retirado_em: null,
        retirado_por: ""
      })
      .eq("id", id)
      .select("*, lojas(nome, grupo, regiao, imagem, cor_tema)")
      .single();

    if (error) throw error;

    return this.lancamentoDBParaApp(data);
  },

  async apagarLancamento(id) {
    const db = this.client();

    const { error } = await db
      .from("lancamentos")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return true;
  },

  async criarNotificacao(dados) {
    const db = this.client();

    const { data, error } = await db
      .from("notificacoes")
      .insert({
        loja_id: dados.lojaId,
        tipo: dados.tipo || "aviso",
        titulo: dados.titulo || "Aviso",
        mensagem: dados.mensagem || "",
        lancamento_id: dados.lancamentoId || null,
        produto: dados.produto || "",
        setor: dados.setor || "",
        validade: dados.validade || null,
        criado_por: dados.criadoPor || ""
      })
      .select("*, lojas(nome, grupo, regiao, imagem, cor_tema)")
      .single();

    if (error) throw error;

    return this.notificacaoDBParaApp(data);
  },

  async listarNotificacoes(lojaId) {
    const db = this.client();

    const { data, error } = await db
      .from("notificacoes")
      .select("*, lojas(nome, grupo, regiao, imagem, cor_tema)")
      .eq("loja_id", lojaId)
      .order("criado_em", { ascending: false });

    if (error) throw error;

    return (data || []).map(this.notificacaoDBParaApp);
  },

  async marcarNotificacaoLida(id) {
    const db = this.client();

    const { data, error } = await db
      .from("notificacoes")
      .update({ lida: true })
      .eq("id", id)
      .select("*, lojas(nome, grupo, regiao, imagem, cor_tema)")
      .single();

    if (error) throw error;

    return this.notificacaoDBParaApp(data);
  },

  async apagarNotificacao(id) {
    const db = this.client();

    const { error } = await db
      .from("notificacoes")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return true;
  },

  lojaDBParaApp(data) {
    return {
      id: data.id,
      nome: data.nome,
      responsavel: data.responsavel || "",
      telefone: data.telefone || "",
      imagem: data.imagem || "",
      regiao: data.regiao || "",
      grupo: data.grupo || "",
      corTema: data.cor_tema || "",
      status: data.status || "ativa",
      criadaEm: data.criada_em || ""
    };
  },

  funcionarioDBParaApp(data) {
    return {
      id: data.id,
      nome: data.nome,
      cargo: data.cargo,
      setor: data.setor || "",
      codigoAcesso: data.codigo_acesso || "",
      lojaId: data.loja_id,
      lojaNome: data.lojas?.nome || data.lojaNome || "",
      criadoEm: data.criado_em || ""
    };
  },

  produtoDBParaApp(data) {
    return {
      id: data.id,
      ean: data.ean,
      nome: data.nome,
      marca: data.marca || "",
      fabricante: data.fabricante || "",
      sabor: data.sabor || "",
      categoria: data.categoria || "",
      quantidadePadrao: data.quantidade_padrao || "",
      porcao: data.porcao || "",
      embalagem: data.embalagem || "",
      origem: data.origem || "",
      paises: data.paises || "",
      lojas: data.lojas_encontradas || "",
      ingredientes: data.ingredientes || "",
      alergicos: data.alergicos || "",
      rastros: data.rastros || "",
      nutriscore: data.nutriscore || "",
      ecoscore: data.ecoscore || "",
      nova: data.nova || "",
      foto: data.foto || "",
      fonte: data.fonte || "sistema",
      criadoEm: data.criado_em || ""
    };
  },

  lancamentoDBParaApp(data) {
    return {
      id: data.id,
      lojaId: data.loja_id,
      lojaNome: data.lojas?.nome || "",
      lojaGrupo: data.lojas?.grupo || "",
      lojaRegiao: data.lojas?.regiao || "",
      lojaImagem: data.lojas?.imagem || "",
      lojaCorTema: data.lojas?.cor_tema || "",
      ean: data.ean || "",
      nomeProduto: data.nome_produto,
      marca: data.marca || "",
      fabricante: data.fabricante || "",
      sabor: data.sabor || "",
      categoria: data.categoria || "",
      setor: data.setor,
      quantidade: Number(data.quantidade || 0),
      validade: data.validade,
      foto: data.foto || "",
      status: data.status || "ativo",
      usuarioNome: data.usuario_nome || "",
      usuarioCargo: data.usuario_cargo || "",
      retiradoEm: data.retirado_em || "",
      retiradoPor: data.retirado_por || "",
      criadoEm: data.criado_em || ""
    };
  },

  notificacaoDBParaApp(data) {
    return {
      id: data.id,
      lojaId: data.loja_id,
      lojaNome: data.lojas?.nome || "",
      lojaGrupo: data.lojas?.grupo || "",
      lojaRegiao: data.lojas?.regiao || "",
      lojaImagem: data.lojas?.imagem || "",
      lojaCorTema: data.lojas?.cor_tema || "",
      tipo: data.tipo || "aviso",
      titulo: data.titulo || "Aviso",
      mensagem: data.mensagem || "",
      lancamentoId: data.lancamento_id || "",
      produto: data.produto || "",
      setor: data.setor || "",
      validade: data.validade || "",
      criadoPor: data.criado_por || "",
      lida: Boolean(data.lida),
      criadoEm: data.criado_em || ""
    };
  }
};
