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
    "quantity",
    "labels",
    "labels_tags",
    "categories_tags",
    "ingredients_text",
    "manufacturing_places",
    "manufacturing_places_tags",
    "producer",
    "producers",
    "owner",
    "packaging_text",
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
    produto.generic_name ||
    "";

  if (!nome.trim()) {
    return null;
  }

  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    ean: codigo,
    nome: limparTexto(nome),
    marca: limparMarca(produto.brands || ""),
    fabricante: identificarFabricante(produto, limparMarca(produto.brands || "")),
    sabor: identificarSabor(produto),
    categoria: limparCategoria(produto.categories || produto.main_category || ""),
    quantidadePadrao: limparTexto(produto.quantity || ""),
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
  const codigo = normalizarCodigo(ean);
  const produtos = JSON.parse(localStorage.getItem("produtos")) || [];
  return produtos.find(p => p.ean === codigo) || null;
}

function salvarProdutoLocalSeNovo(produto) {
  if (!produto || !produto.ean) return null;

  const produtos = JSON.parse(localStorage.getItem("produtos")) || [];
  const existente = produtos.find(p => p.ean === produto.ean);

  if (existente) {
    let mudou = false;

    if (!existente.nome && produto.nome) {
      existente.nome = produto.nome;
      mudou = true;
    }

    if (!existente.marca && produto.marca) {
      existente.marca = produto.marca;
      mudou = true;
    }

    if (!existente.fabricante && produto.fabricante) {
      existente.fabricante = produto.fabricante;
      mudou = true;
    }

    if (!existente.sabor && produto.sabor) {
      existente.sabor = produto.sabor;
      mudou = true;
    }

    if (!existente.categoria && produto.categoria) {
      existente.categoria = produto.categoria;
      mudou = true;
    }

    if (!existente.foto && produto.foto) {
      existente.foto = produto.foto;
      mudou = true;
    }

    if (!existente.fonte && produto.fonte) {
      existente.fonte = produto.fonte;
      mudou = true;
    }

    if (mudou) {
      localStorage.setItem("produtos", JSON.stringify(produtos));
    }

    return existente;
  }

  produtos.push(produto);
  localStorage.setItem("produtos", JSON.stringify(produtos));
  return produto;
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
      ${produto.fonte ? `<p><strong>Fonte:</strong> ${esc(produto.fonte)}</p>` : ""}
      ${
        produto.foto
          ? `<img class="produto-img" src="${produto.foto}" alt="${esc(produto.nome)}">`
          : `<p class="muted">Produto sem foto cadastrada.</p>`
      }
    </div>
  `;
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
    { chave: "frutas", nome: "Frutas" },
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

  // Mapeamento manual para marcas conhecidas.
  // Isso ajuda quando a API traz a marca, mas não traz o fabricante/dono.
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
