-- ─────────────────────────────────────────────────────────────
-- MIGRACIÓN: Añadir columna canal_en_vivo a la tabla juegos
-- ─────────────────────────────────────────────────────────────
-- Esta columna guarda dónde se puede ver el sorteo en vivo
-- (usualmente un canal regional de TV, ej: "Telecaribe", "Teleantioquia")
--
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ─────────────────────────────────────────────────────────────

-- 1. Añadir la nueva columna (text, nullable)
ALTER TABLE juegos
  ADD COLUMN IF NOT EXISTS canal_en_vivo text;

-- 2. Comentario descriptivo
COMMENT ON COLUMN juegos.canal_en_vivo IS 'Canal o medio donde se transmite el sorteo en vivo (ej: Telecaribe, Teleantioquia, Canal Capital)';

-- 3. Verificación
SELECT id, nombre, dia_sorteo, horario, canal_en_vivo
FROM juegos
ORDER BY orden ASC;
