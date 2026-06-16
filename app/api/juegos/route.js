import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET() {
  if (!supabase) return NextResponse.json({ juegos: [] });

  const { data, error } = await supabase
    .from('juegos')
    .select('*')
    .eq('activo', true)
    .order('orden', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ juegos: data });
}