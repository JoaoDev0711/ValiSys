/*
  ValiSys - Chat SAC Online
  Chat flutuante no site público. Sem tabela nova: usa notificacoes com tipo sac_chat.
*/

(function () {
  const widget = document.getElementById("sacChatWidget");
  const toggle = document.getElementById("sacChatToggle");
  const panel = document.getElementById("sacChatPanel");
  const closeBtn = document.getElementById("sacChatClose");
  const body = document.getElementById("sacChatBody");
  const form = document.getElementById("sacChatForm");
  const nomeInput = document.getElementById("sacChatNome");
  const contatoInput = document.getElementById("sacChatContato");
  const mensagemInput = document.getElementById("sacChatMensagem");
  const identificacao = document.getElementById("sacChatIdentificacao");

  const btnSac = document.getElementById("btnSacOnline");
  const btnSacInline = document.getElementById("btnSacOnlineInline");

  if (!widget || !panel || !form || !body) return;

  const storageKey = "valisysSacChat";
  let timer = null;

  function lerSessao() {
    try {
      const dados = JSON.parse(localStorage.getItem(storageKey) || "{}");

      if (!dados.sessaoId) {
        dados.sessaoId = `sac_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      }

      return dados;
    } catch (_) {
      return {
        sessaoId: `sac_${Date.now()}_${Math.random().toString(16).slice(2)}`
      };
    }
  }

  function salvarSessao(dados) {
    localStorage.setItem(storageKey, JSON.stringify(dados));
  }

  let sessao = lerSessao();
  salvarSessao(sessao);

  if (sessao.nome) nomeInput.value = sessao.nome;
  if (sessao.contato) contatoInput.value = sessao.contato;

  function esc(valor) {
    return String(valor || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function abrirChat() {
    panel.classList.add("active");
    panel.setAttribute("aria-hidden", "false");
    carregarMensagens();
    iniciarAtualizacao();

    setTimeout(() => mensagemInput?.focus(), 120);
  }

  function fecharChat() {
    panel.classList.remove("active");
    panel.setAttribute("aria-hidden", "true");
    pararAtualizacao();
  }

  function iniciarAtualizacao() {
    pararAtualizacao();
    timer = setInterval(carregarMensagens, 4500);
  }

  function pararAtualizacao() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function baseAutomatica() {
    return `
      <div class="chat-message bot">
        <p>Olá! Sou o atendimento automático do ValiSys.</p>
      </div>
      <div class="chat-message bot">
        <p>Me diga seu nome e uma forma de contato. Depois escreva o que você precisa. Quando o responsável responder, a mensagem aparece aqui.</p>
      </div>
    `;
  }

  function renderizarMensagens(mensagens) {
    const html = mensagens.map(item => {
      const classe = item.autor === "admin" ? "bot" : "user";
      const rotulo = item.autor === "admin" ? "ValiSys" : "Você";

      return `
        <div class="chat-message ${classe}">
          <small>${rotulo}</small>
          <p>${esc(item.mensagem)}</p>
        </div>
      `;
    }).join("");

    body.innerHTML = baseAutomatica() + html;
    body.scrollTop = body.scrollHeight;
  }

  async function carregarMensagens() {
    try {
      if (typeof valisysDB === "undefined" || !valisysDB.listarMensagensChatSac) {
        return;
      }

      const mensagens = await valisysDB.listarMensagensChatSac(sessao.sessaoId);
      renderizarMensagens(mensagens);
    } catch (erro) {
      console.error(erro);
    }
  }

  async function enviarMensagem(event) {
    event.preventDefault();

    const texto = mensagemInput.value.trim();
    const nome = nomeInput.value.trim();
    const contato = contatoInput.value.trim();

    if (!texto) return;

    if (!nome || !contato) {
      alert("Antes de enviar, preencha seu nome e uma forma de contato.");
      return;
    }

    sessao.nome = nome;
    sessao.contato = contato;
    salvarSessao(sessao);

    identificacao.classList.add("compacto");

    const botao = form.querySelector("button");
    const textoOriginal = botao.innerText;

    botao.disabled = true;
    botao.innerText = "...";

    try {
      await valisysDB.criarMensagemChatSac({
        sessaoId: sessao.sessaoId,
        nome,
        contato,
        mensagem: texto,
        autor: "cliente"
      });

      mensagemInput.value = "";
      mensagemInput.style.height = "";
      await carregarMensagens();
    } catch (erro) {
      console.error(erro);
      alert("Não foi possível enviar a mensagem: " + erro.message);
    } finally {
      botao.disabled = false;
      botao.innerText = textoOriginal;
    }
  }

  toggle?.addEventListener("click", () => {
    if (panel.classList.contains("active")) {
      fecharChat();
    } else {
      abrirChat();
    }
  });

  closeBtn?.addEventListener("click", fecharChat);
  btnSac?.addEventListener("click", abrirChat);
  btnSacInline?.addEventListener("click", abrirChat);
  form.addEventListener("submit", enviarMensagem);

  mensagemInput?.addEventListener("input", () => {
    mensagemInput.style.height = "auto";
    mensagemInput.style.height = `${Math.min(mensagemInput.scrollHeight, 110)}px`;
  });

  if (sessao.nome && sessao.contato) {
    identificacao.classList.add("compacto");
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      pararAtualizacao();
      return;
    }

    if (panel.classList.contains("active")) {
      iniciarAtualizacao();
    }
  });
})();
