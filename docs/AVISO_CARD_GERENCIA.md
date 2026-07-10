# Ajuste dos avisos da equipe

Agora:

- O dashboard mostra somente o aviso dentro do card `Controle do mercado`.
- O dashboard não mostra formulário de envio.
- O envio do aviso fica na página `gestao-loja.html`, em `Enviar aviso para a equipe`.
- Gerente, encarregado e admin podem enviar.
- Promotor e outros cargos apenas visualizam o aviso no dashboard.
- O aviso continua indo por push externo usando a função `send-team-message`.

Arquivos principais:

- `dashboard.html`
- `gestao-loja.html`
- `js/comunicados-core.js`
- `js/comunicados-dashboard.js`
- `js/comunicados-gerencia.js`
- `css/styles.css`
