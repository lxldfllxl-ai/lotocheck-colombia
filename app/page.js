'use client';
import { useState, useEffect } from 'react';
import { Search, Camera, Calendar, History, Ticket, RefreshCw } from 'lucide-react';

export default function Home() {
  const [tab, setTab] = useState('verificar');
  const [numero, setNumero] = useState('');
  const [serie, setSerie] = useState('');
  const [loteria, setLoteria] = useState('Lotería de Bogotá');
  const [resultado, setResultado] = useState(null);
  const [resultadosReales, setResultadosReales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [historial, setHistorial] = useState([]);

  const loterias = [
    'Lotería de Bogotá','Lotería del Tolima','Lotería de Medellín',
    'Lotería del Huila','Lotería del Quindío','Lotería de Caldas',
    'Lotería de Manizales','Lotería del Meta','Lotería de Cundinamarca',
    'Lotería del Cauca','Lotería del Risaralda','Chance / Chontico',
  ];

  useEffect(() => {
    cargarResultados();
  }, []);

  async function cargarResultados() {
    setCargando(true);
    try {
      const res = await fetch('/api/resultados');
      const data = await res.json();
      setResultadosReales(data);
    } catch (e) {
      console.error('Error cargando resultados', e);
    } finally {
      setCargando(false);
    }
  }

  function verificar() {
    if (!numero) return;

    // Busca el resultado de la lotería seleccionada
    const sorteo = resultadosReales.find(r => r.loteria === loteria);

    if (!sorteo) {
      setResultado({ tipo: 'nada', titulo: 'Sin resultado disponible', premio: null, sorteo: null });
      return;
    }

    const numIngresado = numero.padStart(4, '0');
    const serieIngresada = serie.toUpperCase();

    // Premio mayor: número y serie exactos
    if (numIngresado === sorteo.numero && serieIngresada === sorteo.serie) {
      setResultado({
        tipo: 'mayor',
        titulo: '¡Premio mayor!',
        premio: sorteo.premio,
        sorteo,
      });
      guardarHistorial(numIngresado, serieIngresada, loteria, '🏆 Premio mayor');
      return;
    }

    // Premio mayor sin serie: número exacto cualquier serie
    if (numIngresado === sorteo.numero) {
      setResultado({
        tipo: 'mayor',
        titulo: '¡Premio mayor! (sin serie)',
        premio: sorteo.premio,
        sorteo,
      });
      guardarHistorial(numIngresado, serieIngresada, loteria, '🏆 Mayor sin serie');
      return;
    }

    // Secos: últimas 3, 2 o 1 cifras
    const ultimas3 = numIngresado.slice(-3);
    const ultimas2 = numIngresado.slice(-2);
    const ultima1 = numIngresado.slice(-1);

    if (sorteo.secos.includes(ultimas3)) {
      setResultado({
        tipo: 'seco',
        titulo: '¡Seco! Últimas 3 cifras',
        premio: '$75.000',
        sorteo,
      });
      guardarHistorial(numIngresado, serieIngresada, loteria, '🪙 Seco 3 cifras');
      return;
    }

    if (sorteo.secos.includes(ultimas2)) {
      setResultado({
        tipo: 'seco',
        titulo: '¡Seco! Últimas 2 cifras',
        premio: '$25.000',
        sorteo,
      });
      guardarHistorial(numIngresado, serieIngresada, loteria, '🪙 Seco 2 cifras');
      return;
    }

    if (sorteo.secos.includes(ultima1)) {
      setResultado({
        tipo: 'seco',
        titulo: '¡Seco! Última cifra',
        premio: '$3.000',
        sorteo,
      });
      guardarHistorial(numIngresado, serieIngresada, loteria, '🪙 Seco 1 cifra');
      return;
    }

    // Sin premio
    setResultado({ tipo: 'nada', titulo: 'Sin premio esta vez', premio: null, sorteo });
    guardarHistorial(numIngresado, serieIngresada, loteria, '❌ Sin premio');
  }

  function guardarHistorial(num, ser, lot, res) {
    const nuevo = { num: `${num} – ${ser}`, loteria: lot, resultado: res, fecha: new Date().toLocaleDateString('es-CO') };
    setHistorial(prev => [nuevo, ...prev.slice(0, 19)]);
  }

  const colorBorde = (tipo) =>
    tipo === 'mayor' ? 'border-green-200' : tipo === 'seco' ? 'border-yellow-200' : 'border-gray-200';
  const colorFondo = (tipo) =>
    tipo === 'mayor' ? 'bg-green-50' : tipo === 'seco' ? 'bg-yellow-50' : 'bg-gray-50';
  const colorTexto = (tipo) =>
    tipo === 'mayor' ? 'text-green-800' : tipo === 'seco' ? 'text-yellow-800' : 'text-gray-500';
  const colorPremio = (tipo) =>
    tipo === 'mayor' ? 'text-green-700' : 'text-yellow-700';

  return (
    <div className="min-h-screen flex justify-center bg-gray-100">
      <div className="w-full max-w-sm bg-white flex flex-col min-h-screen shadow-xl">

        {/* Header */}
        <div className="bg-red-700 px-4 py-3 flex items-center gap-2">
          <Ticket className="text-white" size={22} />
          <span className="text-white font-semibold text-lg flex-1 text-center">LotoCheck Colombia</span>
          <button onClick={cargarResultados}>
            <RefreshCw className={`text-white ${cargando ? 'animate-spin' : ''}`} size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'verificar', label: 'Verificar', icon: Search },
            { id: 'sorteos', label: 'Sorteos', icon: Calendar },
            { id: 'historial', label: 'Historial', icon: History },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 py-2 flex flex-col items-center gap-1 text-xs font-medium border-b-2 transition-colors ${
                tab === id ? 'border-red-700 text-red-700' : 'border-transparent text-gray-400'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-4">

          {/* VERIFICAR */}
          {tab === 'verificar' && (
            <div className="flex flex-col gap-3">

              {cargando && (
                <div className="text-center py-4 text-sm text-gray-400">
                  Cargando resultados...
                </div>
              )}

              <p className="text-xs text-gray-500 font-medium">Selecciona la lotería</p>
              <select
                value={loteria}
                onChange={e => { setLoteria(e.target.value); setResultado(null); }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
              >
                {loterias.map(l => <option key={l}>{l}</option>)}
              </select>

              {/* Zona escaneo */}
              <div className="border-2 border-dashed border-red-300 rounded-xl p-6 text-center cursor-pointer hover:bg-red-50 transition-colors">
                <Camera className="text-red-600 mx-auto mb-2" size={36} />
                <p className="font-medium text-sm text-gray-700">Escanear boleto</p>
                <p className="text-xs text-gray-400 mt-1">Próximamente disponible</p>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-400">
                <div className="flex-1 h-px bg-gray-200" />
                o ingresa manualmente
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Número — Serie</p>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="0000"
                    value={numero}
                    onChange={e => { setNumero(e.target.value); setResultado(null); }}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-center text-xl font-semibold tracking-widest"
                  />
                  <span className="text-gray-300 text-xl">–</span>
                  <input
                    type="text"
                    maxLength={3}
                    placeholder="A00"
                    value={serie}
                    onChange={e => { setSerie(e.target.value); setResultado(null); }}
                    className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-center text-lg font-semibold tracking-widest"
                  />
                </div>
              </div>

              <button
                onClick={verificar}
                disabled={!numero || cargando}
                className="w-full bg-red-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-red-800 transition-colors disabled:opacity-50"
              >
                <Search size={18} />
                Verificar boleto
              </button>

              {resultado && (
                <div className={`rounded-xl border overflow-hidden ${colorBorde(resultado.tipo)}`}>
                  <div className={`px-4 py-3 ${colorFondo(resultado.tipo)}`}>
                    <p className={`font-semibold text-base ${colorTexto(resultado.tipo)}`}>
                      {resultado.tipo === 'mayor' ? '🏆' : resultado.tipo === 'seco' ? '🪙' : '❌'} {resultado.titulo}
                    </p>
                  </div>
                  <div className="px-4 py-3 bg-white flex flex-col gap-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Número</span>
                      <span className="font-medium">{numero.padStart(4,'0')} – {serie.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Lotería</span>
                      <span className="font-medium">{loteria}</span>
                    </div>
                    {resultado.sorteo && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Número ganador</span>
                        <span className="font-medium">{resultado.sorteo.numero} – {resultado.sorteo.serie}</span>
                      </div>
                    )}
                    {resultado.premio && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Premio</span>
                        <span className={`font-bold text-base ${colorPremio(resultado.tipo)}`}>
                          {resultado.premio}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SORTEOS */}
          {tab === 'sorteos' && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-gray-500 font-medium">Últimos resultados</p>
              {cargando ? (
                <p className="text-center text-sm text-gray-400 py-4">Cargando...</p>
              ) : resultadosReales.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-4">No hay resultados disponibles</p>
              ) : (
                resultadosReales.map((s) => (
                  <div key={s.loteria} className="border border-gray-100 rounded-xl p-3 flex items-center gap-3 bg-white shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                      <Ticket className="text-red-600" size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{s.loteria}</p>
                      <p className="text-xs text-gray-400">{s.dia} {s.fecha}</p>
                      <p className="text-xs font-semibold text-gray-700 mt-0.5">
                        {s.numero} – {s.serie}
                        <span className="text-red-600 ml-2">{s.premio}</span>
                      </p>
                    </div>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Reciente</span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* HISTORIAL */}
          {tab === 'historial' && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-gray-500 font-medium">Boletos verificados</p>
              {historial.length === 0 ? (
                <div className="text-center py-8">
                  <History className="text-gray-300 mx-auto mb-2" size={36} />
                  <p className="text-sm text-gray-400">Aún no has verificado boletos</p>
                </div>
              ) : (
                historial.map((h, i) => (
                  <div key={i} className="border border-gray-100 rounded-xl p-3 flex items-center gap-3 bg-white shadow-sm">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{h.num}</p>
                      <p className="text-xs text-gray-400">{h.loteria} · {h.fecha}</p>
                    </div>
                    <span className={`text-sm font-semibold ${
                      h.resultado.includes('Premio') || h.resultado.includes('Mayor') ? 'text-green-700' :
                      h.resultado.includes('Seco') ? 'text-yellow-700' : 'text-gray-400'
                    }`}>{h.resultado}</span>
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}