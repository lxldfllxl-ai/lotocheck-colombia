import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET(request) {
  if (!supabase) return NextResponse.json({ error: 'Sin conexion.' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const loteria = searchParams.get('loteria');
  const fecha = searchParams.get('fecha');

  if (!loteria || !fecha) {
    return NextResponse.json({ error: 'Faltan parametros loteria y fecha.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('sorteos_historico')
    .select('*')
    .eq('loteria', loteria)
    .eq('fecha', fecha)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sorteo: data });
}