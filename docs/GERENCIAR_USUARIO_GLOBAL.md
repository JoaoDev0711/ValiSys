# Gerenciar usuário com atualização global

Na página `usuarios.html`, cada funcionário agora tem o botão **Gerenciar usuário**.

Permite alterar:

- Nome
- Cargo
- Setor
- Código de acesso do encarregado
- Marca da promotoria
- Status ativo/inativo

Ao salvar, o sistema atualiza:

- o cadastro do funcionário na tabela `funcionarios`;
- os lançamentos antigos da mesma loja em `lancamentos.usuario_nome` e `lancamentos.usuario_cargo`;
- o campo `retirado_por` quando bater com o nome antigo;
- o usuário logado no navegador, quando o gerente estiver editando o próprio usuário.

Assim a mudança aparece no dashboard, lista completa, meus lançamentos e telas onde aparece “lançado por”.
