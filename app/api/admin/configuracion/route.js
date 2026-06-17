import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { esquemaConfiguracion, validar } from '../../../../lib/validaciones';

export async function PUT(request) {
  try {
    const body = await request.json();
    const validacion = validar(esquemaConfiguracion, body);
    if (!validacion.ok) return NextResponse.json({ error: validacion.error }, { status: 400 });

    const datos = validacion.data;
    const update = {};
    const camposPermitidos = [
      'precio_basico', 'precio_pro', 'precio_premium',
      'limite_gratis', 'limite_basico', 'limite_pro',
      'nombre_gratis', 'nombre_basico', 'nombre_pro', 'nombre_premium',
    ];

    camposPermitidos.forEach(campo => {
      if (datos[campo] !== undefined && datos[campo] !== null) {
        if (campo.startsWith('limite_')) {
          update[campo] = parseInt(datos[campo]) || 0;
        } else {
          update[campo] = datos[campo];
        }
      }
    });

    update.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('configuracion')
      .update(update)
      .eq('id', 1)
      .select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, configuracion: data });
  } catch (err) {
    console.error('Error en PUT configuracion:', err);
    return NextResponse.json({ error: 'Error del servidor: ' + err.message }, { status: 500 });
  }
}