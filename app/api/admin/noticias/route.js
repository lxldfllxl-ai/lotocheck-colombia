import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verificarTokenAdmin } from '../../../../lib/auth';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;
    const payload = token ? await verificarTokenAdmin(token) : null;

    if (!payload || payload.rol !== 'admin') {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('noticias')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ noticias: data || [] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;
    const payload = token ? await verificarTokenAdmin(token) : null;

    if (!payload || payload.rol !== 'admin') {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const body = await request.json();
    const { titulo, descripcion, fecha, icono } = body;

    if (!titulo?.trim() || !descripcion?.trim()) {
      return NextResponse.json({ error: 'Título y descripción son obligatorios.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('noticias')
      .insert({
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        fecha: fecha?.trim() || 'Nueva',
        icono: icono?.trim() || '📰',
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ noticia: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;
    const payload = token ? await verificarTokenAdmin(token) : null;

    if (!payload || payload.rol !== 'admin') {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const body = await request.json();
    const { id, titulo, descripcion, fecha, icono } = body;

    if (!id || !titulo?.trim() || !descripcion?.trim()) {
      return NextResponse.json({ error: 'Datos inválidos.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('noticias')
      .update({
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        fecha: fecha?.trim() || 'Nueva',
        icono: icono?.trim() || '📰',
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ noticia: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;
    const payload = token ? await verificarTokenAdmin(token) : null;

    if (!payload || payload.rol !== 'admin') {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Falta el id.' }, { status: 400 });

    const { error } = await supabaseAdmin.from('noticias').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
