import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verificarTokenAdmin } from '../../../../../lib/auth';
import { sendEmailNotification } from '../../../../../lib/notifications';

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;
    const payload = token ? await verificarTokenAdmin(token) : null;

    if (!payload || payload.rol !== 'admin') {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const body = await request.json();
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
  } catch (err) {
    console.error('Error prueba notificacion admin:', err);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
