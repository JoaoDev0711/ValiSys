/*
  ValiSys - Configuração Supabase

  1. Crie um projeto no Supabase.
  2. Vá em Project Settings > API.
  3. Copie:
     - Project URL
     - anon public key ou publishable key
  4. Cole abaixo.

  Nunca coloque service_role key aqui.
*/

const VALISYS_SUPABASE_URL = "https://bwrgkzetsnglmkneqqzs.supabase.co";
const VALISYS_SUPABASE_ANON_KEY = "sb_publishable_H57H-h2JxHhINQ9xt6PIEQ_nawq-V9b";

function supabaseConfigurado() {
  return (
    VALISYS_SUPABASE_URL &&
    VALISYS_SUPABASE_ANON_KEY &&
    !VALISYS_SUPABASE_URL.includes("COLE_AQUI") &&
    !VALISYS_SUPABASE_ANON_KEY.includes("COLE_AQUI")
  );
}

function getSupabaseClient() {
  if (!supabaseConfigurado()) {
    console.warn("Supabase ainda não configurado. O sistema continuará usando localStorage.");
    return null;
  }

  if (!window.supabase) {
    console.error("Biblioteca Supabase não carregou.");
    return null;
  }

  return window.supabase.createClient(
    VALISYS_SUPABASE_URL,
    VALISYS_SUPABASE_ANON_KEY
  );
}
