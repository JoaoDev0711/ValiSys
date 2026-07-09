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
      .neq("status", "excluida")
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
    const db = this.client();

    const atual = getLojaAtual();

    const { error } = await db
      .from("lojas")
      .delete()
      .eq("id", id);

    if (!error) {
      if (atual && atual.id === id) {
        limparLojaAtual();
      }

      return true;
    }

    console.warn("Exclusão real bloqueada pelo banco. Marcando loja como excluída.", error);

    const { error: erroFallback } = await db
      .from("lojas")
      .update({ status: "excluida" })
      .eq("id", id);

    if (erroFallback) throw error;

    if (atual && atual.id === id) {
      limparLojaAtual();
    }

    return true;
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

  async criarFuncionario({ lojaId, nome, cargo, setor = "", codigoAcesso, marcaPromotoria = "" }) {
    const db = this.client();

    const payload = {
      loja_id: lojaId,
      nome,
      cargo,
      setor,
      codigo_acesso: codigoAcesso || "",
      marca_promotoria: marcaPromotoria || ""
    };

    let resposta = await db
      .from("funcionarios")
      .insert(payload)
      .select("*, lojas(nome, grupo, regiao, imagem, cor_tema)")
      .single();

    if (resposta.error && String(resposta.error.message || "").includes("marca_promotoria")) {
      delete payload.marca_promotoria;

      resposta = await db
        .from("funcionarios")
        .insert(payload)
        .select("*, lojas(nome, grupo, regiao, imagem, cor_tema)")
        .single();
    }

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




  setoresPadraoLoja() {
    return [
      "Geral",
      "Mercearia",
      "Bebidas",
      "Frios e Laticínios",
      "Açougue",
      "Hortifruti",
      "Padaria",
      "Congelados",
      "Limpeza",
      "Higiene e Perfumaria",
      "Pet",
      "Outros"
    ];
  },

  normalizarListaSetores(setores = []) {
    const lista = Array.isArray(setores) ? setores : String(setores || "").split(/\n|,/);

    const limpos = lista
      .map(setor => String(setor || "").trim())
      .filter(Boolean);

    return [...new Set(limpos)];
  },

  async listarSetoresLoja(lojaId) {
    const db = this.client();

    try {
      const { data, error } = await db
        .from("setores_loja")
        .select("*")
        .eq("loja_id", lojaId)
        .eq("ativo", true)
        .order("nome", { ascending: true });

      if (error) throw error;

      const setores = (data || []).map(item => ({
        id: item.id,
        lojaId: item.loja_id,
        nome: item.nome,
        ativo: item.ativo !== false
      }));

      return setores.length > 0 ? setores : this.setoresPadraoLoja().map(nome => ({ id: nome, lojaId, nome, ativo: true }));
    } catch (erro) {
      console.warn("Tabela setores_loja indisponível. Usando setores padrão.", erro);

      return this.setoresPadraoLoja().map(nome => ({ id: nome, lojaId, nome, ativo: true }));
    }
  },

  async salvarSetoresLoja(lojaId, setores = []) {
    const db = this.client();
    const lista = this.normalizarListaSetores(setores);

    if (lista.length === 0) return [];

    try {
      await db
        .from("setores_loja")
        .update({ ativo: false })
        .eq("loja_id", lojaId);

      const payload = lista.map(nome => ({
        loja_id: lojaId,
        nome,
        ativo: true
      }));

      const { data, error } = await db
        .from("setores_loja")
        .insert(payload)
        .select();

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        lojaId: item.loja_id,
        nome: item.nome,
        ativo: item.ativo !== false
      }));
    } catch (erro) {
      console.warn("Não foi possível salvar setores da loja. Rode o SQL único atualizado.", erro);
      return lista.map(nome => ({ id: nome, lojaId, nome, ativo: true }));
    }
  },

  async criarFuncionariosEmLote(lojaId, funcionarios = []) {
    const lista = Array.isArray(funcionarios) ? funcionarios : [];

    const criados = [];

    for (const item of lista) {
      const nome = String(item.nome || "").trim();
      const cargo = String(item.cargo || "").trim();
      const setor = String(item.setor || "").trim() || (cargo === "gerente" ? "Geral" : "");
      const codigoAcesso = String(item.codigoAcesso || "").trim();

      if (!nome || !cargo) continue;

      try {
        const existente = await this.buscarFuncionarioPorNomeCargo(nome, cargo, lojaId, codigoAcesso);

        if (existente) {
          criados.push(existente);
          continue;
        }
      } catch (erroBusca) {
        console.warn("Não foi possível verificar funcionário existente.", erroBusca);
      }

      try {
        const criado = await this.criarFuncionario({
          lojaId,
          nome,
          cargo,
          setor,
          codigoAcesso: cargo === "encarregado" ? (codigoAcesso || String(Math.floor(1000 + Math.random() * 9000))) : "",
          marcaPromotoria: ""
        });

        criados.push(criado);
      } catch (erroCriar) {
        console.warn("Não foi possível pré-cadastrar funcionário.", item, erroCriar);
      }
    }

    return criados;
  },


  async listarMarcasPromotoria(lojaId) {
    const db = this.client();

    const { data, error } = await db
      .from("marcas_promotoria")
      .select("*")
      .eq("loja_id", lojaId)
      .eq("ativa", true)
      .order("nome", { ascending: true });

    if (error) {
      console.warn("Tabela marcas_promotoria indisponível. Usando marcas dos promotores cadastrados.", error);

      const funcionarios = await this.listarFuncionarios(lojaId);
      return [...new Set(funcionarios
        .filter(func => func.cargo === "promotor")
        .map(func => String(func.marcaPromotoria || "").trim())
        .filter(Boolean)
      )].map(nome => ({
        id: nome,
        lojaId,
        nome,
        ativa: true
      }));
    }

    return (data || []).map(item => ({
      id: item.id,
      lojaId: item.loja_id,
      nome: item.nome,
      ativa: item.ativa !== false,
      criadoEm: item.criado_em || ""
    }));
  },

  async criarMarcaPromotoria(lojaId, nome) {
    const db = this.client();
    const nomeLimpo = String(nome || "").trim();

    if (!nomeLimpo) {
      throw new Error("Informe o nome da marca.");
    }

    try {
      const existentes = await this.listarMarcasPromotoria(lojaId);
      const encontrada = existentes.find(item =>
        String(item.nome || "").trim().toLowerCase() === nomeLimpo.toLowerCase()
      );

      if (encontrada) return encontrada;
    } catch (erroLista) {
      console.warn("Não foi possível verificar marcas existentes.", erroLista);
    }

    const { data, error } = await db
      .from("marcas_promotoria")
      .insert({
        loja_id: lojaId,
        nome: nomeLimpo,
        ativa: true
      })
      .select()
      .single();

    if (error) {
      console.warn("Não foi possível salvar marca em marcas_promotoria. A marca será salva no promotor.", error);
      return {
        id: nomeLimpo,
        lojaId,
        nome: nomeLimpo,
        ativa: true
      };
    }

    return {
      id: data.id,
      lojaId: data.loja_id,
      nome: data.nome,
      ativa: data.ativa !== false,
      criadoEm: data.criado_em || ""
    };
  },

  async atualizarMarcaFuncionario(id, marcaPromotoria) {
    const db = this.client();

    const { data, error } = await db
      .from("funcionarios")
      .update({ marca_promotoria: marcaPromotoria || "" })
      .eq("id", id)
      .select("*, lojas(nome, grupo, regiao, imagem, cor_tema)")
      .single();

    if (error) {
      console.warn("Não foi possível atualizar marca_promotoria. Talvez o SQL ainda não tenha sido rodado.", error);
      return null;
    }

    return this.funcionarioDBParaApp(data);
  },


  async listarPromotoresPorNome(lojaId, nome) {
    const db = this.client();
    const nomeLimpo = String(nome || "").trim();

    if (!nomeLimpo) return [];

    const { data, error } = await db
      .from("funcionarios")
      .select("*, lojas(nome, grupo, regiao, imagem, cor_tema)")
      .eq("loja_id", lojaId)
      .eq("cargo", "promotor")
      .eq("ativo", true)
      .ilike("nome", nomeLimpo)
      .limit(20);

    if (error) throw error;

    return (data || []).map(this.funcionarioDBParaApp);
  },

  async buscarPromotorPorNomeMarca(lojaId, nome, marcaPromotoria) {
    const nomeLimpo = String(nome || "").trim();
    const marcaLimpa = String(marcaPromotoria || "").trim().toLowerCase();

    const promotores = await this.listarPromotoresPorNome(lojaId, nomeLimpo);

    return promotores.find(promotor =>
      String(promotor.marcaPromotoria || "").trim().toLowerCase() === marcaLimpa
    ) || null;
  },

  async marcaPromotoriaExiste(lojaId, marcaPromotoria) {
    const marcaLimpa = String(marcaPromotoria || "").trim().toLowerCase();

    if (!marcaLimpa) return false;

    const marcas = await this.listarMarcasPromotoria(lojaId);

    return marcas.some(marca =>
      String(marca.nome || "").trim().toLowerCase() === marcaLimpa
    );
  },

  async garantirPromotorComMarca({ lojaId, nome, marcaPromotoria }) {
    const nomeLimpo = String(nome || "").trim();
    const marcaLimpa = String(marcaPromotoria || "").trim();

    if (!nomeLimpo) {
      throw new Error("Informe o nome do promotor.");
    }

    if (!marcaLimpa) {
      throw new Error("Informe a marca da promotoria.");
    }

    const promotoresMesmoNome = await this.listarPromotoresPorNome(lojaId, nomeLimpo);
    const marcaExiste = await this.marcaPromotoriaExiste(lojaId, marcaLimpa);

    const promotorCorreto = promotoresMesmoNome.find(promotor =>
      String(promotor.marcaPromotoria || "").trim().toLowerCase() === marcaLimpa.toLowerCase()
    );

    if (promotorCorreto) {
      return promotorCorreto;
    }

    if (promotoresMesmoNome.length > 0) {
      const marcas = promotoresMesmoNome
        .map(promotor => promotor.marcaPromotoria)
        .filter(Boolean)
        .join(", ");

      throw new Error(
        `Este promotor já está cadastrado com outra marca${marcas ? ": " + marcas : ""}. Use a marca correta ou peça para o gerente/admin ajustar o cadastro.`
      );
    }

    if (marcaExiste) {
      throw new Error(
        "Esta marca já existe na loja, mas esse nome não está cadastrado nela. Peça para o gerente/admin cadastrar o promotor nessa marca antes de entrar."
      );
    }

    // Só cadastra automaticamente quando é uma marca nova.
    // Assim ninguém consegue entrar usando a marca já cadastrada de outro promotor.
    await this.criarMarcaPromotoria(lojaId, marcaLimpa);

    const criado = await this.criarFuncionario({
      lojaId,
      nome: nomeLimpo,
      cargo: "promotor",
      setor: "Promotoria",
      codigoAcesso: "",
      marcaPromotoria: marcaLimpa
    });

    criado.marcaPromotoria = criado.marcaPromotoria || marcaLimpa;
    return criado;
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
      .select("id, nome, cargo, setor, marca_promotoria, loja_id, codigo_acesso, ativo, criado_em, lojas(nome)")
      .eq("loja_id", lojaId)
      .eq("ativo", true)
      .order("nome", { ascending: true });

    if (error) throw error;

    return (data || []).map(this.funcionarioDBParaApp);
  },


  catalogoProdutoDBParaApp(data) {
    return {
      id: data.id || data.codigo_interno || gerarIdLocal("catalogo"),
      codigoInterno: data.codigo_interno || "",
      ean: data.ean || "",
      nome: data.nome || "",
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
      fonte: data.fonte || "Catálogo interno ValiSys",
      ativo: data.ativo !== false,
      criadoEm: data.criado_em || ""
    };
  },

  catalogoFallbackParaApp(item) {
    return {
      id: item.id || item.codigoInterno || gerarIdLocal("catalogo"),
      codigoInterno: item.codigoInterno || "",
      ean: item.ean || "",
      nome: item.nome || "",
      marca: item.marca || "",
      fabricante: item.fabricante || "",
      sabor: item.sabor || "",
      categoria: item.categoria || "",
      quantidadePadrao: item.quantidadePadrao || "",
      porcao: item.porcao || "",
      embalagem: item.embalagem || "",
      origem: item.origem || "",
      paises: item.paises || "",
      lojas: item.lojas || "",
      ingredientes: item.ingredientes || "",
      alergicos: item.alergicos || "",
      rastros: item.rastros || "",
      nutriscore: item.nutriscore || "",
      ecoscore: item.ecoscore || "",
      nova: item.nova || "",
      foto: item.foto || "",
      fonte: item.fonte || "Catálogo interno ValiSys",
      ativo: item.ativo !== false
    };
  },

  filtrarCatalogoFallback(termo = "", limite = 20) {
    const lista = (window.VALISYS_CATALOGO_PRODUTOS || []).map(this.catalogoFallbackParaApp);
    const busca = String(termo || "").trim().toLowerCase();

    const filtrados = busca
      ? lista.filter(item => [
          item.ean,
          item.codigoInterno,
          item.nome,
          item.marca,
          item.fabricante,
          item.categoria,
          item.quantidadePadrao,
          item.embalagem
        ].join(" ").toLowerCase().includes(busca))
      : lista;

    return filtrados.slice(0, limite);
  },

  async buscarCatalogoProdutoPorEAN(ean) {
    const codigo = String(ean || "").trim();

    if (!codigo) return null;

    try {
      const db = this.client();

      const { data, error } = await db
        .from("catalogo_produtos")
        .select("*")
        .eq("ean", codigo)
        .eq("ativo", true)
        .maybeSingle();

      if (error) throw error;

      return data ? this.catalogoProdutoDBParaApp(data) : null;
    } catch (erro) {
      console.warn("Catálogo no banco indisponível. Usando fallback JS.", erro);

      return this.filtrarCatalogoFallback(codigo, 1)[0] || null;
    }
  },

  async buscarCatalogoProdutos(termo = "", limite = 20) {
    const busca = String(termo || "").trim();

    try {
      const db = this.client();

      let query = db
        .from("catalogo_produtos")
        .select("*")
        .eq("ativo", true)
        .limit(limite);

      if (busca) {
        const seguro = busca
          .replaceAll("%", "")
          .replaceAll(",", " ")
          .replaceAll("(", " ")
          .replaceAll(")", " ")
          .trim();

        query = query.or(`nome.ilike.%${seguro}%,marca.ilike.%${seguro}%,fabricante.ilike.%${seguro}%,categoria.ilike.%${seguro}%,quantidade_padrao.ilike.%${seguro}%`);
      }

      const { data, error } = await query.order("nome", { ascending: true });

      if (error) throw error;

      return (data || []).map(this.catalogoProdutoDBParaApp);
    } catch (erro) {
      console.warn("Busca no catálogo do banco falhou. Usando catálogo JS interno.", erro);

      return this.filtrarCatalogoFallback(busca, limite);
    }
  },

  produtoDeCatalogoParaProduto(item, eanManual = "") {
    const eanFinal = String(eanManual || item.ean || "").trim();

    return {
      id: item.id,
      ean: eanFinal,
      nome: item.nome || "",
      marca: item.marca || "",
      fabricante: item.fabricante || "",
      sabor: item.sabor || "",
      categoria: item.categoria || "",
      quantidadePadrao: item.quantidadePadrao || "",
      porcao: item.porcao || "",
      embalagem: item.embalagem || "",
      origem: item.origem || "",
      paises: item.paises || "",
      lojas: item.lojas || "",
      ingredientes: item.ingredientes || "",
      alergicos: item.alergicos || "",
      rastros: item.rastros || "",
      nutriscore: item.nutriscore || "",
      ecoscore: item.ecoscore || "",
      nova: item.nova || "",
      foto: item.foto || "",
      fonte: item.fonte || "Catálogo interno ValiSys",
      criadoEm: new Date().toLocaleString("pt-BR")
    };
  },


  catalogoAppParaDB(item) {
    const nome = String(item.nome || "").trim();
    const ean = String(item.ean || "").replace(/\D/g, "");
    const codigoInterno = String(item.codigoInterno || item.codigo_interno || ean || `IMPORT-${Date.now()}-${Math.floor(Math.random() * 1000000)}`).trim();

    return {
      codigo_interno: codigoInterno,
      ean,
      nome,
      marca: item.marca || "",
      fabricante: item.fabricante || "",
      sabor: item.sabor || "",
      categoria: item.categoria || "",
      quantidade_padrao: item.quantidadePadrao || item.quantidade_padrao || "",
      porcao: item.porcao || "",
      embalagem: item.embalagem || "",
      origem: item.origem || "",
      paises: item.paises || "",
      lojas_encontradas: item.lojas || item.lojasEncontradas || item.lojas_encontradas || "",
      ingredientes: item.ingredientes || "",
      alergicos: item.alergicos || "",
      rastros: item.rastros || "",
      nutriscore: item.nutriscore || "",
      ecoscore: item.ecoscore || "",
      nova: item.nova || "",
      foto: item.foto || "",
      fonte: item.fonte || "Importação CSV",
      ativo: item.ativo !== false
    };
  },

  async importarCatalogoProdutos(itens = []) {
    const db = this.client();

    const payload = itens
      .map(item => this.catalogoAppParaDB(item))
      .filter(item => item.nome && (item.ean || item.codigo_interno));

    if (payload.length === 0) {
      return { total: 0, importados: 0 };
    }

    let importados = 0;
    const tamanhoLote = 100;

    for (let i = 0; i < payload.length; i += tamanhoLote) {
      const lote = payload.slice(i, i + tamanhoLote);

      const { error } = await db
        .from("catalogo_produtos")
        .upsert(lote, { onConflict: "codigo_interno" });

      if (error) throw error;

      importados += lote.length;
    }

    return {
      total: payload.length,
      importados
    };
  },

  async listarProdutos() {
    const db = this.client();

    let resposta = await db
      .from("produtos")
      .select("*")
      .eq("ativo", true)
      .order("nome", { ascending: true });

    if (resposta.error && String(resposta.error.message || "").includes("ativo")) {
      resposta = await db
        .from("produtos")
        .select("*")
        .order("nome", { ascending: true });
    }

    if (resposta.error) throw resposta.error;

    return (resposta.data || []).map(this.produtoDBParaApp);
  },


  async buscarProdutoPorTexto(termo = "") {
    const busca = String(termo || "").trim();

    if (busca.length < 3) return null;

    const seguro = busca
      .replaceAll("%", "")
      .replaceAll(",", " ")
      .replaceAll("(", " ")
      .replaceAll(")", " ")
      .replaceAll("'", "")
      .replaceAll('"', "")
      .trim();

    try {
      const db = this.client();

      let resposta = await db
        .from("produtos")
        .select("*")
        .or(`nome.ilike.%${seguro}%,marca.ilike.%${seguro}%,fabricante.ilike.%${seguro}%,categoria.ilike.%${seguro}%,ean.ilike.%${seguro}%`)
        .eq("ativo", true)
        .order("nome", { ascending: true })
        .limit(1);

      if (resposta.error && String(resposta.error.message || "").includes("ativo")) {
        resposta = await db
          .from("produtos")
          .select("*")
          .or(`nome.ilike.%${seguro}%,marca.ilike.%${seguro}%,fabricante.ilike.%${seguro}%,categoria.ilike.%${seguro}%,ean.ilike.%${seguro}%`)
          .order("nome", { ascending: true })
          .limit(1);
      }

      if (resposta.error) throw resposta.error;

      if (resposta.data && resposta.data[0]) {
        return this.produtoDBParaApp(resposta.data[0]);
      }
    } catch (erro) {
      console.warn("Busca por texto em produtos falhou. Tentando catálogo.", erro);
    }

    try {
      const resultadosCatalogo = await this.buscarCatalogoProdutos(busca, 1);

      if (resultadosCatalogo && resultadosCatalogo[0]) {
        return this.produtoDeCatalogoParaProduto(resultadosCatalogo[0], resultadosCatalogo[0].ean || "");
      }
    } catch (erroCatalogo) {
      console.warn("Busca por texto no catálogo falhou.", erroCatalogo);
    }

    return null;
  },

  async buscarProdutoPorEAN(ean) {
    const db = this.client();

    let resposta = await db
      .from("produtos")
      .select("*")
      .eq("ean", ean)
      .eq("ativo", true)
      .maybeSingle();

    if (resposta.error && String(resposta.error.message || "").includes("ativo")) {
      resposta = await db
        .from("produtos")
        .select("*")
        .eq("ean", ean)
        .maybeSingle();
    }

    if (resposta.error) throw resposta.error;

    return resposta.data ? this.produtoDBParaApp(resposta.data) : null;
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
      fonte: produto.fonte || "sistema",
      ativo: produto.ativo !== false
    };

    let resposta = await db
      .from("produtos")
      .upsert(payload, { onConflict: "ean" })
      .select()
      .single();

    if (resposta.error && String(resposta.error.message || "").includes("ativo")) {
      delete payload.ativo;

      resposta = await db
        .from("produtos")
        .upsert(payload, { onConflict: "ean" })
        .select()
        .single();
    }

    if (resposta.error) throw resposta.error;

    return this.produtoDBParaApp(resposta.data);
  },


  async excluirProduto(idOuEan) {
    const db = this.client();
    const valor = String(idOuEan || "").trim();

    if (!valor) return false;

    let query = db.from("produtos").delete();

    if (valor.includes("-")) {
      query = query.eq("id", valor);
    } else {
      query = query.eq("ean", valor);
    }

    const { error } = await query;

    if (!error) return true;

    console.warn("Exclusão real de produto bloqueada. Tentando ocultar produto.", error);

    let update = db.from("produtos").update({ ativo: false });

    if (valor.includes("-")) {
      update = update.eq("id", valor);
    } else {
      update = update.eq("ean", valor);
    }

    const { error: erroFallback } = await update;

    if (erroFallback) throw error;

    return true;
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
        quantidade_padrao: item.quantidadePadrao || "",
        porcao: item.porcao || "",
        embalagem: item.embalagem || "",
        origem: item.origem || "",
        paises: item.paises || "",
        lojas_encontradas: item.lojas || "",
        ingredientes: item.ingredientes || "",
        alergicos: item.alergicos || "",
        rastros: item.rastros || "",
        nutriscore: item.nutriscore || "",
        ecoscore: item.ecoscore || "",
        nova: item.nova || "",
        fonte: item.fonte || "",
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
      marcaPromotoria: data.marca_promotoria || "",
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
      ativo: data.ativo !== false,
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
      fonte: data.fonte || "",
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
