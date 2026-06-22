import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST(request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'El servicio de escaneo no esta configurado.' }, { status: 500 });
    }

    const { imagenBase64, mimeType } = await request.json();
    if (!imagenBase64) {
      return NextResponse.json({ error: 'No se recibio ninguna imagen.' }, { status: 400 });
    }

    const prompt = `Eres un asistente experto en leer fotos de boletos de loterias y chances colombianos. La imagen puede contener uno o varios boletos fisicos.

IMPORTANTE sobre fracciones: en Colombia, un billete de loteria puede tener multiples fracciones impresas (ej: un billete con fracciones 1, 2 y 3 del mismo numero). Si ves fracciones multiples del MISMO numero y serie en UN SOLO billete fisico, tratalo como UN SOLO boleto con multiples fracciones, NO como boletos separados.

Responde UNICAMENTE con un JSON valido, sin texto adicional, sin markdown, sin backticks:

{
  "boletos": [
    {
      "loteria": "nombre del juego tal como aparece impreso",
      "numero": "numero principal, texto, conservando ceros a la izquierda",
      "serie": "la serie si aparece, o cadena vacia",
      "fracciones": [1, 2, 3],
      "valorApuesta": "valor pagado si aparece con simbolo de pesos, o cadena vacia",
      "fechaSorteo": "fecha del sorteo en formato YYYY-MM-DD si aparece, o cadena vacia",
      "signo": "signo zodiacal solo para juegos Astro, o cadena vacia",
      "confianza": "alta, media o baja"
    }
  ]
}

El campo "fracciones" es un array de numeros enteros indicando CUALES fracciones especificas tiene este boleto (ej: [1] si solo tiene la fraccion 1, [1,2,3] si tiene las fracciones 1, 2 y 3). Si el juego no tiene fracciones (como chances), usa [].

Si hay varios billetes DISTINTOS en la foto (diferentes numeros o series), incluye uno por cada billete. No combines billetes distintos. No inventes datos que no veas claramente.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mimeType || 'image/jpeg', data: imagenBase64 } }] }],
          generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data.error?.message || 'Error al procesar la imagen.' }, { status: 500 });
    }

    const textoRespuesta = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textoRespuesta) {
      return NextResponse.json({ error: 'No se pudo leer la respuesta del modelo.' }, { status: 500 });
    }

    let resultado;
    try { resultado = JSON.parse(textoRespuesta); } catch {
      return NextResponse.json({ error: 'El modelo no devolvio un formato valido.' }, { status: 500 });
    }

    const boletos = Array.isArray(resultado.boletos) ? resultado.boletos : [];
    if (boletos.length === 0) {
      return NextResponse.json({ error: 'No se detecto ningun boleto en la imagen.' }, { status: 422 });
    }

    return NextResponse.json({ ok: true, boletos });
  } catch (err) {
    console.error('Error en /api/escanear-boleto:', err);
    return NextResponse.json({ error: 'Error interno al escanear el boleto.' }, { status: 500 });
  }
}