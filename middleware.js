import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

async function verificarToken(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Rutas publicas que no requieren proteccion
  const rutasPublicas = ['/asd', '/api/admin/login'];
  if (rutasPublicas.includes(pathname)) {
    return NextResponse.next();
  }

  const esRutaPanel = pathname.startsWith('/asd/panel');
  const esApiAdmin = pathname.startsWith('/api/admin');

  if (esRutaPanel || esApiAdmin) {
    const token = request.cookies.get('admin_session')?.value;
    const payload = await verificarToken(token);

    if (!payload) {
      if (esApiAdmin) {
        return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/asd', request.url));
    }

    // Rutas siempre solo-admin, sin importar el metodo
    const rutasSiempreAdmin = ['/api/admin/configuracion', '/api/admin/usuarios', '/api/admin/crear-usuario'];
    const esSiempreAdmin = rutasSiempreAdmin.some(r => pathname.startsWith(r));

    // /api/admin/juegos: GET es para admin y scraper, POST/PUT/DELETE solo admin
    const esJuegosEscritura = pathname.startsWith('/api/admin/juegos') && method !== 'GET';

    if ((esSiempreAdmin || esJuegosEscritura) && payload.rol !== 'admin') {
      return NextResponse.json({ error: 'Acceso denegado. Se requiere rol de administrador.' }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/asd/:path*', '/api/admin/:path*'],
};