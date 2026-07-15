/*
  ValiSys - Ícones SVG seguros
  Não substitui texto vazio entre letras. Preenche somente áreas visuais conhecidas.
*/
(function () {
  const ICONS = {
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    back: '<path d="M15 18l-6-6 6-6"/><path d="M9 12h11"/>',
    logout: '<path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M21 4v16"/>',
    box: '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
    calendar: '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M16 3v4M8 3v4M4 10h16"/>',
    chart: '<path d="M4 19V5"/><path d="M4 19h17"/><path d="M8 16v-5"/><path d="M13 16V8"/><path d="M18 16v-9"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3"/><path d="M12 19v3"/><path d="M4.9 4.9l2.1 2.1"/><path d="M17 17l2.1 2.1"/><path d="M2 12h3"/><path d="M19 12h3"/><path d="M4.9 19.1L7 17"/><path d="M17 7l2.1-2.1"/>',
    store: '<path d="M4 10h16l-1-5H5l-1 5z"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>',
    pin: '<path d="M12 21s7-5.5 7-12a7 7 0 1 0-14 0c0 6.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    cart: '<circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/><path d="M2 3h3l3 12h10l3-8H6"/>',
    alert: '<path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    check: '<path d="M20 6L9 17l-5-5"/>',
    error: '<circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4V8z"/><circle cx="12" cy="13" r="4"/>',
    tag: '<path d="M20 13l-7 7-9-9V4h7l9 9z"/><circle cx="8" cy="8" r="1"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
    database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
    product: '<path d="M6 3h12v18H6z"/><path d="M9 7h6"/><path d="M9 11h6"/><path d="M9 15h3"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 15h10l1-15"/><path d="M10 11v6M14 11v6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 10v7"/><path d="M12 7h.01"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    key: '<circle cx="7" cy="17" r="3"/><path d="M10 17h11"/><path d="M17 17v-3M14 17v-2"/>',
    spark: '<path d="M12 2l2.2 6.2L20 10l-5.8 1.8L12 18l-2.2-6.2L4 10l5.8-1.8L12 2z"/>',
    admin: '<path d="M12 3l7 3v5c0 4.5-2.9 8.5-7 10-4.1-1.5-7-5.5-7-10V6l7-3z"/><path d="M9 12l2 2 4-5"/>',
    money: '<path d="M3 7h18v10H3z"/><circle cx="12" cy="12" r="2"/><path d="M7 9h.01M17 15h.01"/>',
    credit: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/><path d="M7 15h4"/>',
    cancel: '<circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/>',
    moon: '<path d="M21 13.2A8 8 0 0 1 10.8 3 7 7 0 1 0 21 13.2z"/>',
    generic: '<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>'
  };

  const EMOJI_TO_ICON = {
    "←": "back",
    "↪": "user",
    "⏳": "clock",
    "ℹ": "info",
    "✅": "check",
    "⚡": "spark",
    "📦": "box",
    "🔔": "bell"
  };

  const TEXT_ICON = [
    ["lançar", "plus"],
    ["meus lançamentos", "list"],
    ["lista geral", "list"],
    ["gestão", "settings"],
    ["cadastrar produto", "product"],
    ["usuários", "users"],
    ["assinatura", "money"],
    ["planos", "credit"],
    ["tutorial", "file"],
    ["atualizações", "bell"],
    ["configurações", "settings"],
    ["nova implantação", "store"],
    ["lojas", "store"],
    ["vencimentos", "clock"],
    ["gráficos", "chart"],
    ["admin", "admin"]
  ];

  function iconHTML(name) {
    const paths = ICONS[name] || ICONS.generic;
    return `<svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
  }

  window.svgIconHTML = iconHTML;

  function iconElement(name) {
    const temp = document.createElement("span");
    temp.innerHTML = iconHTML(name);
    return temp.firstElementChild;
  }

  function iconByText(text = "") {
    const lower = String(text || "").toLowerCase();
    const item = TEXT_ICON.find(([key]) => lower.includes(key));
    return item ? item[1] : "generic";
  }

  function preencherSpansVisuais(root = document) {
    root.querySelectorAll?.(".action-card > span, .resumo-card > span, .section-title > span, .feature-icon, .impact-card-icon").forEach((span) => {
      if (span.querySelector("svg")) return;

      const contexto = span.closest(".action-card, .resumo-card, .section-title, article, section, .card") || span.parentElement;
      const texto = contexto?.innerText || "";
      span.innerHTML = iconHTML(iconByText(texto));
    });

    root.querySelectorAll?.("[data-svg-icon]").forEach((el) => {
      if (el.querySelector("svg")) return;
      el.innerHTML = iconHTML(el.dataset.svgIcon || "generic");
    });
  }

  const keys = Object.keys(EMOJI_TO_ICON).filter(Boolean).sort((a, b) => b.length - a.length);
  const emojiRegex = keys.length
    ? new RegExp(keys.map(escapeRegExp).join("|"), "g")
    : null;

  function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function hasEmoji(text) {
    if (!emojiRegex) return false;
    emojiRegex.lastIndex = 0;
    return emojiRegex.test(text);
  }

  function cleanOption(option) {
    if (!emojiRegex) return;
    option.textContent = option.textContent.replace(emojiRegex, "").replace(/\s+/g, " ").trim();
  }

  function skip(node) {
    const parent = node.parentElement;
    if (!parent) return true;

    return ["SCRIPT", "STYLE", "SVG", "PATH", "TEXTAREA", "INPUT"].includes(parent.tagName) || parent.closest(".svg-icon");
  }

  function replaceTextNode(node) {
    if (!emojiRegex) return;

    const text = node.nodeValue;

    if (!text || !hasEmoji(text) || skip(node)) return;

    const parent = node.parentElement;

    if (parent && parent.tagName === "OPTION") {
      cleanOption(parent);
      return;
    }

    const frag = document.createDocumentFragment();
    let last = 0;

    text.replace(emojiRegex, (match, offset) => {
      if (offset > last) {
        frag.appendChild(document.createTextNode(text.slice(last, offset)));
      }

      frag.appendChild(iconElement(EMOJI_TO_ICON[match] || "generic"));
      last = offset + match.length;
      return match;
    });

    if (last < text.length) {
      frag.appendChild(document.createTextNode(text.slice(last)));
    }

    node.replaceWith(frag);
  }

  function scan(root) {
    if (!root) return;

    preencherSpansVisuais(root);
    root.querySelectorAll?.("option").forEach(cleanOption);

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];

    while (walker.nextNode()) {
      nodes.push(walker.currentNode);
    }

    nodes.forEach(replaceTextNode);
    preencherSpansVisuais(root);
  }

  function start() {
    scan(document.body);

    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE) {
            replaceTextNode(node);
            return;
          }

          if (node.nodeType === Node.ELEMENT_NODE && !node.classList?.contains("svg-icon")) {
            scan(node);
          }
        });
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
