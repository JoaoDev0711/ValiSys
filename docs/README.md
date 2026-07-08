# ValiSys — Controle de Vencimentos

Sistema web para controle de produtos próximos da validade em mercados, lojas e redes.

O projeto foi feito para funcionar em navegador, inclusive no celular, com fluxo por loja, cargos, lançamentos de validade, scanner de código de barras e painel administrativo.

---

## Funcionalidades principais

- Seleção de loja antes do login operacional.
- Login separado por loja.
- Dashboard operacional da loja.
- Dashboard Admin separada.
- Cadastro de lojas.
- Ativar/desativar loja.
- Organização por grupo/rede.
- Organização por região.
- Imagem/logo da loja pelo arquivo do celular.
- Iniciais automáticas quando a loja não tem imagem.
- Cor da rede aplicada no sistema.
- Cadastro de funcionários por loja.
- Cargos: promotor, encarregado, gerente e admin.
- Lançamento de validade por produto.
- Scanner de código de barras pelo celular.
- Cadastro e consulta de produtos.
- Lista de vencimentos.
- Notificações internas.
- Gráficos administrativos sem duplicação: um gráfico por indicador.
- Percentuais administrativos.
- SQL único para montar/atualizar a base.

---

## Fluxo correto de acesso

### Admin

```txt
Login Admin → Dashboard Admin
```

O admin fica na área administrativa.

Na Dashboard Admin ele pode:

```txt
Cadastrar loja
Editar loja
Ativar/desativar loja
Trocar imagem
Definir região
Definir grupo/rede
Definir cor da rede
Ver gráficos
Escolher loja para acessar o login operacional
```

### Funcionário da loja

```txt
Escolher loja → Login da loja → Dashboard da loja
```

Ao clicar em uma loja, o sistema vai direto para o login daquela loja.

O login da loja mostra apenas:

```txt
Promotor
Encarregado
Gerente
```

A opção Admin não aparece no login da loja.

---

## Segurança de fluxo

O admin não entra diretamente na área operacional da loja.

Quando o admin seleciona uma loja:

```txt
O sistema salva a loja escolhida
Limpa o login admin
Abre o login da loja
```

Assim evita divergência de entrar na loja ainda como admin.

---

## SQL único

Use apenas este arquivo:

```txt
database/valisys-sql-unico.sql
```

Ele cria e atualiza tudo que o sistema precisa:

```txt
Lojas
Funcionários
Produtos
Lançamentos
Notificações
Imagem da loja
Região
Grupo/Rede
Cor da rede
Status ativa/desativada
Índices
Permissões para teste
```

---

## Como instalar no GitHub Pages

1. Extraia o ZIP.
2. Envie os arquivos para um repositório no GitHub.
3. Vá em:

```txt
Settings → Pages
```

4. Em **Source**, escolha:

```txt
Deploy from a branch
```

5. Escolha:

```txt
main / root
```

6. Salve.

O site será publicado pelo GitHub Pages.

---

## Configuração dos dados online

O arquivo de configuração fica em:

```txt
js/dados-config.js
```

Nele ficam a URL e a chave pública do projeto.

Não use chave secreta no front-end.

---

## Estrutura do projeto

```txt
ValiSys/
├── index.html
├── login.html
├── escolher-loja.html
├── admin-dashboard.html
├── dashboard.html
├── lancar.html
├── lista-geral.html
├── meus-lancamentos.html
├── cadastrar-produto.html
├── usuarios.html
├── notificacoes.html
├── teste-conexao.html
├── css/
│   └── styles.css
├── js/
│   ├── auth.js
│   ├── loja.js
│   ├── login.js
│   ├── admin-dashboard.js
│   ├── app.js
│   ├── lancar.js
│   ├── lista.js
│   ├── produto.js
│   ├── usuarios.js
│   ├── notificacoes-internas.js
│   ├── produtos-fonte.js
│   ├── dados-config.js
│   ├── dados-service.js
│   └── teste-conexao.js
├── database/
│   └── valisys-sql-unico.sql
└── docs/
    └── README.md
```

---

## Cargos

### Admin

Acesso geral administrativo.

Pode:

```txt
Cadastrar loja
Editar loja
Ativar/desativar loja
Ver gráficos gerais
Gerenciar estrutura administrativa
```

### Gerente

Acesso operacional da loja.

Pode:

```txt
Ver lista completa da loja
Cadastrar produtos
Gerenciar funcionários da loja
Lançar validade
```

### Encarregado

Acesso operacional por loja/setor.

Pode:

```txt
Lançar validade
Ver lista da loja ou setor
Ver notificações
```

### Promotor

Acesso simples para lançamento.

Pode:

```txt
Lançar validade
Ver seus lançamentos
```

---

## Observação importante

As permissões do SQL único estão liberadas para facilitar teste em front-end estático.

Para produção real, o ideal é usar autenticação real e regras mais restritas por usuário, loja e cargo.


---

## Gráficos administrativos

A Dashboard Admin usa um tipo de gráfico para cada indicador:

```txt
Lojas por situação → pizza
Vencimentos por prazo → barras
Lojas por grupo/rede → barras
Lojas por região → barras
```

O mesmo indicador não é repetido em pizza e barra.


---

## Login administrativo separado

O admin não acessa a loja pelo ícone da seleção de loja.

Agora existe uma tela própria:

```txt
admin-login.html
```

Fluxo correto:

```txt
Funcionário → escolher-loja.html → clique na loja → login.html
Admin → escolher-loja.html → bloco Administração → admin-login.html
```

O login operacional da loja não mostra opção Admin.


---

## Refinamentos finais de interface

Esta versão inclui:

```txt
Animações suaves nos cards, botões e modais
Modais internos para avisos e confirmações
Logout com confirmação dentro do site
Área administrativa mais discreta na seleção de loja
Logo/iniciais junto ao nome da loja nas áreas operacionais
Ícones/emojis sem fundo pesado, com visual mais limpo
```

A área administrativa fica separada:

```txt
Funcionário → escolher-loja.html → clicar na loja → login.html
Admin → Administração → admin-login.html → admin-dashboard.html
```

As confirmações não usam mais a janela padrão do navegador.


---

## Dashboard Admin com navbar

A Dashboard Admin possui uma navbar própria para navegar pela área administrativa:

```txt
Visão geral
Gráficos
Loja atual
Cadastrar loja
Filtros
Lojas
Entrar em loja
```

---

## Gestão da loja para gerente e encarregado

Além da Dashboard Admin geral, existe a área operacional administrativa da loja:

```txt
gestao-loja.html
```

Permissões:

```txt
Gerente:
- vê resumo geral da loja;
- vê vencimentos por prazo;
- vê vencimentos por setor;
- vê equipe ativa;
- acessa produtos;
- acessa funcionários;
- acessa lista completa;
- acessa notificações.

Encarregado:
- vê resumo operacional;
- vê vencimentos filtrados por setor quando tiver setor configurado;
- acessa lista completa conforme permissão;
- acessa notificações;
- não vê gestão de funcionários;
- não vê cadastro de produtos.
```

---

## Produtos completos

A tela de produtos e os lançamentos agora trabalham com dados completos:

```txt
EAN
Nome
Marca
Fabricante
Sabor/variação
Categoria
Quantidade padrão
Porção
Embalagem
Origem
Países
Lojas encontradas
Ingredientes
Alérgicos
Pode conter / traços
Nutri-Score
Eco-Score
NOVA
Fonte
Foto
```


---

## Navbar padrão e confirmação de saída

A Dashboard Admin e a Gestão da Loja agora usam a mesma navegação das demais telas:

```txt
Botão ☰
Menu lateral
Overlay
Links internos
Botão Sair
```

A saída agora pede confirmação dentro do próprio sistema em todas as telas logadas.

Também existe confirmação ao trocar de loja, porque isso limpa a sessão atual para evitar registros no mercado errado.


---

## Admin administrando loja como admin

Existem dois fluxos diferentes:

```txt
Funcionário pela seleção pública:
escolher-loja.html → clicar na loja → login da loja

Admin pela Dashboard Admin:
admin-dashboard.html → Administrar esta loja → entra na loja mantendo cargo Admin
```

Quando o admin administra uma loja pela Dashboard Admin, ele continua como admin e pode acessar a dashboard da loja, produtos, usuários, listas e gestão da loja.
