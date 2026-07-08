# Ajustes desta versão

- Câmera abre em tela cheia ao escanear.
- Removida configuração de qrbox para evitar a barra/linha verde do leitor.
- Se o Supabase não encontrar o produto, tenta Open Food Facts.
- Se a API puxar o item mas não conseguir salvar em `produtos`, os campos ainda são preenchidos.
- Se a API falhar, o usuário ainda pode digitar manualmente e lançar.
- `criarLancamento` não depende mais de vincular `produto_id`; se a busca de produto falhar, salva o lançamento mesmo assim.
