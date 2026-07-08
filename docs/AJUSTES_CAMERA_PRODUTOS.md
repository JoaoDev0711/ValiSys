# Ajustes desta versão

- Câmera abre em tela cheia ao escanear.
- Removida configuração de qrbox para evitar a barra/linha verde do leitor.
- Se o sistema não encontrar o produto, tenta base pública de produtos.
- Se a base de produtos puxar o item mas não conseguir salvar em `produtos`, os campos ainda são preenchidos.
- Se a base de produtos falhar, o usuário ainda pode digitar manualmente e lançar.
- `criarLancamento` não depende mais de vincular `produto_id`; se a busca de produto falhar, salva o lançamento mesmo assim.
