import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'El servicio de escaneo no está configurado.' }, { status: 500 });
    }

    const { imagenBase64, mimeType } = await request.json();
    if (!imagenBase64) {
      return NextResponse.json({ error: 'No se recibió ninguna imagen.' }, { status: 400 });
    }

    const prompt = `Eres un asistente experto en leer fotos de boletos de loterías y chances colombianos. La imagen puede contener uno o varios boletos físicos.

IMPORTANTE sobre fracciones: en Colombia, un billete de lotería puede tener múltiples fracciones impresas (ej: un billete con fracciones 1, 2 y 3 del mismo número y serie). Si ves fracciones múltiples del MISMO número y serie en UN SOLO billete físico, trátalo como UN SOLO boleto con múltiples fracciones, NO como boletos separados.

Responde ÚNICAMENTE con un objeto JSON válido. Sin texto adicional. Sin markdown. Sin backticks. Solo el JSON puro:

{
  "boletos": [
    {
      "loteria": "nombre exacto del juego tal como aparece impreso en el boleto",
      "numero": "número principal como texto conservando ceros a la izquierda, ejemplo: 0821",
      "serie": "la serie si aparece como texto, ejemplo: B34, o cadena vacía si no aplica",
      "fracciones": [1, 2, 3],
      "valorApuesta": "valor pagado con símbolo de pesos si aparece, ejemplo: $2.000, o cadena vacía",
      "fechaSorteo": "fecha del sorteo en formato YYYY-MM-DD si aparece impresa, o cadena vacía",
      "signo": "signo zodiacal solo para juegos Astro Sol o Astro Luna, o cadena vacía",
      "confianza": "alta si lees todo con claridad, media si hay algo dudosa, baja si hay mucha incertidumbre"
    }
  ]
}

REGLAS ESTRICTAS para el campo fracciones:
- Debe ser un array de números enteros, NUNCA strings. Correcto: [1,2,3]. Incorrecto: ["1","2","3"].
- Si el boleto muestra fracciones 1, 2 y 3 del mismo número: [1, 2, 3]
- Si solo tiene una fracción (ej: fracción 2): [2]
- Si el juego no tiene fracciones (chances, astro): []
- Si no puedes leer las fracciones con certeza: []

Si hay varios billetes DISTINTOS en la foto (diferentes números o series), incluye uno por cada billete distinto. No combines billetes de diferentes números. No inventes datos que no veas claramente en la imagen.`;

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
      return NextResponse.json({ error: 'El modelo no devolvió un formato válido.' }, { status: 500 });
    }

    const boletos = Array.isArray(resultado.boletos) ? resultado.boletos.map(b => ({
      ...b,
      // Garantizar que fracciones sea siempre array de numeros enteros
      fracciones: Array.isArray(b.fracciones)
        ? b.fracciones.map(f => parseInt(f)).filter(f => !isNaN(f) && f > 0)
        : [],
    })) : [];

    if (boletos.length === 0) {
      return NextResponse.json({ error: 'No se detecto ningun boleto en la imagen.' }, { status: 422 });
    }

    return NextResponse.json({ ok: true, boletos });
  } catch (err) {
    console.error('Error en /api/escanear-boleto:', err);
    return NextResponse.json({ error: 'Error interno al escanear el boleto.' }, { status: 500 });
  }
}