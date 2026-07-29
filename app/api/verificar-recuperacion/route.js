import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

const MENSAJE_GENERICO = { ok: true, mensaje: 'Si los datos coinciden con una cuenta registrada, recibirás un correo con instrucciones.' };

export async function POST(request) {
  try {
    const { email, fechaNacimiento } = await request.json();

    if (!email || !fechaNacimiento) {
      return NextResponse.json({ error: 'Completa todos los campos.' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Error de configuracion del servidor.' }, { status: 500 });
    }

    const { data: usuarios, error: errorBusqueda } = await supabaseAdmin.auth.admin.listUsers();
    if (errorBusqueda) {
      console.error('Error buscando usuario:', errorBusqueda);
      return NextResponse.json(MENSAJE_GENERICO);
    }

    const usuarioEncontrado = usuarios.users.find(u => u.email?.toLowerCase() === email.toLowerCase().trim());

    if (!usuarioEncontrado) {
      return NextResponse.json(MENSAJE_GENERICO);
    }

    const { data: perfil, error: errorPerfil } = await supabaseAdmin
      .from('profiles')
      .select('fecha_nacimiento')
      .eq('id', usuarioEncontrado.id)
      .single();

    const fechaGuardada = perfil?.fecha_nacimiento || usuarioEncontrado.user_metadata?.fecha_nacimiento;

    if (errorPerfil || !fechaGuardada || fechaGuardada !== fechaNacimiento) {
      return NextResponse.json(MENSAJE_GENERICO);
    }

    const { error: errorEnvio } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://lotocheck-colombia.vercel.app'}/recuperar/nueva-contrasena`,
    });

    if (errorEnvio) {
      console.error('Error enviando correo de recuperacion:', errorEnvio);
    }

    return NextResponse.json(MENSAJE_GENERICO);
  } catch (err) {
    console.error('Error en /api/verificar-recuperacion:', err);
    return NextResponse.json(MENSAJE_GENERICO);
  }
}