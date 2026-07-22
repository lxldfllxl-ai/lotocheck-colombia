-- ============================================================================
-- MIGRACIÓN: Nuevo sistema de premios y resultados para NotiLoto
-- Ejecutar en el SQL Editor de Supabase Dashboard
-- ============================================================================

-- 1. NUEVA TABLA: premios_resultado
-- Almacena los ganadores individuales de cada sorteo, vinculados al plan de premios
CREATE TABLE IF NOT EXISTS premios_resultado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resultado_id UUID NOT NULL REFERENCES resultados(id) ON DELETE CASCADE,
  tier_nombre TEXT NOT NULL,              -- ej: "Premio Mayor", "Seco 100M", "Aproximación"
  tier_posicion INTEGER NOT NULL DEFAULT 1, -- posición en el plan_premios
  numero_ganador TEXT NOT NULL,           -- número ganador (completo o sufijo)
  serie_ganador TEXT DEFAULT '',          -- serie si aplica
  premio TEXT NOT NULL DEFAULT '',        -- monto del premio (ej: "$15.000.000.000")
  tipo_premio TEXT NOT NULL DEFAULT 'seco', -- 'mayor', 'seco', 'aproximacion', 'especial'
  cifras INTEGER DEFAULT 0,              -- cuántas cifras se comparan (para secos)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE premios_resultado IS 'Ganadores individuales por sorteo, vinculados al plan de premios del juego';
COMMENT ON COLUMN premios_resultado.tipo_premio IS 'mayor=premio mayor, seco=seco, aproximacion=aproximación al mayor, especial=otros';

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_premios_resultado_resultado_id ON premios_resultado(resultado_id);
CREATE INDEX IF NOT EXISTS idx_premios_resultado_numero ON premios_resultado(numero_ganador);
CREATE INDEX IF NOT EXISTS idx_premios_resultado_tipo ON premios_resultado(tipo_premio);

-- 1b. HABILITAR Row Level Security en premios_resultado
-- Lectura pública (el endpoint /api/resultados usa la anon key para servir resultados)
-- Escritura solo desde el backend con service_role (bypassa RLS automáticamente)
ALTER TABLE premios_resultado ENABLE ROW LEVEL SECURITY;

-- Política de lectura pública: cualquier cliente puede consultar los premios
DROP POLICY IF EXISTS "premios_resultado_lectura_publica" ON premios_resultado;
CREATE POLICY "premios_resultado_lectura_publica"
  ON premios_resultado FOR SELECT
  USING (true);

-- NOTA: No se crea política de INSERT/UPDATE/DELETE para clientes.
-- El backend (admin/resultados/route.js) usa la service_role key,
-- que ignora RLS y puede escribir sin restricciones.

-- 2. AGREGAR COLUMNAS A resultados
-- premio_mayor: info del premio mayor (número + serie)
-- premios_json: snapshot completo de los premios en formato JSONB (respaldo/consulta rápida)
ALTER TABLE resultados ADD COLUMN IF NOT EXISTS premio_mayor JSONB DEFAULT NULL;
ALTER TABLE resultados ADD COLUMN IF NOT EXISTS premios_json JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN resultados.premio_mayor IS 'Info del premio mayor: {numero, serie, premio}';
COMMENT ON COLUMN resultados.premios_json IS 'Snapshot completo de premios del sorteo: [{tipo, nombre, ganadores: [{numero, serie, premio}]}]';

-- 3. AGREGAR COLUMNAS A sorteos_historico (misma estructura)
ALTER TABLE sorteos_historico ADD COLUMN IF NOT EXISTS premio_mayor JSONB DEFAULT NULL;
ALTER TABLE sorteos_historico ADD COLUMN IF NOT EXISTS premios_json JSONB DEFAULT '[]'::jsonb;

-- 4. ACTUALIZAR plan_premios en juegos: nueva estructura recomendada
-- La columna ya existe como JSONB. Ahora se recomienda esta estructura:
COMMENT ON COLUMN juegos.plan_premios IS 'Plan de premios: [{nombre, posicion, tipo:"mayor"|"seco"|"aproximacion"|"especial", cifras, cantidad_ganadores, premio, descripcion, requiere_serie:bool, comparar_serie:bool}]';

-- 5. AGREGAR COLUMNAS A boletos para mejor tracking
ALTER TABLE boletos ADD COLUMN IF NOT EXISTS premio_ganado TEXT DEFAULT NULL;
ALTER TABLE boletos ADD COLUMN IF NOT EXISTS tipo_premio TEXT DEFAULT NULL;
ALTER TABLE boletos ADD COLUMN IF NOT EXISTS cifras_acertadas INTEGER DEFAULT NULL;

COMMENT ON COLUMN boletos.premio_ganado IS 'Monto del premio ganado (ej: "$100.000.000")';
COMMENT ON COLUMN boletos.tipo_premio IS 'Tipo de premio: mayor, seco, aproximacion, especial';
COMMENT ON COLUMN boletos.cifras_acertadas IS 'Cantidad de cifras acertadas (para secos)';

-- ============================================================================
-- 6. PLANES DE PREMIOS REALES PARA CADA JUEGO
-- ============================================================================

-- LOTERÍA DE BOGOTÁ (jueves)
-- Premio Mayor: $15.000.000.000 (4 cifras + serie)
-- 5 secos de $100.000.000
-- 10 secos de $50.000.000
-- 20 secos de $20.000.000
-- Aproximaciones al mayor: 3 antes y 3 después (mismo número, diferente serie) = $50.000.000 c/u
-- Aproximaciones al mayor: 3 antes y 3 después (diferente serie) = $30.000.000 c/u
UPDATE juegos SET plan_premios = '[
  {"nombre":"Premio Mayor","posicion":1,"tipo":"mayor","cifras":4,"cantidad_ganadores":1,"premio":"$15.000.000.000","descripcion":"4 cifras + serie exacta","requiere_serie":true,"comparar_serie":true},
  {"nombre":"Aproximación misma serie","posicion":2,"tipo":"aproximacion","cifras":4,"cantidad_ganadores":6,"premio":"$50.000.000","descripcion":"3 números antes y 3 después del mayor, misma serie","requiere_serie":true,"comparar_serie":true},
  {"nombre":"Aproximación diferente serie","posicion":3,"tipo":"aproximacion","cifras":4,"cantidad_ganadores":6,"premio":"$30.000.000","descripcion":"3 números antes y 3 después del mayor, cualquier serie","requiere_serie":false,"comparar_serie":false},
  {"nombre":"Seco 100 millones","posicion":4,"tipo":"seco","cifras":4,"cantidad_ganadores":5,"premio":"$100.000.000","descripcion":"4 cifras exactas, cualquier serie","requiere_serie":false,"comparar_serie":false},
  {"nombre":"Seco 50 millones","posicion":5,"tipo":"seco","cifras":4,"cantidad_ganadores":10,"premio":"$50.000.000","descripcion":"4 cifras exactas, cualquier serie","requiere_serie":false,"comparar_serie":false},
  {"nombre":"Seco 20 millones","posicion":6,"tipo":"seco","cifras":4,"cantidad_ganadores":20,"premio":"$20.000.000","descripcion":"4 cifras exactas, cualquier serie","requiere_serie":false,"comparar_serie":false}
]'::jsonb WHERE nombre = 'Loteria de Bogota';

-- LOTERÍA DE MEDELLÍN (viernes)
-- Premio Mayor: $12.000.000.000
UPDATE juegos SET plan_premios = '[
  {"nombre":"Premio Mayor","posicion":1,"tipo":"mayor","cifras":4,"cantidad_ganadores":1,"premio":"$12.000.000.000","descripcion":"4 cifras + serie exacta","requiere_serie":true,"comparar_serie":true},
  {"nombre":"Aproximación misma serie","posicion":2,"tipo":"aproximacion","cifras":4,"cantidad_ganadores":6,"premio":"$40.000.000","descripcion":"3 antes y 3 después, misma serie","requiere_serie":true,"comparar_serie":true},
  {"nombre":"Aproximación diferente serie","posicion":3,"tipo":"aproximacion","cifras":4,"cantidad_ganadores":6,"premio":"$20.000.000","descripcion":"3 antes y 3 después, cualquier serie","requiere_serie":false,"comparar_serie":false},
  {"nombre":"Seco 80 millones","posicion":4,"tipo":"seco","cifras":4,"cantidad_ganadores":5,"premio":"$80.000.000","descripcion":"4 cifras exactas, cualquier serie","requiere_serie":false,"comparar_serie":false},
  {"nombre":"Seco 40 millones","posicion":5,"tipo":"seco","cifras":4,"cantidad_ganadores":10,"premio":"$40.000.000","descripcion":"4 cifras exactas, cualquier serie","requiere_serie":false,"comparar_serie":false},
  {"nombre":"Seco 15 millones","posicion":6,"tipo":"seco","cifras":4,"cantidad_ganadores":15,"premio":"$15.000.000","descripcion":"4 cifras exactas, cualquier serie","requiere_serie":false,"comparar_serie":false}
]'::jsonb WHERE nombre = 'Loteria de Medellin';

-- LOTERIA DEL TOLIMA (lunes)
UPDATE juegos SET plan_premios = '[
  {"nombre":"Premio Mayor","posicion":1,"tipo":"mayor","cifras":4,"cantidad_ganadores":1,"premio":"$9.000.000.000","descripcion":"4 cifras + serie exacta","requiere_serie":true,"comparar_serie":true},
  {"nombre":"Aproximación misma serie","posicion":2,"tipo":"aproximacion","cifras":4,"cantidad_ganadores":6,"premio":"$30.000.000","descripcion":"3 antes y 3 después, misma serie","requiere_serie":true,"comparar_serie":true},
  {"nombre":"Aproximación diferente serie","posicion":3,"tipo":"aproximacion","cifras":4,"cantidad_ganadores":6,"premio":"$15.000.000","descripcion":"3 antes y 3 después, cualquier serie","requiere_serie":false,"comparar_serie":false},
  {"nombre":"Seco 60 millones","posicion":4,"tipo":"seco","cifras":4,"cantidad_ganadores":5,"premio":"$60.000.000","descripcion":"4 cifras exactas, cualquier serie","requiere_serie":false,"comparar_serie":false},
  {"nombre":"Seco 30 millones","posicion":5,"tipo":"seco","cifras":4,"cantidad_ganadores":8,"premio":"$30.000.000","descripcion":"4 cifras exactas, cualquier serie","requiere_serie":false,"comparar_serie":false},
  {"nombre":"Seco 10 millones","posicion":6,"tipo":"seco","cifras":4,"cantidad_ganadores":12,"premio":"$10.000.000","descripcion":"4 cifras exactas, cualquier serie","requiere_serie":false,"comparar_serie":false}
]'::jsonb WHERE nombre = 'Loteria del Tolima';

-- LOTERIA DEL HUILA (sábado)
UPDATE juegos SET plan_premios = '[
  {"nombre":"Premio Mayor","posicion":1,"tipo":"mayor","cifras":4,"cantidad_ganadores":1,"premio":"$6.000.000.000","descripcion":"4 cifras + serie exacta","requiere_serie":true,"comparar_serie":true},
  {"nombre":"Aproximación misma serie","posicion":2,"tipo":"aproximacion","cifras":4,"cantidad_ganadores":6,"premio":"$20.000.000","descripcion":"3 antes y 3 después, misma serie","requiere_serie":true,"comparar_serie":true},
  {"nombre":"Aproximación diferente serie","posicion":3,"tipo":"aproximacion","cifras":4,"cantidad_ganadores":6,"premio":"$10.000.000","descripcion":"3 antes y 3 después, cualquier serie","requiere_serie":false,"comparar_serie":false},
  {"nombre":"Seco 40 millones","posicion":4,"tipo":"seco","cifras":4,"cantidad_ganadores":5,"premio":"$40.000.000","descripcion":"4 cifras exactas, cualquier serie","requiere_serie":false,"comparar_serie":false},
  {"nombre":"Seco 20 millones","posicion":5,"tipo":"seco","cifras":4,"cantidad_ganadores":8,"premio":"$20.000.000","descripcion":"4 cifras exactas, cualquier serie","requiere_serie":false,"comparar_serie":false},
  {"nombre":"Seco 8 millones","posicion":6,"tipo":"seco","cifras":4,"cantidad_ganadores":10,"premio":"$8.000.000","descripcion":"4 cifras exactas, cualquier serie","requiere_serie":false,"comparar_serie":false}
]'::jsonb WHERE nombre = 'Loteria del Huila';

-- LOTERIA DEL QUINDIO (sábado)
UPDATE juegos SET plan_premios = '[
  {"nombre":"Premio Mayor","posicion":1,"tipo":"mayor","cifras":4,"cantidad_ganadores":1,"premio":"$5.000.000.000","descripcion":"4 cifras + serie exacta","requiere_serie":true,"comparar_serie":true},
  {"nombre":"Aproximación misma serie","posicion":2,"tipo":"aproximacion","cifras":4,"cantidad_ganadores":6,"premio":"$15.000.000","descripcion":"3 antes y 3 después, misma serie","requiere_serie":true,"comparar_serie":true},
  {"nombre":"Aproximación diferente serie","posicion":3,"tipo":"aproximacion","cifras":4,"cantidad_ganadores":6,"premio":"$8.000.000","descripcion":"3 antes y 3 después, cualquier serie","requiere_serie":false,"comparar_serie":false},
  {"nombre":"Seco 30 millones","posicion":4,"tipo":"seco","cifras":4,"cantidad_ganadores":5,"premio":"$30.000.000","descripcion":"4 cifras exactas, cualquier serie","requiere_serie":false,"comparar_serie":false},
  {"nombre":"Seco 15 millones","posicion":5,"tipo":"seco","cifras":4,"cantidad_ganadores":8,"premio":"$15.000.000","descripcion":"4 cifras exactas, cualquier serie","requiere_serie":false,"comparar_serie":false},
  {"nombre":"Seco 5 millones","posicion":6,"tipo":"seco","cifras":4,"cantidad_ganadores":10,"premio":"$5.000.000","descripcion":"4 cifras exactas, cualquier serie","requiere_serie":false,"comparar_serie":false}
]'::jsonb WHERE nombre = 'Loteria del Quindio';

-- LOTERIA DE CALDAS (miércoles)
UPDATE juegos SET plan_premios = '[
  {"nombre":"Premio Mayor","posicion":1,"tipo":"mayor","cifras":4,"cantidad_ganadores":1,"premio":"$4.000.000.000","descripcion":"4 cifras + serie exacta","requiere_serie":true,"comparar_serie":true},
  {"nombre":"Aproximación misma serie","posicion":2,"tipo":"aproximacion","cifras":4,"cantidad_ganadores":6,"premio":"$12.000.000","descripcion":"3 antes y 3 después, misma serie","requiere_serie":true,"comparar_serie":true},
  {"nombre":"Aproximación diferente serie","posicion":3,"tipo":"aproximacion","cifras":4,"cantidad_ganadores":6,"premio":"$6.000.000","descripcion":"3 antes y 3 después, cualquier serie","requiere_serie":false,"comparar_serie":false},
  {"nombre":"Seco 25 millones","posicion":4,"tipo":"seco","cifras":4,"cantidad_ganadores":5,"premio":"$25.000.000","descripcion":"4 cifras exactas, cualquier serie","requiere_serie":false,"comparar_serie":false},
  {"nombre":"Seco 12 millones","posicion":5,"tipo":"seco","cifras":4,"cantidad_ganadores":8,"premio":"$12.000.000","descripcion":"4 cifras exactas, cualquier serie","requiere_serie":false,"comparar_serie":false},
  {"nombre":"Seco 4 millones","posicion":6,"tipo":"seco","cifras":4,"cantidad_ganadores":10,"premio":"$4.000.000","descripcion":"4 cifras exactas, cualquier serie","requiere_serie":false,"comparar_serie":false}
]'::jsonb WHERE nombre = 'Loteria de Caldas';

-- LOTERIA DE MANIZALES (miércoles)
UPDATE juegos SET plan_premios = '[
  {"nombre":"Premio Mayor","posicion":1,"tipo":"mayor","cifras":4,"cantidad_ganadores":1,"premio":"$4.000.000.000","descripcion":"4 cifras + serie exacta","requiere_serie":true,"comparar_serie":true},
  {"nombre":"Aproximación misma serie","posicion":2,"tipo":"aproximacion","cifras":4,"cantidad_ganadores":6,"premio":"$12.000.000","descripcion":"3 antes y 3 después, misma serie","requiere_serie":true,"comparar_serie":true},
  {"nombre":"Aproximación diferente serie","posicion":3,"tipo":"aproximacion","cifras":4,"cantidad_ganadores":6,"premio":"$6.000.000","descripcion":"3 antes y 3 después, cualquier serie","requiere_serie":false,"comparar_serie":false},
  {"nombre":"Seco 25 millones","posicion":4,"tipo":"seco","cifras":4,"cantidad_ganadores":5,"premio":"$25.000.000","descripcion":"4 cifras exactas, cualquier serie","requiere_serie":false,"comparar_serie":false},
  {"nombre":"Seco 12 millones","posicion":5,"tipo":"seco","cifras":4,"cantidad_ganadores":8,"premio":"$12.000.000","descripcion":"4 cifras exactas, cualquier serie","requiere_serie":false,"comparar_serie":false},
  {"nombre":"Seco 4 millones","posicion":6,"tipo":"seco","cifras":4,"cantidad_ganadores":10,"premio":"$4.000.000","descripcion":"4 cifras exactas, cualquier serie","requiere_serie":false,"comparar_serie":false}
]'::jsonb WHERE nombre = 'Loteria de Manizales';

-- LOTERIA DEL META (viernes)
UPDATE juegos SET plan_premios = '[
  {"nombre":"Premio Mayor","posicion":1,"tipo":"mayor","cifras":4,"cantidad_ganadores":1,"premio":"$3.000.000.000","descripcion":"4 cifras + serie exacta","requiere_serie":true,"comparar_serie":true},
  {"nombre":"Aproximación misma serie","posicion":2,"tipo":"aproximacion","cifras":4,"cantidad_ganadores":6,"premio":"$10.000.000","descripcion":"3 antes y 3 después, misma serie","requiere_serie":true,"comparar_serie":true},
  {"nombre":"Aproximación diferente serie","posicion":3,"tipo":"aproximacion","cifras":4,"cantidad_ganadores":6,"premio":"$5.000.000","descripcion":"3 antes y 3 después, cualquier serie","requiere_serie":false,"comparar_serie":false},
  {"nombre":"Seco 20 millones","posicion":4,"tipo":"seco","cifras":4,"cantidad_ganadores":5,"premio":"$20.000.000","descripcion":"4 cifras exactas, cualquier serie","requiere_serie":false,"comparar_serie":false},
  {"nombre":"Seco 10 millones","posicion":5,"tipo":"seco","cifras":4,"cantidad_ganadores":8,"premio":"$10.000.000","descripcion":"4 cifras exactas, cualquier serie","requiere_serie":false,"comparar_serie":false},
  {"nombre":"Seco 3 millones","posicion":6,"tipo":"seco","cifras":4,"cantidad_ganadores":10,"premio":"$3.000.000","descripcion":"4 cifras exactas, cualquier serie","requiere_serie":false,"comparar_serie":false}
]'::jsonb WHERE nombre = 'Loteria del Meta';

-- ============================================================================
-- 7. FUNCIÓN AUXILIAR: generar aproximaciones a un número
-- ============================================================================
CREATE OR REPLACE FUNCTION generar_aproximaciones(numero TEXT, cantidad INTEGER)
RETURNS TEXT[] AS $$
DECLARE
  num_int INTEGER;
  resultado TEXT[];
  i INTEGER;
  digitos INTEGER;
BEGIN
  digitos := length(numero);
  num_int := numero::INTEGER;
  FOR i IN 1..cantidad LOOP
    resultado := array_append(resultado, LPAD((num_int - i)::TEXT, digitos, '0'));
    resultado := array_append(resultado, LPAD((num_int + i)::TEXT, digitos, '0'));
  END LOOP;
  RETURN resultado;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- NOTA: Los UPDATEs de plan_premios arriba usan nombres exactos de juegos.
-- Si los nombres en tu BD son diferentes, ajusta la cláusula WHERE.
-- Puedes ver los nombres actuales con: SELECT id, nombre FROM juegos;
-- ============================================================================