# Notificações no ValiSys

Com sistema já dá para fazer 2 níveis:

## 1. Notificação interna
Já existe nesta versão.
Quando um item vence/vencendo é possível criar um aviso na tabela `notificacoes`.
Gerente, encarregado e admin veem na tela `notificacoes.html`.

## 2. Notificação em tempo real
Dá para melhorar usando sistema Realtime.
Quando uma nova linha entrar em `notificacoes`, o dashboard pode atualizar o contador sem recarregar a página.

## 3. Push no celular
Também dá para fazer, mas é outra etapa.
Para aparecer notificação mesmo com o navegador fechado, precisa:
- PWA/service worker;
- permissão de notificação do navegador;
- Web Push com Vbase de produtosD;
- backend ou sistema Edge Function para disparar.

Para o MVP, o mais seguro é começar por notificação interna + contador em tempo real.
