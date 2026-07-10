-- =========================================================
-- ValiSys - Resetar aparelhos das notificações push
-- Use este SQL quando quiser limpar todos os celulares/navegadores
-- cadastrados para receber notificações externas.
-- =========================================================

-- Remove histórico de eventos de push para permitir novos testes
delete from public.push_eventos_enviados;

-- Remove todos os aparelhos inscritos nas notificações externas
delete from public.push_subscriptions;

-- Opcional: remover avisos internos antigos que foram criados pelas versões anteriores do push.
-- Não remove SAC Online.
delete from public.notificacoes
where tipo in (
  'produto_lancado',
  'perto_vencer',
  'vence_hoje',
  'produto_vencido'
);

-- Conferência
select
  (select count(*) from public.push_subscriptions) as aparelhos_cadastrados,
  (select count(*) from public.push_eventos_enviados) as eventos_push;
