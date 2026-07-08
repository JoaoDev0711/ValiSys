async function buscarProdutoAPI(ean) {
  const codigo = normalizarCodigo(ean);

  if (!validarEAN(codigo)) {
    return null;
  }

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

  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(codigo)}.json?fields=${campos}`;

  const resposta = await fetch(url, {
    method: "GET",
    headers: {
      "Accept": "application/json"
    }
  });

  if (!resposta.ok) {
    throw new Error("Erro ao consultar API de produtos.");
  }

  const dados = await resposta.json();

  if (dados.status !== 1 || !dados.product) {
    return null;
  }

  const produto = dados.product;

  const nome =
    produto.product_name_pt ||
    produto.product_name ||
    produto.abbreviated_product_name ||
    produto.generic_name ||
    "";

  if (!nome.trim()) {
    return null;
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
    fonte: "Open Food Facts",
    criadoEm: new Date().toLocaleString("pt-BR")
  };
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
  // Versão Supabase-only: produto local desativado.
  // Use valisysDB.buscarProdutoPorEAN(ean).
  return null;
}

function salvarProdutoLocalSeNovo(produto) {
  // Versão Supabase-only: salvamento local desativado.
  // Use valisysDB.salvarProduto(produto).
  return produto || null;
}

function cardProdutoHTML(produto, mensagem = "") {
  return `
    <div class="card produto-encontrado">
      ${mensagem ? `<p class="api-status">${esc(mensagem)}</p>` : ""}
      <h3>${esc(produto.nome)}</h3>
      <p><strong>EAN:</strong> ${esc(produto.ean)}</p>
      <p><strong>Marca:</strong> ${esc(produto.marca || "Não informada")}</p>
      <p><strong>Fabricante:</strong> ${esc(produto.fabricante || "Não informado")}</p>
      <p><strong>Sabor/variação:</strong> ${esc(produto.sabor || "Não informado")}</p>
      <p><strong>Categoria:</strong> ${esc(produto.categoria || "Não informada")}</p>
      ${produto.quantidadePadrao ? `<p><strong>Quantidade padrão:</strong> ${esc(produto.quantidadePadrao)}</p>` : ""}
      ${produto.embalagem ? `<p><strong>Embalagem:</strong> ${esc(produto.embalagem)}</p>` : ""}
      ${produto.origem ? `<p><strong>Origem:</strong> ${esc(produto.origem)}</p>` : ""}
      ${produto.paises ? `<p><strong>Países:</strong> ${esc(produto.paises)}</p>` : ""}
      ${produto.lojas ? `<p><strong>Lojas encontradas:</strong> ${esc(produto.lojas)}</p>` : ""}
      ${produto.ingredientes ? `<p><strong>Ingredientes:</strong> ${esc(produto.ingredientes)}</p>` : ""}
      ${produto.alergicos ? `<p><strong>Alérgicos:</strong> ${esc(produto.alergicos)}</p>` : ""}
      ${produto.nutriscore ? `<p><strong>Nutri-Score:</strong> ${esc(produto.nutriscore)}</p>` : ""}
      ${produto.nova ? `<p><strong>NOVA:</strong> ${esc(produto.nova)}</p>` : ""}
      ${produto.fonte ? `<p><strong>Fonte:</strong> ${esc(produto.fonte)}</p>` : ""}
      ${
        produto.foto
          ? `<img class="produto-img" src="${produto.foto}" alt="${esc(produto.nome)}">`
          : `<p class="muted">Produto sem foto cadastrada.</p>`
      }
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
    { chave: "zero", nome: "Zero" },
    { chave: "tradicional", nome: "Tradicional" },
    { chave: "original", nome: "Original" },
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
    { chave: "doce de leite", nome: "Doce de leite" }
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
        "isabela"
      ]
    },
    {
      fabricante: "Coca-Cola FEMSA / The Coca-Cola Company",
      marcas: ["coca cola", "fanta", "sprite", "del valle", "kuat"]
    },
    {
      fabricante: "Ambev",
      marcas: ["antarctica", "brahma", "skol", "guarana antarctica", "pepsi"]
    },
    {
      fabricante: "Nestlé",
      marcas: ["nestle", "nescau", "moça", "ninho", "kitkat", "negresco"]
    },
    {
      fabricante: "Unilever",
      marcas: ["hellmann", "knorr", "omo", "comfort", "dove", "rexona"]
    },
    {
      fabricante: "Piracanjuba",
      marcas: ["piracanjuba"]
    },
    {
      fabricante: "Itambé",
      marcas: ["itambe"]
    },
    {
      fabricante: "Betânia",
      marcas: ["betania"]
    },
    {
      fabricante: "Ypê",
      marcas: ["ype"]
    },
    {
      fabricante: "Flora",
      marcas: ["minuano", "assim", "francis", "ox"]
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
