import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { crearTokenAdmin } from '../../../../lib/auth';

export async function POST(request) {
  try {
    const { email, password, codigo } = await request.json();

    if (!email || !password || !codigo) {
      return NextResponse.json({ error: 'Faltan datos.' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Error de configuración del servidor.' }, { status: 500 });
    }

    // Buscar usuario admin
    const { data: admin, error: dbError } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (dbError || !admin) {
      return NextResponse.json({ error: 'Credenciales incorrectas.' }, { status: 401 });
    }

    // Verificar contraseña
    const passwordOk = bcrypt.compareSync(password, admin.password_hash);
    if (!passwordOk) {
      return NextResponse.json({ error: 'Credenciales incorrectas.' }, { status: 401 });
    }

    // Verificar código TOTP
    if (!admin.totp_activado || !admin.totp_secret) {
      return NextResponse.json({ error: '2FA no configurado para este usuario.' }, { status: 401 });
    }

    const codigoOk = authenticator.verify({ token: codigo, secret: admin.totp_secret });
    if (!codigoOk) {
      return NextResponse.json({ error: 'Código de verificación incorrecto.' }, { status: 401 });
    }

    // Crear token de sesión
    const token = await crearTokenAdmin({
      id: admin.id,
      email: admin.email,
      rol: admin.rol,
    });

    const response = NextResponse.json({ ok: true, rol: admin.rol });
    response.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 horas
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Error login admin:', err);
    return NextResponse.json({ error: 'Error del servidor.' }, { status: 500 });
  }
}