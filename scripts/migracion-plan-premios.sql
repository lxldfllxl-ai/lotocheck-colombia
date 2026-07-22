-- Migration: Agregar columna plan_premios a la tabla juegos
-- Ejecutar en el SQL Editor de Supabase Dashboard

-- Agregar columna plan_premios como JSONB (almacena el plan de premios del juego)
ALTER TABLE juegos ADD COLUMN IF NOT EXISTS plan_premios JSONB DEFAULT NULL;

-- Comentario descriptivo
COMMENT ON COLUMN juegos.plan_premios IS 'Plan de premios del juego: array de {nombre, posicion, cifras, premio, descripcion}';

-- Ejemplo de estructura esperada:
-- [
--   { "nombre": "Premio Mayor", "posicion": 1, "cifras": 4, "premio": "$15.000.000.000", "descripcion": "4 cifras + serie" },
--   { "nombre": "Seco 3 cifras", "posicion": 2, "cifras": 3, "premio": "$75.000", "descripcion": "Ultimas 3 cifras" },
--   { "nombre": "Seco 2 cifras", "posicion": 3, "cifras": 2, "premio": "$25.000", "descripcion": "Ultimas 2 cifras" },
--   { "nombre": "Seco 1 cifra", "posicion": 4, "cifras": 1, "premio": "$3.000", "descripcion": "Ultima cifra" }
-- ]
