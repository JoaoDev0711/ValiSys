const usuario = protegerPagina();

if (!podeCadastrarProduto(usuario.cargo)) {
  alert("Você não tem permissão para cadastrar produtos.");
  window.location.href = "main.html";
}

const form = document.getElementById("form-produto");
const lista = document.getElementById("lista-produtos");

const eanInput = document.getElementById("ean");
const fotoArquivo = document.getElementById("fotoArquivo");
const previewFoto = document.getElementById("preview-foto");

const btnCamera = document.getElementById("btn-camera");
const btnPararCamera = document.getElementById("btn-parar-camera");

let fotoBase64 = "";
let leitorCamera = null;

fotoArquivo.addEventListener("change", async function() {
  const arquivo = fotoArquivo.files[0];

  if (!arquivo) {
    fotoBase64 = "";
    previewFoto.innerHTML = "";
    return;
  }

  try {
    fotoBase64 = await compactarImagem(arquivo, 700, 0.72);

    previewFoto.innerHTML = `
      <img class="produto-img" src="${fotoBase64}" alt="Preview da foto">
    `;
  } catch (erro) {
    alert("Não foi possível carregar a foto.");
    console.error(erro);
  }
});

function compactarImagem(arquivo, larguraMaxima, qualidade) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();

    leitor.onload = function(event) {
      const img = new Image();

      img.onload = function() {
        const escala = Math.min(1, larguraMaxima / img.width);
        const largura = Math.round(img.width * escala);
        const altura = Math.round(img.height * escala);

        const canvas = document.createElement("canvas");
        canvas.width = largura;
        canvas.height = altura;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, largura, altura);

        resolve(canvas.toDataURL("image/jpeg", qualidade));
      };

      img.onerror = reject;
      img.src = event.target.result;
    };

    leitor.onerror = reject;
    leitor.readAsDataURL(arquivo);
  });
}

function carregarProdutos() {
  const produtos = JSON.parse(localStorage.getItem("produtos")) || [];

  if (produtos.length === 0) {
    lista.innerHTML = `<div class="card"><p>Nenhum produto cadastrado.</p></div>`;
    return;
  }

  produtos.sort((a, b) => a.nome.localeCompare(b.nome));

  lista.innerHTML = produtos.map(produto => `
    <article class="card">
      <h3>${esc(produto.nome)}</h3>
      <p><strong>EAN:</strong> ${esc(produto.ean)}</p>
      <p><strong>Marca:</strong> ${esc(produto.marca || "Não informada")}</p>
      <p><strong>Categoria:</strong> ${esc(produto.categoria || "Não informada")}</p>
      ${
        produto.foto
          ? `<img class="produto-img" src="${produto.foto}" alt="${esc(produto.nome)}">`
          : `<p class="muted">Sem foto cadastrada.</p>`
      }
      <div class="card-actions">
        <button class="btn-danger" onclick="apagarProduto('${produto.id}')">Apagar produto</button>
      </div>
    </article>
  `).join("");
}

function apagarProduto(id) {
  const confirmar = confirm("Deseja apagar este produto cadastrado?");

  if (!confirmar) return;

  let produtos = JSON.parse(localStorage.getItem("produtos")) || [];
  produtos = produtos.filter(p => p.id !== id);

  localStorage.setItem("produtos", JSON.stringify(produtos));
  carregarProdutos();
}

form.addEventListener("submit", function(event) {
  event.preventDefault();

  const produtos = JSON.parse(localStorage.getItem("produtos")) || [];

  const novoProduto = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    ean: eanInput.value.trim(),
    nome: document.getElementById("nome").value.trim(),
    marca: document.getElementById("marca").value.trim(),
    categoria: document.getElementById("categoria").value.trim(),
    foto: fotoBase64,
    cadastradoPor: usuario.nome,
    criadoEm: new Date().toLocaleString("pt-BR")
  };

  if (!/^\d{6,14}$/.test(novoProduto.ean)) {
    alert("EAN inválido. Use apenas números.");
    return;
  }

  const existe = produtos.some(p => p.ean === novoProduto.ean);

  if (existe) {
    alert("Já existe produto com esse EAN.");
    return;
  }

  produtos.push(novoProduto);
  localStorage.setItem("produtos", JSON.stringify(produtos));

  alert("Produto cadastrado!");

  form.reset();
  fotoBase64 = "";
  previewFoto.innerHTML = "";

  carregarProdutos();
});

btnCamera.addEventListener("click", async () => {
  if (!window.Html5Qrcode) {
    alert("Biblioteca de leitura não carregou. Verifique a internet ou rode pelo Live Server/GitHub Pages.");
    return;
  }

  leitorCamera = new Html5Qrcode("reader");

  btnCamera.style.display = "none";
  btnPararCamera.style.display = "block";

  const config = {
    fps: 10,
    qrbox: { width: 280, height: 150 }
  };

  if (window.Html5QrcodeSupportedFormats) {
    config.formatsToSupport = [
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.EAN_8,
      Html5QrcodeSupportedFormats.UPC_A,
      Html5QrcodeSupportedFormats.UPC_E,
      Html5QrcodeSupportedFormats.CODE_128,
      Html5QrcodeSupportedFormats.CODE_39
    ].filter(Boolean);
  }

  try {
    await leitorCamera.start(
      { facingMode: "environment" },
      config,
      async (codigoLido) => {
        eanInput.value = codigoLido;
        await pararCamera();
      },
      () => {}
    );
  } catch (erro) {
    alert("Não foi possível abrir a câmera. Use Live Server, GitHub Pages ou HTTPS.");
    console.error(erro);
    btnCamera.style.display = "block";
    btnPararCamera.style.display = "none";
  }
});

btnPararCamera.addEventListener("click", pararCamera);

async function pararCamera() {
  if (leitorCamera) {
    try {
      await leitorCamera.stop();
      leitorCamera.clear();
    } catch (erro) {
      console.warn("Câmera já estava parada.", erro);
    }

    leitorCamera = null;
  }

  btnCamera.style.display = "block";
  btnPararCamera.style.display = "none";
}

carregarProdutos();
