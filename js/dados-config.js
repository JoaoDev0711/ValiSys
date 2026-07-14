/*
  ValiSys - Configuração dos dados online
  Esta versão usa dados online para sincronizar vários celulares.

  IMPORTANTE:
  - Use a URL base do projeto.
  - Use chave pública.
  - Nunca use chave secreta no front-end.
*/

const VALISYS_DADOS_URL = "https://bwrgkzetsnglmkneqqzs.supabase.co";
const VALISYS_DADOS_PUBLIC_KEY = "sb_publishable_H57H-h2JxHhINQ9xt6PIEQ_nawq-V9b";

function dadosOnlineConfigurado() {
  return (
    VALISYS_DADOS_URL &&
    VALISYS_DADOS_PUBLIC_KEY &&
    VALISYS_DADOS_URL.startsWith("https://") &&
    !VALISYS_DADOS_URL.includes("COLE_AQUI") &&
    !VALISYS_DADOS_PUBLIC_KEY.includes("COLE_AQUI")
  );
}

function getDadosOnlineClient() {
  if (!dadosOnlineConfigurado()) {
    throw new Error("Dados online não configurados em js/dados-config.js.");
  }

  if (!window.supabase) {
    throw new Error("Biblioteca de dados não carregou. Verifique a internet/CDN.");
  }

  return window.supabase.createClient(
    VALISYS_DADOS_URL,
    VALISYS_DADOS_PUBLIC_KEY
  );
}


/*
  Opcional:
  Se você criar uma conta/token em uma fonte GTIN externa, pode ativar assim:
  window.VALISYS_GTIN_TOKEN = "COLE_SEU_TOKEN_AQUI";

  Sem token, o sistema usa:
  1) sistema produtos
  2) base pública de produtos
  3) Brasilfonte GTIN, quando disponível
*/
