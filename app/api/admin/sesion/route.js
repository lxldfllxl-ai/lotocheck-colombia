import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verificarTokenAdmin } from '../../../../lib/auth';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;

  if (!token) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  const payload = await verificarTokenAdmin(token);

  if (!payload) {
    return NextResponse.json({ error: 'Sesión inválida.' }, { status: 401 });
  }

  return NextResponse.json({ email: payload.email, rol: payload.rol });
}