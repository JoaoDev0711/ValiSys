function getLojaAtual() {
  return lerJSONLocal("lojaAtual", null);
}

function setLojaAtual(loja) {
  salvarJSONLocal("lojaAtual", loja);
  aplicarTemaLoja(loja);
}

function limparLojaAtual() {
  localStorage.removeItem("lojaAtual");
}

function protegerLojaSelecionada() {
  const loja = getLojaAtual();

  if (!loja) {
    window.location.href = "escolher-loja.html";
    return null;
  }

  return loja;
}

function podeCadastrarLoja(cargo) {
  return ["gerente", "admin"].includes(cargo);
}

async function carregarLojasSistema() {
  return await valisysDB.listarLojas();
}


function getIniciaisLoja(nome) {
  const palavras = String(nome || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .filter(palavra => !["de", "da", "do", "das", "dos", "e"].includes(palavra.toLowerCase()));

  if (palavras.length === 0) return "LJ";

  const iniciais = palavras
    .slice(0, 2)
    .map(palavra => palavra.charAt(0).toUpperCase())
    .join("");

  return iniciais || "LJ";
}

function logoLojaHTML(loja, classe = "") {
  const nome = loja?.nome || "Loja";
  const imagem = loja?.imagem || loja?.foto || loja?.logo || "";
  const extra = classe ? ` ${classe}` : "";

  if (imagem) {
    return `<div class="loja-logo${extra}"><img src="${imagem}" alt="${esc(nome)}"></div>`;
  }

  return `<div class="loja-logo loja-logo-iniciais${extra}">${esc(getIniciaisLoja(nome))}</div>`;
}

function comprimirImagemLoja(arquivo, larguraMaxima = 520, qualidade = 0.78) {
  return new Promise((resolve, reject) => {
    if (!arquivo) {
      resolve("");
      return;
    }

    if (!arquivo.type || !arquivo.type.startsWith("image/")) {
      reject(new Error("Selecione um arquivo de imagem."));
      return;
    }

    const leitor = new FileReader();

    leitor.onload = () => {
      const img = new Image();

      img.onload = () => {
        const proporcao = Math.min(1, larguraMaxima / img.width);
        const largura = Math.max(1, Math.round(img.width * proporcao));
        const altura = Math.max(1, Math.round(img.height * proporcao));

        const canvas = document.createElement("canvas");
        canvas.width = largura;
        canvas.height = altura;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, largura, altura);

        resolve(canvas.toDataURL("image/jpeg", qualidade));
      };

      img.onerror = () => reject(new Error("Não foi possível ler a imagem."));
      img.src = leitor.result;
    };

    leitor.onerror = () => reject(new Error("Não foi possível abrir o arquivo."));
    leitor.readAsDataURL(arquivo);
  });
}


function normalizarHexCor(cor) {
  const texto = String(cor || "").trim();

  if (/^#[0-9a-f]{6}$/i.test(texto)) {
    return texto;
  }

  return "";
}

function escurecerHex(cor, porcentagem = 24) {
  const hex = normalizarHexCor(cor);

  if (!hex) return "";

  const num = parseInt(hex.slice(1), 16);
  let r = (num >> 16) & 255;
  let g = (num >> 8) & 255;
  let b = num & 255;

  const fator = Math.max(0, Math.min(100, 100 - porcentagem)) / 100;

  r = Math.round(r * fator);
  g = Math.round(g * fator);
  b = Math.round(b * fator);

  return "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("");
}

function aplicarTemaLoja(loja) {
  const cor = normalizarHexCor(loja?.corTema || loja?.cor || "");

  // A cor da rede não altera mais o tema inteiro do site.
  // Ela fica apenas como destaque visual da loja.
  const corFinal = cor || "#2f7d4f";
  const forte = escurecerHex(corFinal, 26) || corFinal;

  document.documentElement.style.setProperty("--loja-cor", corFinal);
  document.documentElement.style.setProperty("--loja-cor-strong", forte);
  document.documentElement.style.setProperty("--loja-cor-soft", `${corFinal}18`);
}
document.addEventListener("DOMContentLoaded", () => {
  const loja = getLojaAtual();

  if (loja) {
    aplicarTemaLoja(loja);
  }
});


function lojaInlineHTML(loja, classe = "") {
  const extra = classe ? ` ${classe}` : "";
  return `
    <span class="loja-inline-info${extra}">
      ${logoLojaHTML(loja, "loja-logo-inline")}
      <span>${esc(loja?.nome || "Loja não selecionada")}</span>
    </span>
  `;
}
