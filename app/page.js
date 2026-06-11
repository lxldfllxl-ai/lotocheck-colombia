'use client';
import { useState, useEffect } from 'react';
import { Search, Camera, Calendar, Ticket, RefreshCw, Plus, Trash2, Crown, LogOut, Settings, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ModalPremium from './components/ModalPremium';
import EscanerBoleto from './components/EscanerBoleto';
import Image from 'next/image';

const LIMITE_GRATIS = 2;

export default function Home() {
  const [tab, setTab] = useState('verificar');
  const [numero, setNumero] = useState('');
  const [serie, setSerie] = useState('');
  const [fraccion, setFraccion] = useState('Fracción 1/10');
  const [fechaSorteo, setFechaSorteo] = useState('');
  const [loteria, setLoteria] = useState('Lotería de Bogotá');
  const [resultado, setResultado] = useState(null);
  const [resultadosReales, setResultadosReales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [usuario, setUsuario] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [boletos, setBoletos] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [mostrarPremium, setMostrarPremium] = useState(false);
  const [mostrarEscaner, setMostrarEscaner] = useState(false);

  const loterias = [
    'Lotería de Bogotá','Lotería del Tolima','Lotería de Medellín',
    'Lotería del Huila','Lotería del Quindío','Lotería de Caldas',
    'Lotería de Manizales','Lotería del Meta','Lotería de Cundinamarca',
    'Lotería del Cauca','Lotería del Risaralda','Chance / Chontico',
  ];

  useEffect(() => { cargarResultados(); checkUsuario(); }, []);

  async function checkUsuario() {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) { setUsuario(user); await cargarPerfil(user.id); await cargarBoletos(user.id); }
  }

  async function cargarPerfil(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setPerfil(data);
  }

  async function cargarBoletos(userId) {
    const { data } = await supabase.from('boletos').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (data) setBoletos(data);
  }

  async function cargarResultados() {
    setCargando(true);
    try {
      const res = await fetch('/api/resultados');
      const data = await res.json();
      setResultadosReales(data);
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  }

  function verificar() {
    if (!numero) return;
    const sorteo = resultadosReales.find(r => r.loteria === loteria);
    if (!sorteo) { setResultado({ tipo: 'nada', titulo: 'Sin resultado disponible', premio: null, sorteo: null }); return; }
    const numIngresado = numero.padStart(4, '0');
    const serieIngresada = serie.toUpperCase();
    if (numIngresado === sorteo.numero && serieIngresada === sorteo.serie) { setResultado({ tipo: 'mayor', titulo: '¡Premio mayor!', premio: sorteo.premio, sorteo }); return; }
    if (numIngresado === sorteo.numero) { setResultado({ tipo: 'mayor', titulo: '¡Premio mayor! (sin serie)', premio: sorteo.premio, sorteo }); return; }
    if (sorteo.secos.includes(numIngresado.slice(-3))) { setResultado({ tipo: 'seco', titulo: '¡Seco! Últimas 3 cifras', premio: '$75.000', sorteo }); return; }
    if (sorteo.secos.includes(numIngresado.slice(-2))) { setResultado({ tipo: 'seco', titulo: '¡Seco! Últimas 2 cifras', premio: '$25.000', sorteo }); return; }
    if (sorteo.secos.includes(numIngresado.slice(-1))) { setResultado({ tipo: 'seco', titulo: '¡Seco! Última cifra', premio: '$3.000', sorteo }); return; }
    setResultado({ tipo: 'nada', titulo: 'Sin premio esta vez', premio: null, sorteo });
  }

  function getLimite() {
    if (!usuario) return LIMITE_GRATIS;
    if (perfil?.plan === 'pro') return Infinity;
    if (perfil?.plan === 'basico') return 10;
    return LIMITE_GRATIS;
  }

  async function guardarBoleto() {
    if (!usuario) { window.location.href = '/login'; return; }
    if (perfil?.plan !== 'basico' && perfil?.plan !== 'pro' && boletos.length >= LIMITE_GRATIS) { setMostrarPremium(true); return; }
    if (perfil?.plan === 'basico' && boletos.length >= 10) { setMostrarPremium(true); return; }
    setGuardando(true);
    const sorteo = resultadosReales.find(r => r.loteria === loteria);
    const { data, error } = await supabase.from('boletos').insert({
      user_id: usuario.id,
      loteria,
      numero: numero.padStart(4, '0'),
      serie: serie.toUpperCase(),
      fraccion,
      fecha_sorteo: fechaSorteo || sorteo?.fecha || null,
    }).select().single();
    if (!error && data) setBoletos(prev => [data, ...prev]);
    setGuardando(false);
  }

  async function eliminarBoleto(id) {
    await supabase.from('boletos').delete().eq('id', id);
    setBoletos(prev => prev.filter(b => b.id !== id));
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
    setUsuario(null); setPerfil(null); setBoletos([]);
  }

  async function toggleNotif(key) {
    const nuevo = !perfil?.[key];
    await supabase.from('profiles').update({ [key]: nuevo }).eq('id', usuario.id);
    setPerfil(prev => ({ ...prev, [key]: nuevo }));
  }

  const label = {
    fontSize: 11, fontWeight: 600, color: '#555',
    textTransform: 'uppercase', letterSpacing: 1,
    marginBottom: 8, display: 'block',
  };

  const card = {
    backgroundColor: '#1A1A1A',
    border: '1px solid #2A2A2A',
    borderRadius: 16,
    padding: 16,
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      backgroundColor: '#0A0A0A',
      padding: '10px 10px 10px',
      boxSizing: 'border-box',
    }}>

      {mostrarPremium && <ModalPremium onClose={() => setMostrarPremium(false)} />}

      {mostrarEscaner && (
        <EscanerBoleto
          onResultado={({ numero, serie }) => {
            setNumero(numero);
            setSerie(serie);
          }}
          onCerrar={() => setMostrarEscaner(false)}
        />
      )}

      <div style={{
        width: '100%',
        maxWidth: 1800,
        backgroundColor: '#111111',
        borderRadius: 24,
        overflow: 'hidden',
        border: '1px solid #222',
        boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
      }}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1a0000 0%, #2d0000 100%)',
          padding: '20px 32px 16px',
          borderBottom: '1px solid #2A0000',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Image src="/logo.png" alt="LotoCheck Logo" width={44} height={44} style={{ borderRadius: 10, objectFit: 'cover' }} />
              <div>
                <p style={{ color: '#fff', fontWeight: 700, fontSize: 20, lineHeight: 1 }}>LotoCheck</p>
                <p style={{ color: '#C41230', fontSize: 12, fontWeight: 500, marginTop: 3 }}>Colombia</p>
              </div>
            </div>
            {usuario ? (
              <button onClick={cerrarSesion} style={{ background: '#2A0000', border: '1px solid #3A0000', borderRadius: 8, padding: '7px 16px', color: '#ff6b6b', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <LogOut size={14} /> Salir
              </button>
            ) : (
              <button onClick={() => window.location.href = '/login'} style={{ background: '#C41230', border: 'none', borderRadius: 8, padding: '8px 20px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Entrar
              </button>
            )}
          </div>

          {!usuario ? (
            <div onClick={() => window.location.href = '/login'} style={{ marginTop: 14, backgroundColor: '#1a1000', border: '1px solid #2a2000', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <Crown size={14} color="#EAB308" />
              <p style={{ flex: 1, fontSize: 13, color: '#a08020' }}>Inicia sesión para guardar boletos y recibir notificaciones</p>
              <ChevronRight size={12} color="#a08020" />
            </div>
          ) : (
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 13, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400 }}>{usuario.email}</p>
              <span style={{
                fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20,
                backgroundColor: perfil?.plan === 'pro' ? '#1a0020' : perfil?.plan === 'basico' ? '#2a2000' : '#1a1a1a',
                color: perfil?.plan === 'pro' ? '#C084FC' : perfil?.plan === 'basico' ? '#EAB308' : '#555',
                border: `1px solid ${perfil?.plan === 'pro' ? '#3a0040' : perfil?.plan === 'basico' ? '#3a3000' : '#2a2a2a'}`,
              }}>
                {perfil?.plan === 'pro' ? '💎 Pro' : perfil?.plan === 'basico' ? '⭐ Básico' : `Gratis · ${boletos.length}/${LIMITE_GRATIS}`}
              </span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #1E1E1E', backgroundColor: '#111' }}>
          {[
            { id: 'verificar', label: 'Verificar', icon: Search },
            { id: 'sorteos', label: 'Sorteos', icon: Calendar },
            { id: 'boletos', label: 'Boletos', icon: Ticket },
            { id: 'ajustes', label: 'Ajustes', icon: Settings },
          ].map(({ id, label: lbl, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)} style={{
              flex: 1, padding: '16px 4px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              fontSize: 12, fontWeight: 600,
              border: 'none', borderBottom: `2px solid ${tab === id ? '#C41230' : 'transparent'}`,
              cursor: 'pointer', backgroundColor: 'transparent',
              color: tab === id ? '#C41230' : '#444',
              transition: 'all 0.2s',
            }}>
              <Icon size={20} />
              {lbl}
            </button>
          ))}
        </div>

        {/* Contenido */}
        <div style={{ padding: '32px 32px 48px' }}>

          {/* ── VERIFICAR ── */}
          {tab === 'verificar' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>

              {/* Columna izquierda */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                {/* Lotería */}
                <div>
                  <span style={label}>Lotería</span>
                  <select value={loteria} onChange={e => { setLoteria(e.target.value); setResultado(null); }} style={{
                    width: '100%', backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A',
                    borderRadius: 12, padding: '12px 14px', fontSize: 14, color: '#E0E0E0', outline: 'none',
                  }}>
                    {loterias.map(l => <option key={l} style={{ backgroundColor: '#1A1A1A' }}>{l}</option>)}
                  </select>
                </div>

                {/* Botón escanear */}
                <div
                  onClick={() => setMostrarEscaner(true)}
                  style={{ border: '1.5px dashed #C41230', borderRadius: 16, padding: '28px 20px', textAlign: 'center', backgroundColor: '#140000', cursor: 'pointer' }}
                >
                  <div style={{ width: 52, height: 52, backgroundColor: '#1E0000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <Camera size={24} color="#C41230" />
                  </div>
                  <p style={{ color: '#E0E0E0', fontWeight: 600, fontSize: 14 }}>Escanear boleto</p>
                  <p style={{ color: '#555', fontSize: 12, marginTop: 5 }}>Toca para abrir la cámara</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, height: 1, backgroundColor: '#1E1E1E' }} />
                  <span style={{ fontSize: 12, color: '#444' }}>o ingresa manualmente</span>
                  <div style={{ flex: 1, height: 1, backgroundColor: '#1E1E1E' }} />
                </div>

                {/* Número y Serie */}
                <div>
                  <span style={label}>Número — Serie</span>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="text" maxLength={4} placeholder="0000" value={numero}
                      onChange={e => { setNumero(e.target.value); setResultado(null); }}
                      style={{ flex: '1 1 160px', minWidth: 0, backgroundColor: '#1A1A1A', border: '1.5px solid #2A2A2A', borderRadius: 12, padding: '14px 8px', textAlign: 'center', fontSize: 28, fontWeight: 700, letterSpacing: 8, color: '#fff', outline: 'none' }}
                    />
                    <span style={{ color: '#333', fontSize: 24, flexShrink: 0 }}>–</span>
                    <input
                      type="text" maxLength={3} placeholder="A00" value={serie}
                      onChange={e => { setSerie(e.target.value); setResultado(null); }}
                      style={{ flex: '0 0 100px', minWidth: 100, backgroundColor: '#1A1A1A', border: '1.5px solid #2A2A2A', borderRadius: 12, padding: '14px 8px', textAlign: 'center', fontSize: 22, fontWeight: 700, letterSpacing: 5, color: '#fff', outline: 'none' }}
                    />
                  </div>
                </div>

                {/* Fracción y Fecha */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <span style={label}>Fracción</span>
                    <select
                      value={fraccion}
                      onChange={e => { setFraccion(e.target.value); setResultado(null); }}
                      style={{ width: '100%', backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 12, padding: '11px 10px', fontSize: 13, color: '#E0E0E0', outline: 'none' }}
                    >
                      {[1,2,3,4,5,6,7,8,9,10].map(f => (
                        <option key={f} style={{ backgroundColor: '#1A1A1A' }}>Fracción {f}/10</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span style={label}>Fecha sorteo</span>
                    <input
                      type="date"
                      value={fechaSorteo}
                      onChange={e => { setFechaSorteo(e.target.value); setResultado(null); }}
                      style={{ width: '100%', backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 12, padding: '11px 10px', fontSize: 13, color: '#E0E0E0', outline: 'none', colorScheme: 'dark' }}
                    />
                  </div>
                </div>

                {/* Botón verificar */}
                <button onClick={verificar} disabled={!numero || cargando} style={{
                  width: '100%', backgroundColor: '#C41230', border: 'none', borderRadius: 12,
                  padding: '16px', fontSize: 16, fontWeight: 700, color: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: (!numero || cargando) ? 0.4 : 1,
                  boxShadow: '0 4px 24px rgba(196,18,48,0.35)',
                }}>
                  <Search size={20} /> Verificar boleto
                </button>

              </div>

              {/* Columna derecha — resultado */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {!resultado ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid #1E1E1E', borderRadius: 16, padding: 40, textAlign: 'center', backgroundColor: '#141414', minHeight: 300 }}>
                    <div style={{ width: 64, height: 64, backgroundColor: '#1A1A1A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                      <Search size={28} color="#333" />
                    </div>
                    <p style={{ color: '#444', fontSize: 15, fontWeight: 500 }}>Ingresa un número para verificar</p>
                    <p style={{ color: '#333', fontSize: 13, marginTop: 8 }}>El resultado aparecerá aquí</p>
                  </div>
                ) : (
                  <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${resultado.tipo === 'mayor' ? '#1a3a1a' : resultado.tipo === 'seco' ? '#3a3000' : '#222'}` }}>
                    <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: 16, backgroundColor: resultado.tipo === 'mayor' ? '#0d1f0d' : resultado.tipo === 'seco' ? '#1a1500' : '#161616' }}>
                      <div style={{ width: 60, height: 60, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, backgroundColor: resultado.tipo === 'mayor' ? '#1a3a1a' : resultado.tipo === 'seco' ? '#2a2500' : '#222', flexShrink: 0 }}>
                        {resultado.tipo === 'mayor' ? '🏆' : resultado.tipo === 'seco' ? '🪙' : '❌'}
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 20, color: resultado.tipo === 'mayor' ? '#4ade80' : resultado.tipo === 'seco' ? '#facc15' : '#666' }}>{resultado.titulo}</p>
                        {resultado.premio && <p style={{ fontSize: 26, fontWeight: 800, color: resultado.tipo === 'mayor' ? '#4ade80' : '#facc15', marginTop: 4 }}>{resultado.premio}</p>}
                      </div>
                    </div>
                    <div style={{ padding: 20, backgroundColor: '#161616', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {[
                        { lbl: 'Tu número', val: `${numero.padStart(4,'0')} – ${serie.toUpperCase() || '—'}` },
                        { lbl: 'Fracción', val: fraccion },
                        { lbl: 'Lotería', val: loteria },
                        fechaSorteo && { lbl: 'Fecha sorteo', val: fechaSorteo },
                        resultado.sorteo && { lbl: 'Número ganador', val: `${resultado.sorteo.numero} – ${resultado.sorteo.serie}` },
                      ].filter(Boolean).map(({ lbl, val }) => (
                        <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, paddingBottom: 12, borderBottom: '1px solid #1E1E1E' }}>
                          <span style={{ color: '#555' }}>{lbl}</span>
                          <span style={{ color: '#E0E0E0', fontWeight: 600 }}>{val}</span>
                        </div>
                      ))}

                      {/* Premio por fracción */}
                      {resultado.premio && (
                        <div style={{ backgroundColor: resultado.tipo === 'mayor' ? '#0d1f0d' : '#1a1500', borderRadius: 10, padding: '10px 14px' }}>
                          <p style={{ color: '#555', fontSize: 12, marginBottom: 4 }}>Premio por tu fracción</p>
                          <p style={{ color: resultado.tipo === 'mayor' ? '#4ade80' : '#facc15', fontSize: 20, fontWeight: 800 }}>
                            {resultado.premio && fraccion ? (() => {
                              const totalStr = resultado.premio.replace(/[$\.]/g, '');
                              const total = parseInt(totalStr);
                              const frac = parseInt(fraccion.split(' ')[1]?.split('/')[0] || '1');
                              const porFraccion = Math.floor(total / 10) * frac;
                              return '$' + porFraccion.toLocaleString('es-CO');
                            })() : resultado.premio}
                          </p>
                        </div>
                      )}

                      <button onClick={guardarBoleto} disabled={guardando} style={{
                        width: '100%', marginTop: 4, backgroundColor: 'transparent',
                        border: '1.5px solid #C41230', borderRadius: 10, padding: '13px',
                        fontSize: 14, fontWeight: 700, color: '#C41230', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      }}>
                        <Plus size={16} />
                        {guardando ? 'Guardando...' : 'Guardar y recibir notificación'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── SORTEOS ── */}
          {tab === 'sorteos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={label}>Últimos resultados</span>
                <button onClick={cargarResultados} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                  <RefreshCw size={16} color="#444" />
                </button>
              </div>
              {cargando ? (
                <p style={{ textAlign: 'center', color: '#444', fontSize: 14, padding: 40 }}>Cargando...</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
                  {resultadosReales.map((s) => (
                    <div key={s.loteria} style={card}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                        <p style={{ fontSize: 15, fontWeight: 700, color: '#E0E0E0' }}>{s.loteria}</p>
                        <span style={{ fontSize: 10, backgroundColor: '#0d1f0d', color: '#4ade80', padding: '3px 8px', borderRadius: 20, fontWeight: 600, flexShrink: 0 }}>Reciente</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ backgroundColor: '#1E0000', borderRadius: 10, padding: '10px 18px', textAlign: 'center', flexShrink: 0 }}>
                          <p style={{ fontSize: 28, fontWeight: 900, color: '#C41230', letterSpacing: 4 }}>{s.numero}</p>
                          <p style={{ fontSize: 11, color: '#7a0020', fontWeight: 500, marginTop: 2 }}>Serie {s.serie}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: 12, color: '#444' }}>{s.dia} · {s.fecha}</p>
                          <p style={{ fontSize: 16, fontWeight: 700, color: '#E0E0E0', marginTop: 6 }}>{s.premio}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── MIS BOLETOS ── */}
          {tab === 'boletos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={label}>Mis boletos</span>
                {usuario && perfil?.plan !== 'pro' && (
                  <span style={{ fontSize: 12, color: '#444' }}>{boletos.length}/{getLimite()}</span>
                )}
              </div>

              {!usuario ? (
                <div style={{ textAlign: 'center', padding: '80px 0' }}>
                  <div style={{ width: 72, height: 72, backgroundColor: '#1A1A1A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <Ticket size={32} color="#333" />
                  </div>
                  <p style={{ color: '#555', fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Inicia sesión para guardar boletos</p>
                  <p style={{ color: '#333', fontSize: 13, marginBottom: 28 }}>Recibirás notificaciones con los resultados</p>
                  <button onClick={() => window.location.href = '/login'} style={{ backgroundColor: '#C41230', border: 'none', borderRadius: 10, padding: '13px 36px', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                    Iniciar sesión
                  </button>
                </div>
              ) : boletos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0' }}>
                  <div style={{ width: 72, height: 72, backgroundColor: '#1A1A1A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <Ticket size={32} color="#333" />
                  </div>
                  <p style={{ color: '#555', fontSize: 16, fontWeight: 500 }}>No tienes boletos guardados</p>
                  <p style={{ color: '#333', fontSize: 13, marginTop: 8 }}>Verifica un boleto y guárdalo</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
                  {boletos.map((b) => (
                    <div key={b.id} style={card}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <p style={{ fontSize: 12, color: '#555' }}>{b.loteria}</p>
                        <button onClick={() => eliminarBoleto(b.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#333', padding: 4 }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <p style={{ fontSize: 22, fontWeight: 900, color: '#E0E0E0', letterSpacing: 3 }}>{b.numero} – {b.serie}</p>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                          backgroundColor: b.resultado === 'ganador' ? '#0d1f0d' : b.resultado === 'perdedor' ? '#1a1a1a' : '#1a1500',
                          color: b.resultado === 'ganador' ? '#4ade80' : b.resultado === 'perdedor' ? '#444' : '#facc15',
                        }}>
                          {b.resultado === 'pendiente' ? '⏳ Pendiente' : b.resultado === 'ganador' ? '🏆 Ganador' : '❌ Sin premio'}
                        </span>
                      </div>
                      {b.fraccion && <p style={{ fontSize: 11, color: '#444' }}>{b.fraccion} · {b.fecha_sorteo || 'Sin fecha'}</p>}
                    </div>
                  ))}
                </div>
              )}

              {usuario && boletos.length >= getLimite() && perfil?.plan !== 'pro' && (
                <button onClick={() => setMostrarPremium(true)} style={{
                  width: '100%', backgroundColor: 'transparent', border: '1.5px dashed #2a2000',
                  borderRadius: 16, padding: 28, textAlign: 'center', cursor: 'pointer', marginTop: 4,
                }}>
                  <Crown size={30} color="#EAB308" style={{ margin: '0 auto 12px', display: 'block' }} />
                  <p style={{ color: '#E0E0E0', fontSize: 15, fontWeight: 700 }}>Guardar más boletos</p>
                  <p style={{ color: '#555', fontSize: 13, marginTop: 6 }}>Actualiza tu plan para guardar más</p>
                </button>
              )}
            </div>
          )}

          {/* ── AJUSTES ── */}
          {tab === 'ajustes' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {!usuario ? (
                  <div style={{ textAlign: 'center', padding: '80px 0' }}>
                    <div style={{ width: 72, height: 72, backgroundColor: '#1A1A1A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                      <Settings size={32} color="#333" />
                    </div>
                    <p style={{ color: '#555', fontSize: 15, marginBottom: 28 }}>Inicia sesión para configurar tu cuenta</p>
                    <button onClick={() => window.location.href = '/login'} style={{ backgroundColor: '#C41230', border: 'none', borderRadius: 10, padding: '13px 36px', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                      Iniciar sesión
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ background: 'linear-gradient(135deg, #1a0000, #2d0000)', borderRadius: 16, padding: 20, border: '1px solid #2A0000' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 52, height: 52, backgroundColor: '#C41230', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                          {usuario.email[0].toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{usuario.email}</p>
                          <p style={{ fontSize: 13, color: '#C41230', marginTop: 4 }}>
                            {perfil?.plan === 'pro' ? '💎 Plan Pro' : perfil?.plan === 'basico' ? '⭐ Plan Básico' : 'Plan Gratuito'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {perfil?.plan !== 'pro' && (
                      <button onClick={() => setMostrarPremium(true)} style={{
                        width: '100%', background: 'linear-gradient(135deg, #92400e, #78350f)',
                        border: '1px solid #92400e', borderRadius: 14, padding: '16px',
                        color: '#FDE68A', fontSize: 16, fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      }}>
                        <Crown size={20} /> Ver planes de suscripción
                      </button>
                    )}

                    <button onClick={cerrarSesion} style={{
                      width: '100%', backgroundColor: 'transparent',
                      border: '1px solid #222', borderRadius: 12, padding: '14px',
                      color: '#444', fontSize: 14, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}>
                      <LogOut size={16} /> Cerrar sesión
                    </button>
                  </>
                )}
              </div>

              {usuario && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 16, overflow: 'hidden' }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: 1, padding: '16px 18px 14px', borderBottom: '1px solid #222' }}>
                      Notificaciones
                    </p>
                    {[
                      { key: 'notif_correo', lbl: 'Por correo electrónico', icon: '✉️', desc: 'Recibe resultados en tu correo' },
                      { key: 'notif_push', lbl: 'Notificaciones push', icon: '🔔', desc: 'Alertas en tu celular' },
                      { key: 'notif_solo_ganadores', lbl: 'Solo si gané', icon: '🏆', desc: 'Solo notifica premios y secos' },
                    ].map(({ key, lbl, icon, desc }) => (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderTop: '1px solid #1E1E1E' }}>
                        <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 14, color: '#E0E0E0', fontWeight: 500 }}>{lbl}</p>
                          <p style={{ fontSize: 12, color: '#444', marginTop: 4 }}>{desc}</p>
                        </div>
                        <button onClick={() => toggleNotif(key)} style={{
                          position: 'relative', width: 52, height: 30, borderRadius: 999,
                          border: 'none', cursor: 'pointer', flexShrink: 0,
                          backgroundColor: perfil?.[key] ? '#C41230' : '#2A2A2A',
                          transition: 'background-color 0.2s',
                        }}>
                          <div style={{
                            position: 'absolute', top: 5,
                            left: perfil?.[key] ? 27 : 5,
                            width: 20, height: 20,
                            backgroundColor: '#fff', borderRadius: '50%',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                            transition: 'left 0.2s',
                          }} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}