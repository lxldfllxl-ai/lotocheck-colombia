import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { esquemaResultado, validar } from '../../../../lib/validaciones';
import { enviarNotificacionesResultado } from '../../../../lib/notifications';

export async function POST(request) {
  try {
    const body = await request.json();
    const validacion = validar(esquemaResultado, body);
    if (!validacion.ok) return NextResponse.json({ error: validacion.error }, { status: 400 });
    const { loteria, numero, serie, premio, fecha, secos, premios, signo, quinta } = validacion.data;

    // Construir premio_mayor y premios_json
    const premioMayor = { numero, serie, premio };
    const premiosJson = premios && premios.length > 0
      ? premios.map(p => ({
          tipo: p.tipo,
          nombre: p.tier_nombre,
          posicion: p.tier_posicion,
          cifras: p.cifras,
          ganadores: p.ganadores.map(g => ({ numero: g.numero, serie: g.serie, premio: g.premio })),
        }))
      : [];

    // Upsert en resultados
    const { data: ultimo, error: errorUltimo } = await supabaseAdmin
      .from('resultados')
      .upsert({
        loteria, numero, serie, premio, fecha, secos, signo, quinta,
        premio_mayor: premioMayor,
        premios_json: premiosJson,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'loteria' })
      .select().single();

    if (errorUltimo) return NextResponse.json({ error: errorUltimo.message }, { status: 500 });

    // Insertar ganadores individuales en premios_resultado
    if (premios && premios.length > 0) {
      // Eliminar premios anteriores de este resultado
      await supabaseAdmin.from('premios_resultado').delete().eq('resultado_id', ultimo.id);

      const filasPremios = [];
      for (const tier of premios) {
        for (const g of (tier.ganadores || [])) {
          filasPremios.push({
            resultado_id: ultimo.id,
            tier_nombre: tier.tier_nombre,
            tier_posicion: Number(tier.tier_posicion) || 1,
            numero_ganador: g.numero,
            serie_ganador: g.serie || '',
            premio: g.premio || tier.premio || '',
            tipo_premio: tier.tipo || 'seco',
            cifras: Number(tier.cifras) || 0,
          });
        }
      }
      if (filasPremios.length > 0) {
        const { error: errorPremios } = await supabaseAdmin.from('premios_resultado').insert(filasPremios);
        if (errorPremios) console.error('Error insertando premios_resultado:', errorPremios.message);
      }
    }

    // Upsert en sorteos_historico
    const { error: errorHistorico } = await supabaseAdmin
      .from('sorteos_historico')
      .upsert({
        loteria, numero, serie, premio, fecha, secos, signo, quinta,
        premio_mayor: premioMayor,
        premios_json: premiosJson,
      }, { onConflict: 'loteria,fecha' });

    if (errorHistorico) return NextResponse.json({ error: errorHistorico.message }, { status: 500 });

    const noti = await enviarNotificacionesResultado({
      loteria,
      fecha,
      premio,
      descripcion: 'Revisa tus boletos pendientes en NotiLoto.',
      premios_json: premiosJson,
      premio_mayor: premioMayor,
    });
    if (noti?.error) console.error('Error enviando notificaciones:', noti.error);

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