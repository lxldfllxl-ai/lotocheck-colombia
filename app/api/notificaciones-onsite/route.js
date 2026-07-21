import { supabaseAdmin } from '../../../lib/supabaseAdmin';

// GET: obtener notificaciones onsite del usuario autenticado
export async function GET(req) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    if (!token || !supabaseAdmin) {
      return Response.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return Response.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('notificaciones_onsite')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const unreadCount = data.filter(n => !n.leida).length;

    return Response.json({ notificaciones: data, noLeidas: unreadCount });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// POST: marcar notificaciones como leídas
export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    if (!token || !supabaseAdmin) {
      return Response.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return Response.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { ids, marcarTodas } = body;

    if (marcarTodas) {
      const { error } = await supabaseAdmin
        .from('notificaciones_onsite')
        .update({ leida: true })
        .eq('user_id', user.id)
        .eq('leida', false);

      if (error) {
        return Response.json({ error: error.message }, { status: 500 });
      }
      return Response.json({ ok: true });
    }

    if (ids && Array.isArray(ids) && ids.length > 0) {
      const { error } = await supabaseAdmin
        .from('notificaciones_onsite')
        .update({ leida: true })
        .eq('user_id', user.id)
        .in('id', ids);

      if (error) {
        return Response.json({ error: error.message }, { status: 500 });
      }
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Se requiere ids[] o marcarTodas' }, { status: 400 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}