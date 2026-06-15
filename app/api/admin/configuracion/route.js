import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verificarTokenAdmin } from '../../../../lib/auth';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function PUT(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const payload = await verificarTokenAdmin(token);

    if (!payload || payload.rol !== 'admin') {
      return NextResponse.json({ error: 'Acceso denegado.' }, { status: 403 });
    }

    const body = await request.json();
    const { precio_basico, precio_pro, precio_premium, limite_basico, limite_pro } = body;

    const update = {};
    if (precio_basico !== undefined) update.precio_basico = precio_basico;
    if (precio_pro !== undefined) update.precio_pro = precio_pro;
    if (precio_premium !== undefined) update.precio_premium = precio_premium;
    if (limite_basico !== undefined) update.limite_basico = parseInt(limite_basico);
    if (limite_pro !== undefined) update.limite_pro = parseInt(limite_pro);
    update.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('configuracion')
      .update(update)
      .eq('id', 1)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, configuracion: data });
  } catch (err) {
    console.error('Error actualizar config:', err.message);
    return NextResponse.json({ error: 'Error del servidor: ' + err.message }, { status: 500 });
  }
}