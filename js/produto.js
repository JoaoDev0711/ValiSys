const usuario = protegerPagina();
if (bloquearAdminEmAreaLoja()) throw new Error('Admin bloqueado na área da loja.');
protegerLojaSelecionada();

if (!podeCadastrarProduto(usuario.cargo)) {
  alert("Você não tem permissão para cadastrar produtos.");
  window.location.href = "dashboard.html";
}

const form = document.getElementById("form-produto");
const lista = document.getElementById("lista-produtos");

const eanInput = document.getElementById("ean");
const nomeInput = document.getElementById("nome");
const marcaInput = document.getElementById("marca");
const gramagemInput = document.getElementById("quantidadePadrao");
const saborInput = document.getElementById("sabor");
const categoriaInput = document.getElementById("categoria");

const quantidadePadraoInput = document.getElementById("quantidadePadrao");
const porcaoInput = document.getElementById("porcao");
const embalagemInput = document.getElementById("embalagem");
const origemInput = document.getElementById("origem");
const paisesInput = document.getElementById("paises");
const lojasEncontradasInput = document.getElementById("lojasEncontradas");
const ingredientesInput = document.getElementById("ingredientes");
const alergicosInput = document.getElementById("alergicos");
const rastrosInput = document.getElementById("rastros");
const nutriscoreInput = document.getElementById("nutriscore");
const ecoscoreInput = document.getElementById("ecoscore");
const novaInput = document.getElementById("nova");
const fonteProdutoInput = document.getElementById("fonteProduto");

const buscaCatalogoProdutoInput = document.getElementById("busca-catalogo-produto");
const btnBuscarCatalogoProduto = document.getElementById("btn-buscar-catalogo-produto");
const resultadoCatalogoProduto = document.getElementById("resultado-catalogo-produto");

let catalogoProdutoCache = [];

const fotoArquivo = document.getElementById("fotoArquivo");
const fotoCameraProduto = document.getElementById("fotoCameraProduto");
const btnFotoCameraProduto = document.getElementById("btnFotoCameraProduto");
const btnFotoArquivoProduto = document.getElementById("btnFotoArquivoProduto");
const previewFoto = document.getElementById("preview-foto");

const btnCamera = document.getElementById("btn-camera");
const btnPararCamera = document.getElementById("btn-parar-camera");

let fotoBase64 = "";
let produtoAtualCadastro = null;
const LIMITE_PRODUTOS_CADASTRO = 60;

let leitorCamera = null;
let ultimoCodigoLido = "";
let repeticoesCodigo = 0;
let audioLiberado = false;
let timerBuscaEANAutomatica = null;
let ultimoEANBuscadoAutomatico = "";
let timerBuscaNomeAutomatica = null;
let ultimoNomeBuscadoAutomatico = "";
let popupCadastroAberto = false;
let timerListaProdutosCadastro = null;

const scannerStatus = document.getElementById("scanner-status");


function cameraPreferencialDoCelular() {
  const dpr = window.devicePixelRatio || 1;

  const larguraTela = Math.round((window.screen?.width || window.innerWidth || 1280) * dpr);
  const alturaTela = Math.round((window.screen?.height || window.innerHeight || 720) * dpr);

  const maior = Math.max(larguraTela, alturaTela);
  const menor = Math.min(larguraTela, alturaTela);

  // Preferência de câmera traseira sem travar aparelhos que não suportam configurações exatas.
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

      const larguraPreferencial = Math.min(caps.width.max || larguraTela, Math.max(caps.width.min || 0, Math.max(larguraTela, alturaTela)));
      const alturaPreferencial = Math.min(caps.height.max || alturaTela, Math.max(caps.height.min || 0, Math.min(larguraTela, alturaTela)));

      advanced.push({
        width: larguraPreferencial,
        height: alturaPreferencial
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
    console.warn("Não foi possível aplicar foco automático nesta câmera.", erro);
  }

  atualizarStatusScanner("Câmera aberta. Tentando ler o código de barras...", "scanner-lendo");
}

async function iniciarCameraLeitura(callbackLeitura) {
  leitorCamera = new Html5Qrcode("reader");

  try {
    await leitorCamera.start(
      cameraPreferencialDoCelular(),
      configScanner(),
      callbackLeitura,
      () => {}
    );

    await melhorarImagemCamera();
  } catch (erroCameraPrincipal) {
    console.warn("Modo de câmera principal não abriu. Tentando modo padrão.", erroCameraPrincipal);

    await leitorCamera.start(
      { facingMode: "environment" },
      configScanner(),
      callbackLeitura,
      () => {}
    );

    await melhorarImagemCamera();
    atualizarStatusScanner("Câmera aberta. Tentando ler o código de barras...", "scanner-lendo");
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

function validarGTIN(codigo) {
  const gtin = normalizarCodigo(codigo);

  if (![8, 12, 13, 14].includes(gtin.length)) return false;

  const digitos = gtin.split("").map(Number);
  const verificadorInformado = digitos.pop();

  let soma = 0;
  let peso = 3;

  for (let i = digitos.length - 1; i >= 0; i--) {
    soma += digitos[i] * peso;
    peso = peso === 3 ? 1 : 3;
  }

  const verificadorCalculado = (10 - (soma % 10)) % 10;

  return verificadorCalculado === verificadorInformado;
}

function validarEAN8(ean) {
  return normalizarCodigo(ean).length === 8 && validarGTIN(ean);
}

function validarEAN13(ean) {
  return normalizarCodigo(ean).length === 13 && validarGTIN(ean);
}

function validarEAN(ean) {
  return validarGTIN(ean);
}

function tamanhoPossivelGTIN(codigo) {
  return [8, 12, 13, 14].includes(normalizarCodigo(codigo).length);
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
    videoConstraints: cameraPreferencialDoCelular()
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



async function carregarFotoProdutoArquivo(input) {
  const arquivo = input?.files?.[0];

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
}

if (btnFotoCameraProduto && fotoCameraProduto) {
  btnFotoCameraProduto.addEventListener("click", () => fotoCameraProduto.click());
}

if (btnFotoArquivoProduto && fotoArquivo) {
  btnFotoArquivoProduto.addEventListener("click", () => fotoArquivo.click());
}

if (fotoCameraProduto) {
  fotoCameraProduto.addEventListener("change", () => carregarFotoProdutoArquivo(fotoCameraProduto));
}

if (fotoArquivo) {
  fotoArquivo.addEventListener("change", () => carregarFotoProdutoArquivo(fotoArquivo));
}

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




function arquivoParaBase64(arquivo) {
  return new Promise((resolve, reject) => {
    if (!arquivo) {
      resolve("");
      return;
    }

    const leitor = new FileReader();

    leitor.onload = () => resolve(leitor.result || "");
    leitor.onerror = reject;
    leitor.readAsDataURL(arquivo);
  });
}

function garantirPopupCadastroBasico() {
  let modal = document.getElementById("popup-cadastro-basico-produto");

  if (modal) return modal;

  modal = document.createElement("div");
  modal.id = "popup-cadastro-basico-produto";
  modal.className = "produto-popup-overlay";
  modal.innerHTML = `
    <div class="produto-popup-card">
      <button type="button" class="produto-popup-fechar" id="popup-produto-fechar">×</button>
      <h2>Cadastro básico do produto</h2>
      <p class="muted">Não encontrei esse produto. Cadastre o básico uma vez e ele será puxado pelo EAN nas próximas leituras.</p>

      <form id="form-popup-produto-basico">
        <label for="popupProdutoEAN">EAN</label>
        <input type="text" id="popupProdutoEAN" inputmode="numeric" placeholder="Código de barras">

        <label for="popupProdutoNome">Nome</label>
        <input type="text" id="popupProdutoNome" placeholder="Nome do produto" required>

        <label for="popupProdutoMarca">Marca</label>
        <input type="text" id="popupProdutoMarca" placeholder="Ex: M. Dias Branco">

        <label for="popupProdutoGramagem">Gramagem</label>
        <input type="text" id="popupProdutoGramagem" placeholder="Ex: 200g, 1kg, 500ml, 12x1L">

        <label for="popupProdutoSabor">Sabor ou variação</label>
        <input type="text" id="popupProdutoSabor" placeholder="Ex: Tradicional, Chocolate, Integral">

        <label>Foto</label>
        <div class="foto-opcoes">
          <button type="button" class="secondary" id="popupFotoCameraBtn">Abrir câmera</button>
          <button type="button" class="secondary" id="popupFotoArquivoBtn">Escolher arquivo</button>
        </div>
        <input type="file" id="popupProdutoFotoCamera" accept="image/*" capture="environment" hidden>
        <input type="file" id="popupProdutoFoto" accept="image/*" hidden>

        <button type="submit">Salvar produto</button>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector("#popup-produto-fechar").addEventListener("click", fecharPopupCadastroBasico);
  modal.addEventListener("click", event => {
    if (event.target === modal) fecharPopupCadastroBasico();
  });

  modal.querySelector("#form-popup-produto-basico").addEventListener("submit", salvarPopupCadastroBasico);
  modal.querySelector("#popupFotoCameraBtn")?.addEventListener("click", () => modal.querySelector("#popupProdutoFotoCamera")?.click());
  modal.querySelector("#popupFotoArquivoBtn")?.addEventListener("click", () => modal.querySelector("#popupProdutoFoto")?.click());

  return modal;
}

function fecharPopupCadastroBasico() {
  const modal = document.getElementById("popup-cadastro-basico-produto");

  if (modal) modal.classList.remove("active");

  popupCadastroAberto = false;
}

async function abrirPopupCadastroBasico({ ean = "", nome = "" } = {}) {
  if (popupCadastroAberto) return;

  popupCadastroAberto = true;

  const modal = garantirPopupCadastroBasico();
  const eanLimpo = normalizarCodigo(ean || eanInput.value || "");
  const nomeLimpo = String(nome || nomeInput.value || "").trim();

  modal.querySelector("#popupProdutoEAN").value = eanLimpo;
  modal.querySelector("#popupProdutoNome").value = nomeLimpo;
  modal.querySelector("#popupProdutoMarca").value = marcaInput.value || produtoAtualCadastro?.marca || "";
  modal.querySelector("#popupProdutoFabricante").value = fabricanteInput.value || produtoAtualCadastro?.fabricante || "";
  modal.querySelector("#popupProdutoSabor").value = saborInput?.value || produtoAtualCadastro?.sabor || "";
  modal.querySelector("#popupProdutoFoto").value = "";

  modal.classList.add("active");

  setTimeout(() => {
    const alvo = nomeLimpo ? modal.querySelector("#popupProdutoMarca") : modal.querySelector("#popupProdutoNome");
    alvo?.focus();
  }, 80);
}

async function salvarPopupCadastroBasico(event) {
  event.preventDefault();

  const modal = document.getElementById("popup-cadastro-basico-produto");
  const ean = normalizarCodigo(modal.querySelector("#popupProdutoEAN").value);
  const nome = modal.querySelector("#popupProdutoNome").value.trim();
  const marca = modal.querySelector("#popupProdutoMarca").value.trim();
  const gramagem = modal.querySelector("#popupProdutoGramagem").value.trim();
  const sabor = modal.querySelector("#popupProdutoSabor").value.trim();
  const fotoArquivoModal = modal.querySelector("#popupProdutoFoto").files?.[0] || null;

  if (!ean || !validarEAN(ean)) {
    alert("Informe um EAN válido para salvar o produto.");
    return;
  }

  if (!nome) {
    alert("Informe o nome do produto.");
    return;
  }

  try {
    const foto = fotoArquivoModal ? await compactarImagem(fotoArquivoModal, 700, 0.72) : (produtoAtualCadastro?.foto || "");

    const produto = {
      ean,
      nome,
      marca,
      fabricante: "",
      gramagem,
      sabor,
      categoria: "",
      quantidadePadrao: gramagem,
      porcao: "",
      embalagem: "",
      origem: "",
      paises: "",
      lojas: "",
      ingredientes: "",
      alergicos: "",
      rastros: "",
      nutriscore: "",
      ecoscore: "",
      nova: "",
      foto,
      fonte: "Cadastro básico"
    };

    const salvo = await valisysDB.salvarProduto(produto);
    produtoAtualCadastro = salvo || produto;

    preencherCamposProduto(produtoAtualCadastro);

    if (produtoAtualCadastro.foto) {
      fotoBase64 = produtoAtualCadastro.foto;
    }

    previewFoto.innerHTML = cardProdutoHTML(produtoAtualCadastro, "Produto cadastrado e preenchido.");
    fecharPopupCadastroBasico();
    await carregarProdutos();
  } catch (erro) {
    alert("Erro ao salvar produto: " + erro.message);
  }
}

async function buscarProdutoPorNomeAutomatico(nome) {
  const termo = String(nome || "").trim();

  if (termo.length < 3) return null;

  previewFoto.innerHTML = `
    <div class="card">
      <p class="muted">Buscando produto pelo nome...</p>
    </div>
  `;

  try {
    const produto = await valisysDB.buscarProdutoPorTexto(termo);

    if (produto) {
      produtoAtualCadastro = produto;
      preencherCamposProduto(produto);

      if (produto.foto) {
        fotoBase64 = produto.foto;
      }

      previewFoto.innerHTML = cardProdutoHTML(produtoAtualCadastro, "Produto encontrado pelo nome.");
      return produtoAtualCadastro;
    }
  } catch (erro) {
    console.warn("Busca automática por nome falhou.", erro);
  }

  try {
    previewFoto.innerHTML = `
      <div class="card">
        <p class="muted">Buscando foto e dados pela base pública...</p>
      </div>
    `;

    const produtoFonte = typeof buscarProdutoFontePorNome === "function"
      ? await buscarProdutoFontePorNome(termo)
      : null;

    if (produtoFonte && produtoFonte.nome) {
      produtoAtualCadastro = produtoFonte;

      if (produtoFonte.ean && validarEAN(produtoFonte.ean)) {
        eanInput.value = produtoFonte.ean;

        try {
          const salvo = await valisysDB.salvarProduto(produtoFonte);
          produtoAtualCadastro = salvo || produtoFonte;
        } catch (erroSalvarFonteNome) {
          console.warn("Produto encontrado por nome, mas não foi salvo automaticamente.", erroSalvarFonteNome);
        }
      }

      preencherCamposProduto(produtoAtualCadastro);

      if (produtoAtualCadastro.foto) {
        fotoBase64 = produtoAtualCadastro.foto;
      }

      previewFoto.innerHTML = cardProdutoHTML(produtoAtualCadastro, "Produto/foto encontrado pelo nome.");
      return produtoAtualCadastro;
    }
  } catch (erroFonteNome) {
    console.warn("Busca por nome na base pública falhou.", erroFonteNome);
  }

  produtoAtualCadastro = null;
  previewFoto.innerHTML = `
    <div class="card">
      <p class="muted">Produto não encontrado pelo nome.</p>
    </div>
  `;

  await abrirPopupCadastroBasico({ ean: eanInput.value, nome: termo });
  return null;
}

function agendarBuscaNomeAutomatica() {
  const termo = String(nomeInput.value || "").trim();

  if (timerBuscaNomeAutomatica) {
    clearTimeout(timerBuscaNomeAutomatica);
  }

  if (termo.length < 3) return;

  timerBuscaNomeAutomatica = setTimeout(async () => {
    const atual = String(nomeInput.value || "").trim();

    if (atual.length < 3) return;

    if (atual === ultimoNomeBuscadoAutomatico) return;

    ultimoNomeBuscadoAutomatico = atual;
    await buscarProdutoPorNomeAutomatico(atual);
  }, 900);
}


function aplicarProdutoNoFormulario(produto) {
  produtoAtualCadastro = produto;

  preencherCamposProduto(produto);

  if (produto.ean && validarEAN(produto.ean)) {
    eanInput.value = produto.ean;
  }

  if (produto.foto) {
    fotoBase64 = produto.foto;
  }

  if (fonteProdutoInput) {
    fonteProdutoInput.value = produto.fonte || "Catálogo interno ValiSys";
  }

  previewFoto.innerHTML = cardProdutoHTML(produto, "Produto preenchido pela lista interna.");
}

function renderizarResultadosCatalogoProduto(resultados) {
  if (!resultadoCatalogoProduto) return;

  if (!resultados || resultados.length === 0) {
    resultadoCatalogoProduto.innerHTML = `<p class="muted">Nenhum produto encontrado na lista interna.</p>`;
    return;
  }

  catalogoProdutoCache = resultados;

  resultadoCatalogoProduto.innerHTML = `
    <div class="catalogo-resultados">
      ${resultados.map((item, index) => `
        <article class="catalogo-item">
          <div>
            <strong>${esc(item.nome)}</strong>
            <p>${esc(item.marca || "Sem marca")} • ${esc(item.fabricante || "Sem fabricante")}</p>
            <small>${esc(item.categoria || "Sem categoria")} ${item.quantidadePadrao ? "• " + esc(item.quantidadePadrao) : ""}</small>
          </div>
          <button type="button" class="secondary" onclick="selecionarCatalogoProduto(${index})">Usar</button>
        </article>
      `).join("")}
    </div>
  `;
}

async function buscarCatalogoProduto(termoManual = "") {
  const termo = String(termoManual || buscaCatalogoProdutoInput?.value || nomeInput.value || marcaInput.value || "").trim();

  if (!termo) {
    if (resultadoCatalogoProduto) {
      resultadoCatalogoProduto.innerHTML = `<p class="muted">Digite nome, marca, fabricante ou categoria para buscar.</p>`;
    }
    return [];
  }

  if (resultadoCatalogoProduto) {
    resultadoCatalogoProduto.innerHTML = `<p class="muted">Buscando na lista interna...</p>`;
  }

  try {
    const resultados = await valisysDB.buscarCatalogoProdutos(termo, 16);
    renderizarResultadosCatalogoProduto(resultados);
    return resultados;
  } catch (erro) {
    console.error(erro);
    if (resultadoCatalogoProduto) {
      resultadoCatalogoProduto.innerHTML = `<p class="danger">Erro ao buscar na lista interna.</p>`;
    }
    return [];
  }
}

function selecionarCatalogoProduto(index) {
  const item = catalogoProdutoCache[index];

  if (!item) return;

  const eanManual = normalizarCodigo(eanInput.value);
  const produto = valisysDB.produtoDeCatalogoParaProduto(item, validarEAN(eanManual) ? eanManual : "");

  aplicarProdutoNoFormulario(produto);
}

window.selecionarCatalogoProduto = selecionarCatalogoProduto;

if (btnBuscarCatalogoProduto) {
  btnBuscarCatalogoProduto.addEventListener("click", () => buscarCatalogoProduto());
}

if (buscaCatalogoProdutoInput) {
  buscaCatalogoProdutoInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      buscarCatalogoProduto();
    }
  });
}


function preencherCamposProduto(produto) {
  if (!produto) return;

  if (eanInput) eanInput.value = produto.ean || "";
  if (nomeInput) nomeInput.value = produto.nome || "";
  if (marcaInput) marcaInput.value = produto.marca || "";
  if (gramagemInput) gramagemInput.value = produto.gramagem || produto.quantidadePadrao || "";
  if (saborInput) saborInput.value = produto.sabor || "";
}

function lerCamposExtrasProduto() {
  return {
    sabor: "",
    categoria: "",
    quantidadePadrao: gramagemInput?.value.trim() || "",
    porcao: "",
    embalagem: "",
    origem: "",
    paises: "",
    lojas: "",
    ingredientes: "",
    alergicos: "",
    rastros: "",
    nutriscore: "",
    ecoscore: "",
    nova: "",
    fonte: ""
  };
}


function agendarBuscaAutomaticaEAN() {
  const ean = normalizarCodigo(eanInput.value);
  eanInput.value = ean;

  if (timerBuscaEANAutomatica) {
    clearTimeout(timerBuscaEANAutomatica);
  }

  if (!tamanhoPossivelGTIN(ean)) {
    return;
  }

  timerBuscaEANAutomatica = setTimeout(async () => {
    const codigoAtual = normalizarCodigo(eanInput.value);

    if (!validarEAN(codigoAtual)) {
      return;
    }

    if (codigoAtual === ultimoEANBuscadoAutomatico) {
      return;
    }

    ultimoEANBuscadoAutomatico = codigoAtual;
    await preencherProdutoPorEAN(codigoAtual);
  }, 450);
}

async function preencherProdutoPorEAN(ean) {
  const codigo = normalizarCodigo(ean);

  if (!validarEAN(codigo)) {
    alert("EAN inválido. Confira o código.");
    return;
  }

  eanInput.value = codigo;

  let produto = null;

  previewFoto.innerHTML = `<div class="card"><p class="muted">Buscando produto no sistema...</p></div>`;

  try {
    produto = await valisysDB.buscarProdutoPorEAN(codigo);
  } catch (errosistema) {
    console.warn("Falha ao buscar produto no sistema. Tentando base de produtos.", errosistema);
  }

  if (!produto) {
    try {
      const itemCatalogo = await valisysDB.buscarCatalogoProdutoPorEAN(codigo);

      if (itemCatalogo) {
        produto = valisysDB.produtoDeCatalogoParaProduto(itemCatalogo, codigo);
      }
    } catch (erroCatalogo) {
      console.warn("Catálogo interno por EAN não retornou produto.", erroCatalogo);
    }
  }

  if (!produto) {
    previewFoto.innerHTML = `<div class="card"><p class="muted">Produto não estava cadastrado. Buscando em fontes gratuitas...</p></div>`;

    try {
      produto = await buscarProdutoFonteProdutos(codigo);
    } catch (erroFonte) {
      console.warn("Fontes gratuitas não retornaram produto.", erroFonte);
      produtoAtualCadastro = null;
      previewFoto.innerHTML = `<p class="danger">Não consegui puxar pelas fontes gratuitas. Abrindo cadastro básico.</p>`;
      await abrirPopupCadastroBasico({ ean: codigo, nome: nomeInput.value });
      return;
    }

    if (produto) {
      try {
        const produtoSalvo = await valisysDB.salvarProduto(produto);
        produto = produtoSalvo || produto;
      } catch (erroSalvarProduto) {
        console.warn("Produto puxado, mas não salvo automaticamente no sistema.", erroSalvarProduto);
      }
    }
  }

  if (!produto) {
    produtoAtualCadastro = null;
    previewFoto.innerHTML = `<p class="muted">Produto não encontrado pelo EAN. Abrindo cadastro básico.</p>`;
    await abrirPopupCadastroBasico({ ean: codigo, nome: nomeInput.value });
    return;
  }

  produtoAtualCadastro = produto;

  preencherCamposProduto(produto);

  if (produto.foto) {
    fotoBase64 = produto.foto;
  }

  previewFoto.innerHTML = cardProdutoHTML(produto, "Produto puxado com sucesso.");
}


function cardProdutoCadastroHTML(produto) {
  return `
    <article class="card produto-encontrado produto-card-completo">
      <div class="produto-card-header">
        <div>
          <h3>${esc(produto.nome || "Produto sem nome")}</h3>
          <p class="muted">EAN: ${esc(produto.ean || "Não informado")}</p>
          <p><strong>Marca:</strong> ${esc(produto.marca || "Não informada")}</p>
          <p><strong>Gramagem:</strong> ${esc(produto.gramagem || produto.quantidadePadrao || "Não informada")}</p>
          ${produto.sabor ? `<p><strong>Sabor:</strong> ${esc(produto.sabor)}</p>` : ""}
        </div>
        ${produto.foto ? `<img class="produto-img produto-img-mini" src="${produto.foto}" alt="${esc(produto.nome)}">` : ""}
      </div>

      <div class="card-actions stack-actions">
        <button type="button" class="btn-danger" onclick="excluirProdutoCadastro('${esc(produto.id || produto.ean)}')">
          Excluir produto
        </button>
      </div>
    </article>
  `;
}

async function excluirProdutoCadastro(idOuEan) {
  const confirmar = await confirmarAcao(
    "Deseja excluir este produto cadastrado? Os lançamentos antigos continuam salvos.",
    "Excluir produto",
    "perigo"
  );

  if (!confirmar) return;

  try {
    await valisysDB.excluirProduto(idOuEan);
    alert("Produto excluído.");
    await carregarProdutos();
  } catch (erro) {
    alert("Erro ao excluir produto: " + erro.message);
  }
}

window.excluirProdutoCadastro = excluirProdutoCadastro;


async function carregarProdutos() {
  lista.innerHTML = `<div class="card"><p class="muted">Carregando produtos...</p></div>`;

  try {
    const termoLista = String(buscaCatalogoProdutoInput?.value || nomeInput?.value || "").trim();
    const produtos = await valisysDB.listarProdutos({
      termo: termoLista,
      limite: LIMITE_PRODUTOS_CADASTRO
    });

    if (produtos.length === 0) {
      lista.innerHTML = `<div class="card"><p>Nenhum produto cadastrado.</p></div>`;
      return;
    }

    const avisoLimite = produtos.length >= LIMITE_PRODUTOS_CADASTRO
      ? `<div class="card"><p class="muted">Mostrando até ${LIMITE_PRODUTOS_CADASTRO} produtos. Use a busca para encontrar outros.</p></div>`
      : "";

    lista.innerHTML = avisoLimite + produtos.map(produto => cardProdutoCadastroHTML(produto)).join("");
  } catch (erro) {
    console.error(erro);
    lista.innerHTML = `
      <div class="card">
        <p class="danger">Erro ao carregar produtos.</p>
        <p class="muted">${esc(erro.message)}</p>
      </div>
    `;
  }
}

form.addEventListener("submit", async function(event) {
  event.preventDefault();

  const ean = normalizarCodigo(eanInput.value);

  if (!validarEAN(ean)) {
    alert("EAN inválido. Leia novamente pela câmera ou digite o código correto.");
    return;
  }

  const novoProduto = {
    ean,
    nome: nomeInput.value.trim(),
    marca: marcaInput.value.trim(),
    fabricante: "",
    gramagem: gramagemInput?.value.trim() || "",
    ...lerCamposExtrasProduto(),
    sabor: saborInput?.value.trim() || "",
    categoria: "",
    foto: fotoBase64 || produtoAtualCadastro?.foto || "",
    fonte: produtoAtualCadastro?.fonte || "Cadastro básico"
  };

  if (!novoProduto.nome) {
    alert("Informe o nome do produto.");
    return;
  }

  try {
    await valisysDB.salvarProduto(novoProduto);

    alert("Produto salvo!");

    form.reset();
    fotoBase64 = "";
    produtoAtualCadastro = null;
    previewFoto.innerHTML = "";

    await carregarProdutos();
  } catch (erro) {
    alert("Erro ao salvar produto: " + erro.message);
  }
});

eanInput.addEventListener("blur", async () => {
  const ean = normalizarCodigo(eanInput.value);
  eanInput.value = ean;

  if (!ean) return;

  if (!validarEAN(ean)) {
    if (tamanhoPossivelGTIN(ean)) {
      alert("Código de barras inválido. Confira se digitou todos os números corretamente.");
    }
    return;
  }

  ultimoEANBuscadoAutomatico = ean;
  await preencherProdutoPorEAN(ean);
});

eanInput.addEventListener("input", agendarBuscaAutomaticaEAN);

eanInput.addEventListener("keydown", async event => {
  if (event.key !== "Enter") return;

  event.preventDefault();

  const ean = normalizarCodigo(eanInput.value);
  eanInput.value = ean;

  if (!validarEAN(ean)) {
    alert("Código de barras inválido. Confira se digitou todos os números corretamente.");
    return;
  }

  ultimoEANBuscadoAutomatico = ean;
  await preencherProdutoPorEAN(ean);
});

nomeInput.addEventListener("input", agendarBuscaNomeAutomatica);

nomeInput.addEventListener("keydown", async event => {
  if (event.key !== "Enter") return;

  event.preventDefault();

  const termo = String(nomeInput.value || "").trim();

  if (termo.length >= 3) {
    ultimoNomeBuscadoAutomatico = termo;
    await buscarProdutoPorNomeAutomatico(termo);
  }
});

nomeInput.addEventListener("blur", async () => {
  const termo = String(nomeInput.value || "").trim();

  if (termo.length >= 3 && !produtoAtualCadastro) {
    ultimoNomeBuscadoAutomatico = termo;
    await buscarProdutoPorNomeAutomatico(termo);
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
      await preencherProdutoPorEAN(eanConfirmado);
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

if (lista) {
  lista.innerHTML = `
    <div class="card">
      <p><strong>Modo leve ativado.</strong></p>
      <p class="muted">Digite uma busca ou leia um EAN para carregar produtos. Assim a tela não puxa o catálogo inteiro ao abrir.</p>
    </div>
  `;
}


if (buscaCatalogoProdutoInput) {
  buscaCatalogoProdutoInput.addEventListener("input", () => {
    clearTimeout(timerListaProdutosCadastro);
    timerListaProdutosCadastro = setTimeout(carregarProdutos, 550);
  });
}
