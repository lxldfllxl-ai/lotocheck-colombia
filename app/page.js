'use client';
import { useState, useEffect } from 'react';
import { Search, Calendar, Ticket, Settings, Home, Camera, RefreshCw, Plus, Trash2, Crown, LogOut, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ModalPremium from './components/ModalPremium';
import EscanerBoleto from './components/EscanerBoleto';
import Image from 'next/image';

const LIMITE_GRATIS = 2;

export default function HomePage() {
  const [tab, setTab] = useState('inicio');
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

  const noticias = [
    {
      id: 1,
      titulo: 'Nuevas loterías agregadas',
      desc: 'Ahora puedes verificar loterías del Cauca y Risaralda en tiempo real.',
      fecha: 'Hoy',
      icono: '✨',
    },
    {
      id: 2,
      titulo: 'Escanea tus boletos con IA',
      desc: 'Uso de inteligencia artificial para detectar números automáticamente.',
      fecha: 'Hace 3 días',
      icono: '📸',
    },
    {
      id: 3,
      titulo: 'Notificaciones mejoradas',
      desc: 'Recibe alertas al instante cuando ganes premios en tus loterías favoritas.',
      fecha: 'Hace 1 semana',
      icono: '🔔',
    },
    {
      id: 4,
      titulo: 'Actualizamos nuestra seguridad',
      desc: 'Encriptación de extremo a extremo para proteger tus datos personales.',
      fecha: 'Hace 2 semanas',
      icono: '🔐',
    },
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

  const label = { fontSize: 11, fontWeight: 600, color: '#64B5F6', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, display: 'block' };
  const card = { backgroundColor: '#0a4a8f', border: '1px solid #0d5a9f', borderRadius: 16, padding: 16 };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#064089', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '10px', boxSizing: 'border-box' }}>

      {mostrarPremium && <ModalPremium onClose={() => setMostrarPremium(false)} />}
      {mostrarEscaner && <EscanerBoleto onResultado={({ numero, serie }) => { setNumero(numero); setSerie(serie); }} onCerrar={() => setMostrarEscaner(false)} />}

      <div style={{ width: '100%', maxWidth: 1800, backgroundColor: '#0a3a7f', borderRadius: 24, overflow: 'hidden', border: '1px solid #0d5a9f', boxShadow: '0 24px 80px rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #064089 0%, #0a4a8f 100%)', padding: '20px 32px 16px', borderBottom: '1px solid #0d5a9f' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Image src="/logo.png" alt="NotiCheck Logo" width={44} height={44} style={{ borderRadius: 10, objectFit: 'cover' }} />
              <div>
                <p style={{ color: '#fff', fontWeight: 700, fontSize: 20, lineHeight: 1 }}>NotiCheck</p>
                <p style={{ color: '#F59E0B', fontSize: 12, fontWeight: 500, marginTop: 3 }}>Colombia</p>
              </div>
            </div>
            {usuario ? (
              <button onClick={cerrarSesion} style={{ background: '#1a3a5f', border: '1px solid #0d5a9f', borderRadius: 8, padding: '7px 16px', color: '#64B5F6', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <LogOut size={14} /> Salir
              </button>
            ) : (
              <button onClick={() => window.location.href = '/login'} style={{ background: '#F59E0B', border: 'none', borderRadius: 8, padding: '8px 20px', color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Entrar
              </button>
            )}
          </div>

          {!usuario ? (
            <div onClick={() => window.location.href = '/login'} style={{ marginTop: 14, backgroundColor: '#1a3a5f', border: '1px solid #0d5a9f', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <Crown size={14} color="#F59E0B" />
              <p style={{ flex: 1, fontSize: 13, color: '#90CAF9' }}>Inicia sesión para guardar boletos y recibir notificaciones</p>
              <ChevronRight size={12} color="#90CAF9" />
            </div>
          ) : (
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 13, color: '#64B5F6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400 }}>{usuario.email}</p>
              <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, backgroundColor: perfil?.plan === 'pro' ? '#1a3a5f' : perfil?.plan === 'basico' ? '#2a2a1a' : '#1a1a2a', color: perfil?.plan === 'pro' ? '#90CAF9' : perfil?.plan === 'basico' ? '#F59E0B' : '#64B5F6', border: `1px solid ${perfil?.plan === 'pro' ? '#0d5a9f' : perfil?.plan === 'basico' ? '#3a3a1a' : '#1a1a3a'}` }}>
                {perfil?.plan === 'pro' ? '💎 Pro' : perfil?.plan === 'basico' ? '⭐ Básico' : `Gratis · ${boletos.length}/${LIMITE_GRATIS}`}
              </span>
            </div>
          )}
        </div>

        {/* Contenido Principal */}
        <div style={{ flex: 1, padding: '32px 32px 100px', overflowY: 'auto' }}>

          {/* ── INICIO ── */}
          {tab === 'inicio' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>

              {/* Hero */}
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#F59E0B', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Bienvenido a NotiCheck</p>
                <p style={{ color: '#fff', fontSize: 40, fontWeight: 800, lineHeight: 1.1, marginBottom: 12 }}>Verifica tus loterías<br />y recibe noticias</p>
                <p style={{ color: '#90CAF9', fontSize: 15, maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
                  La plataforma más confiable para verificar resultados de loterías colombianas. Escanea, verifica y recibe notificaciones en tiempo real.
                </p>
              </div>

              {/* CTA */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => setTab('verificar')} style={{ backgroundColor: '#F59E0B', border: 'none', borderRadius: 12, padding: '14px 32px', color: '#000', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Search size={18} /> Verificar boleto
                </button>
                {!usuario && (
                  <button onClick={() => window.location.href = '/login'} style={{ backgroundColor: 'transparent', border: '1.5px solid #F59E0B', borderRadius: 12, padding: '13px 32px', color: '#F59E0B', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                    Crear cuenta gratis
                  </button>
                )}
              </div>

              {/* Noticias */}
              <div>
                <p style={{ color: '#fff', fontSize: 24, fontWeight: 700, marginBottom: 20 }}>📰 Últimas noticias</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                  {noticias.map(n => (
                    <div key={n.id} style={{ ...card, cursor: 'pointer', transition: 'all 0.2s', _hover: { borderColor: '#F59E0B', backgroundColor: '#0b5a9f' } }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <span style={{ fontSize: 28 }}>{n.icono}</span>
                        <span style={{ fontSize: 11, backgroundColor: '#064089', color: '#64B5F6', padding: '3px 8px', borderRadius: 20, fontWeight: 600 }}>{n.fecha}</span>
                      </div>
                      <p style={{ color: '#fff', fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{n.titulo}</p>
                      <p style={{ color: '#90CAF9', fontSize: 13, lineHeight: 1.5 }}>{n.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                {[
                  { num: '12+', lbl: 'Loterías disponibles' },
                  { num: '5M+', lbl: 'Boletos verificados' },
                  { num: '24/7', lbl: 'Verificación en vivo' },
                  { num: '100%', lbl: 'Datos encriptados' },
                ].map((s, i) => (
                  <div key={i} style={{ ...card, textAlign: 'center', padding: 24 }}>
                    <p style={{ fontSize: 32, fontWeight: 800, color: '#F59E0B' }}>{s.num}</p>
                    <p style={{ fontSize: 13, color: '#90CAF9', marginTop: 6 }}>{s.lbl}</p>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* ── VERIFICAR ── */}
          {tab === 'verificar' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>

              {/* Columna izquierda */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                <div>
                  <span style={label}>Lotería</span>
                  <select value={loteria} onChange={e => { setLoteria(e.target.value); setResultado(null); }} style={{ width: '100%', backgroundColor: '#0a4a8f', border: '1px solid #0d5a9f', borderRadius: 12, padding: '12px 14px', fontSize: 14, color: '#E0F2FE', outline: 'none' }}>
                    {loterias.map(l => <option key={l} style={{ backgroundColor: '#0a4a8f' }}>{l}</option>)}
                  </select>
                </div>

                <div onClick={() => setMostrarEscaner(true)} style={{ border: '1.5px dashed #F59E0B', borderRadius: 16, padding: '28px 20px', textAlign: 'center', backgroundColor: '#1a3a5f', cursor: 'pointer' }}>
                  <div style={{ width: 52, height: 52, backgroundColor: '#064089', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <Camera size={24} color="#F59E0B" />
                  </div>
                  <p style={{ color: '#E0F2FE', fontWeight: 600, fontSize: 14 }}>Escanear boleto</p>
                  <p style={{ color: '#64B5F6', fontSize: 12, marginTop: 5 }}>Toca para abrir la cámara</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, height: 1, backgroundColor: '#0d5a9f' }} />
                  <span style={{ fontSize: 12, color: '#64B5F6' }}>o ingresa manualmente</span>
                  <div style={{ flex: 1, height: 1, backgroundColor: '#0d5a9f' }} />
                </div>

                <div>
                  <span style={label}>Número — Serie</span>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="text" maxLength={4} placeholder="0000" value={numero}
                      onChange={e => { setNumero(e.target.value); setResultado(null); }}
                      style={{ flex: '1 1 160px', minWidth: 0, backgroundColor: '#064089', border: '1.5px solid #0d5a9f', borderRadius: 12, padding: '14px 8px', textAlign: 'center', fontSize: 28, fontWeight: 700, letterSpacing: 8, color: '#fff', outline: 'none' }}
                    />
                    <span style={{ color: '#0d5a9f', fontSize: 24, flexShrink: 0 }}>–</span>
                    <input
                      type="text" maxLength={3} placeholder="A00" value={serie}
                      onChange={e => { setSerie(e.target.value); setResultado(null); }}
                      style={{ flex: '0 0 100px', minWidth: 100, backgroundColor: '#064089', border: '1.5px solid #0d5a9f', borderRadius: 12, padding: '14px 8px', textAlign: 'center', fontSize: 22, fontWeight: 700, letterSpacing: 5, color: '#fff', outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <span style={label}>Fracción</span>
                    <select value={fraccion} onChange={e => { setFraccion(e.target.value); setResultado(null); }} style={{ width: '100%', backgroundColor: '#0a4a8f', border: '1px solid #0d5a9f', borderRadius: 12, padding: '11px 10px', fontSize: 13, color: '#E0F2FE', outline: 'none' }}>
                      {[1,2,3,4,5,6,7,8,9,10].map(f => <option key={f} style={{ backgroundColor: '#0a4a8f' }}>Fracción {f}/10</option>)}
                    </select>
                  </div>
                  <div>
                    <span style={label}>Fecha sorteo</span>
                    <input type="date" value={fechaSorteo} onChange={e => { setFechaSorteo(e.target.value); setResultado(null); }} style={{ width: '100%', backgroundColor: '#0a4a8f', border: '1px solid #0d5a9f', borderRadius: 12, padding: '11px 10px', fontSize: 13, color: '#E0F2FE', outline: 'none', colorScheme: 'dark' }} />
                  </div>
                </div>

                <button onClick={verificar} disabled={!numero || cargando} style={{ width: '100%', backgroundColor: '#F59E0B', border: 'none', borderRadius: 12, padding: '16px', fontSize: 16, fontWeight: 700, color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: (!numero || cargando) ? 0.4 : 1, boxShadow: '0 4px 24px rgba(245,158,11,0.25)' }}>
                  <Search size={20} /> Verificar boleto
                </button>

              </div>

              {/* Columna derecha — resultado */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {!resultado ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid #0d5a9f', borderRadius: 16, padding: 40, textAlign: 'center', backgroundColor: '#064089', minHeight: 300 }}>
                    <div style={{ width: 64, height: 64, backgroundColor: '#0a4a8f', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                      <Search size={28} color="#0d5a9f" />
                    </div>
                    <p style={{ color: '#90CAF9', fontSize: 15, fontWeight: 500 }}>Ingresa un número para verificar</p>
                    <p style={{ color: '#64B5F6', fontSize: 13, marginTop: 8 }}>El resultado aparecerá aquí</p>
                  </div>
                ) : (
                  <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${resultado.tipo === 'mayor' ? '#10B981' : resultado.tipo === 'seco' ? '#F59E0B' : '#0d5a9f'}` }}>
                    <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: 16, backgroundColor: resultado.tipo === 'mayor' ? '#0a3a2a' : resultado.tipo === 'seco' ? '#1a3a1a' : '#0a3a5f' }}>
                      <div style={{ width: 60, height: 60, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, backgroundColor: resultado.tipo === 'mayor' ? '#0a5a4a' : resultado.tipo === 'seco' ? '#1a5a2a' : '#0a4a7f', flexShrink: 0 }}>
                        {resultado.tipo === 'mayor' ? '🏆' : resultado.tipo === 'seco' ? '🪙' : '❌'}
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 20, color: resultado.tipo === 'mayor' ? '#10B981' : resultado.tipo === 'seco' ? '#F59E0B' : '#90CAF9' }}>{resultado.titulo}</p>
                        {resultado.premio && <p style={{ fontSize: 26, fontWeight: 800, color: resultado.tipo === 'mayor' ? '#10B981' : '#F59E0B', marginTop: 4 }}>{resultado.premio}</p>}
                      </div>
                    </div>
                    <div style={{ padding: 20, backgroundColor: '#064089', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {[
                        { lbl: 'Tu número', val: `${numero.padStart(4,'0')} – ${serie.toUpperCase() || '—'}` },
                        { lbl: 'Fracción', val: fraccion },
                        { lbl: 'Lotería', val: loteria },
                        fechaSorteo && { lbl: 'Fecha sorteo', val: fechaSorteo },
                        resultado.sorteo && { lbl: 'Número ganador', val: `${resultado.sorteo.numero} – ${resultado.sorteo.serie}` },
                      ].filter(Boolean).map(({ lbl, val }) => (
                        <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, paddingBottom: 12, borderBottom: '1px solid #0d5a9f' }}>
                          <span style={{ color: '#64B5F6' }}>{lbl}</span>
                          <span style={{ color: '#E0F2FE', fontWeight: 600 }}>{val}</span>
                        </div>
                      ))}

                      {resultado.premio && (
                        <div style={{ backgroundColor: resultado.tipo === 'mayor' ? '#0a3a2a' : '#1a3a1a', borderRadius: 10, padding: '10px 14px' }}>
                          <p style={{ color: '#64B5F6', fontSize: 12, marginBottom: 4 }}>Premio por tu fracción</p>
                          <p style={{ color: resultado.tipo === 'mayor' ? '#10B981' : '#F59E0B', fontSize: 20, fontWeight: 800 }}>
                            {resultado.premio && fraccion ? (() => { const totalStr = resultado.premio.replace(/[$\.]/g, ''); const total = parseInt(totalStr); const frac = parseInt(fraccion.split(' ')[1]?.split('/')[0] || '1'); const porFraccion = Math.floor(total / 10) * frac; return '$' + porFraccion.toLocaleString('es-CO'); })() : resultado.premio}
                          </p>
                        </div>
                      )}

                      <button onClick={guardarBoleto} disabled={guardando} style={{ width: '100%', marginTop: 4, backgroundColor: 'transparent', border: '1.5px solid #F59E0B', borderRadius: 10, padding: '13px', fontSize: 14, fontWeight: 700, color: '#F59E0B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <Plus size={16} /> {guardando ? 'Guardando...' : 'Guardar y notificar'}
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
                  <RefreshCw size={16} color="#64B5F6" />
                </button>
              </div>
              {cargando ? (
                <p style={{ textAlign: 'center', color: '#64B5F6', fontSize: 14, padding: 40 }}>Cargando...</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
                  {resultadosReales.map((s) => (
                    <div key={s.loteria} style={{ ...card }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                        <p style={{ fontSize: 15, fontWeight: 700, color: '#E0F2FE' }}>{s.loteria}</p>
                        <span style={{ fontSize: 10, backgroundColor: '#0a5a4a', color: '#10B981', padding: '3px 8px', borderRadius: 20, fontWeight: 600, flexShrink: 0 }}>Reciente</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ backgroundColor: '#1a3a5f', borderRadius: 10, padding: '10px 18px', textAlign: 'center', flexShrink: 0 }}>
                          <p style={{ fontSize: 28, fontWeight: 900, color: '#F59E0B', letterSpacing: 4 }}>{s.numero}</p>
                          <p style={{ fontSize: 11, color: '#F59E0B', fontWeight: 500, marginTop: 2, opacity: 0.7 }}>Serie {s.serie}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: 12, color: '#64B5F6' }}>{s.dia} · {s.fecha}</p>
                          <p style={{ fontSize: 16, fontWeight: 700, color: '#E0F2FE', marginTop: 6 }}>{s.premio}</p>
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
                {usuario && perfil?.plan !== 'pro' && <span style={{ fontSize: 12, color: '#64B5F6' }}>{boletos.length}/{getLimite()}</span>}
              </div>

              {!usuario ? (
                <div style={{ textAlign: 'center', padding: '80px 0' }}>
                  <div style={{ width: 72, height: 72, backgroundColor: '#0a4a8f', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <Ticket size={32} color="#0d5a9f" />
                  </div>
                  <p style={{ color: '#90CAF9', fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Inicia sesión para guardar boletos</p>
                  <p style={{ color: '#64B5F6', fontSize: 13, marginBottom: 28 }}>Recibirás notificaciones con los resultados</p>
                  <button onClick={() => window.location.href = '/login'} style={{ backgroundColor: '#F59E0B', border: 'none', borderRadius: 10, padding: '13px 36px', color: '#000', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                    Iniciar sesión
                  </button>
                </div>
              ) : boletos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0' }}>
                  <div style={{ width: 72, height: 72, backgroundColor: '#0a4a8f', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <Ticket size={32} color="#0d5a9f" />
                  </div>
                  <p style={{ color: '#90CAF9', fontSize: 16, fontWeight: 500 }}>No tienes boletos guardados</p>
                  <p style={{ color: '#64B5F6', fontSize: 13, marginTop: 8 }}>Verifica un boleto y guárdalo</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
                  {boletos.map((b) => (
                    <div key={b.id} style={{ ...card }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <p style={{ fontSize: 12, color: '#64B5F6' }}>{b.loteria}</p>
                        <button onClick={() => eliminarBoleto(b.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0d5a9f', padding: 4 }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <p style={{ fontSize: 22, fontWeight: 900, color: '#E0F2FE', letterSpacing: 3 }}>{b.numero} – {b.serie}</p>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, backgroundColor: b.resultado === 'ganador' ? '#0a5a4a' : b.resultado === 'perdedor' ? '#0a3a5f' : '#1a3a2a', color: b.resultado === 'ganador' ? '#10B981' : b.resultado === 'perdedor' ? '#64B5F6' : '#F59E0B' }}>
                          {b.resultado === 'pendiente' ? '⏳ Pendiente' : b.resultado === 'ganador' ? '🏆 Ganador' : '❌ Sin premio'}
                        </span>
                      </div>
                      {b.fraccion && <p style={{ fontSize: 11, color: '#64B5F6' }}>{b.fraccion} · {b.fecha_sorteo || 'Sin fecha'}</p>}
                    </div>
                  ))}
                </div>
              )}

              {usuario && boletos.length >= getLimite() && perfil?.plan !== 'pro' && (
                <button onClick={() => setMostrarPremium(true)} style={{ width: '100%', backgroundColor: 'transparent', border: '1.5px dashed #1a3a5f', borderRadius: 16, padding: 28, textAlign: 'center', cursor: 'pointer', marginTop: 4 }}>
                  <Crown size={30} color="#F59E0B" style={{ margin: '0 auto 12px', display: 'block' }} />
                  <p style={{ color: '#E0F2FE', fontSize: 15, fontWeight: 700 }}>Guardar más boletos</p>
                  <p style={{ color: '#64B5F6', fontSize: 13, marginTop: 6 }}>Actualiza tu plan para guardar más</p>
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
                    <div style={{ width: 72, height: 72, backgroundColor: '#0a4a8f', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                      <Settings size={32} color="#0d5a9f" />
                    </div>
                    <p style={{ color: '#90CAF9', fontSize: 15, marginBottom: 28 }}>Inicia sesión para configurar tu cuenta</p>
                    <button onClick={() => window.location.href = '/login'} style={{ backgroundColor: '#F59E0B', border: 'none', borderRadius: 10, padding: '13px 36px', color: '#000', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                      Iniciar sesión
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ background: 'linear-gradient(135deg, #064089, #0a4a8f)', borderRadius: 16, padding: 20, border: '1px solid #0d5a9f' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 52, height: 52, backgroundColor: '#F59E0B', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#000', flexShrink: 0 }}>
                          {usuario.email[0].toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{usuario.email}</p>
                          <p style={{ fontSize: 13, color: '#F59E0B', marginTop: 4 }}>
                            {perfil?.plan === 'pro' ? '💎 Plan Pro' : perfil?.plan === 'basico' ? '⭐ Plan Básico' : 'Plan Gratuito'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {perfil?.plan !== 'pro' && (
                      <button onClick={() => setMostrarPremium(true)} style={{ width: '100%', background: 'linear-gradient(135deg, #1a5a2a, #0a4a1a)', border: '1px solid #0d5a2f', borderRadius: 14, padding: '16px', color: '#10B981', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <Crown size={20} /> Ver planes
                      </button>
                    )}

                    <button onClick={cerrarSesion} style={{ width: '100%', backgroundColor: 'transparent', border: '1px solid #0d5a9f', borderRadius: 12, padding: '14px', color: '#64B5F6', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <LogOut size={16} /> Cerrar sesión
                    </button>
                  </>
                )}
              </div>

              {usuario && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ backgroundColor: '#0a4a8f', border: '1px solid #0d5a9f', borderRadius: 16, overflow: 'hidden' }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#64B5F6', textTransform: 'uppercase', letterSpacing: 1, padding: '16px 18px 14px', borderBottom: '1px solid #0d5a9f' }}>Notificaciones</p>
                    {[
                      { key: 'notif_correo', lbl: 'Por correo electrónico', icon: '✉️', desc: 'Recibe resultados en tu correo' },
                      { key: 'notif_push', lbl: 'Notificaciones push', icon: '🔔', desc: 'Alertas en tu celular' },
                      { key: 'notif_solo_ganadores', lbl: 'Solo si gané', icon: '🏆', desc: 'Solo notifica premios y secos' },
                    ].map(({ key, lbl, icon, desc }) => (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderTop: '1px solid #0d5a9f' }}>
                        <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 14, color: '#E0F2FE', fontWeight: 500 }}>{lbl}</p>
                          <p style={{ fontSize: 12, color: '#64B5F6', marginTop: 4 }}>{desc}</p>
                        </div>
                        <button onClick={() => toggleNotif(key)} style={{ position: 'relative', width: 52, height: 30, borderRadius: 999, border: 'none', cursor: 'pointer', flexShrink: 0, backgroundColor: perfil?.[key] ? '#F59E0B' : '#0d5a9f', transition: 'background-color 0.2s' }}>
                          <div style={{ position: 'absolute', top: 5, left: perfil?.[key] ? 27 : 5, width: 20, height: 20, backgroundColor: '#fff', borderRadius: '50%', boxShadow: '0 1px 4px rgba(0,0,0,0.4)', transition: 'left 0.2s' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Menú Inferior */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#064089', borderTop: '1px solid #0d5a9f', display: 'flex', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ width: '100%', maxWidth: 1800, display: 'flex', justifyContent: 'space-around' }}>
            {[
              { id: 'inicio', label: 'Inicio', icon: Home },
              { id: 'verificar', label: 'Verificar', icon: Search },
              { id: 'sorteos', label: 'Sorteos', icon: Calendar },
              { id: 'boletos', label: 'Boletos', icon: Ticket },
              { id: 'ajustes', label: 'Ajustes', icon: Settings },
            ].map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)} style={{
                flex: 1, padding: '14px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                fontSize: 11, fontWeight: 600, border: 'none', borderTop: tab === id ? '3px solid #F59E0B' : 'none',
                cursor: 'pointer', backgroundColor: 'transparent', color: tab === id ? '#F59E0B' : '#64B5F6',
                transition: 'all 0.2s',
              }}>
                <Icon size={20} />
                {label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}