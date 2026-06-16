import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verificarTokenAdmin } from '../../../../lib/auth';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('juegos')
    .select('*')
    .order('orden', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ juegos: data });
}

export async function POST(request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  const payload = await verificarTokenAdmin(token);
  if (!payload) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });

  const body = await request.json();
  if (!body.nombre || !body.categoria) return NextResponse.json({ error: 'Faltan datos.' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('juegos')
    .insert({
      nombre: body.nombre,
      categoria: body.categoria,
      tipo: body.tipo || 'loteria',
      dia_sorteo: body.dia_sorteo || '',
      orden: body.orden || 99,
      numero_digits: body.numero_digits || 4,
      serie_digits: body.serie_digits || 0,
      tiene_fraccion: body.tiene_fraccion ?? false,
      usa_signo: body.usa_signo ?? false,
      usa_quinta: body.usa_quinta ?? false,
      activo: true,
    })
    .select().single();

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Ya existe un juego con ese nombre.' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, juego: data });
}

export async function PUT(request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  const payload = await verificarTokenAdmin(token);
  if (!payload) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });

  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: 'Falta el id.' }, { status: 400 });

  const update = { ...body };
  delete update.id;

  const { data, error } = await supabaseAdmin
    .from('juegos')
    .update(update)
    .eq('id', body.id)
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, juego: data });
}

export async function DELETE(request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  const payload = await verificarTokenAdmin(token);
  if (!payload) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'Falta el id.' }, { status: 400 });

  const { error } = await supabaseAdmin.from('juegos').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}