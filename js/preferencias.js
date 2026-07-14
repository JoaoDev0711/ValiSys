/*
  ValiSys - Preferências locais do usuário
  Não usa banco. Salva no localStorage do aparelho.
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

  function clamp(num, min, max) {
    const value = Number(num);
    if (Number.isNaN(value)) return min;
    return Math.min(max, Math.max(min, value));
  }

  function lerPreferencias() {
    try {
      const salvo = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return { ...DEFAULTS, ...(salvo || {}) };
    } catch {
      return { ...DEFAULTS };
    }
  }

  function salvarPreferencias(preferencias) {
    const normalizado = {
      ...DEFAULTS,
      ...(preferencias || {})
    };

    normalizado.volume = clamp(normalizado.volume, 0, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizado));
    aplicarPreferencias(normalizado);

    return normalizado;
  }

  function aplicarPreferencias(preferencias = lerPreferencias()) {
    const root = document.documentElement;
    const body = document.body;

    root.dataset.tema = preferencias.tema || "claro";
    root.dataset.estilo = preferencias.estilo || "minimalista";
    root.dataset.densidade = preferencias.densidade || "confortavel";
    root.dataset.fonteMaior = preferencias.fonteMaior ? "sim" : "nao";
    root.dataset.reduzirMovimento = preferencias.reduzirMovimento ? "sim" : "nao";

    if (body) {
      body.classList.toggle("tema-escuro", preferencias.tema === "escuro");
      body.classList.toggle("tema-auto", preferencias.tema === "auto");
      body.classList.toggle("estilo-compacto", preferencias.estilo === "compacto");
      body.classList.toggle("estilo-premium", preferencias.estilo === "premium");
      body.classList.toggle("fonte-maior", Boolean(preferencias.fonteMaior));
      body.classList.toggle("reduzir-movimento", Boolean(preferencias.reduzirMovimento));
    }
  }

  let audioContext = null;

  function getAudioContext() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!audioContext) audioContext = new Ctx();
    return audioContext;
  }

  function tocarSom(tipo = "sucesso") {
    const preferencias = lerPreferencias();

    if (!preferencias.sons) return;
    if (tipo === "entrada" && !preferencias.somEntrada) return;
    if (tipo === "clique" && !preferencias.somClique) return;
    if (tipo === "sucesso" && !preferencias.somSucesso) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    const volume = clamp(preferencias.volume, 0, 1);
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
    const paginasLogin = ["dashboard.html", "admin-dashboard.html"];
    const pagina = location.pathname.split("/").pop() || "index.html";
    if (!paginasLogin.includes(pagina)) return;

    const chave = `valisysSomEntrada:${pagina}:${new Date().toDateString()}`;
    if (sessionStorage.getItem(chave) === "ok") return;

    sessionStorage.setItem(chave, "ok");
    setTimeout(() => tocarSom("entrada"), 700);
  }

  function ativarSomClique() {
    document.addEventListener("click", (event) => {
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

  aplicarPreferencias();

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
