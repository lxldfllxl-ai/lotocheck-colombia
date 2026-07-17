import webPush from 'web-push';
import { supabaseAdmin } from './supabaseAdmin';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'NotiLoto <no-reply@notiloto.com>';
const VAPID_PUBLIC_KEY = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '').trim();
const VAPID_PRIVATE_KEY = (process.env.VAPID_PRIVATE_KEY || '').trim();

const webPushReady = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
if (webPushReady) {
  webPush.setVapidDetails(
    `mailto:${EMAIL_FROM.replace(/.*<|>.*/g, '')}`,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

async function sendEmailWithResend({ to, subject, text, html }) {
  if (!RESEND_API_KEY) return false;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to,
        subject,
        text,
        html,
      }),
    });
    return true;
  } catch (error) {
    console.error('Error sending email with Resend:', error);
    return false;
  }
}

export async function sendEmailNotification({ to, subject, text, html }) {
  if (RESEND_API_KEY) {
    return await sendEmailWithResend({ to, subject, text, html });
  }
  console.warn('RESEND_API_KEY not configured, skipping email send.');
  return false;
}

export async function sendPushNotification(subscription, payload) {
  if (!webPushReady) return false;
  let pushSubscription = subscription;
  if (typeof subscription === 'string') {
    try { pushSubscription = JSON.parse(subscription); } catch (err) { pushSubscription = subscription; }
  }
  try {
    await webPush.sendNotification(pushSubscription, JSON.stringify(payload));
    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}

export async function enviarNotificacionesResultado({ loteria, fecha, premio, descripcion }) {
  if (!supabaseAdmin) return { error: 'Supabase admin no configurado' };

  let usuarios = [];
  let usuariosError = null;
  const selectCols = 'id, email, notif_correo, notif_push, notif_solo_ganadores, push_subscription';
  const { data, error } = await supabaseAdmin.from('profiles').select(selectCols);
  if (error) {
    usuariosError = error;
    const fallback = await supabaseAdmin.from('profiles').select('id, email, notif_correo, notif_push, notif_solo_ganadores');
    if (fallback.error) {
      console.error('Error cargando perfiles para notificaciones:', error.message, fallback.error.message);
      return { error: error.message };
    }
    usuarios = fallback.data || [];
  } else {
    usuarios = data || [];
  }

  const { data: boletos, error: boletosError } = await supabaseAdmin
    .from('boletos')
    .select('user_id')
    .eq('loteria', loteria)
    .eq('fecha_sorteo', fecha)
    .eq('resultado', 'pendiente');

  if (boletosError) {
    console.error('Error cargando boletos para notificaciones:', boletosError.message);
  }

  const usuariosConBoletoPendiente = new Set((boletos || []).map((b) => b.user_id));
  const payload = {
    title: `Resultado ${loteria} disponible`,
    body: `Nuevo resultado para ${loteria} (${fecha}). ${descripcion}`,
    data: { loteria, fecha, premio },
  };

  const promises = usuarios.map(async (usuario) => {
    const soloGanadores = Boolean(usuario.notif_solo_ganadores);
    const tieneBoleto = usuariosConBoletoPendiente.has(usuario.id);
    if (soloGanadores && !tieneBoleto) return;

    if (usuario.notif_correo && usuario.email) {
      await sendEmailNotification({
        to: usuario.email,
        subject: `Nuevo resultado de ${loteria}`,
        text: `Hola! Ya está disponible el resultado de ${loteria} del ${fecha}. ${descripcion}`,
        html: `<p>Hola!</p><p>Ya está disponible el resultado de <strong>${loteria}</strong> del <strong>${fecha}</strong>.</p><p>${descripcion}</p><p>Ingresa a NotiLoto para revisar tus boletos.</p>`,
      });
    }

    if (usuario.notif_push && usuario.push_subscription) {
      await sendPushNotification(usuario.push_subscription, payload);
    }
  });

  await Promise.all(promises);
  return { ok: true, error: usuariosError?.message };
}

export function getVapidPublicKey() {
  return VAPID_PUBLIC_KEY;
}
