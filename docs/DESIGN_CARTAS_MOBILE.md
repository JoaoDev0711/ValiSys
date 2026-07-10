# Design novo mobile - cartas empilhadas

A seção pública de impacto ganhou um layout mobile separado:

- no desktop continua o layout original;
- no mobile a seção antiga é escondida;
- entra a seção `impact-card-stack-mobile`;
- cada card usa `position: sticky`;
- os cards se sobrepõem como um baralho durante a rolagem.

Arquivos alterados:

- `index.html`
- `css/styles.css`
- `assets/logo/valisys-mark-oficial.png`
- `assets/icons/icon-192.png`
- `assets/icons/icon-512.png`
