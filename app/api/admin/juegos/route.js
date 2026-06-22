import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { esquemaJuego, esquemaJuegoUpdate, validar } from '../../../../lib/validaciones';

export async function GET() {
  try {
    if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase no inicializado.' }, { status: 500 });
    const { data, error } = await supabaseAdmin.from('juegos').select('*').order('orden', { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ juegos: data });
  } catch (err) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const validacion = validar(esquemaJuego, body);
    if (!validacion.ok) return NextResponse.json({ error: validacion.error }, { status: 400 });
    const datos = validacion.data;

    const { data, error } = await supabaseAdmin.from('juegos').insert({
      nombre: datos.nombre,
      categoria: datos.categoria,
      tipo: datos.tipo || 'loteria',
      dia_sorteo: datos.dia_sorteo || '',
      orden: parseInt(datos.orden) || 99,
      numero_digits: parseInt(datos.numero_digits) || 4,
      serie_digits: parseInt(datos.serie_digits) || 0,
      tiene_fraccion: datos.tiene_fraccion ?? false,
      total_fracciones: parseInt(datos.total_fracciones) || 1,
      usa_signo: datos.usa_signo ?? false,
      usa_quinta: datos.usa_quinta ?? false,
      activo: true,
    }).select().single();

    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Ya existe un juego con ese nombre.' }, { status: 409 });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, juego: data });
  } catch (err) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const validacion = validar(esquemaJuegoUpdate, body);
    if (!validacion.ok) return NextResponse.json({ error: validacion.error }, { status: 400 });

    const { id, ...update } = validacion.data;
    if (update.orden !== undefined) update.orden = parseInt(update.orden);
    if (update.numero_digits !== undefined) update.numero_digits = parseInt(update.numero_digits);
    if (update.serie_digits !== undefined) update.serie_digits = parseInt(update.serie_digits);
    if (update.total_fracciones !== undefined) update.total_fracciones = parseInt(update.total_fracciones);

    const { data, error } = await supabaseAdmin.from('juegos').update(update).eq('id', id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, juego: data });
  } catch (err) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Falta el id.' }, { status: 400 });
    const { error } = await supabaseAdmin.from('juegos').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}