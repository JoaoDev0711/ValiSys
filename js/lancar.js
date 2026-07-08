const usuario = protegerPagina();
if (bloquearAdminEmAreaLoja()) throw new Error('Admin bloqueado na área da loja.');
const lojaAtual = protegerLojaSelecionada();

if (lojaAtual) {
  const lojaEl = document.getElementById("loja-lancamento");
  if (lojaEl) lojaEl.innerHTML = lojaInlineHTML(lojaAtual);
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


function cameraResolucaoDoCelular() {
  const dpr = window.devicePixelRatio || 1;

  const larguraTela = Math.round((window.screen?.width || window.innerWidth || 1280) * dpr);
  const alturaTela = Math.round((window.screen?.height || window.innerHeight || 720) * dpr);

  const maior = Math.max(larguraTela, alturaTela);
  const menor = Math.min(larguraTela, alturaTela);

  // Usa a resolução real aproximada do aparelho como "ideal".
  // Não usamos "exact" porque alguns celulares recusam e a câmera nem abre.
  return {
    facingMode: { ideal: "environment" },
    width: { ideal: maior },
    height: { ideal: menor }
  };
}

async function melhorarImagemCamera() {
  await new Promise(resolve => setTimeout(resolve, 500));

  const video = document.querySelector("#reader video");

  if (!video || !video.srcObject) return;

  video.setAttribute("playsinline", "true");
  video.style.objectFit = "cover";

  const tracks = video.srcObject.getVideoTracks ? video.srcObject.getVideoTracks() : [];
  const track = tracks[0];

  if (!track || !track.getCapabilities || !track.applyConstraints) return;

  try {
    const caps = track.getCapabilities();
    const advanced = [];

    if (caps.width && caps.height) {
      const dpr = window.devicePixelRatio || 1;
      const larguraTela = Math.round((window.screen?.width || window.innerWidth || 1280) * dpr);
      const alturaTela = Math.round((window.screen?.height || window.innerHeight || 720) * dpr);

      const larguraIdeal = Math.min(caps.width.max || larguraTela, Math.max(caps.width.min || 0, Math.max(larguraTela, alturaTela)));
      const alturaIdeal = Math.min(caps.height.max || alturaTela, Math.max(caps.height.min || 0, Math.min(larguraTela, alturaTela)));

      advanced.push({
        width: larguraIdeal,
        height: alturaIdeal
      });
    }

    if (caps.focusMode && caps.focusMode.includes("continuous")) {
      advanced.push({ focusMode: "continuous" });
    }

    if (caps.exposureMode && caps.exposureMode.includes("continuous")) {
      advanced.push({ exposureMode: "continuous" });
    }

    if (caps.whiteBalanceMode && caps.whiteBalanceMode.includes("continuous")) {
      advanced.push({ whiteBalanceMode: "continuous" });
    }

    if (caps.zoom) {
      const min = caps.zoom.min || 1;
      const max = caps.zoom.max || 1;
      const zoomIdeal = Math.min(max, Math.max(min, 1.15));

      if (zoomIdeal > min) {
        advanced.push({ zoom: zoomIdeal });
      }
    }

    if (advanced.length > 0) {
      await track.applyConstraints({ advanced });
    }
  } catch (erro) {
    console.warn("Não foi possível aplicar resolução/foco automático nesta câmera.", erro);
  }

  try {
    const settings = track.getSettings ? track.getSettings() : null;

    if (settings?.width && settings?.height) {
      atualizarStatusScanner(`Câmera aberta em ${settings.width}x${settings.height}. Aproxime ou afaste até o código ficar nítido.`, "scanner-lendo");
    }
  } catch (erro) {
    console.warn("Não foi possível ler a resolução da câmera.", erro);
  }
}

async function iniciarCameraLeitura(callbackLeitura) {
  leitorCamera = new Html5Qrcode("reader");

  try {
    await leitorCamera.start(
      cameraResolucaoDoCelular(),
      configScanner(),
      callbackLeitura,
      () => {}
    );

    await melhorarImagemCamera();
  } catch (erroResolucaoCelular) {
    console.warn("Resolução do celular não disponível. Tentando modo padrão.", erroResolucaoCelular);

    await leitorCamera.start(
      { facingMode: "environment" },
      configScanner(),
      callbackLeitura,
      () => {}
    );

    await melhorarImagemCamera();
    atualizarStatusScanner("Câmera aberta em modo padrão. Aproxime o código e mantenha o celular parado.", "scanner-lendo");
  }
}


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
    fps: 18,
    rememberLastUsedCamera: true,
    disableFlip: true,
    videoConstraints: cameraResolucaoDoCelular()
  };

  if (window.Html5QrcodeSupportedFormats) {
    config.formatsToSupport = [
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.EAN_8,
      Html5QrcodeSupportedFormats.CODE_128,
      Html5QrcodeSupportedFormats.UPC_A,
      Html5QrcodeSupportedFormats.UPC_E
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

  document.body.classList.remove("camera-aberta");

  btnCamera.style.display = "block";
  btnPararCamera.style.display = "none";

  atualizarStatusScanner("Aponte a câmera para o código inteiro. Se ficar embaçado, afaste um pouco e use boa luz.", "");
}


async function buscarProdutoCompleto(ean) {
  const codigo = normalizarCodigo(ean);

  if (!validarEAN(codigo)) {
    alert("EAN inválido. Confira o código.");
    return null;
  }

  eanInput.value = codigo;
  let produto = null;

  nomeInput.value = "";
  produtoPreview.innerHTML = `
    <div class="card">
      <p class="muted">Buscando produto no sistema...</p>
    </div>
  `;

  try {
    produto = await valisysDB.buscarProdutoPorEAN(codigo);
  } catch (errosistema) {
    console.warn("Falha ao buscar produto no sistema. Tentando base de produtos.", errosistema);
  }

  if (produto) {
    produtoAtual = produto;
    nomeInput.value = produto.nome || "";
    produtoPreview.innerHTML = cardProdutoHTML(produto, "Produto encontrado no cadastro.");
    return produto;
  }

  produtoPreview.innerHTML = `
    <div class="card">
      <p class="muted">Produto não estava cadastrado. Buscando na base de produtos...</p>
    </div>
  `;

  try {
    produto = await buscarProdutoFonteProdutos(codigo);
  } catch (erroFonte) {
    console.warn("base de produtos não retornou produto.", erroFonte);
    produtoPreview.innerHTML = `
      <div class="card">
        <p class="danger">Não consegui puxar esse item pela base de produtos.</p>
        <p class="muted">Você ainda pode digitar o nome manualmente e lançar normalmente.</p>
      </div>
    `;
    produtoAtual = null;
    return null;
  }

  if (!produto) {
    produtoPreview.innerHTML = `
      <div class="card">
        <p class="muted">Produto não encontrado na base de produtos.</p>
        <p class="muted">Digite o nome manualmente e lance normalmente.</p>
      </div>
    `;
    produtoAtual = null;
    return null;
  }

  // Preenche a tela mesmo que o salvamento do produto no sistema falhe.
  produtoAtual = produto;
  nomeInput.value = produto.nome || "";

  try {
    const produtoSalvo = await valisysDB.salvarProduto(produto);
    produtoAtual = produtoSalvo || produto;
    produtoPreview.innerHTML = cardProdutoHTML(produtoAtual, "Produto encontrado e cadastrado.");
  } catch (erroSalvarProduto) {
    console.warn("Produto puxado da base de produtos, mas não salvo em produtos. O lançamento ainda pode ser salvo.", erroSalvarProduto);
    produtoPreview.innerHTML = cardProdutoHTML(produto, "Produto encontrado. O lançamento já pode ser feito.");
  }

  return produtoAtual;
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

  document.body.classList.add("camera-aberta");
  btnCamera.style.display = "none";
  btnPararCamera.style.display = "block";

  try {
    await iniciarCameraLeitura(async (codigoLido) => {
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
    });
  } catch (erro) {
    alert("Não foi possível abrir a câmera. Use Live Server, GitHub Pages ou HTTPS.");
    console.error(erro);
    document.body.classList.remove("camera-aberta");
    btnCamera.style.display = "block";
    btnPararCamera.style.display = "none";
    atualizarStatusScanner("Não foi possível abrir a câmera. Verifique permissão e HTTPS.", "scanner-erro");
  }
});

btnPararCamera.addEventListener("click", pararCamera);

form.addEventListener("submit", async function(event) {
  event.preventDefault();

  if (!lojaAtual) {
    alert("Escolha uma loja antes de lançar.");
    window.location.href = "escolher-loja.html";
    return;
  }

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

  const novo = {
    lojaId: lojaAtual.id,
    lojaNome: lojaAtual.nome,
    ean,
    nomeProduto,
    marca: produtoAtual?.marca || "",
    fabricante: produtoAtual?.fabricante || "",
    sabor: produtoAtual?.sabor || "",
    categoria: produtoAtual?.categoria || "",
    quantidadePadrao: produtoAtual?.quantidadePadrao || "",
    embalagem: produtoAtual?.embalagem || "",
    ingredientes: produtoAtual?.ingredientes || "",
    setor: document.getElementById("setor").value,
    quantidade: Number(document.getElementById("quantidade").value),
    validade: document.getElementById("validade").value,
    foto: produtoAtual?.foto || "",
    status: "ativo",
    usuarioNome: usuario.nome,
    usuarioCargo: usuario.cargo
  };

  const confirmar = await confirmarAcao(
    `Loja: ${lojaAtual.nome}\nProduto: ${nomeProduto}\nSetor: ${novo.setor}\nValidade: ${novo.validade}`,
    "Confirmar lançamento?"
  );

  if (!confirmar) {
    return;
  }

  try {
    await valisysDB.criarLancamento(novo);

    alert("Lançamento salvo!");
    form.reset();
    produtoAtual = null;
    produtoPreview.innerHTML = "";
  } catch (erro) {
    alert("Erro ao salvar lançamento: " + erro.message);
  }
});
