-- ─────────────────────────────────────────────────────────────
-- Migración v3: Plan de premios mejorado + descripción de juegos
-- ─────────────────────────────────────────────────────────────
-- Cambios:
--   1. Agrega columna `descripcion` a la tabla juegos.
--   2. Documenta la estructura del JSONB `plan_premios` con los nuevos campos:
--      cantidad_ganadores, requiere_serie, comparar_serie, tipo, cifras, descripcion.
-- ─────────────────────────────────────────────────────────────

-- 1. Columna descripción para juegos
ALTER TABLE juegos
  ADD COLUMN IF NOT EXISTS descripcion TEXT DEFAULT '';

COMMENT ON COLUMN juegos.descripcion IS 'Descripción opcional del juego (máx 200 caracteres).';

-- 2. Documentar estructura del JSONB plan_premios
COMMENT ON COLUMN juegos.plan_premios IS
  'Array JSONB con el plan de premios del juego. Cada elemento tiene la forma:
   {
     "nombre": "Premio mayor",            -- nombre del premio
     "posicion": 1,                       -- orden de aparición (1, 2, 3...)
     "tipo": "mayor",                     -- mayor | seco | aproximacion | especial
     "cifras": 4,                         -- número de cifras a comparar
     "cantidad_ganadores": 2,             -- cuántos ganadores tiene este tier
     "premio": "16000000000",             -- monto del premio (string, puede incluir $)
     "descripcion": "",                   -- descripción opcional del premio
     "requiere_serie": false,             -- si el premio requiere serie exacta
     "comparar_serie": false              -- si se debe comparar la serie del boleto
   }
   Nota: cantidad_ganadores define cuántos campos de ganador se inicializan en el panel de resultados.';

-- Fin de la migración
