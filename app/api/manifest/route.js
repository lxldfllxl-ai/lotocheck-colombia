import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      name: 'NotiLoto',
      short_name: 'NotiLoto',
      description: 'Verifica tus boletos de lotería colombiana y recibe notificaciones de resultados',
      start_url: '/',
      display: 'standalone',
      background_color: '#0B1F3A',
      theme_color: '#FFD700',
      gcm_sender_id: '103953800507',
      icons: [
        { src: '/logo.png', sizes: '192x192', type: 'image/png' },
        { src: '/logo.png', sizes: '512x512', type: 'image/png' },
      ],
    },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/manifest+json',
      },
    }
  );
}