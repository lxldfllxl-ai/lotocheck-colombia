import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verificarTokenAdmin } from '../../../../lib/auth';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;

  if (!token) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  const payload = await verificarTokenAdmin(token);

  if (!payload || payload.rol !== 'admin') {
    return NextResponse.json({ error: 'Acceso denegado.' }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from('admin_users')
    .select('id, email, rol, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ usuarios: data });
}