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
const setorSelect = document.getElementById("setor");
const buscaCatalogoLancamentoInput = document.getElementById("busca-catalogo-lancamento");
const btnBuscarCatalogoLancamento = document.getElementById("btn-buscar-catalogo-lancamento");
const resultadoCatalogoLancamento = document.getElementById("resultado-catalogo-lancamento");

let catalogoLancamentoCache = [];

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
let timerBuscaEANAutomatica = null;
let ultimoEANBuscadoAutomatico = "";
let timerBuscaNomeAutomatica = null;
let ultimoNomeBuscadoAutomatico = "";
let popupCadastroAberto = false;

const scannerStatus = document.getElementById("scanner-status");

async function carregarSetoresLancamento() {
  if (!setorSelect || !lojaAtual) return;

  const valorAtual = setorSelect.value;

  try {
    const setores = await valisysDB.listarSetoresLoja(lojaAtual.id);

    setorSelect.innerHTML = `
      <option value="">Selecione o setor</option>
      ${setores.map(setor => `<option value="${esc(setor.nome)}">${esc(setor.nome)}</option>`).join("")}
    `;

    if ([...setorSelect.options].some(op => op.value === valorAtual)) {
      setorSelect.value = valorAtual;
    }
  } catch (erro) {
    console.warn("Não foi possível carregar setores da loja.", erro);
  }
}

carregarSetoresLancamento();




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



function produtoCatalogoParaAtual(item) {
  const eanManual = normalizarCodigo(eanInput.value);
  return valisysDB.produtoDeCatalogoParaProduto(item, validarEAN(eanManual) ? eanManual : "");
}

function renderizarResultadosCatalogoLancamento(resultados) {
  if (!resultadoCatalogoLancamento) return;

  if (!resultados || resultados.length === 0) {
    resultadoCatalogoLancamento.innerHTML = `<p class="muted">Nenhum produto encontrado na lista interna.</p>`;
    return;
  }

  catalogoLancamentoCache = resultados;

  resultadoCatalogoLancamento.innerHTML = `
    <div class="catalogo-resultados">
      ${resultados.map((item, index) => `
        <article class="catalogo-item">
          <div>
            <strong>${esc(item.nome)}</strong>
            <p>${esc(item.marca || "Sem marca")} • ${esc(item.fabricante || "Sem fabricante")}</p>
            <small>${esc(item.categoria || "Sem categoria")} ${item.quantidadePadrao ? "• " + esc(item.quantidadePadrao) : ""}</small>
          </div>
          <button type="button" class="secondary" onclick="selecionarCatalogoLancamento(${index})">Usar</button>
        </article>
      `).join("")}
    </div>
  `;
}

async function buscarCatalogoLancamento(termoManual = "") {
  const termo = String(termoManual || buscaCatalogoLancamentoInput?.value || nomeInput.value || "").trim();

  if (!termo) {
    if (resultadoCatalogoLancamento) {
      resultadoCatalogoLancamento.innerHTML = `<p class="muted">Digite nome, marca ou fabricante para buscar na lista interna.</p>`;
    }
    return [];
  }

  if (resultadoCatalogoLancamento) {
    resultadoCatalogoLancamento.innerHTML = `<p class="muted">Buscando na lista interna...</p>`;
  }

  try {
    const resultados = await valisysDB.buscarCatalogoProdutos(termo, 12);
    renderizarResultadosCatalogoLancamento(resultados);
    return resultados;
  } catch (erro) {
    console.error(erro);
    if (resultadoCatalogoLancamento) {
      resultadoCatalogoLancamento.innerHTML = `<p class="danger">Erro ao buscar na lista interna.</p>`;
    }
    return [];
  }
}

function selecionarCatalogoLancamento(index) {
  const item = catalogoLancamentoCache[index];

  if (!item) return;

  produtoAtual = produtoCatalogoParaAtual(item);
  nomeInput.value = produtoAtual.nome || "";

  if (buscaCatalogoLancamentoInput) {
    buscaCatalogoLancamentoInput.value = `${produtoAtual.nome} ${produtoAtual.marca || ""}`.trim();
  }

  produtoPreview.innerHTML = cardProdutoHTML(produtoAtual, "Produto selecionado da lista interna.");
}

window.selecionarCatalogoLancamento = selecionarCatalogoLancamento;

if (btnBuscarCatalogoLancamento) {
  btnBuscarCatalogoLancamento.addEventListener("click", () => buscarCatalogoLancamento());
}

if (buscaCatalogoLancamentoInput) {
  buscaCatalogoLancamentoInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      buscarCatalogoLancamento();
    }
  });
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
    await buscarProdutoCompleto(codigoAtual);
  }, 450);
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

        <label for="popupProdutoFabricante">Fabricante</label>
        <input type="text" id="popupProdutoFabricante" placeholder="Ex: M. Dias Branco">

        <label for="popupProdutoSabor">Sabor ou variação</label>
        <input type="text" id="popupProdutoSabor" placeholder="Ex: Tradicional, Chocolate, Integral">

        <label for="popupProdutoFoto">Foto</label>
        <input type="file" id="popupProdutoFoto" accept="image/*">

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
  modal.querySelector("#popupProdutoMarca").value = produtoAtual?.marca || "";
  modal.querySelector("#popupProdutoFabricante").value = produtoAtual?.fabricante || "";
  modal.querySelector("#popupProdutoSabor").value = produtoAtual?.sabor || "";
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
  const fabricante = modal.querySelector("#popupProdutoFabricante").value.trim();
  const sabor = modal.querySelector("#popupProdutoSabor").value.trim();
  const fotoArquivo = modal.querySelector("#popupProdutoFoto").files?.[0] || null;

  if (!ean || !validarEAN(ean)) {
    alert("Informe um EAN válido para salvar o produto.");
    return;
  }

  if (!nome) {
    alert("Informe o nome do produto.");
    return;
  }

  try {
    const foto = fotoArquivo ? await arquivoParaBase64(fotoArquivo) : (produtoAtual?.foto || "");

    const produto = {
      ean,
      nome,
      marca,
      fabricante,
      sabor,
      categoria: "",
      quantidadePadrao: "",
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
    produtoAtual = salvo || produto;

    eanInput.value = ean;
    nomeInput.value = produtoAtual.nome || nome;
    produtoPreview.innerHTML = cardProdutoHTML(produtoAtual, "Produto cadastrado e selecionado.");

    fecharPopupCadastroBasico();
  } catch (erro) {
    alert("Erro ao salvar produto: " + erro.message);
  }
}

async function buscarProdutoPorNomeAutomatico(nome) {
  const termo = String(nome || "").trim();

  if (termo.length < 3) return null;

  produtoPreview.innerHTML = `
    <div class="card">
      <p class="muted">Buscando produto pelo nome...</p>
    </div>
  `;

  try {
    const produto = await valisysDB.buscarProdutoPorTexto(termo);

    if (produto) {
      produtoAtual = produto;
      nomeInput.value = produto.nome || termo;

      if (produto.ean) eanInput.value = produto.ean;

      produtoPreview.innerHTML = cardProdutoHTML(produtoAtual, "Produto encontrado pelo nome.");
      return produtoAtual;
    }
  } catch (erro) {
    console.warn("Busca automática por nome falhou.", erro);
  }

  try {
    produtoPreview.innerHTML = `
      <div class="card">
        <p class="muted">Buscando foto e dados pela base pública...</p>
      </div>
    `;

    const produtoFonte = typeof buscarProdutoFontePorNome === "function"
      ? await buscarProdutoFontePorNome(termo)
      : null;

    if (produtoFonte && produtoFonte.nome) {
      produtoAtual = produtoFonte;

      if (produtoFonte.ean && validarEAN(produtoFonte.ean)) {
        eanInput.value = produtoFonte.ean;

        try {
          const salvo = await valisysDB.salvarProduto(produtoFonte);
          produtoAtual = salvo || produtoFonte;
        } catch (erroSalvarFonteNome) {
          console.warn("Produto encontrado por nome, mas não foi salvo automaticamente.", erroSalvarFonteNome);
        }
      }

      nomeInput.value = produtoAtual.nome || termo;
      produtoPreview.innerHTML = cardProdutoHTML(produtoAtual, "Produto/foto encontrado pelo nome.");
      return produtoAtual;
    }
  } catch (erroFonteNome) {
    console.warn("Busca por nome na base pública falhou.", erroFonteNome);
  }

  produtoAtual = null;
  produtoPreview.innerHTML = `
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

  try {
    const itemCatalogo = await valisysDB.buscarCatalogoProdutoPorEAN(codigo);

    if (itemCatalogo) {
      produtoAtual = produtoCatalogoParaAtual(itemCatalogo);
      nomeInput.value = produtoAtual.nome || "";
      produtoPreview.innerHTML = cardProdutoHTML(produtoAtual, "Produto encontrado na lista interna.");
      return produtoAtual;
    }
  } catch (erroCatalogo) {
    console.warn("Catálogo interno por EAN não retornou produto.", erroCatalogo);
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
        <p class="muted">Abrindo cadastro básico.</p>
      </div>
    `;
    produtoAtual = null;
    await abrirPopupCadastroBasico({ ean: codigo, nome: nomeInput.value });
    return null;
  }

  if (!produto) {
    produtoPreview.innerHTML = `
      <div class="card">
        <p class="muted">Produto não encontrado pelo EAN.</p>
        <p class="muted">Abrindo cadastro básico.</p>
      </div>
    `;
    produtoAtual = null;
    await abrirPopupCadastroBasico({ ean: codigo, nome: nomeInput.value });
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
  eanInput.value = ean;

  if (!ean) return;

  if (!validarEAN(ean)) {
    if (tamanhoPossivelGTIN(ean)) {
      alert("Código de barras inválido. Confira se digitou todos os números corretamente.");
    }
    return;
  }

  ultimoEANBuscadoAutomatico = ean;
  await buscarProdutoCompleto(ean);
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
  await buscarProdutoCompleto(ean);
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

  if (termo.length >= 3 && !produtoAtual) {
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

  if (!produtoAtual || String(produtoAtual.ean || "") !== ean) {
    produtoAtual = {
      ean,
      nome: nomeProduto,
      marca: "",
      fabricante: "",
      sabor: "",
      categoria: "",
      quantidadePadrao: "",
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
      foto: "",
      fonte: "Cadastro manual pelo lançamento"
    };
  } else {
    produtoAtual.ean = ean;
    produtoAtual.nome = produtoAtual.nome || nomeProduto;
  }

  try {
    const produtoSalvo = await valisysDB.salvarProduto({
      ...produtoAtual,
      ean,
      nome: produtoAtual.nome || nomeProduto
    });

    produtoAtual = produtoSalvo || produtoAtual;
  } catch (erroProdutoManual) {
    console.warn("Não foi possível salvar o produto no cadastro antes do lançamento. O lançamento continuará.", erroProdutoManual);
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
    porcao: produtoAtual?.porcao || "",
    embalagem: produtoAtual?.embalagem || "",
    origem: produtoAtual?.origem || "",
    paises: produtoAtual?.paises || "",
    lojas: produtoAtual?.lojas || "",
    ingredientes: produtoAtual?.ingredientes || "",
    alergicos: produtoAtual?.alergicos || "",
    rastros: produtoAtual?.rastros || "",
    nutriscore: produtoAtual?.nutriscore || "",
    ecoscore: produtoAtual?.ecoscore || "",
    nova: produtoAtual?.nova || "",
    fonte: produtoAtual?.fonte || "",
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
    const lancamentoSalvo = await valisysDB.criarLancamento(novo);

    if (window.valisysPush?.enviarProdutoLancado) {
      window.valisysPush.enviarProdutoLancado(lancamentoSalvo);
    }

    alert("Lançamento salvo!");
    form.reset();
    produtoAtual = null;
    produtoPreview.innerHTML = "";
  } catch (erro) {
    alert("Erro ao salvar lançamento: " + erro.message);
  }
});
