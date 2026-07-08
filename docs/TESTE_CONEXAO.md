# Teste sistema

Abra:

teste-dados_online.html

Clique em "Testar conexão".

Se estiver OK:
- ele cria uma loja de teste no sistema;
- você verá a nova linha em painel de dados > lojas.

Se falhar:
- confira js/dados_online-config.js;
- confira se a URL não tem URL de integração;
- confira se usou publishable key, não secret key;
- confira se o SQL foi rodado;
- confira se regras de acesso/policies não estão bloqueando SELECT/INSERT.

Nesta versão, lojas, funcionários, produtos, lançamentos e notificações não salvam localmente.
Se falhar, aparece erro.
