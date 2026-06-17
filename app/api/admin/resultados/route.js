import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { esquemaResultado, validar } from '../../../../lib/validaciones';

export async function POST(request) {
  try {
    const body = await request.json();
    const validacion = validar(esquemaResultado, body);
    if (!validacion.ok) return NextResponse.json({ error: validacion.error }, { status: 400 });
    const { loteria, numero, serie, premio, fecha, secos, signo, quinta } = validacion.data;

    const { data: ultimo, error: errorUltimo } = await supabaseAdmin
      .from('resultados')
      .upsert({
        loteria, numero, serie, premio, fecha, secos, signo, quinta,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'loteria' })
      .select().single();

    if (errorUltimo) return NextResponse.json({ error: errorUltimo.message }, { status: 500 });

    const { error: errorHistorico } = await supabaseAdmin
      .from('sorteos_historico')
      .upsert({ loteria, numero, serie, premio, fecha, secos, signo, quinta }, { onConflict: 'loteria,fecha' });

    if (errorHistorico) return NextResponse.json({ error: errorHistorico.message }, { status: 500 });

    return NextResponse.json({ ok: true, resultado: ultimo });
  } catch (err) {
    console.error('Error POST /api/admin/resultados:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.from('resultados').select('*');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ resultados: data });
  } catch (err) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}