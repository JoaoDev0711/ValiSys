ValiSys - MVP localStorage

Como testar:
1. Abra a pasta no VS Code.
2. Instale/use a extensão Live Server.
3. Clique com o botão direito no login.html e escolha "Open with Live Server".
4. Faça login com nome e cargo.
5. Para testar tudo:
   - Entre como Gerente ou Admin
   - Vá em Cadastrar Produto
   - Leia o EAN pela câmera ou digite
   - Tire/envie a foto do produto
   - Salve
   - Vá em Lançar validade
   - Leia o EAN pela câmera
   - O sistema puxa nome e foto do produto cadastrado
   - Informe setor, quantidade e validade

Permissões:
- Promotor: lança vencimentos e vê somente os próprios lançamentos.
- Encarregado: lança vencimentos e vê lista geral.
- Gerente: lança, vê lista geral e cadastra produtos.
- Admin: tudo, incluindo usuários.

Observação:
- localStorage salva somente no navegador/celular atual.
- A câmera pode não funcionar abrindo o arquivo direto por file://.
- Use Live Server ou GitHub Pages/HTTPS.
