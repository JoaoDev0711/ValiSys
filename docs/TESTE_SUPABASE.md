# Teste Supabase

Abra:

teste-supabase.html

Clique em "Testar conexão".

Se estiver OK:
- ele cria uma loja de teste no Supabase;
- você verá a nova linha em Table Editor > lojas.

Se falhar:
- confira js/supabase-config.js;
- confira se a URL não tem /rest/v1;
- confira se usou publishable key, não secret key;
- confira se o SQL foi rodado;
- confira se RLS/policies não estão bloqueando SELECT/INSERT.

Nesta versão, lojas, funcionários, produtos, lançamentos e notificações não salvam localmente.
Se falhar, aparece erro.
