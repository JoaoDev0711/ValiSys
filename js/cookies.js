function setCookie(nome, valor, dias) {
  const data = new Date();
  data.setTime(data.getTime() + dias * 24 * 60 * 60 * 1000);

  document.cookie = `${nome}=${encodeURIComponent(valor)}; expires=${data.toUTCString()}; path=/; SameSite=Lax`;
}

function getCookie(nome) {
  const cookies = document.cookie.split(";");

  for (let cookie of cookies) {
    const [chave, ...resto] = cookie.trim().split("=");

    if (chave === nome) {
      return decodeURIComponent(resto.join("="));
    }
  }

  return "";
}

function mostrarBannerCookies() {
  const aceitou = getCookie("valisys_cookie_consent");

  if (aceitou === "aceito") {
    return;
  }

  const banner = document.createElement("div");
  banner.className = "cookie-banner";
  banner.innerHTML = `
    <div>
      <strong> Cookies</strong>
      <p>
        Usamos cookies apenas para lembrar este aviso. Os dados do sistema ficam salvos no navegador deste aparelho.
      </p>
    </div>

    <button id="aceitar-cookies">Aceitar</button>
  `;

  document.body.appendChild(banner);

  document.getElementById("aceitar-cookies").addEventListener("click", () => {
    setCookie("valisys_cookie_consent", "aceito", 365);
    banner.remove();
  });
}

document.addEventListener("DOMContentLoaded", mostrarBannerCookies);
