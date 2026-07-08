/*
  ValiSys - Serviço Supabase
  Esta camada permite migrar aos poucos do localStorage para banco online.
*/

const valisysDB = {
  client() {
    return getSupabaseClient();
  },

  async listarLojas() {
    const db = this.client();
    if (!db) return lerJSONLocal("lojas", []);

    const { data, error } = await db
      .from("lojas")
      .select("*")
      .eq("status", "ativa")
      .order("nome", { ascending: true });

    if (error) throw error;

    return data.map(loja => ({
      id: loja.id,
      nome: loja.nome,
      responsavel: loja.responsavel || "",
      criadaEm: loja.criada_em || ""
    }));
  },

  async criarLoja({ nome, responsavel }) {
    const db = this.client();
    if (!db) {
      const lojas = lerJSONLocal("lojas", []);
      const nova = {
        id: gerarIdLocal("loja"),
        nome,
        responsavel,
        criadaEm: new Date().toLocaleString("pt-BR")
      };
      lojas.push(nova);
      salvarJSONLocal("lojas", lojas);
      return nova;
    }

    const { data, error } = await db
      .from("lojas")
      .insert({
        nome,
        responsavel
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      nome: data.nome,
      responsavel: data.responsavel || "",
      criadaEm: data.criada_em
    };
  },

  async listarFuncionarios(lojaId) {
    const db = this.client();
    if (!db) {
      return lerJSONLocal("funcionarios", []).filter(f => f.lojaId === lojaId);
    }

    const { data, error } = await db
      .from("funcionarios")
      .select("*")
      .eq("loja_id", lojaId)
      .eq("ativo", true)
      .order("nome", { ascending: true });

    if (error) throw error;

    return data.map(func => ({
      id: func.id,
      nome: func.nome,
      cargo: func.cargo,
      codigoAcesso: func.codigo_acesso || "",
      lojaId: func.loja_id,
      criadoEm: func.criado_em
    }));
  },

  async criarFuncionario({ lojaId, nome, cargo, codigoAcesso }) {
    const db = this.client();
    if (!db) {
      const funcionarios = lerJSONLocal("funcionarios", []);
      const loja = getLojaAtual();
      const novo = {
        id: gerarIdLocal("funcionario"),
        nome,
        cargo,
        codigoAcesso,
        lojaId,
        lojaNome: loja?.nome || "",
        criadoEm: new Date().toLocaleString("pt-BR")
      };
      funcionarios.push(novo);
      salvarJSONLocal("funcionarios", funcionarios);
      return novo;
    }

    const { data, error } = await db
      .from("funcionarios")
      .insert({
        loja_id: lojaId,
        nome,
        cargo,
        codigo_acesso: codigoAcesso
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      nome: data.nome,
      cargo: data.cargo,
      codigoAcesso: data.codigo_acesso || "",
      lojaId: data.loja_id,
      criadoEm: data.criado_em
    };
  },

  async buscarProdutoPorEAN(ean) {
    const db = this.client();
    if (!db) return buscarProdutoLocal(ean);

    const { data, error } = await db
      .from("produtos")
      .select("*")
      .eq("ean", ean)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return this.produtoDBParaApp(data);
  },

  async salvarProduto(produto) {
    const db = this.client();
    if (!db) return salvarProdutoLocalSeNovo(produto);

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
      fonte: produto.fonte || ""
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
    if (!db) {
      const lancamentos = lerJSONLocal("lancamentos", []);
      lancamentos.push(item);
      salvarJSONLocal("lancamentos", lancamentos);
      return item;
    }

    let produtoId = null;

    if (item.ean) {
      const produto = await this.buscarProdutoPorEAN(item.ean);
      produtoId = produto?.id || null;
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
      .select()
      .single();

    if (error) throw error;

    return this.lancamentoDBParaApp(data);
  },

  async listarLancamentos({ lojaId = "", status = "ativo" } = {}) {
    const db = this.client();
    if (!db) {
      let itens = lerJSONLocal("lancamentos", []);
      if (lojaId && lojaId !== "todas") itens = itens.filter(i => i.lojaId === lojaId);
      if (status && status !== "todos") itens = itens.filter(i => (i.status || "ativo") === status);
      return itens;
    }

    let query = db
      .from("lancamentos")
      .select("*")
      .order("validade", { ascending: true });

    if (lojaId && lojaId !== "todas") {
      query = query.eq("loja_id", lojaId);
    }

    if (status && status !== "todos") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data.map(item => this.lancamentoDBParaApp(item));
  },

  async marcarRetirado(id, usuarioNome) {
    const db = this.client();
    if (!db) return null;

    const { data, error } = await db
      .from("lancamentos")
      .update({
        status: "retirado",
        retirado_em: new Date().toISOString(),
        retirado_por: usuarioNome
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return this.lancamentoDBParaApp(data);
  },

  async criarNotificacao(dados) {
    const db = this.client();
    if (!db) return criarNotificacaoInterna(dados);

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
      .select()
      .single();

    if (error) throw error;

    return data;
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
      fonte: data.fonte || "Supabase",
      criadoEm: data.criado_em
    };
  },

  lancamentoDBParaApp(data) {
    return {
      id: data.id,
      lojaId: data.loja_id,
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
      criadoEm: data.criado_em
    };
  }
};
