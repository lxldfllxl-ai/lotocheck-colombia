import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verificarTokenAdmin } from '../../../../lib/auth';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;
    const payload = await verificarTokenAdmin(token);
    if (!payload) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });

    const body = await request.json();
    const { loteria, numero, serie, premio, fecha, secos, signo, quinta } = body;

    if (!loteria || !numero) return NextResponse.json({ error: 'Faltan datos obligatorios.' }, { status: 400 });
    if (!fecha) return NextResponse.json({ error: 'La fecha del sorteo es obligatoria para el historico.' }, { status: 400 });

    // 1. Actualizar/crear el "ultimo resultado" (usado por la app para mostrar en Sorteos)
    const { data: ultimo, error: errorUltimo } = await supabaseAdmin
      .from('resultados')
      .upsert({
        loteria,
        numero,
        serie: serie || '',
        premio: premio || '',
        fecha,
        secos: secos || [],
        signo: signo || '',
        quinta: quinta || '',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'loteria' })
      .select().single();

    if (errorUltimo) return NextResponse.json({ error: errorUltimo.message }, { status: 500 });

    // 2. Guardar tambien en el historico (para verificar boletos de fechas pasadas)
    const { error: errorHistorico } = await supabaseAdmin
      .from('sorteos_historico')
      .upsert({
        loteria,
        numero,
        serie: serie || '',
        premio: premio || '',
        fecha,
        secos: secos || [],
        signo: signo || '',
        quinta: quinta || '',
      }, { onConflict: 'loteria,fecha' });

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