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


---

## Correção de navbar, admin loja e cor da rede

Esta versão corrige:

```txt
Botão ☰ funcionando com script global
Sem duplicidade de evento na navbar
Admin administrando loja mantendo cargo Admin
Cor da rede sem alterar o tema inteiro do site
```

A cor cadastrada na loja agora aparece apenas como destaque visual da loja, sem mudar todas as cores do sistema.


---

## Regras de funcionários, código e setor

Nesta versão:

```txt
Admin pode cadastrar funcionários.
Gerente pode cadastrar funcionários da loja.
Encarregado não cadastra funcionários.
Gerente não usa código de acesso.
Promotor não usa código de acesso.
Somente encarregado usa código de acesso.
Setor é escolhido por lista interna, não digitado livremente.
```

Setores internos:

```txt
Geral
Mercearia
Bebidas
Frios e Laticínios
Açougue
Hortifruti
Padaria
Congelados
Limpeza
Higiene e Perfumaria
Pet
Outros
```


---

## Promotor com marca automática no login

Somente promotor precisa informar a marca da promotoria ao entrar.

Fluxo:

```txt
Promotor escolhe a loja
Seleciona Promotor no login
Digita o nome
Seleciona uma marca cadastrada ou digita uma nova
Entra no sistema
```

O sistema faz automaticamente:

```txt
Se a marca não existir, cadastra a marca na loja
Se o promotor não existir, cadastra o promotor no banco
Se o promotor já existir, atualiza/vincula a marca escolhida
Salva nome, cargo e marca da promotoria na sessão
```

Gerente, encarregado e admin não precisam informar marca.


---

## Catálogo interno amplo de produtos

Esta versão adiciona um catálogo interno de produtos para quando o EAN/API não retornar.

Arquivos novos:

```txt
database/catalogo-produtos-base.sql
js/catalogo-produtos-base.js
```

O SQL único também cria e popula a tabela:

```txt
catalogo_produtos
```

Campos do catálogo:

```txt
código interno
EAN opcional
nome
marca
fabricante
sabor/variação
categoria
quantidade padrão
porção
embalagem
origem
países
lojas encontradas
ingredientes
alérgicos
rastros
Nutri-Score
Eco-Score
NOVA
foto
fonte
ativo
```

Fluxo de busca:

```txt
1. Busca no banco principal produtos
2. Busca no catálogo interno por EAN
3. Busca nas APIs gratuitas
4. Se ainda não achar, permite buscar por nome/marca/fabricante/categoria
5. Ao selecionar da lista interna, preenche o formulário automaticamente
```

Observação importante:

```txt
Produtos sem EAN oficial ficam com código interno.
Isso evita inventar código de barras falso.
Quando você tiver o EAN real, basta preencher o EAN no cadastro e salvar.
```


---

## EAN automático como fluxo principal

Nesta versão o EAN/GTIN é o centro do processo.

Fluxo:

```txt
Escaneou pela câmera → validou o código → puxa produto automaticamente
Digitou manualmente → quando o código fica válido → puxa produto automaticamente
Pressionou Enter no campo EAN → puxa produto automaticamente
Saiu do campo EAN → puxa produto automaticamente
```

Suporte de código:

```txt
GTIN-8
GTIN-12 / UPC-A
GTIN-13 / EAN-13
GTIN-14
```

Se o EAN não existir nas fontes gratuitas:

```txt
O usuário pode digitar o nome manualmente.
Ao salvar o lançamento/cadastro, o EAN fica salvo no banco interno.
Na próxima leitura daquele mesmo EAN, o produto será puxado do banco do ValiSys.
```

A busca por nome/marca/fabricante continua apenas como apoio, não como fluxo principal.



---

## Correção do login de promotor por marca

Antes o login do promotor estava permissivo demais:

```txt
Qualquer nome + marca existente conseguia entrar.
```

Agora ficou assim:

```txt
Promotor cadastrado:
- nome precisa bater
- marca precisa bater

Nome já cadastrado com outra marca:
- sistema bloqueia e avisa qual marca está correta

Marca já existe, mas nome não está cadastrado nela:
- sistema bloqueia
- gerente/admin precisa cadastrar esse promotor nessa marca

Marca nova:
- sistema cadastra a marca e o promotor automaticamente
```

Também foi adicionado campo de marca no cadastro de funcionários, somente quando o cargo for Promotor.


---

## Busca automática e pop-up de cadastro básico

Foi removido o buscador manual da lista interna nas telas de lançamento/cadastro.

Novo fluxo:

```txt
Digitou EAN válido → busca automático
Escaneou EAN → busca automático
Digitou nome do produto → busca automático
Não encontrou → abre pop-up de cadastro básico
```

Pop-up de cadastro básico:

```txt
EAN
Nome
Marca
Fabricante
Foto
```

Depois de salvar pelo pop-up, o produto fica gravado no banco e será puxado pelo EAN nas próximas leituras.


---

## Versão sem CSV externo e com SVG

Esta versão removeu a importação por CSV da interface.

O cadastro de produtos fica dentro do próprio site:

```txt
Digita ou escaneia o EAN
Sistema busca automático
Digita o nome
Sistema busca automático
Se não encontrar, abre pop-up de cadastro básico
```

O site também passou a usar ícones SVG profissionais no lugar de emojis visíveis.

Os SVGs são:

```txt
sem fundo
sem caixinha
com traço limpo
aplicados automaticamente em menus, cards, botões e conteúdos criados pelo JavaScript
```


---

## Ajustes finais: produto básico, loja e câmera

Cadastro de produto simplificado:

```txt
Código EAN
Nome do produto
Marca
Fabricante
```

A tela de cadastro não mostra mais campos longos como ingredientes, alergênicos, embalagem, porção, origem, categoria e outros.

Admin de lojas:

```txt
Voltou a opção Excluir loja no card da loja.
```

A exclusão/desativação remove a loja da seleção operacional dos funcionários, mas permite controle pelo admin.

Leitor de código:

```txt
Não mostra mais mensagem de resolução da câmera.
Mostra apenas status de leitura: abrindo câmera, tentando ler, EAN detectado/confirmado ou erro.
```


---

## Correção exclusão real de loja e SVG admin

Exclusão de loja:

```txt
Agora o botão Excluir loja tenta apagar a loja do banco.
Se o banco bloquear por causa de vínculos antigos, a loja é marcada como "excluida".
Lojas com status "excluida" não aparecem mais na dashboard admin nem na seleção de lojas.
```

SVG do admin:

```txt
O ícone de admin foi trocado por um SVG simples de escudo.
Foi removido o SVG bugado de engrenagem no avatar/menu do admin.
```


---

## Produtos, notificações, setores e pré-cadastro

Ajustes desta versão:

```txt
Produtos
- voltou o campo Sabor/variação
- voltou cadastro de foto do produto
- tenta puxar foto automaticamente pelo EAN
- tenta puxar foto/dados automaticamente pelo nome digitado
- produto cadastrado agora pode ser excluído na tela Cadastrar produto
```

```txt
Notificações
- voltou o botão para notificar a equipe nos itens vencidos/vencendo hoje
- a notificação aparece de forma discreta no canto da tela
- não polui a dashboard com blocos grandes
```

```txt
Setores da loja
- admin define os setores na criação da loja
- os setores aparecem automaticamente no lançamento
- os setores aparecem automaticamente no cadastro de funcionários
```

```txt
Pré-cadastro
- admin pode pré-cadastrar gerentes ao criar a loja
- admin pode pré-cadastrar encarregados ao criar a loja
- formato do encarregado: Nome | Setor | Código opcional
```

Importante para Supabase:

```txt
Rode novamente database/valisys-sql-unico.sql no SQL Editor.
```

Isso cria/atualiza:

```txt
setores_loja
produtos.ativo
políticas de acesso dos setores
```


---

## Setores por seleção

Os setores da loja agora são escolhidos por seleção/checklist na área admin.

Fluxo:

```txt
Admin cria ou edita loja
Seleciona os setores usados naquela loja
Se precisar de um setor diferente, marca "Outros"
Ao marcar "Outros", aparece o campo para adicionar novo setor
O setor adicionado entra na seleção
```

Observação:

```txt
"Outros" serve apenas para abrir o campo de novo setor.
Ele não é salvo como setor operacional.
```


---

## Site público reestilizado

Esta versão mudou o visual da página pública (`index.html`).

Entrou:

```txt
- nova hero section premium
- slider coverflow com telas uma atrás da outra
- imagens/telas mais juntas, igual referência de portfólio
- troca automática do slider
- nova seção de recursos
- nova seção de fluxo
- nova seção de gestão/admin
- nova chamada final
```

Arquivos principais alterados:

```txt
index.html
css/styles.css
js/public-coverflow.js
```

Para trocar os painéis por imagens reais depois:

```txt
No index.html, substitua o conteúdo de cada .coverflow-window por uma imagem:
<img src="img/sua-imagem.jpg" alt="Descrição">
```


---

## Dados públicos e SAC Online interno

Dados públicos atualizados:

```txt
E-mail: joaoferreiraneto0711@gmail.com
Instagram: @jferreira07.11
```

O WhatsApp foi removido do contato principal e substituído por SAC Online.

Fluxo do SAC:

```txt
Visitante abre o SAC Online
Aparece mensagem automática inicial
Visitante informa nome, contato e mensagem
A solicitação é salva no banco do ValiSys
Admin visualiza dentro da Dashboard Admin
```

Arquivos principais:

```txt
index.html
js/public-sac.js
js/dados-service.js
js/admin-dashboard.js
database/valisys-sql-unico.sql
```

Importante:

```txt
Esta versão não precisa de tabela nova para o SAC.
O SAC usa a tabela notificacoes que o sistema já possui.
```


---

## SAC sem SQL novo

Esta versão não cria tabela nova para o SAC.

O SAC Online salva as mensagens dentro da tabela já existente:

```txt
notificacoes
```

Usa:

```txt
tipo = sac_online
setor = SAC Online
lida = false/true
```

Assim o admin consegue ver as mensagens dentro da Dashboard Admin sem rodar SQL novo só para o SAC.


---

## SAC Online em formato de chat

O SAC agora funciona como chat online no próprio site, parecido com WhatsApp/ChatGPT.

Fluxo:

```txt
Visitante abre o balão SAC Online
Mensagem automática aparece no chat
Visitante informa nome, contato e mensagem
Admin vê a conversa na Dashboard Admin
Admin responde por dentro do painel
Visitante recebe a resposta ao abrir o chat
```

Sem tabela nova:

```txt
Usa a tabela notificacoes
tipo = sac_chat
setor = SAC Online
```

Observação:

```txt
Para funcionar entre visitantes e admin em aparelhos diferentes, o Supabase precisa estar configurado.
Não precisa criar tabela nova para o chat.
```


---

## Animações do site público

Esta versão adicionou animações na página pública.

Entrou:

```txt
- animações suaves de entrada ao rolar
- efeito de destaque no coverflow
- cards flutuando levemente
- seção "Ponto importante" com tela travada/sticky
```

A seção travada funciona assim:

```txt
Usuário rola a página
Chega no ponto importante
A tela segura o conteúdo por alguns instantes
O fluxo muda por etapas:
1. Identificar
2. Notificar
3. Retirar
4. Controlar
Depois a página continua normalmente
```

Arquivos principais:

```txt
index.html
css/styles.css
js/public-animations.js
```


---

## Correção do SAC chat

O chat do SAC foi ajustado para não ficar piscando/recarregando a conversa toda a cada atualização.

Mudanças:

```txt
- polling aumentado para 9 segundos
- evita requisição duplicada ao mesmo tempo
- só redesenha o chat quando chega mensagem nova
- preserva o scroll quando o usuário está lendo mensagens antigas
- botão flutuante agora usa SVG fixo
- card "SAC Online" do contato também recebeu SVG
```

Arquivos alterados:

```txt
index.html
css/styles.css
js/public-sac.js
```


---

## Assumir chat no SAC

No painel admin do SAC, agora existe a opção de assumir uma conversa.

Funciona assim:

```txt
Admin abre uma conversa
Informa o nome de quem vai atender
Confere ou altera o horário de atendimento
Clica em "Assumir chat"
O cliente recebe uma mensagem automática
```

Mensagem automática enviada:

```txt
Olá! Aqui é [nome]. Assumi seu atendimento no SAC Online do ValiSys.

Nosso horário de atendimento é: [horário].
```

Também foi corrigido o blur da tela ativa no coverflow do site público.
