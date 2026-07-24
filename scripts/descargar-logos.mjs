// Descarga logos de juegos y los redimensiona a 200x200 (manteniendo proporción, con padding transparente)
// Uso: node scripts/descargar-logos.mjs
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'juegos');
const SIZE = 200; // tamaño estándar

// Mapeo: nombreArchivo -> URL original
const logos = {
  // Loterías
  'loteria-bogota': 'https://cdn1.loteriasdehoy.com/loterias/1.gif',
  'loteria-boyaca': 'https://cdn1.loteriasdehoy.com/loterias/2.gif',
  'loteria-cauca': 'https://cdn1.loteriasdehoy.com/loterias/3.gif',
  'loteria-cruz-roja': 'https://cdn1.loteriasdehoy.com/loterias/4.gif',
  'loteria-cundinamarca': 'https://cdn1.loteriasdehoy.com/loterias/5.gif',
  'loteria-huila': 'https://cdn1.loteriasdehoy.com/loterias/6.gif',
  'loteria-manizales': 'https://cdn1.loteriasdehoy.com/loterias/7.gif',
  'loteria-medellin': 'https://cdn1.loteriasdehoy.com/loterias/8.gif',
  'loteria-meta': 'https://cdn1.loteriasdehoy.com/loterias/9.gif',
  'loteria-quindio': 'https://cdn1.loteriasdehoy.com/loterias/10.gif',
  'loteria-risaralda': 'https://cdn1.loteriasdehoy.com/loterias/11.gif',
  'loteria-santander': 'https://cdn1.loteriasdehoy.com/loterias/12.gif',
  'loteria-tolima': 'https://cdn1.loteriasdehoy.com/loterias/13.gif',
  'loteria-valle': 'https://cdn1.loteriasdehoy.com/loterias/14.gif',
  // Chances
  'dorado-manana': 'https://cdn1.loteriasdehoy.com/chances/12.gif',
  'dorado-noche': 'https://cdn1.loteriasdehoy.com/chances/7.gif',
  'dorado-tarde': 'https://cdn1.loteriasdehoy.com/chances/19.gif',
  'chontico-dia': 'https://cdn1.loteriasdehoy.com/chances/15.gif',
  'chontico-noche': 'https://cdn1.loteriasdehoy.com/chances/14.gif',
  'sinuano-dia': 'https://cdn1.loteriasdehoy.com/chances/23.gif',
  'sinuano-noche': 'https://cdn1.loteriasdehoy.com/chances/23.gif',
  'caribena-dia': 'https://cdn1.loteriasdehoy.com/chances/25.gif',
  'caribena-noche': 'https://cdn1.loteriasdehoy.com/chances/25.gif',
  'astro-luna': 'https://cdn1.loteriasdehoy.com/chances/11.gif',
  'astro-sol': 'https://cdn1.loteriasdehoy.com/chances/5.gif',
  'cafeterito-tarde': 'https://cdn1.loteriasdehoy.com/chances/6.gif',
  'cafeterito-noche': 'https://cdn1.loteriasdehoy.com/chances/10.gif',
  'culona-dia': 'https://cdn1.loteriasdehoy.com/chances/62.gif',
  'culona-noche': 'https://cdn1.loteriasdehoy.com/chances/62.gif',
  'fantastica-dia': 'https://cdn1.loteriasdehoy.com/chances/29.gif',
  'fantastica-noche': 'https://cdn1.loteriasdehoy.com/chances/29.gif',
  'paisita-dia': 'https://cdn1.loteriasdehoy.com/chances/16.gif',
  'paisita-noche': 'https://cdn1.loteriasdehoy.com/chances/13.gif',
  'pijao-oro': 'https://cdn1.loteriasdehoy.com/chances/2.gif',
  'saman': 'https://cdn1.loteriasdehoy.com/chances/21.gif',
  'pick4-dia': 'https://cdn1.loteriasdehoy.com/chances/18.gif',
  'pick4-noche': 'https://cdn1.loteriasdehoy.com/chances/9.gif',
  // Baloto / Colorloto
  'baloto': 'https://d314ivgy8nq27r.cloudfront.net/static/img/webp/logo_206.webp',
  'baloto-revancha': 'https://d314ivgy8nq27r.cloudfront.net/static/img/widgets/revancha.webp',
  'colorloto': 'https://d314ivgy8nq27r.cloudfront.net/static/colorloto/img/logo.webp',
};

async function downloadAndResize(name, url) {
  try {
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    if (!resp.ok) { console.error(`FAIL ${name}: HTTP ${resp.status}`); return false; }
    const buf = Buffer.from(await resp.arrayBuffer());
    const outPath = join(OUT_DIR, name + '.png');
    // Redimensionar: ajustar dentro de SIZE x SIZE manteniendo proporción, fondo transparente
    await sharp(buf)
      .resize(SIZE, SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(outPath);
    console.log(`OK ${name} -> ${name}.png (${SIZE}x${SIZE})`);
    return true;
  } catch (e) {
    console.error(`ERR ${name}: ${e.message}`);
    return false;
  }
}

async function main() {
  if (!existsSync(OUT_DIR)) await mkdir(OUT_DIR, { recursive: true });
  let ok = 0, fail = 0;
  for (const [name, url] of Object.entries(logos)) {
    const success = await downloadAndResize(name, url);
    if (success) ok++; else fail++;
  }
  console.log(`\n=== Descarga completa: ${ok} OK, ${fail} fallos ===`);
  console.log(`Todos los logos redimensionados a ${SIZE}x${SIZE} PNG en public/juegos/`);
}

main();
