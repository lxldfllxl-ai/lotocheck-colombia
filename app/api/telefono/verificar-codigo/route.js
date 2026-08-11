import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { normalizePhoneNumber, isPhoneNumberValid } from '../../../../lib/sms';

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
      .select('plan, telefono, telefono_otp, telefono_otp_expira')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'No se pudo cargar el perfil.' }, { status: 500 });
    }

    if (profile.plan === 'gratis') {
      return NextResponse.json({ error: 'Las notificaciones por SMS no están disponibles en el plan gratuito.' }, { status: 403 });
    }

    const body = await request.json();
    const codigo = (body.codigo || '').toString().trim();
    if (!codigo) {
      return NextResponse.json({ error: 'El código de verificación es obligatorio.' }, { status: 400 });
    }

    if (!profile.telefono || !isPhoneNumberValid(profile.telefono)) {
      return NextResponse.json({ error: 'No hay un número de teléfono válido para verificar.' }, { status: 400 });
    }

    if (!profile.telefono_otp || profile.telefono_otp !== codigo) {
      return NextResponse.json({ error: 'Código incorrecto.' }, { status: 400 });
    }

    if (!profile.telefono_otp_expira || new Date(profile.telefono_otp_expira) < new Date()) {
      return NextResponse.json({ error: 'El código ha expirado. Solicita uno nuevo.' }, { status: 400 });
    }

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        telefono_verificado: true,
        telefono_otp: null,
        telefono_otp_expira: null,
      })
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json({ error: 'No se pudo verificar el teléfono.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, telefono: profile.telefono });
  } catch (err) {
    console.error('Error verificando código de teléfono:', err);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
