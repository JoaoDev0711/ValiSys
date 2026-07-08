const usuario = protegerPagina();

const form = document.getElementById("form-lancamento");
const eanInput = document.getElementById("ean");
const nomeInput = document.getElementById("nomeProduto");
const produtoPreview = document.getElementById("produto-preview");

const btnCamera = document.getElementById("btn-camera");
const btnPararCamera = document.getElementById("btn-parar-camera");

let leitorCamera = null;

function buscarProdutoPorEAN(ean) {
  const produtos = JSON.parse(localStorage.getItem("produtos")) || [];
  const produto = produtos.find(p => p.ean === ean);

  if (produto) {
    nomeInput.value = produto.nome;

    produtoPreview.innerHTML = `
      <div class="card">
        <h3>${esc(produto.nome)}</h3>
        <p><strong>EAN:</strong> ${esc(produto.ean)}</p>
        <p><strong>Marca:</strong> ${esc(produto.marca || "Não informada")}</p>
        <p><strong>Categoria:</strong> ${esc(produto.categoria || "Não informada")}</p>
        ${
          produto.foto
            ? `<img class="produto-img" src="${produto.foto}" alt="${esc(produto.nome)}">`
            : `<p class="muted">Produto sem foto cadastrada.</p>`
        }
      </div>
    `;
  } else {
    nomeInput.value = "";

    produtoPreview.innerHTML = `
      <div class="card">
        <p class="danger">Produto ainda não cadastrado.</p>
        <p class="muted">Você ainda pode lançar digitando o nome manualmente, mas o ideal é gerente/admin cadastrar o produto com foto.</p>
      </div>
    `;
  }
}

eanInput.addEventListener("blur", () => {
  const ean = eanInput.value.trim();

  if (ean !== "") {
    buscarProdutoPorEAN(ean);
  }
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
        buscarProdutoPorEAN(codigoLido);
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

form.addEventListener("submit", function(event) {
  event.preventDefault();

  const ean = eanInput.value.trim();
  const nomeProduto = nomeInput.value.trim();

  if (!/^\d{6,14}$/.test(ean)) {
    alert("EAN inválido. Use apenas números.");
    return;
  }

  if (!nomeProduto) {
    alert("Informe o nome do produto.");
    return;
  }

  const lancamentos = JSON.parse(localStorage.getItem("lancamentos")) || [];
  const produtos = JSON.parse(localStorage.getItem("produtos")) || [];

  const produtoCadastrado = produtos.find(p => p.ean === ean);

  const novo = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    ean,
    nomeProduto,
    setor: document.getElementById("setor").value.trim(),
    quantidade: Number(document.getElementById("quantidade").value),
    validade: document.getElementById("validade").value,
    foto: produtoCadastrado ? produtoCadastrado.foto : "",
    produtoCadastrado: Boolean(produtoCadastrado),
    usuarioId: usuario.id,
    usuarioNome: usuario.nome,
    usuarioCargo: usuario.cargo,
    criadoEm: new Date().toLocaleString("pt-BR")
  };

  lancamentos.push(novo);
  localStorage.setItem("lancamentos", JSON.stringify(lancamentos));

  alert("Lançamento salvo com sucesso!");
  form.reset();
  produtoPreview.innerHTML = "";
});
