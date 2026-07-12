async function buscarProdutoFontePorNome(termo) {
  const busca = String(termo || "").trim();

  if (busca.length < 3) return null;

  const campos = [
    "code",
    "product_name",
    "product_name_pt",
    "generic_name",
    "abbreviated_product_name",
    "brands",
    "categories",
    "main_category",
    "quantity",
    "serving_size",
    "manufacturers",
    "manufacturer",
    "producer",
    "producers",
    "owner",
    "packaging",
    "packaging_text",
    "image_front_url",
    "image_url",
    "selected_images",
    "images"
  ].join(",");

  const urls = [
    `https://br.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(busca)}&search_simple=1&action=process&json=1&page_size=5&fields=${campos}`,
    `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(busca)}&search_simple=1&action=process&json=1&page_size=5&fields=${campos}`
  ];

  for (const url of urls) {
    try {
      const resposta = await fetch(url, {
        method: "GET",
        headers: {
          "Accept": "application/json"
        }
      });

      if (!resposta.ok) continue;

      const dados = await resposta.json();
      const lista = Array.isArray(dados.products) ? dados.products : [];
      const produto = lista.find(item => limparTexto(item.product_name_pt || item.product_name || item.generic_name || ""));

      if (!produto) continue;

      const codigo = String(produto.code || "").replace(/\D/g, "");
      const nome =
        produto.product_name_pt ||
        produto.product_name ||
        produto.abbreviated_product_name ||
        produto.generic_name ||
        busca;

      const marca = limparMarca(produto.brands || "");

      return normalizarProdutoCompleto({
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        ean: codigo,
        nome: limparTexto(nome),
        marca,
        fabricante: identificarFabricante(produto, marca),
        sabor: identificarSabor(produto),
        categoria: limparCategoria(produto.categories || produto.main_category || ""),
        quantidadePadrao: montarQuantidade(produto),
        porcao: limparTexto(produto.serving_size || ""),
        embalagem: limparLista(produto.packaging || produto.packaging_text || ""),
        foto: obterFotoProduto(produto),
        fonte: url.includes("br.openfoodfacts") ? "busca por nome na base pública Brasil" : "busca por nome na base pública"
      }, codigo);
    } catch (erro) {
      console.warn("Busca de foto/produto por nome falhou nesta fonte.", erro);
    }
  }

  return null;
}


async function buscarProdutoFonteProdutos(ean) {
  const codigo = normalizarCodigo(ean);

  if (!validarEAN(codigo)) {
    return null;
  }

  const tentativas = [
    buscarProdutoOpenFoodFacts,
    buscarProdutoBrasilFonte,
    buscarProdutoOSCBRComToken
  ];

  const erros = [];

  for (const tentativa of tentativas) {
    try {
      const produto = await tentativa(codigo);

      if (produto && produto.nome) {
        return normalizarProdutoCompleto(produto, codigo);
      }
    } catch (erro) {
      console.warn(`Fonte ${tentativa.name} falhou. Tentando próxima.`, erro);
      erros.push(`${tentativa.name}: ${erro.message}`);
    }
  }

  console.warn("Nenhuma fonte encontrou o produto.", erros);

  return null;
}

async function buscarProdutoOpenFoodFacts(codigo) {
  const campos = [
    "code",
    "product_name",
    "product_name_pt",
    "generic_name",
    "abbreviated_product_name",
    "brands",
    "categories",
    "main_category",
    "category_properties",
    "quantity",
    "product_quantity",
    "product_quantity_unit",
    "serving_size",
    "labels",
    "labels_tags",
    "categories_tags",
    "ingredients_text",
    "ingredients_text_pt",
    "allergens",
    "allergens_tags",
    "traces",
    "traces_tags",
    "manufacturing_places",
    "manufacturing_places_tags",
    "manufacturer",
    "manufacturers",
    "producer",
    "producers",
    "owner",
    "origins",
    "origins_tags",
    "countries",
    "countries_tags",
    "stores",
    "packaging",
    "packaging_text",
    "nutriscore_grade",
    "nova_group",
    "ecoscore_grade",
    "image_front_url",
    "image_url",
    "selected_images",
    "images"
  ].join(",");

  const urls = [
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(codigo)}.json?fields=${campos}`,
    `https://br.openfoodfacts.org/api/v2/product/${encodeURIComponent(codigo)}.json?fields=${campos}`
  ];

  for (const url of urls) {
    const resposta = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    });

    if (!resposta.ok) {
      continue;
    }

    const dados = await resposta.json();

    if (dados.status !== 1 || !dados.product) {
      continue;
    }

    const produto = dados.product;

    const nome =
      produto.product_name_pt ||
      produto.product_name ||
      produto.abbreviated_product_name ||
      produto.generic_name ||
      "";

    if (!limparTexto(nome)) {
      continue;
    }

    const marca = limparMarca(produto.brands || "");
    const quantidadePadrao = montarQuantidade(produto);

    return {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      ean: codigo,
      nome: limparTexto(nome),
      marca,
      fabricante: identificarFabricante(produto, marca),
      sabor: identificarSabor(produto),
      categoria: limparCategoria(produto.categories || produto.main_category || ""),
      quantidadePadrao,
      porcao: limparTexto(produto.serving_size || ""),
      embalagem: limparLista(produto.packaging || produto.packaging_text || ""),
      origem: limparLista(produto.origins || ""),
      paises: limparLista(produto.countries || ""),
      lojas: limparLista(produto.stores || ""),
      ingredientes: resumirTexto(produto.ingredients_text_pt || produto.ingredients_text || "", 180),
      alergicos: limparAlergicos(produto.allergens || produto.allergens_tags || ""),
      rastros: limparAlergicos(produto.traces || produto.traces_tags || ""),
      nutriscore: normalizarNota(produto.nutriscore_grade),
      ecoscore: normalizarNota(produto.ecoscore_grade),
      nova: produto.nova_group ? String(produto.nova_group) : "",
      foto: obterFotoProduto(produto),
      fonte: url.includes("br.openfoodfacts") ? "base pública de produtos Brasil" : "base pública de produtos",
      criadoEm: new Date().toLocaleString("pt-BR")
    };
  }

  return null;
}

async function buscarProdutoBrasilFonte(codigo) {
  // Endpoint público usado por algumas instalações da Brasilfonte.
  // Pode não existir/estar indisponível em alguns momentos; por isso é apenas fallback.
  const url = `https://brasilapi.com.br/api/gtin/v1/${encodeURIComponent(codigo)}`;

  const resposta = await fetch(url, {
    method: "GET",
    headers: {
      "Accept": "application/json"
    }
  });

  if (!resposta.ok) {
    return null;
  }

  const dados = await resposta.json();

  const nome = primeiroValor(
    dados.description,
    dados.descricao,
    dados.nome,
    dados.product_name,
    dados.productName,
    dados.produto,
    dados.name
  );

  if (!limparTexto(nome)) return null;

  const marca = primeiroValor(
    dados.brand,
    dados.marca,
    dados.brand_name,
    dados.brandName,
    dados.fabricante,
    dados.manufacturer
  );

  const categoria = primeiroValor(
    dados.category,
    dados.categoria,
    dados.gpc_description,
    dados.gpc_descricao,
    dados.ncm_description,
    dados.ncm_descricao
  );

  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    ean: codigo,
    nome: limparTexto(nome),
    marca: limparTexto(marca),
    fabricante: limparTexto(primeiroValor(dados.manufacturer, dados.fabricante, dados.razao_social, dados.company_name, marca)),
    sabor: identificarSabor({ product_name: nome, categories: categoria, brands: marca }),
    categoria: limparCategoria(categoria),
    quantidadePadrao: limparTexto(primeiroValor(dados.quantity, dados.quantidade, dados.unit, dados.unidade, dados.volume, dados.peso)),
    porcao: "",
    embalagem: limparTexto(primeiroValor(dados.package, dados.embalagem)),
    origem: "",
    paises: limparTexto(primeiroValor(dados.country, dados.pais)),
    lojas: "",
    ingredientes: "",
    alergicos: "",
    rastros: "",
    nutriscore: "",
    ecoscore: "",
    nova: "",
    foto: primeiroValor(dados.image, dados.image_url, dados.link_foto, dados.foto, dados.thumbnail),
    fonte: "BrasilFonte GTIN",
    criadoEm: new Date().toLocaleString("pt-BR")
  };
}

async function buscarProdutoOSCBRComToken(codigo) {
  // Opcional. Para usar, declare no HTML antes do produtos-fonte.js:
  // window.VALISYS_GTIN_TOKEN = "SEU_TOKEN";
  // Sem token, esta fonte é ignorada.
  const token = window.VALISYS_GTIN_TOKEN || "";

  if (!token) return null;

  const url = `https://gtin.rscsistemas.com.br/api/gtin/infor/${encodeURIComponent(codigo)}`;

  const resposta = await fetch(url, {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`
    }
  });

  if (!resposta.ok) {
    return null;
  }

  const dados = await resposta.json();

  const nome = primeiroValor(dados.nome, dados.description, dados.descricao, dados.produto);

  if (!limparTexto(nome)) return null;

  const marca = primeiroValor(dados.marca, dados.brand);

  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    ean: codigo,
    nome: limparTexto(nome),
    marca: limparTexto(marca),
    fabricante: limparTexto(primeiroValor(dados.fabricante, dados.manufacturer, marca)),
    sabor: identificarSabor({ product_name: nome, categories: dados.categoria, brands: marca }),
    categoria: limparCategoria(dados.categoria || ""),
    quantidadePadrao: inferirQuantidadeDoNome(nome),
    porcao: "",
    embalagem: "",
    origem: "",
    paises: limparTexto(dados.pais || ""),
    lojas: "",
    ingredientes: "",
    alergicos: "",
    rastros: "",
    nutriscore: "",
    ecoscore: "",
    nova: "",
    foto: dados.link_foto || `https://gtin.rscsistemas.com.br/api/gtin/img/${encodeURIComponent(codigo)}`,
    fonte: "OSCBR Fonte GTIN",
    criadoEm: new Date().toLocaleString("pt-BR")
  };
}

function normalizarProdutoCompleto(produto, codigo) {
  const nome = limparTexto(produto.nome || "");
  const marca = limparMarca(produto.marca || "");

  const completo = {
    id: produto.id || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
    ean: produto.ean || codigo,
    nome,
    marca,
    fabricante: limparTexto(produto.fabricante || ""),
    sabor: limparTexto(produto.sabor || ""),
    categoria: limparTexto(produto.categoria || ""),
    quantidadePadrao: limparTexto(produto.quantidadePadrao || ""),
    porcao: limparTexto(produto.porcao || ""),
    embalagem: limparTexto(produto.embalagem || ""),
    origem: limparTexto(produto.origem || ""),
    paises: limparTexto(produto.paises || ""),
    lojas: limparTexto(produto.lojas || ""),
    ingredientes: resumirTexto(produto.ingredientes || "", 180),
    alergicos: limparTexto(produto.alergicos || ""),
    rastros: limparTexto(produto.rastros || ""),
    nutriscore: limparTexto(produto.nutriscore || ""),
    ecoscore: limparTexto(produto.ecoscore || ""),
    nova: limparTexto(produto.nova || ""),
    foto: limparTexto(produto.foto || ""),
    fonte: limparTexto(produto.fonte || "base de produtos de produtos"),
    criadoEm: produto.criadoEm || new Date().toLocaleString("pt-BR")
  };

  if (!completo.quantidadePadrao) {
    completo.quantidadePadrao = inferirQuantidadeDoNome(nome);
  }

  if (!completo.sabor) {
    completo.sabor = identificarSabor({
      product_name: nome,
      brands: marca,
      categories: completo.categoria,
      labels: completo.embalagem,
      ingredients_text: completo.ingredientes
    });
  }

  if (!completo.categoria) {
    completo.categoria = inferirCategoriaDoNome(nome);
  }

  if (!completo.fabricante) {
    completo.fabricante = identificarFabricante({
      brands: marca,
      product_name: nome,
      generic_name: completo.categoria
    }, marca);
  }

  // Para não deixar vazio no MVP: quando não há fabricante real, usa a marca como fallback.
  if (!completo.fabricante && marca) {
    completo.fabricante = marca;
  }

  return completo;
}

function primeiroValor(...valores) {
  for (const valor of valores) {
    if (Array.isArray(valor)) {
      const limpo = valor.map(limparTexto).find(Boolean);
      if (limpo) return limpo;
      continue;
    }

    const limpo = limparTexto(valor);

    if (limpo) return limpo;
  }

  return "";
}

function inferirQuantidadeDoNome(nome) {
  const texto = limparTexto(nome);
  const match = texto.match(/(\d+(?:[,.]\d+)?)\s?(kg|g|mg|l|ml|un|und|unid|litro|litros|gramas|quilo|quilos)\b/i);

  return match ? `${match[1]} ${match[2]}`.replace(",", ".") : "";
}

function inferirCategoriaDoNome(nome) {
  const texto = limparTexto(nome)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const categorias = [
    { chave: "biscoito", nome: "Biscoitos" },
    { chave: "bolacha", nome: "Biscoitos" },
    { chave: "macarrao", nome: "Massas" },
    { chave: "massa", nome: "Massas" },
    { chave: "arroz", nome: "Arroz" },
    { chave: "feijao", nome: "Feijão" },
    { chave: "leite", nome: "Laticínios" },
    { chave: "iogurte", nome: "Laticínios" },
    { chave: "queijo", nome: "Laticínios" },
    { chave: "requeijao", nome: "Laticínios" },
    { chave: "margarina", nome: "Margarinas" },
    { chave: "farinha", nome: "Farinhas" },
    { chave: "cafe", nome: "Café" },
    { chave: "acucar", nome: "Açúcar" },
    { chave: "oleo", nome: "Óleos" },
    { chave: "azeite", nome: "Azeites" },
    { chave: "refrigerante", nome: "Bebidas" },
    { chave: "suco", nome: "Bebidas" },
    { chave: "agua", nome: "Bebidas" },
    { chave: "cerveja", nome: "Bebidas" },
    { chave: "sabonete", nome: "Higiene" },
    { chave: "shampoo", nome: "Higiene" },
    { chave: "detergente", nome: "Limpeza" },
    { chave: "sabao", nome: "Limpeza" },
    { chave: "amaciante", nome: "Limpeza" }
  ];

  const encontrado = categorias.find(item => texto.includes(item.chave));

  return encontrado ? encontrado.nome : "";
}

function limparTexto(texto) {
  return String(texto || "")
    .replace(/\s+/g, " ")
    .trim();
}

function resumirTexto(texto, limite) {
  const limpo = limparTexto(texto);

  if (limpo.length <= limite) return limpo;

  return limpo.slice(0, limite).trim() + "...";
}

function limparLista(texto) {
  return limparTexto(texto)
    .replaceAll("en:", "")
    .replaceAll("pt:", "")
    .replaceAll("_", " ")
    .split(",")
    .map(item => item.trim())
    .filter(Boolean)
    .slice(0, 5)
    .join(", ");
}

function limparAlergicos(valor) {
  if (Array.isArray(valor)) {
    return valor
      .map(item => String(item).replaceAll("en:", "").replaceAll("pt:", "").replaceAll("_", " "))
      .map(item => item.trim())
      .filter(Boolean)
      .slice(0, 5)
      .join(", ");
  }

  return limparLista(valor);
}

function normalizarNota(valor) {
  const texto = limparTexto(valor);

  if (!texto || texto === "unknown" || texto === "not-applicable") return "";

  return texto.toUpperCase();
}

function montarQuantidade(produto) {
  const quantidade = limparTexto(produto.quantity || "");

  if (quantidade) return quantidade;

  if (produto.product_quantity && produto.product_quantity_unit) {
    return `${produto.product_quantity}${produto.product_quantity_unit}`;
  }

  if (produto.product_quantity) {
    return String(produto.product_quantity);
  }

  return "";
}

function limparCategoria(categoria) {
  const texto = String(categoria || "")
    .replaceAll("en:", "")
    .replaceAll("pt:", "")
    .replaceAll("-", " ")
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);

  if (texto.length === 0) {
    return "";
  }

  return texto[0]
    .replace(/\b\w/g, letra => letra.toUpperCase());
}

function buscarProdutoLocal(ean) {
  // Versão sistema-only: produto local desativado.
  // Use valisysDB.buscarProdutoPorEAN(ean).
  return null;
}

function salvarProdutoLocalSeNovo(produto) {
  // Versão sistema-only: salvamento local desativado.
  // Use valisysDB.salvarProduto(produto).
  return produto || null;
}

function produtoCampoHTML(rotulo, valor, classe = "") {
  const texto = String(valor || "").trim();

  if (!texto) return "";

  return `<p class="${classe}"><strong>${esc(rotulo)}:</strong> ${esc(texto)}</p>`;
}

function cardProdutoHTML(produto, mensagem = "") {
  if (!produto) return "";

  return `
    <div class="card produto-encontrado produto-card-completo">
      ${mensagem ? `<p class="api-status">${esc(mensagem)}</p>` : ""}

      <div class="produto-card-header">
        <div>
          <h3>${esc(produto.nome || "Produto sem nome")}</h3>
          <p class="muted">EAN: ${esc(produto.ean || "Não informado")}</p>
          <p><strong>Marca:</strong> ${esc(produto.marca || "Não informada")}</p>
          <p><strong>Gramagem:</strong> ${esc(produto.gramagem || produto.quantidadePadrao || "Não informada")}</p>
          ${produto.sabor ? `<p><strong>Sabor:</strong> ${esc(produto.sabor)}</p>` : ""}
          <p class="muted">Você pode editar os dados nos campos do formulário antes de salvar.</p>
        </div>
        ${
          produto.foto
            ? `<img class="produto-img produto-img-mini" src="${produto.foto}" alt="${esc(produto.nome)}">`
            : ``
        }
      </div>
    </div>
  `;
}

function limparMarca(marcas) {
  const texto = limparTexto(marcas);

  if (!texto) return "";

  return texto
    .split(",")
    .map(marca => marca.trim())
    .filter(Boolean)[0] || "";
}

function identificarSabor(produto) {
  const partes = [
    produto.product_name_pt,
    produto.product_name,
    produto.abbreviated_product_name,
    produto.generic_name,
    produto.categories,
    produto.labels,
    Array.isArray(produto.categories_tags) ? produto.categories_tags.join(" ") : "",
    Array.isArray(produto.labels_tags) ? produto.labels_tags.join(" ") : "",
    produto.ingredients_text_pt,
    produto.ingredients_text
  ];

  const texto = partes
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const sabores = [
    { chave: "morango", nome: "Morango" },
    { chave: "chocolate", nome: "Chocolate" },
    { chave: "baunilha", nome: "Baunilha" },
    { chave: "coco", nome: "Coco" },
    { chave: "uva", nome: "Uva" },
    { chave: "laranja", nome: "Laranja" },
    { chave: "limao", nome: "Limão" },
    { chave: "maca", nome: "Maçã" },
    { chave: "banana", nome: "Banana" },
    { chave: "abacaxi", nome: "Abacaxi" },
    { chave: "maracuja", nome: "Maracujá" },
    { chave: "manga", nome: "Manga" },
    { chave: "goiaba", nome: "Goiaba" },
    { chave: "frutas vermelhas", nome: "Frutas vermelhas" },
    { chave: "natural", nome: "Natural" },
    { chave: "integral", nome: "Integral" },
    { chave: "desnatado", nome: "Desnatado" },
    { chave: "semidesnatado", nome: "Semidesnatado" },
    { chave: "zero lactose", nome: "Zero lactose" },
    { chave: "lactose zero", nome: "Zero lactose" },
    { chave: "zero acucar", nome: "Zero açúcar" },
    { chave: "zero", nome: "Zero" },
    { chave: "tradicional", nome: "Tradicional" },
    { chave: "original", nome: "Original" },
    { chave: "extra forte", nome: "Extra forte" },
    { chave: "forte", nome: "Forte" },
    { chave: "suave", nome: "Suave" },
    { chave: "queijo", nome: "Queijo" },
    { chave: "presunto", nome: "Presunto" },
    { chave: "frango", nome: "Frango" },
    { chave: "carne", nome: "Carne" },
    { chave: "calabresa", nome: "Calabresa" },
    { chave: "cebola", nome: "Cebola" },
    { chave: "alho", nome: "Alho" },
    { chave: "pimenta", nome: "Pimenta" },
    { chave: "menta", nome: "Menta" },
    { chave: "hortela", nome: "Hortelã" },
    { chave: "acai", nome: "Açaí" },
    { chave: "cookies", nome: "Cookies" },
    { chave: "caramelo", nome: "Caramelo" },
    { chave: "doce de leite", nome: "Doce de leite" },
    { chave: "leite condensado", nome: "Leite condensado" },
    { chave: "creme de leite", nome: "Creme de leite" },
    { chave: "carioca", nome: "Carioca" },
    { chave: "parboilizado", nome: "Parboilizado" },
    { chave: "agulhinha", nome: "Agulhinha" },
    { chave: "tipo 1", nome: "Tipo 1" },
    { chave: "t1", nome: "Tipo 1" },
    { chave: "extrafino", nome: "Extrafino" },
    { chave: "fino", nome: "Fino" }
  ];

  const encontrado = sabores.find(sabor => texto.includes(sabor.chave));

  return encontrado ? encontrado.nome : "";
}

function identificarFabricante(produto, marcaPrincipal) {
  const camposDiretos = [
    produto.owner,
    produto.producer,
    produto.producers,
    produto.manufacturing_places,
    Array.isArray(produto.manufacturing_places_tags) ? produto.manufacturing_places_tags.join(" ") : "",
    produto.packaging_text
  ];

  const direto = camposDiretos
    .map(limparTexto)
    .find(Boolean);

  if (direto) {
    return direto
      .replaceAll("en:", "")
      .replaceAll("pt:", "")
      .replace(/\s+/g, " ")
      .trim();
  }

  const texto = [
    marcaPrincipal,
    produto.brands,
    produto.product_name_pt,
    produto.product_name,
    produto.generic_name
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const mapaFabricantes = [
    {
      fabricante: "M. Dias Branco",
      marcas: [
        "finna",
        "fortaleza",
        "richester",
        "estrela",
        "puro sabor",
        "vitarella",
        "adyly",
        "bento pelotas",
        "isabela",
        "m dias branco"
      ]
    },
    {
      fabricante: "Coca-Cola FEMSA / The Coca-Cola Company",
      marcas: ["coca cola", "coca-cola", "fanta", "sprite", "del valle", "kuat", "schweppes", "crystal"]
    },
    {
      fabricante: "Ambev",
      marcas: ["antarctica", "brahma", "skol", "guarana antarctica", "pepsi", "sukita", "h2oh", "stella", "bohemia"]
    },
    {
      fabricante: "Nestlé",
      marcas: ["nestle", "nescau", "moca", "moça", "ninho", "kitkat", "negresco", "chamyto", "molico", "neston"]
    },
    {
      fabricante: "Unilever",
      marcas: ["hellmann", "knorr", "omo", "comfort", "dove", "rexona", "kibon", "closeup", "clear", "tresemme"]
    },
    {
      fabricante: "Piracanjuba",
      marcas: ["piracanjuba"]
    },
    {
      fabricante: "Itambé",
      marcas: ["itambe", "itambé"]
    },
    {
      fabricante: "Betânia",
      marcas: ["betania", "betânia"]
    },
    {
      fabricante: "Ypê",
      marcas: ["ype", "ypê", "tixan", "assolan"]
    },
    {
      fabricante: "Flora",
      marcas: ["minuano", "assim", "francis", "ox", "neutrox"]
    },
    {
      fabricante: "Kicaldo",
      marcas: ["kicaldo"]
    },
    {
      fabricante: "Urbano",
      marcas: ["urbano"]
    },
    {
      fabricante: "Camil",
      marcas: ["camil", "uniao", "união", "coqueiro"]
    },
    {
      fabricante: "Josapar",
      marcas: ["tio joao", "tio joão", "meu biju", "supra soy"]
    },
    {
      fabricante: "3 Corações",
      marcas: ["3 coracoes", "3 corações", "santa clara", "kimimo", "pimpinela"]
    },
    {
      fabricante: "JDE Peet's",
      marcas: ["pilao", "pilão", "caboclo", "damasco", "l'ore"]
    },
    {
      fabricante: "Mondelez",
      marcas: ["oreo", "club social", "bis", "trident", "halls", "tang", "royal", "lacta", "belvita"]
    },
    {
      fabricante: "PepsiCo",
      marcas: ["toddy", "ruffles", "doritos", "cheetos", "fandangos", "elma chips", "quaker", "mabel"]
    },
    {
      fabricante: "BRF",
      marcas: ["sadia", "perdigao", "perdigão", "qualy", "batavo"]
    },
    {
      fabricante: "Seara",
      marcas: ["seara", "rezende", "doriana", "margarina delicia", "delicia"]
    },
    {
      fabricante: "Bunge",
      marcas: ["soya", "salada", "primor", "delicia supreme", "suprema", "bunge"]
    },
    {
      fabricante: "J. Macêdo",
      marcas: ["dona benta", "sol", "petybon", "brandini", "boa sorte"]
    },
    {
      fabricante: "Kimberly-Clark",
      marcas: ["neve", "scott", "kleenex", "intimus", "plentify"]
    },
    {
      fabricante: "Procter & Gamble",
      marcas: ["pampers", "always", "ariel", "downy", "gillette", "head shoulders", "oral b"]
    },
    {
      fabricante: "Colgate-Palmolive",
      marcas: ["colgate", "palmolive", "protex", "ajax", "pinho sol", "sorriso"]
    },
    {
      fabricante: "Hypermarcas / Hypera",
      marcas: ["monange", "bozzano", "risque", "risqué", "jontex", "zero cal"]
    }
  ];

  for (const item of mapaFabricantes) {
    const encontrou = item.marcas.some(marca => texto.includes(marca));

    if (encontrou) {
      return item.fabricante;
    }
  }

  return "";
}

function obterFotoProduto(produto) {
  if (!produto) return "";

  if (produto.image_front_url) return produto.image_front_url;
  if (produto.image_url) return produto.image_url;

  if (produto.selected_images?.front?.display?.pt) {
    return produto.selected_images.front.display.pt;
  }

  if (produto.selected_images?.front?.display?.br) {
    return produto.selected_images.front.display.br;
  }

  if (produto.selected_images?.front?.display?.en) {
    return produto.selected_images.front.display.en;
  }

  return "";
}
