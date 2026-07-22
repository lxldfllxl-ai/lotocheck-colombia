import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

const RESPALDO = [
  { loteria: 'Loteria de Bogota', numero: '4821', serie: 'B34', premio: '$15.000.000.000', secos: ['821', '21', '1'], dia: 'Jueves', fecha: '' },
  { loteria: 'Loteria de Medellin', numero: '2047', serie: 'A12', premio: '$12.000.000.000', secos: ['047', '47', '7'], dia: 'Viernes', fecha: '' },
  { loteria: 'Loteria del Tolima', numero: '6391', serie: 'C05', premio: '$9.000.000.000', secos: ['391', '91', '1'], dia: 'Lunes', fecha: '' },
  { loteria: 'Loteria del Huila', numero: '8824', serie: 'B01', premio: '$6.000.000.000', secos: ['824', '24', '4'], dia: 'Sabado', fecha: '' },
  { loteria: 'Loteria del Quindio', numero: '3156', serie: 'A07', premio: '$5.000.000.000', secos: ['156', '56', '6'], dia: 'Sabado', fecha: '' },
  { loteria: 'Loteria de Caldas', numero: '7203', serie: 'D02', premio: '$4.000.000.000', secos: ['203', '03', '3'], dia: 'Miercoles', fecha: '' },
  { loteria: 'Loteria de Manizales', numero: '5548', serie: 'A11', premio: '$4.000.000.000', secos: ['548', '48', '8'], dia: 'Miercoles', fecha: '' },
  { loteria: 'Loteria del Meta', numero: '1872', serie: 'B08', premio: '$3.000.000.000', secos: ['872', '72', '2'], dia: 'Viernes', fecha: '' },
];

export async function GET() {
  try {
    if (!supabase) throw new Error('Sin conexion a Supabase');

    const { data, error } = await supabase.from('resultados').select('*');
    if (error) throw error;

    if (!data || data.length === 0) {
      return NextResponse.json(RESPALDO.map(r => ({ ...r, premios_json: [], premio_mayor: null, dia: r.dia })));
    }

    const formateados = data.map(r => ({
      loteria: r.loteria,
      numero: r.numero,
      serie: r.serie,
      premio: r.premio,
      secos: r.secos || [],
      premios_json: r.premios_json || [],
      premio_mayor: r.premio_mayor || null,
      fecha: r.fecha,
      dia: r.fecha,
      signo: r.signo,
      quinta: r.quinta,
    }));

    return NextResponse.json(formateados);
  } catch (err) {
    console.error('Error cargando resultados, usando respaldo:', err.message);
    return NextResponse.json(RESPALDO.map(r => ({ ...r, premios_json: [], premio_mayor: null })));
  }
}