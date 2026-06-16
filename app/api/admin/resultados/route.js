import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verificarTokenAdmin } from '../../../../lib/auth';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function POST(request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  const payload = await verificarTokenAdmin(token);
  if (!payload) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });

  const body = await request.json();
  const { loteria, numero, serie, premio, fecha, secos, signo, quinta } = body;

  if (!loteria || !numero) return NextResponse.json({ error: 'Faltan datos obligatorios.' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('resultados')
    .upsert({
      loteria,
      numero,
      serie: serie || '',
      premio: premio || '',
      fecha: fecha || '',
      secos: secos || [],
      signo: signo || '',
      quinta: quinta || '',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'loteria' })
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, resultado: data });
}

export async function GET() {
  const { data, error } = await supabaseAdmin.from('resultados').select('*');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ resultados: data });
}