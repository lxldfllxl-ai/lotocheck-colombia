import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verificarTokenAdmin } from '../../../../../lib/auth';
import { sendEmailNotification, sendPushNotification } from '../../../../../lib/notifications';
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;
    const payload = token ? await verificarTokenAdmin(token) : null;

    if (!payload || payload.rol !== 'admin') {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const body = await request.json();
    const tipo = (body.tipo || 'email').toString();

    if (tipo === 'email') {
      const email = (body.email || '').trim();
      if (!email) {
        return NextResponse.json({ error: 'Correo de prueba requerido.' }, { status: 400 });
      }

      const sent = await sendEmailNotification({
        to: email,
        subject: 'Prueba NotiLoto',
        text: 'Este es un correo de prueba de NotiLoto. Si lo recibes, la configuración de Resend funciona correctamente.',
        html: `<p>Este es un correo de prueba de <strong>NotiLoto</strong>.</p><p>Si lo recibes, la configuración de <strong>Resend</strong> funciona correctamente.</p>`,
      });

      if (!sent) {
        return NextResponse.json({ error: 'No se pudo enviar el correo de prueba. Revisa la configuración de Resend.' }, { status: 500 });
      }

      return NextResponse.json({ ok: true });
    }

    if (tipo === 'push') {
      // Si la petición incluye una suscripción en el body, la usamos para enviar push directamente
      const subscription = body.subscription || null;
      if (subscription) {
        try {
          const sent = await sendPushNotification(subscription, { title: 'Prueba NotiLoto', body: 'Esta es una notificación push de prueba.' });
          return NextResponse.json({ ok: !!sent, enviados: sent ? 1 : 0 });
        } catch (e) {
          console.error('Error enviando push a suscripción proporcionada:', e);
          return NextResponse.json({ error: 'Error enviando push a la suscripción proporcionada.' }, { status: 500 });
        }
      }

      if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase admin no configurado' }, { status: 500 });
      // Enviar push a todos los perfiles que tengan una suscripción válida
      const { data: usuarios, error: errUsuarios } = await supabaseAdmin.from('profiles').select('id, push_subscription, push_notifications, push_notification');
      if (errUsuarios) return NextResponse.json({ error: errUsuarios.message }, { status: 500 });

      let enviados = 0;
      for (const u of usuarios || []) {
        const subscription = u.push_subscription || u.push_notifications || u.push_notification;
        if (!subscription) continue;
        try {
          await sendPushNotification(subscription, { title: 'Prueba NotiLoto', body: 'Esta es una notificación push de prueba.' });
          enviados += 1;
        } catch (e) {
          console.error('Error enviando push a usuario', u.id, e?.message || e);
        }
      }

      return NextResponse.json({ ok: true, enviados });
    }

    return NextResponse.json({ error: 'Tipo no soportado' }, { status: 400 });
  } catch (err) {
    console.error('Error prueba notificacion admin:', err);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
