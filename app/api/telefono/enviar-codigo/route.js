import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';
import { normalizePhoneNumber, isPhoneNumberValid, createVerificationCode, sendSmsViaTwilio } from '../../../../../lib/sms';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token || !supabaseAdmin) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'No se pudo cargar el perfil.' }, { status: 500 });
    }

    if (profile.plan === 'gratis') {
      return NextResponse.json({ error: 'Las notificaciones por SMS no están disponibles en el plan gratuito.' }, { status: 403 });
    }

    const body = await request.json();
    const telefonoRaw = (body.telefono || '').toString().trim();
    if (!telefonoRaw) {
      return NextResponse.json({ error: 'El número de teléfono es obligatorio.' }, { status: 400 });
    }

    const telefono = normalizePhoneNumber(telefonoRaw);
    if (!isPhoneNumberValid(telefono)) {
      return NextResponse.json({ error: 'Formato de teléfono no válido. Usa +57 3001234567 o 3001234567.' }, { status: 400 });
    }

    const codigo = createVerificationCode();
    const expira = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        telefono,
        telefono_verificado: false,
        telefono_otp: codigo,
        telefono_otp_expira: expira,
      })
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json({ error: 'No se pudo guardar el número de teléfono.' }, { status: 500 });
    }

    const sent = await sendSmsViaTwilio({
      to: telefono,
      body: `Tu código de verificación NotiLoto es ${codigo}. No compartas este código con nadie.`,
    });

    if (!sent) {
      return NextResponse.json({ error: 'No se pudo enviar el SMS. Revisa la configuración de Twilio.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, telefono });
  } catch (err) {
    console.error('Error enviando código de teléfono:', err);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
