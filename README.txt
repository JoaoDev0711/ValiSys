ValiSys - Site público + sistema por loja

Esta versão tem duas partes:

1. Site público:
- index.html
- apresentação do sistema
- funcionalidades
- planos em construção
- contatos
- botão para entrar no sistema

2. Área do sistema:
- login.html
- escolher-loja.html
- dashboard.html
- lancar.html
- meus-lancamentos.html
- lista-geral.html
- cadastrar-produto.html
- usuarios.html

Fluxo:
1. Usuário entra pelo site público.
2. Clica em Entrar.
3. Faz login.
4. Escolhe/confirma a loja.
5. Só depois acessa o dashboard e lança vencimentos.

Regras:
- Promotor lança e vê somente os próprios lançamentos da loja selecionada.
- Encarregado vê lançamentos da equipe da loja selecionada.
- Gerente e admin podem cadastrar produtos.
- Gerente e admin podem cadastrar lojas neste protótipo.
- Admin acessa usuários.

Senhas:
- Promotor: sem senha
- Encarregado: enc123
- Gerente: ger123
- Admin: admin123

Contatos no site:
- E-mail já está como idarkolekdasdorgas@gmail.com.
- Instagram está como instagram.com/idarkolekdasdorgas.
- WhatsApp está com número fictício 5585999999999. Troque pelo número real no index.html.

Observação:
Esta versão ainda usa localStorage, ideal para demonstração e GitHub Pages.
Para várias lojas usando de verdade ao mesmo tempo, o próximo passo é banco online como Supabase.


Atualização site público:
- Página pública agora tem apresentação comercial completa.
- Inclui hero com mockup do app.
- Inclui demonstração visual de escolha da loja, leitura de EAN, produto automático e lembretes.
- Inclui passo a passo de funcionamento.
- Inclui seção de permissões por cargo.
- Planos continuam em construção.


Correções e melhorias:
- Corrigido erro que impedia lançamentos de aparecerem em "Meus lançamentos" e "Lista geral".
- Lançamentos antigos sem lojaId também aparecem na loja atual para não sumirem do protótipo.
- Lembretes agora são agrupados por vencidos, hoje, até 7 dias e até 30 dias.
- Dentro de cada grupo, os itens são agrupados por quantidade de dias restantes.
- API agora tenta puxar mais dados do Open Food Facts: embalagem, origem, países, lojas, ingredientes, alergênicos, porção, Nutri-Score, NOVA e Eco-Score quando disponíveis.
