'use client';
import { useState, useEffect } from 'react';
import { Search, Calendar, Ticket, Settings, Home as HomeIcon, Camera, RefreshCw, Plus, Trash2, Crown, LogOut, ChevronRight, ChevronLeft, X, Edit2, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { verificarBoletoContraResultados } from '../lib/verificacion';
import ModalPremium from './components/ModalPremium';
import EscanerBoleto from './components/EscanerBoleto';
import Image from 'next/image';

export default function Home() {
  const [tab, setTab] = useState('inicio');
  const [juegos, setJuegos] = useState([]);
  const [juegoSeleccionado, setJuegoSeleccionado] = useState(null);
  const [numero, setNumero] = useState('');
  const [serie, setSerie] = useState('');
  const [fraccionesSeleccionadas, setFraccionesSeleccionadas] = useState([]);
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
  const [nombresPlanes, setNombresPlanes] = useState({ gratis: 'Gratis', basico: 'Basico', pro: 'Pro', premium: 'Premium' });
  const [colaEscaneados, setColaEscaneados] = useState([]);
  const [indiceCola, setIndiceCola] = useState(0);

  // Preview editable de boleto escaneado (columna derecha antes de verificar)
  const [previewEscaner, setPreviewEscaner] = useState(null); // null o { loteria, numero, serie, fracciones, confianza }
  const [editandoPreview, setEditandoPreview] = useState(false);

  const COLOR_FONDO = '#0B1F3A';
  const COLOR_CARD = '#142A4A';
  const COLOR_BORDE = '#1A3A5F';
  const COLOR_ACENTO = '#FFD700';
  const COLOR_TEXTO_SEC = '#8FB3E0';
  const COLOR_TEXTO_TERC = '#5C7CA3';

  const noticias = [
    { id: 1, titulo: 'Nuevas loterias agregadas', desc: 'Ahora puedes verificar Colorloto y juegos Astro en tiempo real.', fecha: 'Hoy', icono: '✨' },
    { id: 2, titulo: 'Escanea tus boletos con IA', desc: 'Detecta varios boletos en una sola foto automaticamente.', fecha: 'Hace 3 dias', icono: '📸' },
    { id: 3, titulo: 'Notificaciones mejoradas', desc: 'Recibe alertas al instante cuando ganes premios en tus loterias favoritas.', fecha: 'Hace 1 semana', icono: '🔔' },
    { id: 4, titulo: 'Actualizamos nuestra seguridad', desc: 'Encriptacion de extremo a extremo para proteger tus datos personales.', fecha: 'Hace 2 semanas', icono: '🔐' },
  ];

  useEffect(() => {
    cargarJuegos();
    cargarResultados();
    checkUsuario();
    fetch('/api/configuracion').then(res => res.json()).then(data => {
      if (!data.error) {
        setConfigLimites({ gratis: data.limite_gratis, basico: data.limite_basico, pro: data.limite_pro });
        setNombresPlanes({ gratis: data.nombre_gratis || 'Gratis', basico: data.nombre_basico || 'Basico', pro: data.nombre_pro || 'Pro', premium: data.nombre_premium || 'Premium' });
      }
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
    setNumero(''); setSerie(''); setFraccionesSeleccionadas([]); setSigno('');
    setPreviewEscaner(null); setEditandoPreview(false);
  }

  function toggleFraccion(f) {
    setFraccionesSeleccionadas(prev => {
      if (prev.includes(f)) return prev.filter(x => x !== f);
      return [...prev, f].sort((a, b) => a - b);
    });
    setResultado(null);
  }

  function matchJuegoPorNombre(nombre) {
    return juegos.find(j => j.nombre.toLowerCase() === (nombre || '').toLowerCase());
  }

  function cargarBoletoDeColaDirecto(cola, indice) {
    const b = cola[indice];
    if (!b) return;
    const juegoMatch = matchJuegoPorNombre(b.loteria);
    if (juegoMatch) setJuegoSeleccionado(juegoMatch);
    setNumero(b.numero || '');
    setSerie(b.serie || '');
    const fracs = Array.isArray(b.fracciones) ? b.fracciones.map(f => parseInt(f)).filter(f => !isNaN(f) && f > 0) : [];
    setFraccionesSeleccionadas(fracs);
    setSigno(b.signo || '');
    setValorApuesta(b.valorApuesta || '');
    setFechaSorteo(b.fechaSorteo || '');
    setResultado(null);
    setIndiceCola(indice);
    setPreviewEscaner({
      loteria: b.loteria || '',
      numero: b.numero || '',
      serie: b.serie || '',
      fracciones: fracs,
      confianza: b.confianza || 'media',
    });
    setEditandoPreview(false);
  }

  function manejarBoletosDetectados(boletosDetectados) {
    setColaEscaneados(boletosDetectados);
    setTab('verificar');
    setTimeout(() => cargarBoletoDeColaDirecto(boletosDetectados, 0), 0);
  }

  function irABoletoCola(indice) {
    if (indice < 0 || indice >= colaEscaneados.length) return;
    cargarBoletoDeColaDirecto(colaEscaneados, indice);
  }

  function quitarDeCola(indice) {
    const nuevaCola = colaEscaneados.filter((_, i) => i !== indice);
    setColaEscaneados(nuevaCola);
    setPreviewEscaner(null);
    if (nuevaCola.length === 0) { setIndiceCola(0); return; }
    const nuevoIndice = Math.min(indice, nuevaCola.length - 1);
    cargarBoletoDeColaDirecto(nuevaCola, nuevoIndice);
  }

  function cerrarCola() {
    setColaEscaneados([]);
    setIndiceCola(0);
    setPreviewEscaner(null);
    setEditandoPreview(false);
  }

  function confirmarPreviewEdicion() {
    // El usuario editó los campos del formulario directamente, solo cerramos modo edición
    setEditandoPreview(false);
    setPreviewEscaner(prev => prev ? { ...prev, numero, serie, fracciones: fraccionesSeleccionadas } : null);
    setResultado(null);
  }

  async function verificar() {
    if (!numero || !juegoSeleccionado) return;
    if (!fechaSorteo) { setResultado({ tipo: 'error', titulo: 'Selecciona la fecha del sorteo', premio: null }); return; }

    setVerificando(true);

    const verificacion = await verificarBoletoContraResultados({
      loteria: juegoSeleccionado.nombre,
      numero,
      serie,
      fechaSorteo,
      tipoJuego: juegoSeleccionado.tipo,
      numeroDigits: juegoSeleccionado.numero_digits,
      resultadosReales,
    });

    setVerificando(false);

    if (verificacion.resultado === 'pendiente') {
      const motivo = verificacion.detalle?.motivo;
      const titulo = motivo === 'sorteo_futuro' ? 'Sorteo pendiente de realizarse' :
                     motivo === 'sin_resultado_aun' ? 'Resultado aun no disponible' : 'Sorteo pendiente';
      setResultado({ tipo: 'pendiente', titulo, premio: null, sorteo: null });
      return;
    }

    const detalle = verificacion.detalle;
    if (verificacion.resultado === 'ganador') {
      const titulo = detalle.tipo === 'mayor' ? '¡Premio mayor!' :
                     detalle.tipo === 'mayor_sin_serie' ? '¡Premio mayor! (sin serie)' :
                     detalle.tipo === 'seco_3' ? '¡Seco! Ultimas 3 cifras' :
                     detalle.tipo === 'seco_2' ? '¡Seco! Ultimas 2 cifras' :
                     detalle.tipo === 'seco_1' ? '¡Seco! Ultima cifra' : '¡Numero ganador!';
      const esSeco = detalle.tipo?.startsWith('seco');
      setResultado({ tipo: esSeco ? 'seco' : 'mayor', titulo, premio: verificacion.premio, sorteo: detalle.sorteo, esHistorico: detalle.esHistorico });
    } else {
      setResultado({ tipo: 'nada', titulo: 'Sin premio esta vez', premio: null, sorteo: detalle.sorteo, esHistorico: detalle.esHistorico });
    }
  }

  async function guardarBoleto() {
    if (!usuario) { window.location.href = '/login'; return; }
    const limite = getLimite();
    if (boletosPendientes().length >= limite) { setMostrarPremium(true); return; }

    setGuardando(true);

    let resultadoFinal = 'pendiente';
    let premioFinal = null;
    if (resultado && (resultado.tipo === 'mayor' || resultado.tipo === 'seco')) {
      resultadoFinal = 'ganador'; premioFinal = resultado.premio;
    } else if (resultado && resultado.tipo === 'nada') {
      resultadoFinal = 'perdedor';
    }

    const { data, error } = await supabase.from('boletos').insert({
      user_id: usuario.id,
      loteria: juegoSeleccionado.nombre,
      numero: numero.padStart(juegoSeleccionado.numero_digits || 4, '0'),
      serie: serie.toUpperCase(),
      fracciones: fraccionesSeleccionadas,
      fecha_sorteo: fechaSorteo,
      resultado: resultadoFinal,
      premio: premioFinal,
    }).select().single();

    setGuardando(false);
    if (error) { console.error(error); return; }

    setBoletos(prev => [data, ...prev]);
    setResultado(null);
    setPreviewEscaner(null);

    if (colaEscaneados.length > 0) {
      quitarDeCola(indiceCola);
    }
  }

  function getLimite() {
    if (!usuario) return configLimites.gratis || 2;
    if (perfil?.plan === 'premium') return Infinity;
    if (perfil?.plan === 'pro') return configLimites.pro || 25;
    if (perfil?.plan === 'basico') return configLimites.basico || 10;
    return configLimites.gratis || 2;
  }

  function nombrePlanActual() {
    if (!usuario) return null;
    return nombresPlanes[perfil?.plan || 'gratis'] || 'Gratis';
  }

  function boletosPendientes() {
    return boletos.filter(b => b.resultado === 'pendiente');
  }

  async function eliminarBoleto(id) {
    await supabase.from('boletos').delete().eq('id', id);
    setBoletos(prev => prev.filter(b => b.id !== id));
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
    setUsuario(null); setPerfil(null); setBoletos([]);
    setTab('inicio');
  }

  async function toggleNotif(key) {
    const nuevo = !perfil?.[key];
    await supabase.from('profiles').update({ [key]: nuevo }).eq('id', usuario.id);
    setPerfil(prev => ({ ...prev, [key]: nuevo }));
  }

  const label = { fontSize: 11, fontWeight: 600, color: COLOR_TEXTO_SEC, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, display: 'block' };
  const card = { backgroundColor: COLOR_CARD, border: `1px solid ${COLOR_BORDE}`, borderRadius: 16, padding: 16 };

  const pendientes = boletosPendientes();
  const historicos = boletos.filter(b => b.resultado !== 'pendiente');
  const porCategoria = juegos.reduce((acc, j) => { if (!acc[j.categoria]) acc[j.categoria] = []; acc[j.categoria].push(j); return acc; }, {});

  // Lógica del botón principal de acción
  const hayNumero = numero.trim().length > 0;
  const haVerificado = resultado !== null;
  const labelBotonPrincipal = verificando ? 'Verificando...' :
    !hayNumero ? 'Verificar / Guardar' :
    !haVerificado ? 'Verificar / Guardar' :
    resultado?.tipo === 'error' ? 'Verificar / Guardar' : 'Verificar de nuevo';

  const accionBotonPrincipal = haVerificado && resultado?.tipo !== 'error' ? verificar : verificar;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLOR_FONDO, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '10px', boxSizing: 'border-box' }}>

      {mostrarPremium && <ModalPremium onClose={() => setMostrarPremium(false)} />}
      {mostrarEscaner && <EscanerBoleto onBoletosDetectados={manejarBoletosDetectados} onCerrar={() => setMostrarEscaner(false)} />}

      <div style={{ width: '100%', maxWidth: 1800, backgroundColor: '#0D2240', borderRadius: 24, overflow: 'hidden', border: `1px solid ${COLOR_BORDE}`, boxShadow: '0 24px 80px rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${COLOR_FONDO} 0%, ${COLOR_CARD} 100%)`, padding: '24px 32px 20px', borderBottom: `1px solid ${COLOR_BORDE}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Image src="/logo.png" alt="NotiLoto Logo" width={110} height={110} style={{ borderRadius: 10, objectFit: 'cover', width: 'clamp(44px, 20vw, 90px)', height: 'clamp(44px, 20vw, 90px)' }} />
              <div>
                <p style={{ color: '#fff', fontWeight: 700, fontSize: 20, lineHeight: 1 }}>NotiLoto</p>
                <p style={{ color: COLOR_ACENTO, fontSize: 12, fontWeight: 500, marginTop: 3 }}>Colombia</p>
              </div>
            </div>
            {usuario ? (
              <button onClick={() => setTab('ajustes')} style={{ background: COLOR_CARD, border: `1px solid ${COLOR_BORDE}`, borderRadius: 10, padding: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Settings size={18} color={COLOR_ACENTO} />
              </button>
            ) : (
              <button onClick={() => window.location.href = '/login'} style={{ background: COLOR_ACENTO, border: 'none', borderRadius: 8, padding: '8px 20px', color: '#1A1500', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Entrar
              </button>
            )}
          </div>

          {!usuario ? (
            <div onClick={() => window.location.href = '/login'} style={{ marginTop: 14, backgroundColor: COLOR_CARD, border: `1px solid ${COLOR_BORDE}`, borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <Crown size={14} color={COLOR_ACENTO} />
              <p style={{ flex: 1, fontSize: 13, color: COLOR_TEXTO_SEC }}>Inicia sesion para guardar boletos y recibir notificaciones</p>
              <ChevronRight size={12} color={COLOR_TEXTO_SEC} />
            </div>
          ) : (
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: COLOR_ACENTO }}>{nombrePlanActual()}</p>
                <p style={{ fontSize: 12, color: COLOR_TEXTO_TERC, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>{usuario.email}</p>
              </div>
              {perfil?.plan !== 'premium' && (
                <span style={{ fontSize: 11, fontWeight: 600, color: COLOR_TEXTO_SEC }}>{pendientes.length}/{getLimite()} pendientes</span>
              )}
            </div>
          )}
        </div>

        {/* Contenido */}
        <div style={{ flex: 1, padding: '32px 32px 100px', overflowY: 'auto' }}>

          {/* ── INICIO ── */}
          {tab === 'inicio' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: COLOR_ACENTO, fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Bienvenido a NotiLoto</p>
                <p style={{ color: '#fff', fontSize: 40, fontWeight: 800, lineHeight: 1.1, marginBottom: 12 }}>Verifica tus loterias<br />y recibe noticias</p>
                <p style={{ color: COLOR_TEXTO_SEC, fontSize: 15, maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
                  La plataforma mas confiable para verificar resultados de loterias y chances colombianos. Escanea, verifica y recibe notificaciones en tiempo real.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => setTab('verificar')} style={{ backgroundColor: COLOR_ACENTO, border: 'none', borderRadius: 12, padding: '14px 32px', color: '#1A1500', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Search size={18} /> Verificar / Guardar
                </button>
                {!usuario && (
                  <button onClick={() => window.location.href = '/login'} style={{ backgroundColor: 'transparent', border: `1.5px solid ${COLOR_ACENTO}`, borderRadius: 12, padding: '13px 32px', color: COLOR_ACENTO, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
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
                        <span style={{ fontSize: 11, backgroundColor: COLOR_FONDO, color: COLOR_TEXTO_SEC, padding: '3px 8px', borderRadius: 20, fontWeight: 600 }}>{n.fecha}</span>
                      </div>
                      <p style={{ color: '#fff', fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{n.titulo}</p>
                      <p style={{ color: COLOR_TEXTO_SEC, fontSize: 13, lineHeight: 1.5 }}>{n.desc}</p>
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
                    <p style={{ fontSize: 32, fontWeight: 800, color: COLOR_ACENTO }}>{s.num}</p>
                    <p style={{ fontSize: 13, color: COLOR_TEXTO_SEC, marginTop: 6 }}>{s.lbl}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── VERIFICAR / GUARDAR ── */}
          {tab === 'verificar' && juegoSeleccionado && (
            <div>
              {/* Navegador de cola escaneados */}
              {colaEscaneados.length > 0 && (
                <div style={{ ...card, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button onClick={() => irABoletoCola(indiceCola - 1)} disabled={indiceCola === 0} style={{ background: COLOR_FONDO, border: `1px solid ${COLOR_BORDE}`, borderRadius: 8, padding: 8, cursor: indiceCola === 0 ? 'not-allowed' : 'pointer', opacity: indiceCola === 0 ? 0.4 : 1 }}>
                      <ChevronLeft size={16} color={COLOR_TEXTO_SEC} />
                    </button>
                    <p style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>Boleto {indiceCola + 1} de {colaEscaneados.length} escaneados</p>
                    <button onClick={() => irABoletoCola(indiceCola + 1)} disabled={indiceCola === colaEscaneados.length - 1} style={{ background: COLOR_FONDO, border: `1px solid ${COLOR_BORDE}`, borderRadius: 8, padding: 8, cursor: indiceCola === colaEscaneados.length - 1 ? 'not-allowed' : 'pointer', opacity: indiceCola === colaEscaneados.length - 1 ? 0.4 : 1 }}>
                      <ChevronRight size={16} color={COLOR_TEXTO_SEC} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => quitarDeCola(indiceCola)} style={{ background: 'transparent', border: `1px solid ${COLOR_BORDE}`, borderRadius: 8, padding: '6px 12px', color: COLOR_TEXTO_SEC, fontSize: 12, cursor: 'pointer' }}>Omitir este</button>
                    <button onClick={cerrarCola} style={{ background: 'transparent', border: 'none', borderRadius: 8, padding: 6, color: COLOR_TEXTO_SEC, cursor: 'pointer' }}>
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>

                {/* Columna izquierda — formulario */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                  <div>
                    <span style={label}>Juego</span>
                    <select value={juegoSeleccionado.nombre} onChange={e => cambiarJuego(e.target.value)} style={{ width: '100%', backgroundColor: COLOR_CARD, border: `1px solid ${COLOR_BORDE}`, borderRadius: 12, padding: '12px 14px', fontSize: 14, color: '#E0F2FE', outline: 'none' }}>
                      {Object.entries(porCategoria).map(([cat, lista]) => (
                        <optgroup key={cat} label={cat} style={{ backgroundColor: COLOR_CARD }}>
                          {lista.map(j => <option key={j.id} value={j.nombre} style={{ backgroundColor: COLOR_CARD }}>{j.nombre}</option>)}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  {/* Boton escaner */}
                  {usuario ? (
                    <div onClick={() => setMostrarEscaner(true)} style={{ border: `1.5px dashed ${COLOR_ACENTO}`, borderRadius: 16, padding: '20px', textAlign: 'center', backgroundColor: COLOR_CARD, cursor: 'pointer' }}>
                      <div style={{ width: 44, height: 44, backgroundColor: COLOR_FONDO, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                        <Camera size={20} color={COLOR_ACENTO} />
                      </div>
                      <p style={{ color: '#E0F2FE', fontWeight: 600, fontSize: 14 }}>Escanear boleto con IA</p>
                      <p style={{ color: COLOR_TEXTO_SEC, fontSize: 12, marginTop: 4 }}>Detecta numero, serie y fracciones automaticamente</p>
                    </div>
                  ) : (
                    <div onClick={() => window.location.href = '/login'} style={{ border: `1.5px dashed ${COLOR_BORDE}`, borderRadius: 16, padding: '20px', textAlign: 'center', backgroundColor: COLOR_CARD, cursor: 'pointer' }}>
                      <div style={{ width: 44, height: 44, backgroundColor: COLOR_FONDO, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                        <Camera size={20} color={COLOR_TEXTO_TERC} />
                      </div>
                      <p style={{ color: COLOR_TEXTO_SEC, fontWeight: 600, fontSize: 14 }}>Escanear boleto con IA</p>
                      <p style={{ color: COLOR_TEXTO_TERC, fontSize: 12, marginTop: 4 }}>Inicia sesion para usar esta funcion</p>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1, height: 1, backgroundColor: COLOR_BORDE }} />
                    <span style={{ fontSize: 12, color: COLOR_TEXTO_SEC }}>o ingresa manualmente</span>
                    <div style={{ flex: 1, height: 1, backgroundColor: COLOR_BORDE }} />
                  </div>

                  {/* Numero + Serie */}
                  <div>
                    <span style={label}>Numero {juegoSeleccionado.serie_digits > 0 && '— Serie'}</span>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        type="text" maxLength={juegoSeleccionado.numero_digits || 4} placeholder="0000" value={numero}
                        onChange={e => { setNumero(e.target.value); setResultado(null); if (previewEscaner) setEditandoPreview(true); }}
                        style={{ flex: '1 1 160px', minWidth: 0, backgroundColor: COLOR_FONDO, border: `1.5px solid ${editandoPreview ? COLOR_ACENTO : COLOR_BORDE}`, borderRadius: 12, padding: '14px 8px', textAlign: 'center', fontSize: 28, fontWeight: 700, letterSpacing: 8, color: '#fff', outline: 'none' }}
                      />
                      {juegoSeleccionado.serie_digits > 0 && (
                        <>
                          <span style={{ color: COLOR_BORDE, fontSize: 24, flexShrink: 0 }}>–</span>
                          <input
                            type="text" maxLength={3} placeholder="A00" value={serie}
                            onChange={e => { setSerie(e.target.value); setResultado(null); if (previewEscaner) setEditandoPreview(true); }}
                            style={{ flex: '0 0 100px', minWidth: 100, backgroundColor: COLOR_FONDO, border: `1.5px solid ${editandoPreview ? COLOR_ACENTO : COLOR_BORDE}`, borderRadius: 12, padding: '14px 8px', textAlign: 'center', fontSize: 22, fontWeight: 700, letterSpacing: 5, color: '#fff', outline: 'none' }}
                          />
                        </>
                      )}
                    </div>
                    {editandoPreview && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                        <p style={{ fontSize: 11, color: COLOR_ACENTO }}>Editando datos escaneados</p>
                        <button onClick={confirmarPreviewEdicion} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10B981', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                          <Check size={12} /> Confirmar
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Signo */}
                  {juegoSeleccionado.usa_signo && (
                    <div>
                      <span style={label}>Signo zodiacal</span>
                      <select value={signo} onChange={e => { setSigno(e.target.value); setResultado(null); }} style={{ width: '100%', backgroundColor: COLOR_CARD, border: `1px solid ${COLOR_BORDE}`, borderRadius: 12, padding: '11px 10px', fontSize: 13, color: '#E0F2FE', outline: 'none' }}>
                        <option value="" style={{ backgroundColor: COLOR_CARD }}>Selecciona signo</option>
                        {['Aries','Tauro','Geminis','Cancer','Leo','Virgo','Libra','Escorpio','Sagitario','Capricornio','Acuario','Piscis'].map(s => <option key={s} style={{ backgroundColor: COLOR_CARD }}>{s}</option>)}
                      </select>
                    </div>
                  )}

                  {/* Fracciones */}
                  {juegoSeleccionado.tiene_fraccion && (
                    <div>
                      <span style={label}>
                        Fracciones que tienes
                        <span style={{ color: COLOR_TEXTO_TERC, fontWeight: 400, marginLeft: 6, textTransform: 'none', letterSpacing: 0 }}>
                          ({juegoSeleccionado.total_fracciones || 10} en total)
                        </span>
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {Array.from({ length: juegoSeleccionado.total_fracciones || 10 }, (_, i) => i + 1).map(f => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => toggleFraccion(f)}
                            style={{
                              width: 40, height: 40, borderRadius: 10,
                              border: `1.5px solid ${fraccionesSeleccionadas.includes(f) ? COLOR_ACENTO : COLOR_BORDE}`,
                              backgroundColor: fraccionesSeleccionadas.includes(f) ? '#3a2f0a' : COLOR_FONDO,
                              color: fraccionesSeleccionadas.includes(f) ? COLOR_ACENTO : COLOR_TEXTO_SEC,
                              fontSize: 14, fontWeight: 700, cursor: 'pointer',
                              transition: 'all 0.15s',
                            }}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                      {fraccionesSeleccionadas.length > 0 ? (
                        <p style={{ fontSize: 11, color: COLOR_ACENTO, marginTop: 8 }}>Seleccionadas: {fraccionesSeleccionadas.join(', ')}</p>
                      ) : (
                        <p style={{ fontSize: 11, color: COLOR_TEXTO_TERC, marginTop: 8 }}>Toca las fracciones que aparecen en tu billete</p>
                      )}
                    </div>
                  )}

                  {/* Fecha */}
                  <div>
                    <span style={label}>Fecha sorteo</span>
                    <input type="date" value={fechaSorteo} onChange={e => { setFechaSorteo(e.target.value); setResultado(null); }} style={{ width: '100%', backgroundColor: COLOR_CARD, border: `1px solid ${COLOR_BORDE}`, borderRadius: 12, padding: '11px 10px', fontSize: 13, color: '#E0F2FE', outline: 'none', colorScheme: 'dark' }} />
                  </div>

                  {/* Valor */}
                  <div>
                    <span style={label}>Valor de la apuesta (opcional)</span>
                    <input type="text" placeholder="$2.000" value={valorApuesta} onChange={e => setValorApuesta(e.target.value)} style={{ width: '100%', backgroundColor: COLOR_CARD, border: `1px solid ${COLOR_BORDE}`, borderRadius: 12, padding: '12px 14px', fontSize: 14, color: '#E0F2FE', outline: 'none' }} />
                  </div>

                  {/* Botón principal */}
                  <button onClick={verificar} disabled={!numero || verificando} style={{ width: '100%', backgroundColor: COLOR_ACENTO, border: 'none', borderRadius: 12, padding: '16px', fontSize: 16, fontWeight: 700, color: '#1A1500', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: (!numero || verificando) ? 0.4 : 1, boxShadow: '0 4px 24px rgba(255,215,0,0.25)' }}>
                    <Search size={20} /> {labelBotonPrincipal}
                  </button>

                  {/* Guardar sin verificar — solo si hay numero pero no ha verificado */}
                  {hayNumero && !haVerificado && usuario && (
                    <button onClick={guardarBoleto} disabled={guardando} style={{ width: '100%', backgroundColor: 'transparent', border: `1px solid ${COLOR_BORDE}`, borderRadius: 12, padding: '13px', fontSize: 14, color: COLOR_TEXTO_SEC, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <Plus size={16} /> {guardando ? 'Guardando...' : 'Guardar sin verificar (pendiente)'}
                    </button>
                  )}
                </div>

                {/* Columna derecha — preview / resultado */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                  {/* Preview de datos escaneados (antes de verificar) */}
                  {previewEscaner && !resultado && (
                    <div style={{ ...card, border: `1px solid ${previewEscaner.confianza === 'alta' ? '#10B981' : COLOR_ACENTO}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 20 }}>📸</span>
                          <p style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>Detectado por IA</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, backgroundColor: previewEscaner.confianza === 'alta' ? '#0a5a4a' : '#3a2f0a', color: previewEscaner.confianza === 'alta' ? '#10B981' : COLOR_ACENTO }}>
                            Confianza {previewEscaner.confianza}
                          </span>
                          <button onClick={() => { setEditandoPreview(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLOR_TEXTO_SEC }}>
                            <Edit2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: `1px solid ${COLOR_BORDE}` }}>
                          <span style={{ color: COLOR_TEXTO_SEC, fontSize: 13 }}>Juego detectado</span>
                          <span style={{ color: '#E0F2FE', fontSize: 13, fontWeight: 600 }}>{previewEscaner.loteria || 'No detectado'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: `1px solid ${COLOR_BORDE}` }}>
                          <span style={{ color: COLOR_TEXTO_SEC, fontSize: 13 }}>Numero</span>
                          <span style={{ color: COLOR_ACENTO, fontSize: 20, fontWeight: 800, letterSpacing: 3 }}>{numero || '----'}{serie ? ` – ${serie}` : ''}</span>
                        </div>
                        {fraccionesSeleccionadas.length > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: `1px solid ${COLOR_BORDE}` }}>
                            <span style={{ color: COLOR_TEXTO_SEC, fontSize: 13 }}>Fracciones</span>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                              {fraccionesSeleccionadas.map(f => (
                                <span key={f} style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: '#3a2f0a', border: `1px solid ${COLOR_ACENTO}`, color: COLOR_ACENTO, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{f}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {fechaSorteo && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: COLOR_TEXTO_SEC, fontSize: 13 }}>Fecha sorteo</span>
                            <span style={{ color: '#E0F2FE', fontSize: 13, fontWeight: 600 }}>{fechaSorteo}</span>
                          </div>
                        )}
                      </div>

                      <p style={{ color: COLOR_TEXTO_TERC, fontSize: 12, marginTop: 16, textAlign: 'center' }}>
                        Revisa los datos en el formulario y toca "Verificar / Guardar"
                      </p>
                    </div>
                  )}

                  {/* Estado vacío (sin escaner y sin resultado) */}
                  {!previewEscaner && !resultado && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: `1px solid ${COLOR_BORDE}`, borderRadius: 16, padding: 40, textAlign: 'center', backgroundColor: COLOR_FONDO, minHeight: 300 }}>
                      <div style={{ width: 64, height: 64, backgroundColor: COLOR_CARD, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                        <Search size={28} color={COLOR_BORDE} />
                      </div>
                      <p style={{ color: COLOR_TEXTO_SEC, fontSize: 15, fontWeight: 500 }}>Ingresa un numero para verificar</p>
                      <p style={{ color: COLOR_TEXTO_TERC, fontSize: 13, marginTop: 8 }}>o escanea tu boleto con la camara</p>
                    </div>
                  )}

                  {/* Resultado de verificacion */}
                  {resultado && (
                    <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${resultado.tipo === 'mayor' ? '#10B981' : resultado.tipo === 'seco' ? COLOR_ACENTO : COLOR_BORDE}` }}>
                      <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: 16, backgroundColor: resultado.tipo === 'mayor' ? '#0a3a2a' : resultado.tipo === 'seco' ? '#3a2f0a' : COLOR_FONDO }}>
                        <div style={{ width: 60, height: 60, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, backgroundColor: resultado.tipo === 'mayor' ? '#0a5a4a' : resultado.tipo === 'seco' ? '#5a4a0a' : COLOR_CARD, flexShrink: 0 }}>
                          {resultado.tipo === 'mayor' ? '🏆' : resultado.tipo === 'seco' ? '🪙' : resultado.tipo === 'pendiente' ? '⏳' : resultado.tipo === 'error' ? '⚠️' : '❌'}
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: 20, color: resultado.tipo === 'mayor' ? '#10B981' : resultado.tipo === 'seco' ? COLOR_ACENTO : COLOR_TEXTO_SEC }}>{resultado.titulo}</p>
                          {resultado.premio && <p style={{ fontSize: 26, fontWeight: 800, color: resultado.tipo === 'mayor' ? '#10B981' : COLOR_ACENTO, marginTop: 4 }}>{resultado.premio}</p>}
                        </div>
                      </div>

                      {resultado.tipo !== 'error' && (
                        <div style={{ padding: 20, backgroundColor: COLOR_FONDO, display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {[
                            { lbl: 'Tu numero', val: `${numero.padStart(juegoSeleccionado.numero_digits || 4,'0')}${serie ? ' – ' + serie.toUpperCase() : ''}` },
                            fraccionesSeleccionadas.length > 0 && { lbl: 'Fracciones', val: fraccionesSeleccionadas.join(', ') },
                            { lbl: 'Juego', val: juegoSeleccionado.nombre },
                            fechaSorteo && { lbl: 'Fecha sorteo', val: fechaSorteo },
                            resultado.esHistorico !== undefined && { lbl: 'Tipo', val: resultado.esHistorico ? 'Sorteo historico' : 'Sorteo reciente' },
                            resultado.sorteo && { lbl: 'Numero ganador', val: `${resultado.sorteo.numero}${resultado.sorteo.serie ? ' – ' + resultado.sorteo.serie : ''}` },
                          ].filter(Boolean).map(({ lbl, val }) => (
                            <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, paddingBottom: 12, borderBottom: `1px solid ${COLOR_BORDE}` }}>
                              <span style={{ color: COLOR_TEXTO_SEC }}>{lbl}</span>
                              <span style={{ color: '#E0F2FE', fontWeight: 600 }}>{val}</span>
                            </div>
                          ))}

                          {usuario ? (
                            <>
                              {resultado.tipo !== 'pendiente' && (
                                <button onClick={guardarBoleto} disabled={guardando} style={{ width: '100%', marginTop: 4, backgroundColor: 'transparent', border: `1.5px solid ${COLOR_ACENTO}`, borderRadius: 10, padding: '13px', fontSize: 14, fontWeight: 700, color: COLOR_ACENTO, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                  <Plus size={16} /> {guardando ? 'Guardando...' : colaEscaneados.length > 0 ? 'Guardar y siguiente boleto' : 'Guardar en mi historial'}
                                </button>
                              )}
                              {resultado.tipo === 'pendiente' && (
                                <button onClick={guardarBoleto} disabled={guardando} style={{ width: '100%', marginTop: 4, backgroundColor: COLOR_ACENTO, border: 'none', borderRadius: 10, padding: '13px', fontSize: 14, fontWeight: 700, color: '#1A1500', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                  <Plus size={16} /> {guardando ? 'Guardando...' : colaEscaneados.length > 0 ? 'Guardar y siguiente boleto' : 'Guardar y notificar cuando salga'}
                                </button>
                              )}
                            </>
                          ) : (
                            <button onClick={() => window.location.href = '/login'} style={{ width: '100%', marginTop: 4, backgroundColor: COLOR_ACENTO, border: 'none', borderRadius: 10, padding: '13px', fontSize: 14, fontWeight: 700, color: '#1A1500', cursor: 'pointer' }}>
                              Inicia sesion para guardar
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── RESULTADOS ── */}
          {tab === 'resultados' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={label}>Ultimos resultados</span>
                <button onClick={cargarResultados} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                  <RefreshCw size={16} color={COLOR_TEXTO_SEC} />
                </button>
              </div>
              {cargando ? (
                <p style={{ textAlign: 'center', color: COLOR_TEXTO_SEC, fontSize: 14, padding: 40 }}>Cargando...</p>
              ) : resultadosReales.length === 0 ? (
                <p style={{ textAlign: 'center', color: COLOR_TEXTO_SEC, fontSize: 14, padding: 40 }}>No hay resultados disponibles aun.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
                  {resultadosReales.map((s) => (
                    <div key={s.loteria} style={{ ...card }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                        <p style={{ fontSize: 15, fontWeight: 700, color: '#E0F2FE' }}>{s.loteria}</p>
                        <span style={{ fontSize: 10, backgroundColor: '#0a5a4a', color: '#10B981', padding: '3px 8px', borderRadius: 20, fontWeight: 600, flexShrink: 0 }}>Reciente</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ backgroundColor: COLOR_FONDO, borderRadius: 10, padding: '10px 18px', textAlign: 'center', flexShrink: 0 }}>
                          <p style={{ fontSize: 28, fontWeight: 900, color: COLOR_ACENTO, letterSpacing: 4 }}>{s.numero}</p>
                          {s.serie && <p style={{ fontSize: 11, color: COLOR_ACENTO, fontWeight: 500, marginTop: 2, opacity: 0.7 }}>Serie {s.serie}</p>}
                        </div>
                        <div>
                          <p style={{ fontSize: 12, color: COLOR_TEXTO_SEC }}>{s.fecha}</p>
                          <p style={{ fontSize: 16, fontWeight: 700, color: '#E0F2FE', marginTop: 6 }}>{s.premio}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── MIS NUMEROS ── */}
          {tab === 'numeros' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              {!usuario ? (
                <div style={{ textAlign: 'center', padding: '80px 0' }}>
                  <div style={{ width: 72, height: 72, backgroundColor: COLOR_CARD, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <Ticket size={32} color={COLOR_BORDE} />
                  </div>
                  <p style={{ color: COLOR_TEXTO_SEC, fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Inicia sesion para guardar boletos</p>
                  <p style={{ color: COLOR_TEXTO_TERC, fontSize: 13, marginBottom: 28 }}>Recibiras notificaciones con los resultados</p>
                  <button onClick={() => window.location.href = '/login'} style={{ backgroundColor: COLOR_ACENTO, border: 'none', borderRadius: 10, padding: '13px 36px', color: '#1A1500', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                    Iniciar sesion
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <span style={label}>Pendientes</span>
                      {perfil?.plan !== 'premium' && <span style={{ fontSize: 12, color: COLOR_TEXTO_SEC }}>{pendientes.length}/{getLimite()}</span>}
                    </div>
                    {pendientes.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <p style={{ color: COLOR_TEXTO_SEC, fontSize: 14 }}>No tienes boletos pendientes</p>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
                        {pendientes.map((b) => (
                          <div key={b.id} style={{ ...card }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                              <p style={{ fontSize: 12, color: COLOR_TEXTO_SEC }}>{b.loteria}</p>
                              <button onClick={() => eliminarBoleto(b.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLOR_BORDE, padding: 4 }}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <p style={{ fontSize: 22, fontWeight: 900, color: '#E0F2FE', letterSpacing: 3 }}>{b.numero}{b.serie ? ` – ${b.serie}` : ''}</p>
                            {b.fracciones?.length > 0 && (
                              <p style={{ fontSize: 11, color: COLOR_ACENTO, marginTop: 4 }}>Fracciones: {b.fracciones.join(', ')}</p>
                            )}
                            <p style={{ fontSize: 11, color: COLOR_TEXTO_SEC, marginTop: 4 }}>{b.fecha_sorteo || 'Sin fecha'}</p>
                            <span style={{ display: 'inline-block', marginTop: 8, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, backgroundColor: '#3a2f0a', color: COLOR_ACENTO }}>⏳ Pendiente</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {pendientes.length >= getLimite() && perfil?.plan !== 'premium' && (
                      <button onClick={() => setMostrarPremium(true)} style={{ width: '100%', backgroundColor: 'transparent', border: `1.5px dashed ${COLOR_BORDE}`, borderRadius: 16, padding: 24, textAlign: 'center', cursor: 'pointer', marginTop: 14 }}>
                        <Crown size={28} color={COLOR_ACENTO} style={{ margin: '0 auto 10px', display: 'block' }} />
                        <p style={{ color: '#E0F2FE', fontSize: 15, fontWeight: 700 }}>Guarda mas boletos pendientes</p>
                        <p style={{ color: COLOR_TEXTO_SEC, fontSize: 13, marginTop: 6 }}>Actualiza tu plan para aumentar el limite</p>
                      </button>
                    )}
                  </div>

                  <div>
                    <span style={label}>Historial verificado</span>
                    {historicos.length === 0 ? (
                      <p style={{ color: COLOR_TEXTO_SEC, fontSize: 14, marginTop: 10 }}>Aun no tienes boletos verificados</p>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginTop: 10 }}>
                        {historicos.map((b) => (
                          <div key={b.id} style={{ ...card, opacity: 0.9 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                              <p style={{ fontSize: 12, color: COLOR_TEXTO_SEC }}>{b.loteria}</p>
                              <button onClick={() => eliminarBoleto(b.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLOR_BORDE, padding: 4 }}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <p style={{ fontSize: 22, fontWeight: 900, color: '#E0F2FE', letterSpacing: 3 }}>{b.numero}{b.serie ? ` – ${b.serie}` : ''}</p>
                              <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, backgroundColor: b.resultado === 'ganador' ? '#0a5a4a' : COLOR_FONDO, color: b.resultado === 'ganador' ? '#10B981' : COLOR_TEXTO_SEC }}>
                                {b.resultado === 'ganador' ? '🏆 Ganador' : '❌ Sin premio'}
                              </span>
                            </div>
                            {b.fracciones?.length > 0 && (
                              <p style={{ fontSize: 11, color: COLOR_TEXTO_SEC, marginTop: 4 }}>Fracciones: {b.fracciones.join(', ')}</p>
                            )}
                            {b.premio && <p style={{ fontSize: 14, color: '#10B981', fontWeight: 700, marginTop: 6 }}>{b.premio}</p>}
                            <p style={{ fontSize: 11, color: COLOR_TEXTO_SEC, marginTop: 4 }}>{b.fecha_sorteo || 'Sin fecha'}</p>
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
                    <div style={{ width: 72, height: 72, backgroundColor: COLOR_CARD, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                      <Settings size={32} color={COLOR_BORDE} />
                    </div>
                    <p style={{ color: COLOR_TEXTO_SEC, fontSize: 15, marginBottom: 28 }}>Inicia sesion para configurar tu cuenta</p>
                    <button onClick={() => window.location.href = '/login'} style={{ backgroundColor: COLOR_ACENTO, border: 'none', borderRadius: 10, padding: '13px 36px', color: '#1A1500', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                      Iniciar sesion
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ background: `linear-gradient(135deg, ${COLOR_FONDO}, ${COLOR_CARD})`, borderRadius: 16, padding: 20, border: `1px solid ${COLOR_BORDE}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 52, height: 52, backgroundColor: COLOR_ACENTO, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#1A1500', flexShrink: 0 }}>
                          {usuario.email[0].toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{usuario.email}</p>
                          <p style={{ fontSize: 13, color: COLOR_ACENTO, marginTop: 4 }}>Plan {nombrePlanActual()}</p>
                        </div>
                      </div>
                    </div>

                    {perfil?.plan !== 'premium' && (
                      <button onClick={() => setMostrarPremium(true)} style={{ width: '100%', background: 'linear-gradient(135deg, #1a5a2a, #0a4a1a)', border: '1px solid #0d5a2f', borderRadius: 14, padding: '16px', color: '#10B981', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <Crown size={20} /> Ver planes
                      </button>
                    )}

                    <button onClick={cerrarSesion} style={{ width: '100%', backgroundColor: 'transparent', border: `1px solid ${COLOR_BORDE}`, borderRadius: 12, padding: '14px', color: COLOR_TEXTO_SEC, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <LogOut size={16} /> Cerrar sesion
                    </button>
                  </>
                )}
              </div>

              {usuario && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ backgroundColor: COLOR_CARD, border: `1px solid ${COLOR_BORDE}`, borderRadius: 16, overflow: 'hidden' }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: COLOR_TEXTO_SEC, textTransform: 'uppercase', letterSpacing: 1, padding: '16px 18px 14px', borderBottom: `1px solid ${COLOR_BORDE}` }}>Notificaciones</p>
                    {[
                      { key: 'notif_correo', lbl: 'Por correo electronico', icon: '✉️', desc: 'Recibe resultados en tu correo' },
                      { key: 'notif_push', lbl: 'Notificaciones push', icon: '🔔', desc: 'Alertas en tu celular' },
                      { key: 'notif_solo_ganadores', lbl: 'Solo si gane', icon: '🏆', desc: 'Solo notifica premios y secos' },
                    ].map(({ key, lbl, icon, desc }) => (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderTop: `1px solid ${COLOR_BORDE}` }}>
                        <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 14, color: '#E0F2FE', fontWeight: 500 }}>{lbl}</p>
                          <p style={{ fontSize: 12, color: COLOR_TEXTO_SEC, marginTop: 4 }}>{desc}</p>
                        </div>
                        <button onClick={() => toggleNotif(key)} style={{ position: 'relative', width: 52, height: 30, borderRadius: 999, border: 'none', cursor: 'pointer', flexShrink: 0, backgroundColor: perfil?.[key] ? COLOR_ACENTO : COLOR_BORDE, transition: 'background-color 0.2s' }}>
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
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: COLOR_FONDO, borderTop: `1px solid ${COLOR_BORDE}`, display: 'flex', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ width: '100%', maxWidth: 1800, display: 'flex', justifyContent: 'space-around' }}>
            {[
              { id: 'inicio', label: 'Inicio', icon: HomeIcon },
              { id: 'verificar', label: 'Verificar/Guardar', icon: Search },
              { id: 'resultados', label: 'Resultados', icon: Calendar },
              { id: 'numeros', label: 'Mis Numeros', icon: Ticket },
            ].map(({ id, label: lbl, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)} style={{
                flex: 1, padding: '14px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                fontSize: 11, fontWeight: 600, border: 'none', borderTop: tab === id ? `3px solid ${COLOR_ACENTO}` : 'none',
                cursor: 'pointer', backgroundColor: 'transparent', color: tab === id ? COLOR_ACENTO : COLOR_TEXTO_SEC,
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