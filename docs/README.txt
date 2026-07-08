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
Para várias lojas usando de verdade ao mesmo tempo, o próximo passo é dados online como sistema.


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
- base de produtos agora tenta puxar mais dados do base pública de produtos: embalagem, origem, países, lojas, ingredientes, alergênicos, porção, Nutri-Score, NOVA e Eco-Score quando disponíveis.


Correção final:
- Lista de lançamentos ficou mais tolerante a dados antigos e relogin.
- "Meus lançamentos" agora tenta reconhecer pelo id do usuário e também por nome/cargo.
- Filtro de loja na lista começa em "Todas as lojas deste aparelho" para o lançamento não parecer que sumiu.
- Site público foi refeito com visual mais profissional, menos emoji e melhor responsividade mobile.
- Demonstração pública agora parece tela de sistema e fluxo de operação, não card genérico.


Ajuste de home:
- Página inicial voltou para o estilo visual anterior, com mockup e apresentação mais chamativa.
- Removido excesso de emoji e textos com cara de IA.
- Demonstração ficou mais natural, parecida com uso real do sistema.
- Mantidas as correções de listas e filtros.


Atualização lojas, filtros, retirada e avisos:
- Filtro de loja refeito: agora mantém a loja atual selecionada e possui opção "Todas as lojas".
- Adicionado filtro de status: ativos, retirados ou todos.
- Itens retirados não entram mais no resumo principal de vencimentos.
- Cada lançamento ganhou botão "Marcar como retirado".
- Encarregado, gerente e admin podem reativar item retirado.
- Cargos acima podem criar aviso interno para gerência/encarregado/admin quando produto vence hoje ou já venceu.
- Criada página "Notificações" para ver avisos internos.
- Admin pode excluir lojas, mas apenas se a loja não tiver lançamentos vinculados.


Atualização funcionários:
- Criada página funcionarios.html.
- Gerente e admin podem cadastrar funcionários vinculados à loja atual.
- Funcionário tem nome, cargo, código de acesso e loja vinculada.
- Tela de login ganhou botão para preencher funcionário cadastrado neste aparelho.
- Quando entra como funcionário cadastrado, a loja dele já fica selecionada automaticamente.
- Importante: no GitHub Pages/localStorage, isso funciona apenas no mesmo aparelho/navegador.
- Lista completa ainda mostra somente dados salvos no aparelho atual. Para vários celulares compartilharem a mesma lista, precisa dados online como sistema/Firebase.


Correção funcionários:
- Removida a página separada funcionarios.html.
- Funcionários agora ficam dentro de usuarios.html, no mesmo padrão do sistema.
- Menu "Usuários" aparece para gerente e admin.
- Gerente/admin cadastram funcionários da loja atual dentro da tela Usuários.
- Admin também vê os usuários que já entraram no sistema.


Versão sistema-only:
- Removido salvamento local de lojas, funcionários, produtos, lançamentos e notificações.
- Esses dados agora são carregados/salvos pelo sistema.
- localStorage fica apenas para sessão: usuário logado e loja atual.
- Produto local foi desativado; cadastro e busca passam pelo sistema.
- Se o sistema não estiver configurado ou a política bloquear acesso, a tela mostra erro em vez de salvar localmente.
