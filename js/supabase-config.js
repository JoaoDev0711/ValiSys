/*
  ValiSys - Configuração Supabase
  Esta versão é Supabase-only para testar dados online em vários celulares.

  IMPORTANTE:
  - URL é a URL base do projeto, sem /rest/v1.
  - Use publishable key/anon key pública.
  - Nunca use secret key/service_role no front-end.
*/

const VALISYS_SUPABASE_URL = "https://bwrgkzetsnglmkneqqzs.supabase.co";
const VALISYS_SUPABASE_ANON_KEY = "sb_publishable_H57H-h2JxHhINQ9xt6PIEQ_nawq-V9b";

function supabaseConfigurado() {
  return (
    VALISYS_SUPABASE_URL &&
    VALISYS_SUPABASE_ANON_KEY &&
    VALISYS_SUPABASE_URL.startsWith("https://") &&
    !VALISYS_SUPABASE_URL.includes("COLE_AQUI") &&
    !VALISYS_SUPABASE_ANON_KEY.includes("COLE_AQUI")
  );
}

function getSupabaseClient() {
  if (!supabaseConfigurado()) {
    throw new Error("Supabase não configurado em js/supabase-config.js.");
  }

  if (!window.supabase) {
    throw new Error("Biblioteca Supabase não carregou. Verifique a internet/CDN.");
  }

  return window.supabase.createClient(
    VALISYS_SUPABASE_URL,
    VALISYS_SUPABASE_ANON_KEY
  );
}
