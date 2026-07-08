ValiSys - Versão GitHub Pages simples

Esta versão NÃO usa servidor Node e NÃO usa push real.
Ela foi ajustada para rodar em GitHub Pages.

O que tem:
- Login por nome e cargo
- Senha para encarregado, gerente e admin
- Promotor sem senha
- Cadastro de produtos
- Busca automática por API usando EAN
- Foto automática quando a API tiver imagem
- Leitura de EAN pela câmera
- Lançamento de vencimentos
- Lembretes na tela inicial
- Contagem de dias até o vencimento
- Cookies apenas para lembrar o aviso de cookies
- Tudo salvo no localStorage do aparelho

Senhas do MVP:
- Promotor: sem senha
- Encarregado: enc123
- Gerente: ger123
- Admin: admin123

Importante:
- localStorage salva apenas no celular/navegador usado.
- Se abrir em outro aparelho, os dados não aparecem.
- Para dados compartilhados entre celulares, depois precisa Supabase/Firebase.
- Câmera funciona melhor no GitHub Pages/HTTPS ou Live Server.


Atualização:
- API agora tenta puxar marca e sabor/variação pelo EAN.
- O sabor é inferido pelo nome/categoria/ingredientes do produto, pois nem todo cadastro público possui campo de sabor separado.
- O setor agora é uma seleção padronizada para manter o visual organizado.


Atualização leitura de código:
- Área de leitura maior para facilitar no celular.
- Linha visual no leitor para alinhar o código de barras.
- Status da leitura mostrando quando detectou e quando confirmou.
- Som curto quando o EAN é confirmado.
- Vibração dupla quando o EAN é confirmado.
- Continua validando EAN-13/EAN-8 e confirmando duas leituras para evitar erro.


Atualização fabricante:
- Produto agora tem Marca e Fabricante separados.
- Exemplo: Marca = Finna, Fabricante = M. Dias Branco.
- A API tenta puxar fabricante quando disponível.
- Quando a API não informa fabricante, o sistema usa um mapeamento de marcas conhecidas.
- O fabricante aparece no cadastro, listas, lembretes e lançamento salvo.
