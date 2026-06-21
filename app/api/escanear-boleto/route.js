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

    const prompt = `Eres un asistente que lee fotos de boletos de loterias y chances colombianos. La imagen puede contener UN SOLO boleto o VARIOS boletos/recibos juntos en la misma foto (por ejemplo, varios tiquetes de chance superpuestos o en fila).

Identifica cada boleto individual que veas en la imagen y extrae sus datos. Responde UNICAMENTE con un JSON valido, sin texto adicional, sin markdown, sin backticks, con esta estructura exacta:

{
  "boletos": [
    {
      "loteria": "nombre del juego o loteria tal como aparece impreso (ej: Loteria de Bogota, Chontico Dia, Astro Sol)",
      "numero": "el numero principal jugado, como texto, conservando ceros a la izquierda",
      "serie": "la serie si aparece, como texto, o cadena vacia si no aplica",
      "fraccion": "el numero de fraccion si aparece, o cadena vacia si no aplica",
      "valorApuesta": "el valor pagado por el boleto si aparece, con simbolo de pesos, o cadena vacia",
      "fechaSorteo": "la fecha del sorteo si aparece impresa, en formato YYYY-MM-DD, o cadena vacia",
      "signo": "el signo zodiacal si aplica (solo juegos Astro), o cadena vacia",
      "confianza": "alta, media o baja, segun que tan seguro estas de la lectura de ESTE boleto especifico"
    }
  ]
}

Si solo hay un boleto en la imagen, el array "boletos" debe tener un solo elemento. Si hay varios boletos distintos y claramente separables, incluye uno por cada uno. Si algun campo no es visible o no aplica, usa cadena vacia "". No inventes datos que no veas claramente en la imagen. No combines datos de boletos distintos en uno solo.`;

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