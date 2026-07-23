-- ─────────────────────────────────────────────────────────────
-- ACTUALIZACIÓN: Horarios, días y canales en vivo de los juegos
-- ─────────────────────────────────────────────────────────────
-- Datos investigados de loteriasdecolombia.co y chancehoy.com
-- Ejecutar DESPUÉS de migracion-canal-en-vivo.sql
--
-- NOTA: Ajusta los nombres exactos según tu tabla juegos.
--       Verifica con: SELECT id, nombre FROM juegos ORDER BY orden;
-- ─────────────────────────────────────────────────────────────

-- ═══════════════════════════════════════════
-- LOTERÍAS TRADICIONALES (4 cifras + serie, fracciones)
-- ═══════════════════════════════════════════

UPDATE juegos SET dia_sorteo = 'Lunes',     horario = '10:30 PM', canal_en_vivo = 'Canal Capital'           WHERE nombre ILIKE '%Cundinamarca%';
UPDATE juegos SET dia_sorteo = 'Lunes',     horario = '11:00 PM', canal_en_vivo = 'Canal Uno'               WHERE nombre ILIKE '%Tolima%';
UPDATE juegos SET dia_sorteo = 'Martes',    horario = '10:30 PM', canal_en_vivo = 'Canal Capital'           WHERE nombre ILIKE '%Cruz Roja%';
UPDATE juegos SET dia_sorteo = 'Martes',    horario = '10:30 PM', canal_en_vivo = 'Canal 12 Huila'          WHERE nombre ILIKE '%Huila%';
UPDATE juegos SET dia_sorteo = 'Miercoles', horario = '10:30 PM', canal_en_vivo = 'Teleantioquia'          WHERE nombre ILIKE '%Manizales%';
UPDATE juegos SET dia_sorteo = 'Miercoles', horario = '10:30 PM', canal_en_vivo = 'Canal TRO Meta'         WHERE nombre ILIKE '%Meta%';
UPDATE juegos SET dia_sorteo = 'Miercoles', horario = '10:30 PM', canal_en_vivo = 'Telepacifico'           WHERE nombre ILIKE '%Valle%';
UPDATE juegos SET dia_sorteo = 'Jueves',     horario = '10:30 PM', canal_en_vivo = 'Telecafe'               WHERE nombre ILIKE '%Quindio%';
UPDATE juegos SET dia_sorteo = 'Jueves',     horario = '10:30 PM', canal_en_vivo = 'Canal Capital'           WHERE nombre ILIKE '%Bogota%';
UPDATE juegos SET dia_sorteo = 'Viernes',    horario = '11:00 PM', canal_en_vivo = 'Teleantioquia'          WHERE nombre ILIKE '%Santander%';
UPDATE juegos SET dia_sorteo = 'Viernes',    horario = '11:00 PM', canal_en_vivo = 'Teleantioquia'          WHERE nombre ILIKE '%Medellin%';
UPDATE juegos SET dia_sorteo = 'Viernes',    horario = '11:00 PM', canal_en_vivo = 'Telecafe'               WHERE nombre ILIKE '%Risaralda%';
UPDATE juegos SET dia_sorteo = 'Sabado',     horario = '10:40 PM', canal_en_vivo = 'Canal TRO Boyaca'        WHERE nombre ILIKE '%Boyaca%';
UPDATE juegos SET dia_sorteo = 'Sabado',     horario = '9:40 PM',  canal_en_vivo = 'Telepacifico'           WHERE nombre ILIKE '%Cauca%';
UPDATE juegos SET dia_sorteo = 'Sabado',     horario = '11:00 PM', canal_en_vivo = 'Canal Uno'               WHERE nombre ILIKE '%Extra%Colombia%';

-- ═══════════════════════════════════════════
-- CHANCES (3 cifras, sorteos diurnos/nocturnos)
-- ═══════════════════════════════════════════

-- Antioqueñita
UPDATE juegos SET dia_sorteo = 'Lunes a Sabado', horario = '10:00 AM', canal_en_vivo = 'Teleantioquia' WHERE nombre ILIKE '%Antioqueñita%Dia%' OR nombre ILIKE '%Antioquenita%Dia%';
UPDATE juegos SET dia_sorteo = 'Lunes a Sabado', horario = '4:00 PM',   canal_en_vivo = 'Teleantioquia' WHERE nombre ILIKE '%Antioqueñita%Tarde%' OR nombre ILIKE '%Antioquenita%Tarde%';

-- Dorado
UPDATE juegos SET dia_sorteo = 'Lunes a Sabado', horario = '10:58 AM', canal_en_vivo = 'Teleantioquia' WHERE nombre ILIKE '%Dorado%Mañana%' OR nombre ILIKE '%Dorado%Manana%';
UPDATE juegos SET dia_sorteo = 'Lunes a Sabado', horario = '3:28 PM',  canal_en_vivo = 'Teleantioquia' WHERE nombre ILIKE '%Dorado%Tarde%';
UPDATE juegos SET dia_sorteo = 'Sabado',         horario = '10:15 PM', canal_en_vivo = 'Teleantioquia' WHERE nombre ILIKE '%Dorado%Noche%';

-- Fantástica
UPDATE juegos SET dia_sorteo = 'Lunes a Sabado', horario = '12:57 PM', canal_en_vivo = 'Teleantioquia' WHERE nombre ILIKE '%Fantastica%Dia%';
UPDATE juegos SET dia_sorteo = 'Lunes a Sabado', horario = '8:30 PM',  canal_en_vivo = 'Teleantioquia' WHERE nombre ILIKE '%Fantastica%Noche%';

-- Samán de la Suerte
UPDATE juegos SET dia_sorteo = 'Lunes a Sabado', horario = '1:00 PM', canal_en_vivo = 'Teleantioquia' WHERE nombre ILIKE '%Saman%';

-- Paisita
UPDATE juegos SET dia_sorteo = 'Lunes a Sabado', horario = '1:00 PM',  canal_en_vivo = 'Teleantioquia' WHERE nombre ILIKE '%Paisita%Dia%';
UPDATE juegos SET dia_sorteo = 'Lunes a Sabado', horario = '6:00 PM',  canal_en_vivo = 'Teleantioquia' WHERE nombre ILIKE '%Paisita%Noche%';

-- Chontico
UPDATE juegos SET dia_sorteo = 'Todos los dias', horario = '1:00 PM',  canal_en_vivo = 'Teleantioquia' WHERE nombre ILIKE '%Chontico%Dia%';
UPDATE juegos SET dia_sorteo = 'Lunes a Viernes', horario = '7:00 PM',  canal_en_vivo = 'Teleantioquia' WHERE nombre ILIKE '%Chontico%Noche%';

-- Pijao de Oro
UPDATE juegos SET dia_sorteo = 'Lunes a Viernes', horario = '2:00 PM', canal_en_vivo = 'Telecafe' WHERE nombre ILIKE '%Pijao%';

-- Super Astro Sol / Luna
UPDATE juegos SET dia_sorteo = 'Lunes a Sabado', horario = '2:30 PM', canal_en_vivo = 'Canal Capital' WHERE nombre ILIKE '%Astro%Sol%' OR nombre ILIKE '%Super Astro Sol%';
UPDATE juegos SET dia_sorteo = 'Lunes a Sabado', horario = '10:30 PM', canal_en_vivo = 'Canal Capital' WHERE nombre ILIKE '%Astro%Luna%' OR nombre ILIKE '%Super Astro Luna%';

-- Sinuano Día / Noche
UPDATE juegos SET dia_sorteo = 'Lunes a Sabado', horario = '2:30 PM',  canal_en_vivo = 'Telecaribe' WHERE nombre ILIKE '%Sinuano%Dia%';
UPDATE juegos SET dia_sorteo = 'Lunes a Sabado', horario = '10:30 PM', canal_en_vivo = 'Telecaribe' WHERE nombre ILIKE '%Sinuano%Noche%';

-- La Caribeña Día / Noche
UPDATE juegos SET dia_sorteo = 'Todos los dias', horario = '2:30 PM',  canal_en_vivo = 'Telecaribe' WHERE nombre ILIKE '%Caribeña%Dia%' OR nombre ILIKE '%Caribena%Dia%';
UPDATE juegos SET dia_sorteo = 'Lunes a Sabado', horario = '10:30 PM', canal_en_vivo = 'Telecaribe' WHERE nombre ILIKE '%Caribeña%Noche%' OR nombre ILIKE '%Caribena%Noche%';

-- Motilón Tarde / Noche
UPDATE juegos SET dia_sorteo = 'Todos los dias', horario = '3:00 PM', canal_en_vivo = 'Canal TRO' WHERE nombre ILIKE '%Motilon%Tarde%';
UPDATE juegos SET dia_sorteo = 'Todos los dias', horario = '9:00 PM', canal_en_vivo = 'Canal TRO' WHERE nombre ILIKE '%Motilon%Noche%';

-- Cafeterito Tarde / Noche
UPDATE juegos SET dia_sorteo = 'Lunes a Sabado', horario = '12:00 PM', canal_en_vivo = 'Telecafe' WHERE nombre ILIKE '%Cafeterito%Tarde%';
UPDATE juegos SET dia_sorteo = 'Lunes a Viernes', horario = '10:00 PM', canal_en_vivo = 'Telecafe' WHERE nombre ILIKE '%Cafeterito%Noche%';

-- Paisa Lotto
UPDATE juegos SET dia_sorteo = 'Sabado', horario = '10:00 PM', canal_en_vivo = 'Teleantioquia' WHERE nombre ILIKE '%Paisa%Lotto%';

-- La Culona Día / Noche
UPDATE juegos SET dia_sorteo = 'Todos los dias', horario = '2:30 PM', canal_en_vivo = 'Teleantioquia' WHERE nombre ILIKE '%Culona%Dia%';
UPDATE juegos SET dia_sorteo = 'Lunes a Sabado', horario = '9:30 PM', canal_en_vivo = 'Teleantioquia' WHERE nombre ILIKE '%Culona%Noche%';

-- SuperMillonaria
UPDATE juegos SET dia_sorteo = 'Viernes', horario = '11:00 PM', canal_en_vivo = 'Canal Capital' WHERE nombre ILIKE '%SuperMillonaria%' OR nombre ILIKE '%Super Millonaria%';

-- ═══════════════════════════════════════════
-- VERIFICACIÓN FINAL
-- ═══════════════════════════════════════════
SELECT id, nombre, categoria, dia_sorteo, horario, canal_en_vivo
FROM juegos
ORDER BY orden ASC;
