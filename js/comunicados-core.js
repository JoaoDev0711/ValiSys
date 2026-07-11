/*
  ValiSys - utilidades de comunicados
*/
window.ValiSysComunicados = (function () {
  function usuarioAtual() {
    try {
      return typeof getUsuarioLogado === "function" ? getUsuarioLogado() : JSON.parse(localStorage.getItem("usuarioLogado") || "null");
    } catch {
      return null;
    }
  }

  function lojaAtual() {
    try {
      return typeof getLojaAtual === "function" ? getLojaAtual() : JSON.parse(localStorage.getItem("lojaAtual") || "null");
    } catch {
      return null;
    }
  }

  function cargoNome(cargo) {
    if (typeof nomeCargo === "function") return nomeCargo(cargo);
    return cargo || "";
  }

  function functionUrl(nome) {
    return `${VALISYS_DADOS_URL.replace(/\/$/, "")}/functions/v1/${nome}`;
  }

  async function chamarFunction(nome, payload) {
    const resposta = await fetch(functionUrl(nome), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": VALISYS_DADOS_PUBLIC_KEY,
        "Authorization": `Bearer ${VALISYS_DADOS_PUBLIC_KEY}`
      },
      body: JSON.stringify(payload || {})
    });

    const texto = await resposta.text();
    let json = {};

    try {
      json = texto ? JSON.parse(texto) : {};
    } catch {
      json = { mensagem: texto };
    }

    if (!resposta.ok) {
      throw new Error(json.error || json.mensagem || "Erro ao processar comunicado.");
    }

    return json;
  }

  function inicioHojeLocalISO() {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return hoje.toISOString();
  }

  function comunicadoValidoHoje(item) {
    const agora = new Date();

    if (item.expira_em) {
      return new Date(item.expira_em) >= agora;
    }

    // Compatibilidade com comunicados antigos criados antes do campo expira_em.
    return new Date(item.criado_em) >= new Date(inicioHojeLocalISO());
  }

  async function listarComunicados(lojaId) {
    const db = getDadosOnlineClient();

    const { data, error } = await db
      .from("comunicados_equipe")
      .select("*")
      .eq("loja_id", lojaId)
      .eq("ativo", true)
      .order("criado_em", { ascending: false })
      .limit(10);

    if (error) throw error;

    return (data || [])
      .filter(comunicadoValidoHoje)
      .slice(0, 3);
  }

  return {
    usuarioAtual,
    lojaAtual,
    cargoNome,
    chamarFunction,
    listarComunicados
  };
})();
