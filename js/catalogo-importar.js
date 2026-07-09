const usuario = protegerPagina();

if (!podeCadastrarProduto(usuario.cargo)) {
  alert("Somente gerente e admin podem importar catálogo.");
  window.location.href = "dashboard.html";
}

const formImportar = document.getElementById("form-importar-catalogo");
const arquivoCatalogo = document.getElementById("arquivoCatalogo");
const statusImportacao = document.getElementById("status-importacao");
const previewCatalogo = document.getElementById("preview-catalogo");

let itensPreview = [];

function detectarSeparadorCSV(linha) {
  const virgulas = (linha.match(/,/g) || []).length;
  const pontosVirgulas = (linha.match(/;/g) || []).length;

  return pontosVirgulas > virgulas ? ";" : ",";
}

function parseCSV(texto) {
  const linhas = String(texto || "").replace(/^\uFEFF/, "").split(/\r?\n/).filter(linha => linha.trim());

  if (linhas.length < 2) return [];

  const separador = detectarSeparadorCSV(linhas[0]);
  const resultado = [];

  for (const linha of linhas) {
    const campos = [];
    let atual = "";
    let dentroAspas = false;

    for (let i = 0; i < linha.length; i++) {
      const char = linha[i];
      const proximo = linha[i + 1];

      if (char === '"' && proximo === '"') {
        atual += '"';
        i++;
        continue;
      }

      if (char === '"') {
        dentroAspas = !dentroAspas;
        continue;
      }

      if (char === separador && !dentroAspas) {
        campos.push(atual.trim());
        atual = "";
        continue;
      }

      atual += char;
    }

    campos.push(atual.trim());
    resultado.push(campos);
  }

  const cabecalhos = resultado.shift().map(campo =>
    campo
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_")
      .trim()
  );

  return resultado.map(linha => {
    const item = {};

    cabecalhos.forEach((campo, index) => {
      item[campo] = linha[index] || "";
    });

    return item;
  });
}

function normalizarLinhaCatalogo(linha, index) {
  const ean = String(linha.ean || linha.gtin || linha.codigo_barras || linha.codigo || "").replace(/\D/g, "");
  const nome = linha.nome || linha.produto || linha.descricao || linha.description || "";

  return {
    codigoInterno: linha.codigo_interno || linha.codigoInterno || ean || `CSV-${Date.now()}-${index}`,
    ean,
    nome,
    marca: linha.marca || linha.brand || "",
    fabricante: linha.fabricante || linha.manufacturer || "",
    sabor: linha.sabor || linha.variacao || "",
    categoria: linha.categoria || linha.category || "",
    quantidadePadrao: linha.quantidade_padrao || linha.quantidade || linha.quantity || "",
    porcao: linha.porcao || linha.serving_size || "",
    embalagem: linha.embalagem || linha.package || "",
    origem: linha.origem || "",
    paises: linha.paises || linha.pais || "",
    lojas: linha.lojas_encontradas || linha.lojas || "",
    ingredientes: linha.ingredientes || "",
    alergicos: linha.alergicos || "",
    rastros: linha.rastros || "",
    nutriscore: linha.nutriscore || "",
    ecoscore: linha.ecoscore || "",
    nova: linha.nova || "",
    foto: linha.foto || linha.image || linha.image_url || "",
    fonte: linha.fonte || "Importação CSV",
    ativo: true
  };
}

function renderizarPreview(itens) {
  if (!previewCatalogo) return;

  if (!itens.length) {
    previewCatalogo.innerHTML = `<p class="muted">Nenhum item válido encontrado.</p>`;
    return;
  }

  previewCatalogo.innerHTML = `
    <p class="muted">${itens.length} produto(s) válido(s) lidos. Mostrando os 10 primeiros.</p>
    <div class="catalogo-resultados">
      ${itens.slice(0, 10).map(item => `
        <article class="catalogo-item">
          <div>
            <strong>${esc(item.nome)}</strong>
            <p>${esc(item.ean || "Sem EAN")} • ${esc(item.marca || "Sem marca")} • ${esc(item.fabricante || "Sem fabricante")}</p>
            <small>${esc(item.categoria || "Sem categoria")} ${item.quantidadePadrao ? "• " + esc(item.quantidadePadrao) : ""}</small>
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

arquivoCatalogo.addEventListener("change", async () => {
  const arquivo = arquivoCatalogo.files?.[0];

  if (!arquivo) return;

  const texto = await arquivo.text();
  const linhas = parseCSV(texto);

  itensPreview = linhas
    .map(normalizarLinhaCatalogo)
    .filter(item => item.nome && (item.ean || item.codigoInterno));

  renderizarPreview(itensPreview);
});

formImportar.addEventListener("submit", async event => {
  event.preventDefault();

  if (!itensPreview.length) {
    alert("Selecione um CSV válido antes de importar.");
    return;
  }

  const confirmar = await confirmarAcao(
    `Importar ${itensPreview.length} produto(s) para o catálogo do banco?`,
    "Importar catálogo"
  );

  if (!confirmar) return;

  statusImportacao.innerHTML = `<div class="card"><p class="muted">Importando produtos para o banco...</p></div>`;

  try {
    const resultado = await valisysDB.importarCatalogoProdutos(itensPreview);

    statusImportacao.innerHTML = `
      <div class="card">
        <p class="success">Catálogo importado com sucesso.</p>
        <p class="muted">${resultado.importados} produto(s) enviados para o banco.</p>
      </div>
    `;
  } catch (erro) {
    console.error(erro);
    statusImportacao.innerHTML = `
      <div class="card">
        <p class="danger">Erro ao importar catálogo.</p>
        <p class="muted">${esc(erro.message)}</p>
      </div>
    `;
  }
});
