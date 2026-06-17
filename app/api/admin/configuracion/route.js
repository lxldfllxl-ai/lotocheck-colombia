import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verificarTokenAdmin } from '../../../../lib/auth';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function PUT(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;
    const payload = await verificarTokenAdmin(token);
    if (!payload || payload.rol !== 'admin') {
      return NextResponse.json({ error: 'Acceso denegado.' }, { status: 403 });
    }

    const body = await request.json();
    console.log('Body recibido en PUT configuracion:', body);

    const update = {};
    const camposPermitidos = [
      'precio_basico', 'precio_pro', 'precio_premium',
      'limite_gratis', 'limite_basico', 'limite_pro',
      'nombre_gratis', 'nombre_basico', 'nombre_pro', 'nombre_premium',
    ];

    camposPermitidos.forEach(campo => {
      if (body[campo] !== undefined && body[campo] !== null) {
        if (campo.startsWith('limite_')) {
          update[campo] = parseInt(body[campo]) || 0;
        } else {
          update[campo] = body[campo];
        }
      }
    });

    update.updated_at = new Date().toISOString();

    console.log('Update final a enviar a Supabase:', update);

    const { data, error } = await supabaseAdmin
      .from('configuracion')
      .update(update)
      .eq('id', 1)
      .select().single();

    if (error) {
      console.error('Error de Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, configuracion: data });
  } catch (err) {
    console.error('Error en PUT configuracion:', err);
    return NextResponse.json({ error: 'Error del servidor: ' + err.message }, { status: 500 });
  }
}