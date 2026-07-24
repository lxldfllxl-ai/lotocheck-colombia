-- ============================================================
-- Actualizar logo_url en tabla juegos
-- Ejecutar en Supabase SQL Editor
-- Los logos están en /public/juegos/ (38 logos a 200x200 PNG)
-- ============================================================

-- LOTERÍAS (14)
UPDATE juegos SET logo_url = '/juegos/loteria-bogota.png'       WHERE nombre = 'Lotería de Bogotá';
UPDATE juegos SET logo_url = '/juegos/loteria-boyaca.png'        WHERE nombre = 'Lotería de Boyacá';
UPDATE juegos SET logo_url = '/juegos/loteria-cauca.png'        WHERE nombre = 'Lotería del Cauca';
UPDATE juegos SET logo_url = '/juegos/loteria-cruz-roja.png'    WHERE nombre = 'Lotería Cruz Roja';
UPDATE juegos SET logo_url = '/juegos/loteria-cundinamarca.png' WHERE nombre = 'Lotería de Cundinamarca';
UPDATE juegos SET logo_url = '/juegos/loteria-huila.png'       WHERE nombre = 'Lotería del Huila';
UPDATE juegos SET logo_url = '/juegos/loteria-manizales.png'    WHERE nombre = 'Lotería de Manizales';
UPDATE juegos SET logo_url = '/juegos/loteria-medellin.png'     WHERE nombre = 'Lotería de Medellín';
UPDATE juegos SET logo_url = '/juegos/loteria-meta.png'         WHERE nombre = 'Lotería del Meta';
UPDATE juegos SET logo_url = '/juegos/loteria-quindio.png'      WHERE nombre = 'Lotería del Quindío';
UPDATE juegos SET logo_url = '/juegos/loteria-risaralda.png'    WHERE nombre = 'Lotería de Risaralda';
UPDATE juegos SET logo_url = '/juegos/loteria-santander.png'    WHERE nombre = 'Lotería de Santander';
UPDATE juegos SET logo_url = '/juegos/loteria-tolima.png'       WHERE nombre = 'Lotería del Tolima';
UPDATE juegos SET logo_url = '/juegos/loteria-valle.png'        WHERE nombre = 'Lotería del Valle';

-- CHANCES (21)
UPDATE juegos SET logo_url = '/juegos/dorado-manana.png'     WHERE nombre = 'Dorado Mañana';
UPDATE juegos SET logo_url = '/juegos/dorado-noche.png'      WHERE nombre = 'Dorado Noche';
UPDATE juegos SET logo_url = '/juegos/dorado-tarde.png'      WHERE nombre = 'Dorado Tarde';
UPDATE juegos SET logo_url = '/juegos/chontico-dia.png'      WHERE nombre = 'Chontico Día';
UPDATE juegos SET logo_url = '/juegos/chontico-noche.png'    WHERE nombre = 'Chontico Noche';
UPDATE juegos SET logo_url = '/juegos/sinuano-dia.png'       WHERE nombre = 'Sinuano Día';
UPDATE juegos SET logo_url = '/juegos/sinuano-noche.png'     WHERE nombre = 'Sinuano Noche';
UPDATE juegos SET logo_url = '/juegos/caribena-dia.png'      WHERE nombre = 'Caribeña Día';
UPDATE juegos SET logo_url = '/juegos/caribena-noche.png'    WHERE nombre = 'Caribeña Noche';
UPDATE juegos SET logo_url = '/juegos/astro-luna.png'        WHERE nombre = 'Astro Luna';
UPDATE juegos SET logo_url = '/juegos/astro-sol.png'         WHERE nombre = 'Astro Sol';
UPDATE juegos SET logo_url = '/juegos/cafeterito-tarde.png'  WHERE nombre = 'Cafeterito Tarde';
UPDATE juegos SET logo_url = '/juegos/cafeterito-noche.png'  WHERE nombre = 'Cafeterito Noche';
UPDATE juegos SET logo_url = '/juegos/fantastica-dia.png'    WHERE nombre = 'Fantástica Día';
UPDATE juegos SET logo_url = '/juegos/fantastica-noche.png'  WHERE nombre = 'Fantástica Noche';
UPDATE juegos SET logo_url = '/juegos/paisita-dia.png'       WHERE nombre = 'Paisita Día';
UPDATE juegos SET logo_url = '/juegos/paisita-noche.png'     WHERE nombre = 'Paisita Noche';
UPDATE juegos SET logo_url = '/juegos/pijao-oro.png'         WHERE nombre = 'Pijao de Oro';
UPDATE juegos SET logo_url = '/juegos/saman.png'             WHERE nombre = 'Samán';
UPDATE juegos SET logo_url = '/juegos/pick4-dia.png'        WHERE nombre = 'Pick 4 Día';
UPDATE juegos SET logo_url = '/juegos/pick4-noche.png'       WHERE nombre = 'Pick 4 Noche';

-- BALOTO / COLORLOTO (3)
UPDATE juegos SET logo_url = '/juegos/baloto.png'            WHERE nombre = 'Baloto';
UPDATE juegos SET logo_url = '/juegos/baloto-revancha.png'   WHERE nombre = 'Baloto Revancha';
UPDATE juegos SET logo_url = '/juegos/colorloto.png'         WHERE nombre = 'Colorloto';

-- ============================================================
-- JUEGOS SIN LOGO (10) — logo_url queda NULL
-- El CDN bloqueó el archivo 62.gif (Culona) o no se encontró:
--   - Culona Día, Culona Noche        (CDN 403 AccessDenied)
--   - Antioqueñita 1, Antioqueñita 2   (no existe en el CDN)
--   - Motilón Noche, Motilón Tarde     (no existe en el CDN)
--   - Paisita Lotto                    (no existe en el CDN)
--   - Pick 3 Día, Pick 3 Noche          (no existe en el CDN)
--   - Súper Chontico Millonario        (no existe en el CDN)
--   - La Quinta                        (no existe en el CDN)
-- ============================================================
