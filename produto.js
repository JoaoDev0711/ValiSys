const usuario = protegerPagina();

if (!podeCadastrarProduto(usuario.cargo)) {
  alert("Você não tem permissão para cadastrar produtos.");
  window.location.href = "index.html";
}

const form = document.getElementById("form-produto");
const lista = document.getElementById("lista-produtos");

const eanInput = document.getElementById("ean");
const nomeInput = document.getElementById("nome");
const marcaInput = document.getElementById("marca");
const fabricanteInput = document.getElementById("fabricante");
const saborInput = document.getElementById("sabor");
const categoriaInput = document.getElementById("categoria");

const fotoArquivo = document.getElementById("fotoArquivo");
const previewFoto = document.getElementById("preview-foto");

const btnCamera = document.getElementById("btn-camera");
const btnPararCamera = document.getElementById("btn-parar-camera");

let fotoBase64 = "";

let leitorCamera = null;
let ultimoCodigoLido = "";
let repeticoesCodigo = 0;
let audioLiberado = false;

const scannerStatus = document.getElementById("scanner-status");

function atualizarStatusScanner(texto, tipo = "") {
  if (!scannerStatus) return;

  scannerStatus.innerText = texto;
  scannerStatus.className = tipo;
}

function liberarAudioLeitura() {
  // Navegadores móveis só deixam tocar som depois de uma ação do usuário.
  audioLiberado = true;
}

function tocarSomLeitura() {
  if (!audioLiberado) return;

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const contexto = new AudioContext();

    const oscilador = contexto.createOscillator();
    const ganho = contexto.createGain();

    oscilador.type = "sine";
    oscilador.frequency.setValueAtTime(880, contexto.currentTime);

    ganho.gain.setValueAtTime(0.001, contexto.currentTime);
    ganho.gain.exponentialRampToValueAtTime(0.18, contexto.currentTime + 0.02);
    ganho.gain.exponentialRampToValueAtTime(0.001, contexto.currentTime + 0.16);

    oscilador.connect(ganho);
    ganho.connect(contexto.destination);

    oscilador.start();
    oscilador.stop(contexto.currentTime + 0.18);
  } catch (erro) {
    console.warn("Som de leitura não disponível neste navegador.", erro);
  }
}

function normalizarCodigo(codigo) {
  return String(codigo || "").replace(/\D/g, "");
}

function validarEAN8(ean) {
  if (!/^\d{8}$/.test(ean)) return false;

  const digitos = ean.split("").map(Number);
  const soma =
    (digitos[0] + digitos[2] + digitos[4] + digitos[6]) * 3 +
    (digitos[1] + digitos[3] + digitos[5]);

  const verificador = (10 - (soma % 10)) % 10;

  return verificador === digitos[7];
}

function validarEAN13(ean) {
  if (!/^\d{13}$/.test(ean)) return false;

  const digitos = ean.split("").map(Number);
  let soma = 0;

  for (let i = 0; i < 12; i++) {
    soma += digitos[i] * (i % 2 === 0 ? 1 : 3);
  }

  const verificador = (10 - (soma % 10)) % 10;

  return verificador === digitos[12];
}

function validarEAN(ean) {
  return validarEAN13(ean) || validarEAN8(ean);
}

function confirmarLeitura(codigo) {
  const ean = normalizarCodigo(codigo);

  if (!validarEAN(ean)) {
    atualizarStatusScanner("Tentando ler... mantenha o código inteiro dentro da área.", "scanner-lendo");
    return null;
  }

  if (ean === ultimoCodigoLido) {
    repeticoesCodigo++;
  } else {
    ultimoCodigoLido = ean;
    repeticoesCodigo = 1;
    atualizarStatusScanner(`EAN detectado: ${ean}. Segure firme para confirmar...`, "scanner-lendo");
  }

  // Mantém confirmação dupla para evitar leitura errada.
  if (repeticoesCodigo >= 2) {
    atualizarStatusScanner(`EAN confirmado: ${ean}`, "scanner-ok");
    return ean;
  }

  return null;
}

function configScanner() {
  const config = {
    fps: 12,
    qrbox: function(viewfinderWidth, viewfinderHeight) {
      const largura = Math.floor(viewfinderWidth * 0.96);
      const altura = Math.min(230, Math.max(150, Math.floor(viewfinderHeight * 0.34)));

      return {
        width: largura,
        height: altura
      };
    },
    aspectRatio: 1.7777778,
    rememberLastUsedCamera: true,
    disableFlip: true
  };

  if (window.Html5QrcodeSupportedFormats) {
    config.formatsToSupport = [
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.EAN_8
    ].filter(Boolean);
  }

  return config;
}

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

  ultimoCodigoLido = "";
  repeticoesCodigo = 0;

  btnCamera.style.display = "block";
  btnPararCamera.style.display = "none";

  atualizarStatusScanner("Aponte a câmera para o código de barras inteiro.", "");
}


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

async function preencherProdutoPorEAN(ean) {
  const codigo = normalizarCodigo(ean);

  if (!validarEAN(codigo)) {
    alert("EAN inválido. Confira o código.");
    return;
  }

  eanInput.value = codigo;

  let produto = buscarProdutoLocal(codigo);

  if (!produto) {
    previewFoto.innerHTML = `<div class="card"><p class="muted">Buscando produto na API...</p></div>`;

    try {
      produto = await buscarProdutoAPI(codigo);
    } catch (erro) {
      console.error(erro);
      previewFoto.innerHTML = `<p class="danger">Não foi possível consultar a API.</p>`;
      return;
    }
  }

  if (!produto) {
    previewFoto.innerHTML = `<p class="muted">Produto não encontrado na API. Preencha manualmente.</p>`;
    return;
  }

  nomeInput.value = produto.nome || "";
  marcaInput.value = produto.marca || "";
  fabricanteInput.value = produto.fabricante || "";
  saborInput.value = produto.sabor || "";
  categoriaInput.value = produto.categoria || "";

  if (produto.foto) {
    fotoBase64 = produto.foto;
    previewFoto.innerHTML = `<img class="produto-img" src="${produto.foto}" alt="${esc(produto.nome)}">`;
  } else {
    previewFoto.innerHTML = `<p class="muted">Produto encontrado, mas sem foto.</p>`;
  }
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
      <p><strong>Fabricante:</strong> ${esc(produto.fabricante || "Não informado")}</p>
      <p><strong>Sabor/variação:</strong> ${esc(produto.sabor || "Não informado")}</p>
      <p><strong>Categoria:</strong> ${esc(produto.categoria || "Não informada")}</p>
      ${produto.fonte ? `<p><strong>Fonte:</strong> ${esc(produto.fonte)}</p>` : ""}
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
  const ean = normalizarCodigo(eanInput.value);

  if (!validarEAN(ean)) {
    alert("EAN inválido. Leia novamente pela câmera ou digite o código correto.");
    return;
  }

  const novoProduto = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    ean,
    nome: nomeInput.value.trim(),
    marca: marcaInput.value.trim(),
    fabricante: fabricanteInput.value.trim(),
    sabor: saborInput.value.trim(),
    categoria: categoriaInput.value.trim(),
    foto: fotoBase64,
    fonte: fotoBase64 && fotoBase64.startsWith("http") ? "Open Food Facts" : "Cadastro local",
    cadastradoPor: usuario.nome,
    criadoEm: new Date().toLocaleString("pt-BR")
  };

  if (!novoProduto.nome) {
    alert("Informe o nome do produto.");
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

eanInput.addEventListener("blur", async () => {
  const ean = normalizarCodigo(eanInput.value);

  if (ean) {
    await preencherProdutoPorEAN(ean);
  }
});

btnCamera.addEventListener("click", async () => {
  liberarAudioLeitura();
  atualizarStatusScanner("Abrindo câmera...", "scanner-lendo");
  if (!window.Html5Qrcode) {
    alert("Biblioteca de leitura não carregou. Verifique a internet ou rode pelo Live Server/GitHub Pages.");
    return;
  }

  leitorCamera = new Html5Qrcode("reader");

  btnCamera.style.display = "none";
  btnPararCamera.style.display = "block";

  try {
    await leitorCamera.start(
      { facingMode: "environment" },
      configScanner(),
      async (codigoLido) => {
        const eanConfirmado = confirmarLeitura(codigoLido);

        if (!eanConfirmado) {
          return;
        }

        eanInput.value = eanConfirmado;

        tocarSomLeitura();

        if (navigator.vibrate) {
          navigator.vibrate([80, 40, 80]);
        }

        await pararCamera();
        await preencherProdutoPorEAN(eanConfirmado);
      },
      () => {}
    );
  } catch (erro) {
    alert("Não foi possível abrir a câmera. Use Live Server, GitHub Pages ou HTTPS.");
    console.error(erro);
    btnCamera.style.display = "block";
    btnPararCamera.style.display = "none";
    atualizarStatusScanner("Não foi possível abrir a câmera. Verifique permissão e HTTPS.", "scanner-erro");
  }
});

btnPararCamera.addEventListener("click", pararCamera);

carregarProdutos();
