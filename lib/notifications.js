import webPush from 'web-push';
import { supabaseAdmin } from './supabaseAdmin';
import { sendSmsViaTwilio } from './sms';

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

export async function sendSmsNotification({ to, body }) {
  if (!to || !body) {
    return false;
  }

  return await sendSmsViaTwilio({ to, body });
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

export async function enviarNotificacionesResultado({ loteria, fecha, premio, descripcion, premios_json, premio_mayor }) {
  if (!supabaseAdmin) return { error: 'Supabase admin no configurado' };

  // Construir descripción enriquecida con el plan de premios si está disponible
  let descripcionFinal = descripcion || 'Revisa tus boletos pendientes en NotiLoto.';
  let premioFinal = premio || '';
  if (premios_json && Array.isArray(premios_json) && premios_json.length > 0) {
    const partes = [];
    for (const tier of premios_json) {
      const ganadores = Array.isArray(tier.ganadores) ? tier.ganadores : [];
      const nums = ganadores.map(g => g.numero).filter(Boolean).join(', ');
      if (nums) {
        partes.push(`${tier.tier_nombre}: ${nums}${tier.premio ? ' (' + tier.premio + ')' : ''}`);
      } else if (tier.tier_nombre && tier.premio) {
        partes.push(`${tier.tier_nombre}: ${tier.premio}`);
      }
    }
    if (partes.length > 0) {
      descripcionFinal = `Premios: ${partes.join(' | ')}. Revisa tus boletos en NotiLoto.`;
    }
    // Usar el premio mayor del primer tier de tipo "mayor" si no se pasó premio explícito
    if (!premioFinal) {
      const mayor = premios_json.find(t => t.tipo === 'mayor');
      if (mayor && mayor.premio) premioFinal = mayor.premio;
    }
  } else if (premio_mayor && premio_mayor.premio && !premioFinal) {
    premioFinal = premio_mayor.premio;
  }

  let usuarios = [];
  let usuariosError = null;
  const selectCols = 'id, email, plan, telefono, telefono_verificado, notif_correo, notif_push, notif_sms, notif_solo_ganadores, push_subscription_json';
  const { data, error } = await supabaseAdmin.from('profiles').select(selectCols);
  if (error) {
    usuariosError = error;
    const fallback = await supabaseAdmin.from('profiles').select('id, email, notif_correo, notif_push, notif_solo_ganadores, push_subscription_json');
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
    body: `Nuevo resultado para ${loteria} (${fecha}). ${descripcionFinal}`,
    data: { loteria, fecha, premio: premioFinal },
  };

  const promises = usuarios.map(async (usuario) => {
    const soloGanadores = Boolean(usuario.notif_solo_ganadores);
    const tieneBoleto = usuariosConBoletoPendiente.has(usuario.id);
    if (soloGanadores && !tieneBoleto) return;

    if (usuario.notif_correo && usuario.email) {
      await sendEmailNotification({
        to: usuario.email,
        subject: `Nuevo resultado de ${loteria}`,
        text: `Hola! Ya está disponible el resultado de ${loteria} del ${fecha}. ${descripcionFinal}`,
        html: `<p>Hola!</p><p>Ya está disponible el resultado de <strong>${loteria}</strong> del <strong>${fecha}</strong>.</p><p>${descripcionFinal}</p><p>Ingresa a NotiLoto para revisar tus boletos.</p>`,
      });
    }

    // Obtener todas las suscripciones push del usuario (array nuevo + fallback al campo antiguo)
    let subscriptions = [];
    if (Array.isArray(usuario.push_subscriptions) && usuario.push_subscriptions.length > 0) {
      subscriptions = usuario.push_subscriptions;
    } else if (usuario.push_subscription_json) {
      subscriptions = [usuario.push_subscription_json];
    }
    if (usuario.notif_push && subscriptions.length > 0) {
      for (const sub of subscriptions) {
        try {
          await sendPushNotification(sub, payload);
        } catch (e) {
          console.error('Error enviando push a usuario', usuario.id, e?.message || e);
        }
      }
    }

    if (usuario.notif_sms && usuario.telefono && usuario.telefono_verificado && usuario.plan !== 'gratis') {
      try {
        await sendSmsNotification({
          to: usuario.telefono,
          body: `Nuevo resultado de ${loteria} (${fecha}). ${descripcionFinal}`,
        });
      } catch (e) {
        console.error('Error enviando SMS a usuario', usuario.id, e?.message || e);
      }
    }
  });

  await Promise.all(promises);
  return { ok: true, error: usuariosError?.message };
}

export function getVapidPublicKey() {
  return VAPID_PUBLIC_KEY;
}
