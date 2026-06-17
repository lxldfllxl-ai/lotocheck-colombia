import { NextResponse } from 'next/server';

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

    const prompt = `Eres un asistente que lee boletos de loterias y chances colombianos en una foto.
Extrae SOLO los siguientes datos visibles en el boleto y responde UNICAMENTE con un JSON valido, sin texto adicional, sin markdown, sin backticks:

{
  "loteria": "nombre del juego o loteria tal como aparece impreso (ej: Loteria de Bogota, Chontico Dia, Astro Sol)",
  "numero": "el numero principal jugado, como texto, conservando ceros a la izquierda",
  "serie": "la serie si aparece, como texto, o cadena vacia si no aplica",
  "fraccion": "el numero de fraccion si aparece (ej: 1, 2, 3...), o cadena vacia si no aplica",
  "valorApuesta": "el valor pagado por el boleto si aparece, como texto con el simbolo de pesos (ej: $2.000), o cadena vacia si no es visible",
  "fechaSorteo": "la fecha del sorteo si aparece impresa, en formato YYYY-MM-DD, o cadena vacia si no es visible",
  "signo": "el signo zodiacal si aplica (solo para juegos Astro), o cadena vacia",
  "confianza": "alta, media o baja, segun que tan seguro estas de la lectura"
}

Si algun campo no es visible o no aplica, usa cadena vacia "". No inventes datos que no veas claramente en la imagen.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType || 'image/jpeg', data: imagenBase64 } },
            ],
          }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error('Error de Gemini:', data);
      return NextResponse.json({ error: data.error?.message || 'Error al procesar la imagen.' }, { status: 500 });
    }

    const textoRespuesta = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textoRespuesta) {
      return NextResponse.json({ error: 'No se pudo leer la respuesta del modelo.' }, { status: 500 });
    }

    let resultado;
    try {
      resultado = JSON.parse(textoRespuesta);
    } catch {
      return NextResponse.json({ error: 'El modelo no devolvio un formato valido.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, datos: resultado });
  } catch (err) {
    console.error('Error en /api/escanear-boleto:', err);
    return NextResponse.json({ error: 'Error interno al escanear el boleto.' }, { status: 500 });
  }
}