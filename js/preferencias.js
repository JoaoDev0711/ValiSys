/*
  ValiSys - Preferências locais seguras
  As preferências são locais do aparelho e não alteram banco de dados.
  Para evitar quebra visual, o site público não recebe tema/estilo do usuário.
*/
(function () {
  const STORAGE_KEY = "valisysPreferencias";

  const DEFAULTS = {
    tema: "claro",
    estilo: "minimalista",
    sons: true,
    volume: 0.55,
    somEntrada: true,
    somClique: false,
    somSucesso: true,
    reduzirMovimento: false,
    fonteMaior: false,
    densidade: "confortavel"
  };

  function paginaAtual() {
    return location.pathname.split("/").pop() || "index.html";
  }

  function ehPaginaPublica() {
    const pagina = paginaAtual();
    return ["index.html", "contratacao.html"].includes(pagina) || document.body?.classList.contains("public-page");
  }

  function clamp(num, min, max) {
    const value = Number(num);
    if (Number.isNaN(value)) return min;
    return Math.min(max, Math.max(min, value));
  }

  function normalizar(preferencias = {}) {
    const pref = { ...DEFAULTS, ...(preferencias || {}) };

    if (!["claro", "escuro", "auto"].includes(pref.tema)) pref.tema = "claro";
    if (!["minimalista", "compacto", "premium"].includes(pref.estilo)) pref.estilo = "minimalista";
    if (!["confortavel", "compacta"].includes(pref.densidade)) pref.densidade = "confortavel";

    pref.volume = clamp(pref.volume, 0, 1);
    pref.sons = Boolean(pref.sons);
    pref.somEntrada = Boolean(pref.somEntrada);
    pref.somClique = Boolean(pref.somClique);
    pref.somSucesso = Boolean(pref.somSucesso);
    pref.reduzirMovimento = Boolean(pref.reduzirMovimento);
    pref.fonteMaior = Boolean(pref.fonteMaior);

    return pref;
  }

  function lerPreferencias() {
    try {
      const salvo = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return normalizar(salvo);
    } catch {
      return normalizar(DEFAULTS);
    }
  }

  function salvarPreferencias(preferencias) {
    const pref = normalizar(preferencias);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pref));
    aplicarPreferencias(pref);
    return pref;
  }

  function limparClasses(body) {
    body.classList.remove(
      "valisys-tema-claro",
      "valisys-tema-escuro",
      "valisys-tema-auto",
      "valisys-estilo-minimalista",
      "valisys-estilo-compacto",
      "valisys-estilo-premium",
      "valisys-densidade-confortavel",
      "valisys-densidade-compacta",
      "valisys-fonte-maior",
      "valisys-reduzir-movimento",
      "tema-escuro",
      "tema-auto",
      "estilo-compacto",
      "estilo-premium",
      "fonte-maior",
      "reduzir-movimento"
    );
  }

  function aplicarPreferencias(preferencias = lerPreferencias()) {
    const pref = normalizar(preferencias);
    const root = document.documentElement;
    const body = document.body;

    root.dataset.valisysPreferencias = "ativas";
    root.dataset.tema = pref.tema;
    root.dataset.estilo = pref.estilo;
    root.dataset.densidade = pref.densidade;
    root.dataset.fonteMaior = pref.fonteMaior ? "sim" : "nao";
    root.dataset.reduzirMovimento = pref.reduzirMovimento ? "sim" : "nao";

    if (!body) return;

    limparClasses(body);

    // Site público fica sempre com identidade visual própria.
    if (ehPaginaPublica()) {
      body.classList.add("valisys-preferencias-publico-bloqueadas");
      return;
    }

    body.classList.add(`valisys-tema-${pref.tema}`);
    body.classList.add(`valisys-estilo-${pref.estilo}`);
    body.classList.add(`valisys-densidade-${pref.densidade}`);

    if (pref.fonteMaior) body.classList.add("valisys-fonte-maior");
    if (pref.reduzirMovimento) body.classList.add("valisys-reduzir-movimento");
  }

  let audioContext = null;

  function getAudioContext() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!audioContext) audioContext = new Ctx();
    return audioContext;
  }

  function tocarSom(tipo = "sucesso") {
    const pref = lerPreferencias();

    if (!pref.sons) return;
    if (tipo === "entrada" && !pref.somEntrada) return;
    if (tipo === "clique" && !pref.somClique) return;
    if (tipo === "sucesso" && !pref.somSucesso) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    const volume = clamp(pref.volume, 0, 1);
    const ganho = ctx.createGain();
    const oscilador = ctx.createOscillator();

    const mapa = {
      entrada: { freq: 520, dur: 0.12, type: "sine" },
      clique: { freq: 360, dur: 0.055, type: "triangle" },
      sucesso: { freq: 720, dur: 0.13, type: "sine" },
      alerta: { freq: 260, dur: 0.18, type: "square" }
    };

    const cfg = mapa[tipo] || mapa.sucesso;
    const now = ctx.currentTime;

    oscilador.type = cfg.type;
    oscilador.frequency.setValueAtTime(cfg.freq, now);

    ganho.gain.setValueAtTime(0.0001, now);
    ganho.gain.exponentialRampToValueAtTime(Math.max(0.001, volume * 0.18), now + 0.015);
    ganho.gain.exponentialRampToValueAtTime(0.0001, now + cfg.dur);

    oscilador.connect(ganho);
    ganho.connect(ctx.destination);
    oscilador.start(now);
    oscilador.stop(now + cfg.dur + 0.02);
  }

  function tocarAoEntrar() {
    if (ehPaginaPublica()) return;

    const paginasLogin = ["dashboard.html", "admin-dashboard.html"];
    const pagina = paginaAtual();

    if (!paginasLogin.includes(pagina)) return;

    const chave = `valisysSomEntrada:${pagina}:${new Date().toDateString()}`;
    if (sessionStorage.getItem(chave) === "ok") return;

    sessionStorage.setItem(chave, "ok");
    setTimeout(() => tocarSom("entrada"), 700);
  }

  function ativarSomClique() {
    document.addEventListener("click", (event) => {
      if (ehPaginaPublica()) return;

      const alvo = event.target.closest("button, a, .action-card, .loja-card-clickable");
      if (!alvo) return;

      tocarSom("clique");
    }, { capture: true });
  }

  window.valisysPreferencias = {
    defaults: DEFAULTS,
    ler: lerPreferencias,
    salvar: salvarPreferencias,
    aplicar: aplicarPreferencias,
    tocarSom
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      aplicarPreferencias();
      ativarSomClique();
      tocarAoEntrar();
    });
  } else {
    aplicarPreferencias();
    ativarSomClique();
    tocarAoEntrar();
  }
})();
