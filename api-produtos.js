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
    "brands",
    "categories",
    "main_category",
    "quantity",
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
    marca: limparTexto(produto.brands || ""),
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
