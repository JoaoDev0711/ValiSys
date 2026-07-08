# Fontes de dados de produtos

Esta versão tenta buscar produto em várias fontes:

1. Tabela `produtos` no sistema
2. base pública de produtos mundial
3. base pública de produtos Brasil
4. Brasilbase de produtos GTIN, quando o endpoint estiver disponível
5. OSCBR base de produtos GTIN, opcional com token em `window.VALISYS_GTIN_TOKEN`

Campos melhorados:
- nome
- marca
- fabricante
- sabor/variação
- categoria
- quantidade padrão
- foto
- fonte

Observação:
Nem toda base pública retorna fabricante e sabor. Por isso o sistema também tenta inferir essas informações pelo nome, marca e categoria.
