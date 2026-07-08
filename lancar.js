const usuario = protegerPagina();
const lojaAtual = protegerLojaSelecionada();

if (lojaAtual) {
  const lojaEl = document.getElementById("loja-lancamento");
  if (lojaEl) lojaEl.innerText = lojaAtual.nome;
}

const form = document.getElementById("form-lancamento");
const eanInput = document.getElementById("ean");
const nomeInput = document.getElementById("nomeProduto");
const produtoPreview = document.getElementById("produto-preview");

const btnCamera = document.getElementById("btn-camera");
const btnPararCamera = document.getElementById("btn-parar-camera");

let produtoAtual = null;

const validadeInput = document.getElementById("validade");
if (validadeInput) {
  validadeInput.min = new Date().toISOString().split("T")[0];
}


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


async function buscarProdutoCompleto(ean) {
  const codigo = normalizarCodigo(ean);

  if (!validarEAN(codigo)) {
    alert("EAN inválido. Confira o código.");
    return null;
  }

  let produto = buscarProdutoLocal(codigo);

  if (produto) {
    produtoAtual = produto;
    nomeInput.value = produto.nome;
    produtoPreview.innerHTML = cardProdutoHTML(produto, "Produto encontrado no cadastro local.");
    return produto;
  }

  nomeInput.value = "";
  produtoPreview.innerHTML = `
    <div class="card">
      <p class="muted">Buscando produto na API...</p>
    </div>
  `;

  try {
    produto = await buscarProdutoAPI(codigo);

    if (produto) {
      produto = salvarProdutoLocalSeNovo(produto);
      produtoAtual = produto;
      nomeInput.value = produto.nome;
      produtoPreview.innerHTML = cardProdutoHTML(produto, "Produto encontrado na API e salvo no cadastro local.");
      return produto;
    }

    produtoPreview.innerHTML = `
      <div class="card">
        <p class="danger">Produto não encontrado na API.</p>
        <p class="muted">Digite o nome manualmente ou peça para gerente/admin cadastrar o produto com foto.</p>
      </div>
    `;

    return null;
  } catch (erro) {
    console.error(erro);

    produtoPreview.innerHTML = `
      <div class="card">
        <p class="danger">Não foi possível consultar a API.</p>
        <p class="muted">Confira a internet ou cadastre/digite o produto manualmente.</p>
      </div>
    `;

    return null;
  }
}

eanInput.addEventListener("blur", async () => {
  const ean = normalizarCodigo(eanInput.value);

  if (ean !== "") {
    eanInput.value = ean;
    await buscarProdutoCompleto(ean);
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
        await buscarProdutoCompleto(eanConfirmado);
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

form.addEventListener("submit", function(event) {
  event.preventDefault();

  const ean = normalizarCodigo(eanInput.value);
  const nomeProduto = nomeInput.value.trim();

  if (!validarEAN(ean)) {
    alert("EAN inválido. Leia novamente pela câmera ou digite o código correto.");
    return;
  }

  if (!nomeProduto) {
    alert("Informe o nome do produto.");
    return;
  }

  const lancamentos = JSON.parse(localStorage.getItem("lancamentos")) || [];
  const produtoCadastrado = buscarProdutoLocal(ean);

  const novo = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    lojaId: lojaAtual.id,
    lojaNome: lojaAtual.nome,
    ean,
    nomeProduto,
    marca: produtoCadastrado ? (produtoCadastrado.marca || "") : (produtoAtual?.marca || ""),
    fabricante: produtoCadastrado ? (produtoCadastrado.fabricante || "") : (produtoAtual?.fabricante || ""),
    sabor: produtoCadastrado ? (produtoCadastrado.sabor || "") : (produtoAtual?.sabor || ""),
    categoria: produtoCadastrado ? (produtoCadastrado.categoria || "") : (produtoAtual?.categoria || ""),
    quantidadePadrao: produtoCadastrado ? (produtoCadastrado.quantidadePadrao || "") : (produtoAtual?.quantidadePadrao || ""),
    embalagem: produtoCadastrado ? (produtoCadastrado.embalagem || "") : (produtoAtual?.embalagem || ""),
    ingredientes: produtoCadastrado ? (produtoCadastrado.ingredientes || "") : (produtoAtual?.ingredientes || ""),
    setor: document.getElementById("setor").value,
    quantidade: Number(document.getElementById("quantidade").value),
    validade: document.getElementById("validade").value,
    foto: produtoCadastrado ? produtoCadastrado.foto : "",
    produtoCadastrado: Boolean(produtoCadastrado),
    usuarioId: usuario.id,
    usuarioNome: usuario.nome,
    usuarioCargo: usuario.cargo,
    criadoEm: new Date().toLocaleString("pt-BR")
  };

  const confirmar = confirm(
    `Confirmar lançamento?\n\nLoja: ${lojaAtual.nome}\nProduto: ${nomeProduto}\nSetor: ${novo.setor}\nValidade: ${novo.validade}`
  );

  if (!confirmar) {
    return;
  }

  lancamentos.push(novo);
  localStorage.setItem("lancamentos", JSON.stringify(lancamentos));

  alert("Lançamento salvo com sucesso!");
  form.reset();
  produtoPreview.innerHTML = "";
});
