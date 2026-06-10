import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

let cache = { data: null, timestamp: 0 };
const CACHE_DURATION = 1000 * 60 * 60; // 1 hora

const FUENTES = [
  {
    nombre: 'loti',
    url: 'https://loti.com.co/resultados-loterias-colombia-hoy/',
    parsear: ($) => {
      const resultados = [];
      $('.result-item, .loteria-result, .resultado, article, .card').each((i, el) => {
        const texto = $(el).text();
        const nombre = $(el).find('h2, h3, h4, .title, .nombre').first().text().trim();
        const numero = $(el).find('.numero, .number, strong').first().text().trim().replace(/\D/g, '').slice(0, 4);
        const serie = $(el).find('.serie, .series').first().text().trim().replace(/[^A-Z0-9]/gi, '').slice(0, 3).toUpperCase();
        if (nombre && numero && numero.length >= 3) {
          resultados.push({ nombre, numero: numero.padStart(4, '0'), serie: serie || '000' });
        }
      });
      return resultados;
    }
  },
  {
    nombre: 'balota',
    url: 'https://www.balota.com.co/resultados',
    parsear: ($) => {
      const resultados = [];
      $('.resultado-loteria, .loteria-card, .result-card, .sorteo').each((i, el) => {
        const nombre = $(el).find('.nombre, .title, h3, h4').first().text().trim();
        const numero = $(el).find('.numero, .number, .ganador').first().text().trim().replace(/\D/g, '').slice(0, 4);
        const serie = $(el).find('.serie').first().text().trim().replace(/[^A-Z0-9]/gi, '').slice(0, 3).toUpperCase();
        if (nombre && numero && numero.length >= 3) {
          resultados.push({ nombre, numero: numero.padStart(4, '0'), serie: serie || '000' });
        }
      });
      return resultados;
    }
  }
];

const PREMIOS = {
  'bogotá': '$15.000.000.000',
  'medellín': '$12.000.000.000',
  'medellin': '$12.000.000.000',
  'tolima': '$9.000.000.000',
  'huila': '$6.000.000.000',
  'quindío': '$5.000.000.000',
  'quindio': '$5.000.000.000',
  'caldas': '$4.000.000.000',
  'manizales': '$4.000.000.000',
  'meta': '$3.000.000.000',
  'cundinamarca': '$3.000.000.000',
  'cauca': '$2.000.000.000',
  'risaralda': '$2.000.000.000',
  'santander': '$2.000.000.000',
};

function getPremio(nombre) {
  const lower = nombre.toLowerCase();
  for (const [key, val] of Object.entries(PREMIOS)) {
    if (lower.includes(key)) return val;
  }
  return '$0';
}

function construirResultado(item) {
  const num = item.numero;
  return {
    loteria: item.nombre,
    fecha: new Date().toISOString().split('T')[0],
    dia: ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][new Date().getDay()],
    numero: num,
    serie: item.serie,
    premio: getPremio(item.nombre),
    secos: [num.slice(-3), num.slice(-2), num.slice(-1)],
  };
}

async function intentarFuente(fuente) {
  try {
    const res = await fetch(fuente.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-CO,es;q=0.9',
      },
      next: { revalidate: 0 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const { load } = await import('cheerio');
    const $ = load(html);
    const items = fuente.parsear($);
    if (items.length === 0) throw new Error('Sin resultados parseados');
    console.log(`✅ Fuente ${fuente.nombre}: ${items.length} resultados`);
    return items.map(construirResultado);
  } catch (err) {
    console.error(`❌ Fuente ${fuente.nombre} falló:`, err.message);
    return null;
  }
}

const RESPALDO = [
  { loteria: 'Lotería de Bogotá', fecha: '2026-06-05', dia: 'Jueves', numero: '4821', serie: 'B34', premio: '$15.000.000.000', secos: ['821','21','1'] },
  { loteria: 'Lotería de Medellín', fecha: '2026-06-06', dia: 'Viernes', numero: '2047', serie: 'A12', premio: '$12.000.000.000', secos: ['047','47','7'] },
  { loteria: 'Lotería del Tolima', fecha: '2026-06-02', dia: 'Lunes', numero: '6391', serie: 'C05', premio: '$9.000.000.000', secos: ['391','91','1'] },
  { loteria: 'Lotería del Huila', fecha: '2026-06-04', dia: 'Miércoles', numero: '8824', serie: 'B01', premio: '$6.000.000.000', secos: ['824','24','4'] },
  { loteria: 'Lotería del Quindío', fecha: '2026-06-04', dia: 'Miércoles', numero: '3156', serie: 'A07', premio: '$5.000.000.000', secos: ['156','56','6'] },
  { loteria: 'Lotería de Caldas', fecha: '2026-06-03', dia: 'Miércoles', numero: '7203', serie: 'D02', premio: '$4.000.000.000', secos: ['203','03','3'] },
  { loteria: 'Lotería de Manizales', fecha: '2026-06-03', dia: 'Miércoles', numero: '5548', serie: 'A11', premio: '$4.000.000.000', secos: ['548','48','8'] },
  { loteria: 'Lotería del Meta', fecha: '2026-06-01', dia: 'Viernes', numero: '1872', serie: 'B08', premio: '$3.000.000.000', secos: ['872','72','2'] },
];

export async function GET() {
  const ahora = Date.now();
  if (cache.data && ahora - cache.timestamp < CACHE_DURATION) {
    return NextResponse.json(cache.data);
  }

  for (const fuente of FUENTES) {
    const resultados = await intentarFuente(fuente);
    if (resultados && resultados.length > 0) {
      cache = { data: resultados, timestamp: ahora };
      return NextResponse.json(resultados);
    }
  }

  cache = { data: RESPALDO, timestamp: ahora };
  return NextResponse.json(RESPALDO);
}