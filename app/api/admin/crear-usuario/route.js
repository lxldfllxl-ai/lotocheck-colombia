import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { verificarTokenAdmin } from '../../../../lib/auth';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

function generarSecretoTOTP() {
  const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secreto = '';
  const randomBytes = crypto.randomBytes(20);
  for (let i = 0; i < 32; i++) {
    secreto += base32chars[randomBytes[i % 20] % 32];
  }
  return secreto;
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const payload = await verificarTokenAdmin(token);

    if (!payload || payload.rol !== 'admin') {
      return NextResponse.json({ error: 'Solo administradores pueden crear usuarios.' }, { status: 403 });
    }

    const { email, password, rol } = await request.json();

    if (!email || !password || !rol) {
      return NextResponse.json({ error: 'Faltan datos.' }, { status: 400 });
    }

    if (!['admin', 'scraper'].includes(rol)) {
      return NextResponse.json({ error: 'Rol invalido.' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'La contrasena debe tener al menos 8 caracteres.' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Error de configuracion del servidor.' }, { status: 500 });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const totpSecret = generarSecretoTOTP();

    const { data, error } = await supabaseAdmin
      .from('admin_users')
      .insert({
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        totp_secret: totpSecret,
        totp_activado: true,
        rol,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Ya existe un usuario con ese correo.' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Error al crear usuario: ' + error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      email: data.email,
      rol: data.rol,
      totpSecret,
    });
  } catch (err) {
    console.error('Error crear usuario admin:', err.message);
    return NextResponse.json({ error: 'Error del servidor: ' + err.message }, { status: 500 });
  }
}