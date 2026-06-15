import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET() {
  if (!supabase) {
    return NextResponse.json({ error: 'Error de configuracion.' }, { status: 500 });
  }

  const { data, error } = await supabase
    .from('configuracion')
    .select('*')
    .eq('id', 1)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}