'use client';
import { useState, useEffect } from 'react';
import { Search, Calendar, Ticket, Settings, Home, Camera, RefreshCw, Plus, Trash2, Crown, LogOut, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ModalPremium from './components/ModalPremium';
import EscanerBoleto from './components/EscanerBoleto';
import Image from 'next/image';

export default function Home() {
  const [tab, setTab] = useState('inicio');
  const [juegos, setJuegos] = useState([]);
  const [juegoSeleccionado, setJuegoSeleccionado] = useState(null);
  const [numero, setNumero] = useState('');
  const [serie, setSerie] = useState('');
  const [fraccion, setFraccion] = useState('1');
  const [signo, setSigno] = useState('');
  const [valorApuesta, setValorApuesta] = useState('');
  const [fechaSorteo, setFechaSorteo] = useState('');
  const [resultado, setResultado] = useState(null);
  const [verificando, setVerificando] = useState(false);
  const [resultadosReales, setResultadosReales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [usuario, setUsuario] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [boletos, setBoletos] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [mostrarPremium, setMostrarPremium] = useState(false);
  const [mostrarEscaner, setMostrarEscaner] = useState(false);
  const [configLimites, setConfigLimites] = useState({ gratis: 2, basico: 10, pro: 25 });

  const noticias = [
    { id: 1, titulo: 'Nuevas loterias agregadas', desc: 'Ahora puedes verificar Colorloto y juegos Astro en tiempo real.', fecha: 'Hoy', icono: '✨' },
    { id: 2, titulo: 'Escanea tus boletos con IA', desc: 'Usa inteligencia artificial para leer tus boletos automaticamente.', fecha: 'Hace 3 dias', icono: '📸' },
    { id: 3, titulo: 'Notificaciones mejoradas', desc: 'Recibe alertas al instante cuando ganes premios en tus loterias favoritas.', fecha: 'Hace 1 semana', icono: '🔔' },
    { id: 4, titulo: 'Actualizamos nuestra seguridad', desc: 'Encriptacion de extremo a extremo para proteger tus datos personales.', fecha: 'Hace 2 semanas', icono: '🔐' },
  ];

  useEffect(() => {
    cargarJuegos();
    cargarResultados();
    checkUsuario();
    fetch('/api/configuracion').then(res => res.json()).then(data => {
      if (!data.error) setConfigLimites({ gratis: data.limite_gratis, basico: data.limite_basico, pro: data.limite_pro });
    }).catch(() => {});
  }, []);

  async function cargarJuegos() {
    try {
      const res = await fetch('/api/juegos');
      const data = await res.json();
      if (data.juegos && data.juegos.length > 0) {
        setJuegos(data.juegos);
        setJuegoSeleccionado(data.juegos[0]);
      }
    } catch (e) { console.error(e); }
  }

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

  function cambiarJuego(nombreJuego) {
    const j = juegos.find(j => j.nombre === nombreJuego);
    setJuegoSeleccionado(j);
    setResultado(null);
    setNumero(''); setSerie(''); setFraccion('1'); setSigno('');
  }

  async function verificar() {
    if (!numero || !juegoSeleccionado) return;
    if (!fechaSorteo) { setResultado({ tipo: 'error', titulo: 'Selecciona la fecha del sorteo', premio: null }); return; }

    setVerificando(true);
    const numIngresado = numero.padStart(juegoSeleccionado.numero_digits || 4, '0');
    const serieIngresada = serie.toUpperCase();

    try {
      // 1. Buscar primero en el historico por fecha exacta (boleto antiguo)
      const resHist = await fetch(`/api/sorteos-historico?loteria=${encodeURIComponent(juegoSeleccionado.nombre)}&fecha=${fechaSorteo}`);
      const dataHist = await resHist.json();

      if (dataHist.sorteo) {
        evaluarContraSorteo(dataHist.sorteo, numIngresado, serieIngresada, true);
        setVerificando(false);
        return;
      }

      // 2. Si no hay historico para esa fecha, comparar contra el ultimo resultado conocido
      const sorteo = resultadosReales.find(r => r.loteria === juegoSeleccionado.nombre);
      if (!sorteo) {
        setResultado({ tipo: 'pendiente', titulo: 'Sorteo aun no disponible', premio: null, sorteo: null });
        setVerificando(false);
        return;
      }

      // Si la fecha del ultimo resultado coincide con la ingresada, evaluamos; si no, es pendiente
      if (sorteo.fecha === fechaSorteo) {
        evaluarContraSorteo(sorteo, numIngresado, serieIngresada, false);
      } else {
        setResultado({ tipo: 'pendiente', titulo: 'Sorteo pendiente de realizarse', premio: null, sorteo: null });
      }
    } catch (e) {
      console.error(e);
      setResultado({ tipo: 'error', titulo: 'Error al verificar', premio: null });
    } finally {
      setVerificando(false);
    }
  }

  function evaluarContraSorteo(sorteo, numIngresado, serieIngresada, esHistorico) {
    const tipoJuego = juegoSeleccionado.tipo;

    if (tipoJuego === 'astro') {
      if (numIngresado === sorteo.numero) {
        setResultado({ tipo: 'mayor', titulo: 'Numero exacto', premio: sorteo.premio, sorteo, esHistorico });
        return;
      }
      setResultado({ tipo: 'nada', titulo: 'Sin premio esta vez', premio: null, sorteo, esHistorico });
      return;
    }

    if (tipoJuego === 'chance' || tipoJuego === 'quinta' || tipoJuego === 'chance_millonario') {
      if (numIngresado === sorteo.numero) {
        setResultado({ tipo: 'mayor', titulo: '¡Numero ganador!', premio: sorteo.premio, sorteo, esHistorico });
        return;
      }
      setResultado({ tipo: 'nada', titulo: 'Sin premio esta vez', premio: null, sorteo, esHistorico });
      return;
    }

    // Loteria tradicional: numero+serie, secos
    if (numIngresado === sorteo.numero && (!sorteo.serie || serieIngresada === sorteo.serie)) {
      setResultado({ tipo: 'mayor', titulo: '¡Premio mayor!', premio: sorteo.premio, sorteo, esHistorico });
      return;
    }
    if (numIngresado === sorteo.numero) {
      setResultado({ tipo: 'mayor', titulo: '¡Premio mayor! (sin serie)', premio: sorteo.premio, sorteo, esHistorico });
      return;
    }
    const secos = sorteo.secos || [];
    if (secos.includes(numIngresado.slice(-3))) { setResultado({ tipo: 'seco', titulo: '¡Seco! Ultimas 3 cifras', premio: '$75.000', sorteo, esHistorico }); return; }
    if (secos.includes(numIngresado.slice(-2))) { setResultado({ tipo: 'seco', titulo: '¡Seco! Ultimas 2 cifras', premio: '$25.000', sorteo, esHistorico }); return; }
    if (secos.includes(numIngresado.slice(-1))) { setResultado({ tipo: 'seco', titulo: '¡Seco! Ultima cifra', premio: '$3.000', sorteo, esHistorico }); return; }
    setResultado({ tipo: 'nada', titulo: 'Sin premio esta vez', premio: null, sorteo, esHistorico });
  }

  function getLimite() {
    if (!usuario) return configLimites.gratis || 2;
    if (perfil?.plan === 'premium') return Infinity;
    if (perfil?.plan === 'pro') return configLimites.pro || 25;
    if (perfil?.plan === 'basico') return configLimites.basico || 10;
    return configLimites.gratis || 2;
  }

  function boletosPendientes() {
    return boletos.filter(b => b.resultado === 'pendiente');
  }

  async function guardarBoleto() {
    if (!usuario) { window.location.href = '/login'; return; }
    const limite = getLimite();
    if (boletosPendientes().length >= limite) { setMostrarPremium(true); return; }

    setGuardando(true);

    // Si ya sabemos el resultado (porque verificamos y existe sorteo), guardamos directo con ese resultado
    let resultadoFinal = 'pendiente';
    let premioFinal = null;
    if (resultado && (resultado.tipo === 'mayor' || resultado.tipo === 'seco')) {
      resultadoFinal = 'ganador';
      premioFinal = resultado.premio;
    } else if (resultado && resultado.tipo === 'nada') {
      resultadoFinal = 'perdedor';
    }

    const { data, error } = await supabase.from('boletos').insert({
      user_id: usuario.id,
      loteria: juegoSeleccionado.nombre,
      numero: numero.padStart(juegoSeleccionado.numero_digits || 4, '0'),
      serie: serie.toUpperCase(),
      fraccion: fraccion || '',
      fecha_sorteo: fechaSorteo,
      resultado: resultadoFinal,
      premio: premioFinal,
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

  function manejarResultadoEscaner({ loteria, numero: num, serie: ser, fraccion: frac, valorApuesta: val, fechaSorteo: fecha, signo: sig }) {
    if (loteria) {
      const j = juegos.find(j => j.nombre.toLowerCase() === loteria.toLowerCase());
      if (j) setJuegoSeleccionado(j);
    }
    if (num) setNumero(num);
    if (ser) setSerie(ser);
    if (frac) setFraccion(frac);
    if (val) setValorApuesta(val);
    if (fecha) setFechaSorteo(fecha);
    if (sig) setSigno(sig);
  }

  const label = { fontSize: 11, fontWeight: 600, color: '#64B5F6', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, display: 'block' };
  const card = { backgroundColor: '#0a4a8f', border: '1px solid #0d5a9f', borderRadius: 16, padding: 16 };

  const pendientes = boletosPendientes();
  const historicos = boletos.filter(b => b.resultado !== 'pendiente');

  const porCategoria = juegos.reduce((acc, j) => {
    if (!acc[j.categoria]) acc[j.categoria] = [];
    acc[j.categoria].push(j);
    return acc;
  }, {});

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#064089', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '10px', boxSizing: 'border-box' }}>

      {mostrarPremium && <ModalPremium onClose={() => setMostrarPremium(false)} />}
      {mostrarEscaner && <EscanerBoleto onResultado={manejarResultadoEscaner} onCerrar={() => setMostrarEscaner(false)} />}

      <div style={{ width: '100%', maxWidth: 1800, backgroundColor: '#0a3a7f', borderRadius: 24, overflow: 'hidden', border: '1px solid #0d5a9f', boxShadow: '0 24px 80px rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #064089 0%, #0a4a8f 100%)', padding: '20px 32px 16px', borderBottom: '1px solid #0d5a9f' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Image src="/logo.png" alt="NotiLoto Logo" width={44} height={44} style={{ borderRadius: 10, objectFit: 'cover' }} />
              <div>
                <p style={{ color: '#fff', fontWeight: 700, fontSize: 20, lineHeight: 1 }}>NotiLoto</p>
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
              <p style={{ flex: 1, fontSize: 13, color: '#90CAF9' }}>Inicia sesion para guardar boletos y recibir notificaciones</p>
              <ChevronRight size={12} color="#90CAF9" />
            </div>
          ) : (
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 13, color: '#64B5F6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400 }}>{usuario.email}</p>
              <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, backgroundColor: perfil?.plan === 'premium' ? '#2a1a3a' : perfil?.plan === 'pro' ? '#1a3a5f' : perfil?.plan === 'basico' ? '#2a2a1a' : '#1a1a2a', color: perfil?.plan === 'premium' ? '#C084FC' : perfil?.plan === 'pro' ? '#90CAF9' : perfil?.plan === 'basico' ? '#F59E0B' : '#64B5F6', border: `1px solid ${perfil?.plan === 'premium' ? '#3a1a4a' : perfil?.plan === 'pro' ? '#0d5a9f' : perfil?.plan === 'basico' ? '#3a3a1a' : '#1a1a3a'}` }}>
                {perfil?.plan === 'premium' ? '🌟 Premium' : perfil?.plan === 'pro' ? '💎 Pro' : perfil?.plan === 'basico' ? '⭐ Basico' : `Gratis · ${pendientes.length}/${getLimite()}`}
              </span>
            </div>
          )}
        </div>

        {/* Contenido Principal */}
        <div style={{ flex: 1, padding: '32px 32px 100px', overflowY: 'auto' }}>

          {/* ── INICIO ── */}
          {tab === 'inicio' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#F59E0B', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Bienvenido a NotiLoto</p>
                <p style={{ color: '#fff', fontSize: 40, fontWeight: 800, lineHeight: 1.1, marginBottom: 12 }}>Verifica tus loterias<br />y recibe noticias</p>
                <p style={{ color: '#90CAF9', fontSize: 15, maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
                  La plataforma mas confiable para verificar resultados de loterias y chances colombianos. Escanea, verifica y recibe notificaciones en tiempo real.
                </p>
              </div>

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

              <div>
                <p style={{ color: '#fff', fontSize: 24, fontWeight: 700, marginBottom: 20 }}>📰 Ultimas noticias</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                  {noticias.map(n => (
                    <div key={n.id} style={{ ...card, cursor: 'pointer' }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                {[
                  { num: `${juegos.length}+`, lbl: 'Juegos disponibles' },
                  { num: '5M+', lbl: 'Boletos verificados' },
                  { num: '24/7', lbl: 'Verificacion en vivo' },
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
          {tab === 'verificar' && juegoSeleccionado && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                <div>
                  <span style={label}>Juego</span>
                  <select value={juegoSeleccionado.nombre} onChange={e => cambiarJuego(e.target.value)} style={{ width: '100%', backgroundColor: '#0a4a8f', border: '1px solid #0d5a9f', borderRadius: 12, padding: '12px 14px', fontSize: 14, color: '#E0F2FE', outline: 'none' }}>
                    {Object.entries(porCategoria).map(([cat, lista]) => (
                      <optgroup key={cat} label={cat} style={{ backgroundColor: '#0a4a8f' }}>
                        {lista.map(j => <option key={j.id} value={j.nombre} style={{ backgroundColor: '#0a4a8f' }}>{j.nombre}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div onClick={() => setMostrarEscaner(true)} style={{ border: '1.5px dashed #F59E0B', borderRadius: 16, padding: '28px 20px', textAlign: 'center', backgroundColor: '#1a3a5f', cursor: 'pointer' }}>
                  <div style={{ width: 52, height: 52, backgroundColor: '#064089', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <Camera size={24} color="#F59E0B" />
                  </div>
                  <p style={{ color: '#E0F2FE', fontWeight: 600, fontSize: 14 }}>Escanear boleto con IA</p>
                  <p style={{ color: '#64B5F6', fontSize: 12, marginTop: 5 }}>Toca para tomar una foto</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, height: 1, backgroundColor: '#0d5a9f' }} />
                  <span style={{ fontSize: 12, color: '#64B5F6' }}>o ingresa manualmente</span>
                  <div style={{ flex: 1, height: 1, backgroundColor: '#0d5a9f' }} />
                </div>

                <div>
                  <span style={label}>Numero {juegoSeleccionado.serie_digits > 0 && '— Serie'}</span>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="text" maxLength={juegoSeleccionado.numero_digits || 4} placeholder="0000" value={numero}
                      onChange={e => { setNumero(e.target.value); setResultado(null); }}
                      style={{ flex: '1 1 160px', minWidth: 0, backgroundColor: '#064089', border: '1.5px solid #0d5a9f', borderRadius: 12, padding: '14px 8px', textAlign: 'center', fontSize: 28, fontWeight: 700, letterSpacing: 8, color: '#fff', outline: 'none' }}
                    />
                    {juegoSeleccionado.serie_digits > 0 && (
                      <>
                        <span style={{ color: '#0d5a9f', fontSize: 24, flexShrink: 0 }}>–</span>
                        <input
                          type="text" maxLength={3} placeholder="A00" value={serie}
                          onChange={e => { setSerie(e.target.value); setResultado(null); }}
                          style={{ flex: '0 0 100px', minWidth: 100, backgroundColor: '#064089', border: '1.5px solid #0d5a9f', borderRadius: 12, padding: '14px 8px', textAlign: 'center', fontSize: 22, fontWeight: 700, letterSpacing: 5, color: '#fff', outline: 'none' }}
                        />
                      </>
                    )}
                  </div>
                </div>

                {juegoSeleccionado.usa_signo && (
                  <div>
                    <span style={label}>Signo zodiacal</span>
                    <select value={signo} onChange={e => { setSigno(e.target.value); setResultado(null); }} style={{ width: '100%', backgroundColor: '#0a4a8f', border: '1px solid #0d5a9f', borderRadius: 12, padding: '11px 10px', fontSize: 13, color: '#E0F2FE', outline: 'none' }}>
                      <option value="" style={{ backgroundColor: '#0a4a8f' }}>Selecciona signo</option>
                      {['Aries','Tauro','Geminis','Cancer','Leo','Virgo','Libra','Escorpio','Sagitario','Capricornio','Acuario','Piscis'].map(s => <option key={s} style={{ backgroundColor: '#0a4a8f' }}>{s}</option>)}
                    </select>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: juegoSeleccionado.tiene_fraccion ? '1fr 1fr' : '1fr', gap: 12 }}>
                  {juegoSeleccionado.tiene_fraccion && (
                    <div>
                      <span style={label}>Fraccion</span>
                      <select value={fraccion} onChange={e => { setFraccion(e.target.value); setResultado(null); }} style={{ width: '100%', backgroundColor: '#0a4a8f', border: '1px solid #0d5a9f', borderRadius: 12, padding: '11px 10px', fontSize: 13, color: '#E0F2FE', outline: 'none' }}>
                        {[1,2,3,4,5,6,7,8,9,10].map(f => <option key={f} value={f} style={{ backgroundColor: '#0a4a8f' }}>Fraccion {f}/10</option>)}
                      </select>
                    </div>
                  )}
                  <div>
                    <span style={label}>Fecha sorteo</span>
                    <input type="date" value={fechaSorteo} onChange={e => { setFechaSorteo(e.target.value); setResultado(null); }} style={{ width: '100%', backgroundColor: '#0a4a8f', border: '1px solid #0d5a9f', borderRadius: 12, padding: '11px 10px', fontSize: 13, color: '#E0F2FE', outline: 'none', colorScheme: 'dark' }} />
                  </div>
                </div>

                <div>
                  <span style={label}>Valor de la apuesta (opcional)</span>
                  <input type="text" placeholder="$2.000" value={valorApuesta} onChange={e => setValorApuesta(e.target.value)} style={{ width: '100%', backgroundColor: '#0a4a8f', border: '1px solid #0d5a9f', borderRadius: 12, padding: '12px 14px', fontSize: 14, color: '#E0F2FE', outline: 'none' }} />
                </div>

                <button onClick={verificar} disabled={!numero || verificando} style={{ width: '100%', backgroundColor: '#F59E0B', border: 'none', borderRadius: 12, padding: '16px', fontSize: 16, fontWeight: 700, color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: (!numero || verificando) ? 0.4 : 1, boxShadow: '0 4px 24px rgba(245,158,11,0.25)' }}>
                  <Search size={20} /> {verificando ? 'Verificando...' : 'Verificar boleto'}
                </button>

              </div>

              {/* Columna derecha — resultado */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {!resultado ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid #0d5a9f', borderRadius: 16, padding: 40, textAlign: 'center', backgroundColor: '#064089', minHeight: 300 }}>
                    <div style={{ width: 64, height: 64, backgroundColor: '#0a4a8f', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                      <Search size={28} color="#0d5a9f" />
                    </div>
                    <p style={{ color: '#90CAF9', fontSize: 15, fontWeight: 500 }}>Ingresa un numero para verificar</p>
                    <p style={{ color: '#64B5F6', fontSize: 13, marginTop: 8 }}>El resultado aparecera aqui</p>
                  </div>
                ) : (
                  <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${resultado.tipo === 'mayor' ? '#10B981' : resultado.tipo === 'seco' ? '#F59E0B' : resultado.tipo === 'pendiente' ? '#0d5a9f' : '#0d5a9f'}` }}>
                    <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: 16, backgroundColor: resultado.tipo === 'mayor' ? '#0a3a2a' : resultado.tipo === 'seco' ? '#1a3a1a' : '#0a3a5f' }}>
                      <div style={{ width: 60, height: 60, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, backgroundColor: resultado.tipo === 'mayor' ? '#0a5a4a' : resultado.tipo === 'seco' ? '#1a5a2a' : '#0a4a7f', flexShrink: 0 }}>
                        {resultado.tipo === 'mayor' ? '🏆' : resultado.tipo === 'seco' ? '🪙' : resultado.tipo === 'pendiente' ? '⏳' : resultado.tipo === 'error' ? '⚠️' : '❌'}
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 20, color: resultado.tipo === 'mayor' ? '#10B981' : resultado.tipo === 'seco' ? '#F59E0B' : '#90CAF9' }}>{resultado.titulo}</p>
                        {resultado.premio && <p style={{ fontSize: 26, fontWeight: 800, color: resultado.tipo === 'mayor' ? '#10B981' : '#F59E0B', marginTop: 4 }}>{resultado.premio}</p>}
                      </div>
                    </div>

                    {resultado.tipo !== 'error' && (
                      <div style={{ padding: 20, backgroundColor: '#064089', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[
                          { lbl: 'Tu numero', val: `${numero.padStart(juegoSeleccionado.numero_digits || 4,'0')}${serie ? ' – ' + serie.toUpperCase() : ''}` },
                          juegoSeleccionado.tiene_fraccion && { lbl: 'Fraccion', val: `${fraccion}/10` },
                          { lbl: 'Juego', val: juegoSeleccionado.nombre },
                          fechaSorteo && { lbl: 'Fecha sorteo', val: fechaSorteo },
                          resultado.esHistorico !== undefined && { lbl: 'Tipo de boleto', val: resultado.esHistorico ? 'Sorteo antiguo (historico)' : 'Sorteo reciente' },
                          resultado.sorteo && { lbl: 'Numero ganador', val: `${resultado.sorteo.numero}${resultado.sorteo.serie ? ' – ' + resultado.sorteo.serie : ''}` },
                        ].filter(Boolean).map(({ lbl, val }) => (
                          <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, paddingBottom: 12, borderBottom: '1px solid #0d5a9f' }}>
                            <span style={{ color: '#64B5F6' }}>{lbl}</span>
                            <span style={{ color: '#E0F2FE', fontWeight: 600 }}>{val}</span>
                          </div>
                        ))}

                        {resultado.tipo !== 'pendiente' && (
                          <button onClick={guardarBoleto} disabled={guardando} style={{ width: '100%', marginTop: 4, backgroundColor: 'transparent', border: '1.5px solid #F59E0B', borderRadius: 10, padding: '13px', fontSize: 14, fontWeight: 700, color: '#F59E0B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            <Plus size={16} /> {guardando ? 'Guardando...' : 'Guardar en mi historial'}
                          </button>
                        )}
                        {resultado.tipo === 'pendiente' && (
                          <button onClick={guardarBoleto} disabled={guardando} style={{ width: '100%', marginTop: 4, backgroundColor: '#F59E0B', border: 'none', borderRadius: 10, padding: '13px', fontSize: 14, fontWeight: 700, color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            <Plus size={16} /> {guardando ? 'Guardando...' : 'Guardar y notificar cuando salga'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── SORTEOS ── */}
          {tab === 'sorteos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={label}>Ultimos resultados</span>
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
                          {s.serie && <p style={{ fontSize: 11, color: '#F59E0B', fontWeight: 500, marginTop: 2, opacity: 0.7 }}>Serie {s.serie}</p>}
                        </div>
                        <div>
                          <p style={{ fontSize: 12, color: '#64B5F6' }}>{s.fecha}</p>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

              {!usuario ? (
                <div style={{ textAlign: 'center', padding: '80px 0' }}>
                  <div style={{ width: 72, height: 72, backgroundColor: '#0a4a8f', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <Ticket size={32} color="#0d5a9f" />
                  </div>
                  <p style={{ color: '#90CAF9', fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Inicia sesion para guardar boletos</p>
                  <p style={{ color: '#64B5F6', fontSize: 13, marginBottom: 28 }}>Recibiras notificaciones con los resultados</p>
                  <button onClick={() => window.location.href = '/login'} style={{ backgroundColor: '#F59E0B', border: 'none', borderRadius: 10, padding: '13px 36px', color: '#000', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                    Iniciar sesion
                  </button>
                </div>
              ) : (
                <>
                  {/* Pendientes */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <span style={label}>Pendientes</span>
                      {perfil?.plan !== 'premium' && <span style={{ fontSize: 12, color: '#64B5F6' }}>{pendientes.length}/{getLimite()}</span>}
                    </div>

                    {pendientes.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <p style={{ color: '#64B5F6', fontSize: 14 }}>No tienes boletos pendientes</p>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
                        {pendientes.map((b) => (
                          <div key={b.id} style={{ ...card }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                              <p style={{ fontSize: 12, color: '#64B5F6' }}>{b.loteria}</p>
                              <button onClick={() => eliminarBoleto(b.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0d5a9f', padding: 4 }}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <p style={{ fontSize: 22, fontWeight: 900, color: '#E0F2FE', letterSpacing: 3 }}>{b.numero}{b.serie ? ` – ${b.serie}` : ''}</p>
                            <p style={{ fontSize: 11, color: '#64B5F6', marginTop: 6 }}>{b.fraccion ? `Fraccion ${b.fraccion}/10 · ` : ''}{b.fecha_sorteo || 'Sin fecha'}</p>
                            <span style={{ display: 'inline-block', marginTop: 8, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, backgroundColor: '#1a3a2a', color: '#F59E0B' }}>⏳ Pendiente</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {pendientes.length >= getLimite() && perfil?.plan !== 'premium' && (
                      <button onClick={() => setMostrarPremium(true)} style={{ width: '100%', backgroundColor: 'transparent', border: '1.5px dashed #1a3a5f', borderRadius: 16, padding: 24, textAlign: 'center', cursor: 'pointer', marginTop: 14 }}>
                        <Crown size={28} color="#F59E0B" style={{ margin: '0 auto 10px', display: 'block' }} />
                        <p style={{ color: '#E0F2FE', fontSize: 15, fontWeight: 700 }}>Guarda mas boletos pendientes</p>
                        <p style={{ color: '#64B5F6', fontSize: 13, marginTop: 6 }}>Actualiza tu plan para aumentar el limite</p>
                      </button>
                    )}
                  </div>

                  {/* Historial (no cuenta contra el limite) */}
                  <div>
                    <span style={label}>Historial verificado</span>
                    {historicos.length === 0 ? (
                      <p style={{ color: '#64B5F6', fontSize: 14, marginTop: 10 }}>Aun no tienes boletos verificados</p>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginTop: 10 }}>
                        {historicos.map((b) => (
                          <div key={b.id} style={{ ...card, opacity: 0.9 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                              <p style={{ fontSize: 12, color: '#64B5F6' }}>{b.loteria}</p>
                              <button onClick={() => eliminarBoleto(b.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0d5a9f', padding: 4 }}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <p style={{ fontSize: 22, fontWeight: 900, color: '#E0F2FE', letterSpacing: 3 }}>{b.numero}{b.serie ? ` – ${b.serie}` : ''}</p>
                              <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, backgroundColor: b.resultado === 'ganador' ? '#0a5a4a' : '#0a3a5f', color: b.resultado === 'ganador' ? '#10B981' : '#64B5F6' }}>
                                {b.resultado === 'ganador' ? '🏆 Ganador' : '❌ Sin premio'}
                              </span>
                            </div>
                            {b.premio && <p style={{ fontSize: 14, color: '#10B981', fontWeight: 700, marginTop: 8 }}>{b.premio}</p>}
                            <p style={{ fontSize: 11, color: '#64B5F6', marginTop: 6 }}>{b.fecha_sorteo || 'Sin fecha'}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
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
                    <p style={{ color: '#90CAF9', fontSize: 15, marginBottom: 28 }}>Inicia sesion para configurar tu cuenta</p>
                    <button onClick={() => window.location.href = '/login'} style={{ backgroundColor: '#F59E0B', border: 'none', borderRadius: 10, padding: '13px 36px', color: '#000', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                      Iniciar sesion
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
                            {perfil?.plan === 'premium' ? '🌟 Plan Premium' : perfil?.plan === 'pro' ? '💎 Plan Pro' : perfil?.plan === 'basico' ? '⭐ Plan Basico' : 'Plan Gratuito'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {perfil?.plan !== 'premium' && (
                      <button onClick={() => setMostrarPremium(true)} style={{ width: '100%', background: 'linear-gradient(135deg, #1a5a2a, #0a4a1a)', border: '1px solid #0d5a2f', borderRadius: 14, padding: '16px', color: '#10B981', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <Crown size={20} /> Ver planes
                      </button>
                    )}

                    <button onClick={cerrarSesion} style={{ width: '100%', backgroundColor: 'transparent', border: '1px solid #0d5a9f', borderRadius: 12, padding: '14px', color: '#64B5F6', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <LogOut size={16} /> Cerrar sesion
                    </button>
                  </>
                )}
              </div>

              {usuario && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ backgroundColor: '#0a4a8f', border: '1px solid #0d5a9f', borderRadius: 16, overflow: 'hidden' }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#64B5F6', textTransform: 'uppercase', letterSpacing: 1, padding: '16px 18px 14px', borderBottom: '1px solid #0d5a9f' }}>Notificaciones</p>
                    {[
                      { key: 'notif_correo', lbl: 'Por correo electronico', icon: '✉️', desc: 'Recibe resultados en tu correo' },
                      { key: 'notif_push', lbl: 'Notificaciones push', icon: '🔔', desc: 'Alertas en tu celular' },
                      { key: 'notif_solo_ganadores', lbl: 'Solo si gane', icon: '🏆', desc: 'Solo notifica premios y secos' },
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

        {/* Menu Inferior */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#064089', borderTop: '1px solid #0d5a9f', display: 'flex', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ width: '100%', maxWidth: 1800, display: 'flex', justifyContent: 'space-around' }}>
            {[
              { id: 'inicio', label: 'Inicio', icon: Home },
              { id: 'verificar', label: 'Verificar', icon: Search },
              { id: 'sorteos', label: 'Sorteos', icon: Calendar },
              { id: 'boletos', label: 'Boletos', icon: Ticket },
              { id: 'ajustes', label: 'Ajustes', icon: Settings },
            ].map(({ id, label: lbl, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)} style={{
                flex: 1, padding: '14px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                fontSize: 11, fontWeight: 600, border: 'none', borderTop: tab === id ? '3px solid #F59E0B' : 'none',
                cursor: 'pointer', backgroundColor: 'transparent', color: tab === id ? '#F59E0B' : '#64B5F6',
                transition: 'all 0.2s',
              }}>
                <Icon size={20} />
                {lbl}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}