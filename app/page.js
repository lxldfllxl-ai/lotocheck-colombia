'use client';
import { useState, useEffect, useRef } from 'react';
import { Search, Calendar, Ticket, Settings, Bell, Home as HomeIcon, Camera, RefreshCw, Plus, Trash2, Crown, LogOut, ChevronRight, X, Check } from 'lucide-react';
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
  const [noticias, setNoticias] = useState([]);
  const [cargandoNoticias, setCargandoNoticias] = useState(true);
  const [notificacionesUI, setNotificacionesUI] = useState([]); // toasts efímeros (auto-desaparecen)
  const [notificacionesPersist, setNotificacionesPersist] = useState([]); // notificaciones guardadas en Supabase
  const [noLeidas, setNoLeidas] = useState(0); // contador de no leídas para el badge
  const [vapidPublicKey, setVapidPublicKey] = useState('');
  const [pushReady, setPushReady] = useState(false);
  const [mostrarNotificacionesPanel, setMostrarNotificacionesPanel] = useState(false);
  const [mostrarBannerPush, setMostrarBannerPush] = useState(false); // Banner para sugerir activar push en este dispositivo

  // Vista de loterias / juegos
  const [juegoDetalle, setJuegoDetalle] = useState(null); // juego seleccionado para ver detalle
  const [historicoSorteos, setHistoricoSorteos] = useState([]); // sorteos historicos del juego seleccionado
  const [cargandoHistorico, setCargandoHistorico] = useState(false);
  const [verHistorico, setVerHistorico] = useState(false); // toggle para mostrar historico

  // Cola de boletos escaneados con estado individual
  const [boletosEscaneados, setBoletosEscaneados] = useState([]); // [{...datos, estado:'pendiente'|'guardado'|'seleccionado'}]
  const [indiceSeleccionado, setIndiceSeleccionado] = useState(null);
  const [boletoEditandoId, setBoletoEditandoId] = useState(null);

  const COLOR_FONDO = '#0B1F3A';
  const COLOR_CARD = '#142A4A';
  const COLOR_BORDE = '#1A3A5F';
  const COLOR_ACENTO = '#FFD700';
  const COLOR_TEXTO_SEC = '#8FB3E0';
  const COLOR_TEXTO_TERC = '#5C7CA3';

  useEffect(() => {
    cargarJuegos();
    cargarResultados();
    checkUsuario();
    fetch('/api/configuracion').then(r => r.json()).then(data => {
      if (!data.error) {
        setConfigLimites({ gratis: data.limite_gratis, basico: data.limite_basico, pro: data.limite_pro });
        setNombresPlanes({ gratis: data.nombre_gratis || 'Gratis', basico: data.nombre_basico || 'Basico', pro: data.nombre_pro || 'Pro', premium: data.nombre_premium || 'Premium' });
      }
    }).catch(() => {});
    fetch('/api/noticias').then(r => r.json()).then(data => {
      if (data.noticias) setNoticias(data.noticias);
    }).catch(() => setNoticias([])).finally(() => setCargandoNoticias(false));

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      // Registrar el Service Worker al cargar la página (necesario para push)
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .catch(() => {});

      fetch('/api/notificaciones')
        .then((r) => r.json())
        .then((data) => {
          const key = (data?.vapidPublicKey || '').trim();
          if (key && /^[A-Za-z0-9_-]+$/.test(key)) {
            setVapidPublicKey(key);
            setPushReady(true);
          } else {
            setPushReady(false);
          }
        })
        .catch((err) => {
          setPushReady(false);
        });
    }

    // Si hay una intención de suscripción pendiente (flag puesto antes de recarga),
    // se procesará en el useEffect dedicado más abajo cuando pushReady y usuario estén listos.
  }, []);

  // Efecto para auto-reanudar suscripción push después de recarga por permiso
  useEffect(() => {
    let intentFlag = false;
    try { intentFlag = sessionStorage.getItem('push_subscribe_retry') === 'true'; } catch (_) {}

    if (intentFlag && pushReady && usuario && perfil) {
      try { sessionStorage.removeItem('push_subscribe_retry'); } catch (_) {}
      // Pequeño delay para asegurar que el SW está listo
      const timer = setTimeout(async () => {
        const subscription = await subscribeToPush();
        if (!subscription) return;
        const subsActuales = Array.isArray(perfil?.push_subscriptions) ? perfil.push_subscriptions : (perfil?.push_subscription_json ? [perfil.push_subscription_json] : []);
        const endpoint = subscription.endpoint;
        const yaExiste = subsActuales.some(s => (typeof s === 'object' ? s.endpoint : null) === endpoint);
        const nuevasSubs = yaExiste ? subsActuales : [...subsActuales, subscription];
        const { error } = await actualizarPerfil({
          notif_push: true,
          push_subscriptions: nuevasSubs,
          push_subscription_json: subscription,
        });
        if (error) {
          addNotificacion({ tipo: 'error', titulo: 'Error activando push', mensaje: 'No se pudo guardar la suscripción.' });
        } else {
          addNotificacion({ tipo: 'success', titulo: 'Push activado', mensaje: 'Recibirás alertas cuando haya resultados.' });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [pushReady, usuario, perfil]);

  // Detectar si push está activo en el perfil pero no en este dispositivo
  useEffect(() => {
    if (!pushReady || !usuario || !perfil) return;
    if (!perfil.notif_push) { setMostrarBannerPush(false); return; }
    // Verificar si este dispositivo tiene suscripción activa
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        if (!sub) {
          // Push activo en perfil pero no en este dispositivo → mostrar banner
          setMostrarBannerPush(true);
        } else {
          setMostrarBannerPush(false);
        }
      }).catch(() => {});
    }
  }, [pushReady, usuario, perfil, perfil?.notif_push]);

  // Polling de nuevos resultados para notificaciones onsite
  const prevResultadosRef = useRef(null);
  useEffect(() => {
    if (!usuario) return;
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/resultados');
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) return;
        const prev = prevResultadosRef.current;
        // Detectar nuevos resultados comparando con la lista anterior
        if (prev && prev.length > 0) {
          for (const r of data) {
            const old = prev.find(p => p.loteria === r.loteria);
            if (!old || old.numero !== r.numero || old.serie !== r.serie || old.fecha !== r.fecha) {
              addNotificacionPersistente({
                tipo: 'info',
                titulo: `Nuevo resultado: ${r.loteria}`,
                mensaje: `${r.numero}${r.serie ? ' - ' + r.serie : ''} — ${r.premio || ''}`,
              });
            }
          }
        }
        prevResultadosRef.current = data;
      } catch (_) { /* ignorar errores de polling */ }
    }, 60000); // cada 60 segundos
    return () => clearInterval(pollInterval);
  }, [usuario]);

  async function cargarJuegos() {
    try {
      const res = await fetch('/api/juegos');
      const data = await res.json();
      if (data.juegos?.length > 0) {
        setJuegos(data.juegos);
        setJuegoSeleccionado(data.juegos[0]);
      }
    } catch (e) { console.error(e); }
  }

  async function checkUsuario() {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUsuario(user);
      await cargarPerfil(user.id);
      await cargarBoletos(user.id);
      cargarNotificacionesPersist();
    }
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
      prevResultadosRef.current = data;
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  }

  function matchJuegoPorNombre(nombre) {
    return juegos.find(j => j.nombre.toLowerCase() === (nombre || '').toLowerCase());
  }

  function cambiarJuego(nombreJuego) {
    const j = juegos.find(j => j.nombre === nombreJuego);
    setJuegoSeleccionado(j);
    setResultado(null);
    setNumero(''); setSerie(''); setFraccionesSeleccionadas([]); setSigno('');
  }

  async function abrirDetalleJuego(juego) {
    setJuegoDetalle(juego);
    setVerHistorico(false);
    setHistoricoSorteos([]);
    setCargandoHistorico(true);
    try {
      const res = await fetch(`/api/sorteos-historico?loteria=${encodeURIComponent(juego.nombre)}`);
      const data = await res.json();
      if (data.sorteos) setHistoricoSorteos(data.sorteos);
    } catch (e) { console.error(e); }
    finally { setCargandoHistorico(false); }
  }

  function cerrarDetalleJuego() {
    setJuegoDetalle(null);
    setHistoricoSorteos([]);
    setVerHistorico(false);
  }

  function toggleFraccion(f) {
    setFraccionesSeleccionadas(prev =>
      prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f].sort((a, b) => a - b)
    );
    setResultado(null);
  }

  function seleccionarBoletoEscaneado(indice) {
    const b = boletosEscaneados[indice];
    if (!b || b.estado === 'guardado') return;

    setIndiceSeleccionado(indice);
    setBoletosEscaneados(prev => prev.map((x, i) => ({ ...x, estado: i === indice ? 'seleccionado' : x.estado === 'seleccionado' ? 'pendiente' : x.estado })));

    const fracs = Array.isArray(b.fracciones) ? b.fracciones.map(f => parseInt(f)).filter(f => !isNaN(f) && f > 0) : [];
    const juegoMatch = matchJuegoPorNombre(b.loteria);

    setNumero(b.numero || '');
    setSerie(b.serie || '');
    setSigno(b.signo || '');
    setValorApuesta(b.valorApuesta || '');
    setFechaSorteo(b.fechaSorteo || '');
    setResultado(null);

    if (juegoMatch) {
      setJuegoSeleccionado(juegoMatch);
      setFraccionesSeleccionadas(fracs);
    } else {
      // No encontró juego — aplicar fracciones directamente
      setFraccionesSeleccionadas(fracs);
    }
  }

  function manejarBoletosDetectados(boletosDetectados) {
    const normalizados = boletosDetectados.map(b => ({
      ...b,
      fracciones: Array.isArray(b.fracciones) ? b.fracciones.map(f => parseInt(f)).filter(f => !isNaN(f) && f > 0) : [],
      estado: 'pendiente', // pendiente | seleccionado | guardado
      resultadoVerificacion: null,
    }));
    setBoletosEscaneados(normalizados);
    setIndiceSeleccionado(null);
    setTab('verificar');
    // Seleccionar el primero automaticamente
    setTimeout(() => seleccionarBoletoEscaneado_directo(normalizados, 0), 100);
  }

  // Version que recibe la lista directamente (para el setTimeout inicial)
  function seleccionarBoletoEscaneado_directo(lista, indice) {
    const b = lista[indice];
    if (!b) return;

    setIndiceSeleccionado(indice);
    setBoletosEscaneados(lista.map((x, i) => ({ ...x, estado: i === indice ? 'seleccionado' : x.estado })));

    const fracs = Array.isArray(b.fracciones) ? b.fracciones.map(f => parseInt(f)).filter(f => !isNaN(f) && f > 0) : [];
    const juegoMatch = juegos.find(j => j.nombre.toLowerCase() === (b.loteria || '').toLowerCase());

    setNumero(b.numero || '');
    setSerie(b.serie || '');
    setSigno(b.signo || '');
    setValorApuesta(b.valorApuesta || '');
    setFechaSorteo(b.fechaSorteo || '');
    setResultado(null);

    if (juegoMatch) {
      setJuegoSeleccionado(juegoMatch);
      setFraccionesSeleccionadas(fracs);
    } else {
      setFraccionesSeleccionadas(fracs);
    }
  }

  function cerrarEscaneados() {
    setBoletosEscaneados([]);
    setIndiceSeleccionado(null);
  }

  function advertenciaFecha(fecha) {
    if (!fecha) return null;
    const corte = '2026-06-01';
    return fecha < corte ? {
      titulo: 'Resultados disponibles a partir de Junio 2026',
      mensaje: ''
    } : null;
  }

  function prepararEdicionBoleto(boleto) {
    const juegoMatch = juegos.find(j => j.nombre === boleto.loteria);
    setBoletoEditandoId(boleto.id);
    setTab('verificar');
    setJuegoSeleccionado(juegoMatch || juegoSeleccionado);
    setNumero(boleto.numero || '');
    setSerie(boleto.serie || '');
    setFraccionesSeleccionadas(Array.isArray(boleto.fracciones) ? boleto.fracciones : []);
    setFechaSorteo(boleto.fecha_sorteo || '');
    setValorApuesta('');
    setSigno('');
    setResultado({ tipo: 'warning', titulo: 'Editando boleto guardado', mensaje: 'Puedes modificar los datos y guardar los cambios.' });
  }

  function cancelarEdicion() {
    setBoletoEditandoId(null);
    setResultado(null);
  }

  async function guardarEdicionBoleto() {
    if (!usuario) { window.location.href = '/login'; return; }
    if (!numero || !juegoSeleccionado) return;
    if (!fechaSorteo) { setResultado({ tipo: 'error', titulo: 'Selecciona la fecha del sorteo', premio: null }); return; }

    const aviso = advertenciaFecha(fechaSorteo);
    if (aviso) {
      setResultado({ tipo: 'warning', titulo: aviso.titulo, premio: null, mensaje: aviso.mensaje });
      return;
    }

    const duplicado = encontrarBoletoDuplicado({
      loteria: juegoSeleccionado.nombre,
      numero,
      serie,
      fechaSorteo,
      excluirId: boletoEditandoId,
    });

    if (duplicado) {
      setResultado({ tipo: 'warning', titulo: 'Ya guardaste este numero anteriormente', premio: null, mensaje: 'Puedes editarlo desde aqui si necesitas actualizarlo.', mostrarEditar: true, boletoDuplicadoId: duplicado.id });
      return;
    }

    setGuardando(true);
    const { data, error } = await supabase.from('boletos').update({
      loteria: juegoSeleccionado.nombre,
      numero: numero.padStart(juegoSeleccionado.numero_digits || 4, '0'),
      serie: serie.toUpperCase(),
      fracciones: fraccionesSeleccionadas,
      fecha_sorteo: fechaSorteo,
    }).eq('id', boletoEditandoId).select().single();
    setGuardando(false);

    if (!error && data) {
      setBoletos(prev => prev.map(b => b.id === boletoEditandoId ? { ...b, ...data } : b));
      setBoletoEditandoId(null);
      setResultado({ tipo: 'success', titulo: '✓ Cambios guardados', premio: null, mensaje: null });
      setTab('numeros');
    }
  }

  function encontrarBoletoDuplicado({ loteria, numero: numeroInput, serie: serieInput, fechaSorteo: fechaInput, excluirId = null }) {
    const numeroNormalizado = (numeroInput || '').padStart(juegoSeleccionado?.numero_digits || 4, '0');
    const serieNormalizada = (serieInput || '').toUpperCase();
    return boletos.find(b => {
      if (excluirId && b.id === excluirId) return false;
      const mismoJuego = b.loteria === loteria;
      const mismoNumero = (b.numero || '').toString() === numeroNormalizado;
      const mismaSerie = (b.serie || '').toUpperCase() === serieNormalizada;
      const mismaFecha = b.fecha_sorteo === fechaInput;
      return mismoJuego && mismoNumero && mismaSerie && mismaFecha;
    });
  }

  async function verificarYGuardar() {
    if (!numero || !juegoSeleccionado) return;
    if (!fechaSorteo) { setResultado({ tipo: 'error', titulo: 'Selecciona la fecha del sorteo', premio: null }); return; }
    const aviso = advertenciaFecha(fechaSorteo);
    if (aviso) {
      setResultado({ tipo: 'warning', titulo: aviso.titulo, premio: null, mensaje: aviso.mensaje });
      return;
    }
    if (!usuario) { window.location.href = '/login'; return; }
    if (boletosPendientes().length >= getLimite()) { setMostrarPremium(true); return; }

    const duplicado = encontrarBoletoDuplicado({ loteria: juegoSeleccionado.nombre, numero, serie, fechaSorteo });
    if (duplicado) {
      setResultado({ tipo: 'warning', titulo: 'Ya guardaste este numero anteriormente', premio: null, mensaje: 'Puedes editarlo desde aqui si necesitas actualizarlo.', mostrarEditar: true, boletoDuplicadoId: duplicado.id });
      return;
    }

    setVerificando(true);

    const verificacion = await verificarBoletoContraResultados({
      loteria: juegoSeleccionado.nombre,
      numero,
      serie,
      fechaSorteo,
      tipoJuego: juegoSeleccionado.tipo,
      numeroDigits: juegoSeleccionado.numero_digits,
      resultadosReales,
      planPremios: juegoSeleccionado.plan_premios,
    });

    setVerificando(false);

    // Determinar tipo de resultado para mostrar
    let tipoDisplay = 'pendiente';
    let tituloDisplay = 'Pendiente de sorteo';
    if (verificacion.resultado !== 'pendiente') {
      const detalle = verificacion.detalle;
      if (verificacion.resultado === 'ganador') {
        tipoDisplay = detalle.tipo?.startsWith('seco') ? 'seco' : 'mayor';
        tituloDisplay = detalle.tipo === 'mayor' ? '¡Premio mayor!' :
                        detalle.tipo === 'mayor_sin_serie' ? '¡Premio mayor! (sin serie)' :
                        detalle.tipo === 'seco_3' ? '¡Seco! Ultimas 3 cifras' :
                        detalle.tipo === 'seco_2' ? '¡Seco! Ultimas 2 cifras' :
                        detalle.tipo === 'seco_1' ? '¡Seco! Ultima cifra' : '¡Numero ganador!';
      } else {
        tipoDisplay = 'nada';
        tituloDisplay = 'Sin premio esta vez';
      }
    } else {
      const motivo = verificacion.detalle?.motivo;
      tituloDisplay = motivo === 'sorteo_futuro' ? 'Sorteo pendiente de realizarse' :
                      motivo === 'sin_resultado_aun' ? 'Resultado aun no disponible' : 'Pendiente de sorteo';
    }

    setResultado({ tipo: tipoDisplay, titulo: tituloDisplay, premio: verificacion.premio, sorteo: verificacion.detalle?.sorteo, esHistorico: verificacion.detalle?.esHistorico });

    // Guardar automaticamente
    setGuardando(true);

    const resultadoFinal = verificacion.resultado;
    const premioFinal = verificacion.premio;

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

    if (!error && data) {
      setBoletos(prev => [data, ...prev]);
      if (indiceSeleccionado !== null) {
        setBoletosEscaneados(prev => prev.map((b, i) => i === indiceSeleccionado ? { ...b, estado: 'guardado', resultadoVerificacion: { tipo: tipoDisplay, titulo: tituloDisplay, premio: premioFinal } } : b));
      }
      setResultado({ tipo: 'success', titulo: '✓ Guardado automaticamente', premio: null, mensaje: null });
    }
  }

  async function soloVerificar() {
    if (!numero || !juegoSeleccionado) return;
    if (!fechaSorteo) { setResultado({ tipo: 'error', titulo: 'Selecciona la fecha del sorteo', premio: null }); return; }
    const aviso = advertenciaFecha(fechaSorteo);
    if (aviso) {
      setResultado({ tipo: 'warning', titulo: aviso.titulo, premio: null, mensaje: aviso.mensaje });
      return;
    }

    setVerificando(true);

    const verificacion = await verificarBoletoContraResultados({
      loteria: juegoSeleccionado.nombre,
      numero, serie, fechaSorteo,
      tipoJuego: juegoSeleccionado.tipo,
      numeroDigits: juegoSeleccionado.numero_digits,
      resultadosReales,
      planPremios: juegoSeleccionado.plan_premios,
    });

    setVerificando(false);

    // Determinar tipo de resultado para mostrar
    let tipoDisplay = 'pendiente';
    let tituloDisplay = 'Pendiente de sorteo';
    if (verificacion.resultado !== 'pendiente') {
      const detalle = verificacion.detalle;
      if (verificacion.resultado === 'ganador') {
        tipoDisplay = detalle.tipo?.startsWith('seco') ? 'seco' : 'mayor';
        tituloDisplay = detalle.tipo === 'mayor' ? '¡Premio mayor!' :
                        detalle.tipo === 'mayor_sin_serie' ? '¡Premio mayor! (sin serie)' :
                        detalle.tipo === 'seco_3' ? '¡Seco! Ultimas 3 cifras' :
                        detalle.tipo === 'seco_2' ? '¡Seco! Ultimas 2 cifras' :
                        detalle.tipo === 'seco_1' ? '¡Seco! Ultima cifra' : '¡Numero ganador!';
      } else {
        tipoDisplay = 'nada';
        tituloDisplay = 'Sin premio esta vez';
      }
    } else {
      const motivo = verificacion.detalle?.motivo;
      tituloDisplay = motivo === 'sorteo_futuro' ? 'Sorteo pendiente de realizarse' :
                      motivo === 'sin_resultado_aun' ? 'Resultado aun no disponible' : 'Pendiente de sorteo';
    }

    setResultado({ tipo: tipoDisplay, titulo: tituloDisplay, premio: verificacion.premio, sorteo: verificacion.detalle?.sorteo, esHistorico: verificacion.detalle?.esHistorico, mensaje: null });

    if (!usuario) { window.location.href = '/login'; return; }
    if (boletosPendientes().length >= getLimite()) { setMostrarPremium(true); return; }

    const duplicado = encontrarBoletoDuplicado({ loteria: juegoSeleccionado.nombre, numero, serie, fechaSorteo });
    if (duplicado) {
      setResultado({ tipo: 'warning', titulo: 'Ya guardaste este numero anteriormente', premio: null, mensaje: 'Puedes editarlo desde aqui si necesitas actualizarlo.', mostrarEditar: true, boletoDuplicadoId: duplicado.id });
      return;
    }

    setGuardando(true);

    const resultadoFinal = verificacion.resultado;
    const premioFinal = verificacion.premio;

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

    if (!error && data) {
      setBoletos(prev => [data, ...prev]);
      if (indiceSeleccionado !== null) {
        setBoletosEscaneados(prev => prev.map((b, i) => i === indiceSeleccionado ? { ...b, estado: 'guardado', resultadoVerificacion: { tipo: tipoDisplay, titulo: tituloDisplay, premio: premioFinal } } : b));
      }
      setResultado({ tipo: 'success', titulo: '✓ Guardado automaticamente', premio: null, mensaje: null });
    }
  }

  async function guardarResultadoManual() {
    if (!usuario) { window.location.href = '/login'; return; }
    if (!fechaSorteo) { setResultado({ tipo: 'error', titulo: 'Selecciona la fecha del sorteo', premio: null }); return; }
    const aviso = advertenciaFecha(fechaSorteo);
    if (aviso) {
      setResultado({ tipo: 'warning', titulo: aviso.titulo, premio: null, mensaje: aviso.mensaje });
      return;
    }
    if (boletosPendientes().length >= getLimite()) { setMostrarPremium(true); return; }

    setGuardando(true);

    let resultadoFinal = 'pendiente';
    let premioFinal = null;
    if (resultado?.tipo === 'mayor' || resultado?.tipo === 'seco') { resultadoFinal = 'ganador'; premioFinal = resultado.premio; }
    else if (resultado?.tipo === 'nada') { resultadoFinal = 'perdedor'; }

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
    if (!error && data) {
      setBoletos(prev => [data, ...prev]);
      setResultado({ tipo: 'success', titulo: '✓ Guardado automaticamente', premio: null, mensaje: null });
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

  function boletosPendientes() { return boletos.filter(b => b.resultado === 'pendiente'); }

  async function eliminarBoleto(id) {
    await supabase.from('boletos').delete().eq('id', id);
    setBoletos(prev => prev.filter(b => b.id !== id));
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
    setUsuario(null); setPerfil(null); setBoletos([]);
    setTab('inicio');
  }

  async function actualizarPerfil(datos) {
    if (!usuario) return { data: null, error: 'No hay usuario' };
    const { data, error } = await supabase.from('profiles').update(datos).eq('id', usuario.id).select().single();
    if (!error && data) setPerfil(data);
    return { data, error };
  }

  // Toast efímero: se muestra arriba a la derecha y desaparece solo
  function addNotificacion(nuevo, opts = {}) {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const toast = { id, ...nuevo };
    setNotificacionesUI(prev => [{ id, ...nuevo }, ...prev].slice(0, 4));
    // Auto-dismiss después de N segundos (default 5s)
    const segundos = opts.duracion ?? 5;
    if (segundos > 0) {
      setTimeout(() => dismissNotificacion(id), segundos * 1000);
    }
  }

  // Notificación persistente: se guarda en Supabase y cuenta como no leída
  async function addNotificacionPersistente(nuevo) {
    if (!usuario || !supabase) {
      // Sin sesión: caer a toast efímero
      addNotificacion(nuevo);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('notificaciones_onsite')
        .insert({
          user_id: usuario.id,
          tipo: nuevo.tipo || 'info',
          titulo: nuevo.titulo,
          mensaje: nuevo.mensaje || null,
        })
        .select()
        .single();
      if (!error && data) {
        setNotificacionesPersist(prev => [data, ...prev].slice(0, 50));
        setNoLeidas(prev => prev + 1);
      }
    } catch (_) { /* ignorar */ }
  }

  function dismissNotificacion(id) {
    setNotificacionesUI(prev => prev.filter((item) => item.id !== id));
  }

  // Cargar notificaciones persistentes desde Supabase
  async function cargarNotificacionesPersist() {
    if (!usuario || !supabase) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch('/api/notificaciones-onsite', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (data.notificaciones) {
        setNotificacionesPersist(data.notificaciones);
        setNoLeidas(data.noLeidas || 0);
      }
    } catch (_) { /* ignorar */ }
  }

  // Marcar todas como leídas
  async function marcarTodasLeidas() {
    if (!usuario || !supabase || noLeidas === 0) return;
    setNoLeidas(0);
    setNotificacionesPersist(prev => prev.map(n => ({ ...n, leida: true })));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await fetch('/api/notificaciones-onsite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ marcarTodas: true }),
      });
    } catch (_) { /* ignorar */ }
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async function getActiveServiceWorkerRegistration() {
    try {
      const existing = await navigator.serviceWorker.getRegistration();
      if (existing?.active) {
        return existing;
      }
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      const ready = await navigator.serviceWorker.ready;
      return ready;
    } catch (err) {
      throw err;
    }
  }

  function isValidVapidKey(key) {
    return typeof key === 'string' && /^[A-Za-z0-9_-]+$/.test(key);
  }

  async function subscribeToPush() {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        addNotificacion({ tipo: 'error', titulo: 'Push no soportado', mensaje: 'Tu navegador no soporta notificaciones push.' });
        return null;
      }

      // Verificar permiso actual sin disparar prompt (evita reload en Chrome)
      const permisoActual = Notification.permission;

      if (permisoActual === 'denied') {
        addNotificacion({ tipo: 'warning', titulo: 'Permiso denegado', mensaje: 'Las notificaciones están bloqueadas. Actívalas en la configuración de tu navegador.' });
        return null;
      }

      // Solo pedir permiso si está en 'default' (nunca se ha preguntado)
      if (permisoActual === 'default') {
        // Guardar intención en sessionStorage por si el navegador recarga la página
        try { sessionStorage.setItem('push_subscribe_retry', 'true'); } catch (_) {}
        const permiso = await Notification.requestPermission();
        // Si la página NO recargó, limpiamos el flag. Si recargó, el useEffect lo detectará.
        try { sessionStorage.removeItem('push_subscribe_retry'); } catch (_) {}
        if (permiso !== 'granted') {
          addNotificacion({ tipo: 'warning', titulo: 'Permiso denegado', mensaje: 'Activa las notificaciones en tu navegador para recibir alertas.' });
          return null;
        }
      }

      const vapidKey = vapidPublicKey?.trim();
      if (!vapidKey) {
        addNotificacion({ tipo: 'error', titulo: 'Falta clave VAPID', mensaje: 'No se pudo activar push en este momento.' });
        return null;
      }
      if (!isValidVapidKey(vapidKey)) {
        addNotificacion({ tipo: 'error', titulo: 'Clave VAPID inválida', mensaje: 'La clave VAPID configurada no es válida.' });
        return null;
      }

      // Usar el SW ya registrado (evitar doble registro)
      const activeRegistration = await getActiveServiceWorkerRegistration();

      // Verificar si ya hay suscripción
      let subscription = await activeRegistration.pushManager.getSubscription();
      if (subscription) {
        return subscription.toJSON ? subscription.toJSON() : subscription;
      }

      // Decodificar clave
      let applicationServerKey;
      try {
        applicationServerKey = urlBase64ToUint8Array(vapidKey);
      } catch (subErr) {
        addNotificacion({ tipo: 'error', titulo: 'Clave VAPID inválida', mensaje: 'No se pudo decodificar la clave VAPID.' });
        return null;
      }

      // Intentar suscribir con VAPID con reintentos
      let lastError = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          subscription = await activeRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey,
          });
          break;
        } catch (subErr) {
          lastError = subErr;
          if (attempt < 3) {
            const delay = attempt * 1000;
            await new Promise(r => setTimeout(r, delay));
          }
        }
      }
      if (!subscription) {
        const subErr = lastError;
        const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
        const isVercelPreview = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
        let mensaje = subErr?.message || 'No se pudo activar las notificaciones push.';
        if (isLocalhost) {
          mensaje = 'Push no disponible en localhost con Chrome. Prueba con Firefox o en el dominio de producción (HTTPS).';
        } else if (isVercelPreview) {
          mensaje = 'Error de conexión con el servicio push. Verifica que tu dominio esté autorizado en Firebase y que la clave VAPID pública en Firebase coincida con la de tu app.';
        }
        addNotificacion({ tipo: 'error', titulo: 'Error al suscribirse', mensaje });
        return null;
      }

      return subscription.toJSON ? subscription.toJSON() : subscription;
    } catch (error) {
      addNotificacion({ tipo: 'error', titulo: 'Error push', mensaje: error?.message || 'No se pudo activar las notificaciones push.' });
      return null;
    }
  }

  async function unsubscribePush() {
    try {
      const registration = await getActiveServiceWorkerRegistration();
      if (!registration) return false;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) await subscription.unsubscribe();
      return true;
    } catch (error) {
      return false;
    }
  }

  async function toggleNotif(key) {
    const nuevo = !perfil?.[key];
    if (key === 'notif_push') {
      if (nuevo) {
        // Siempre guardar la preferencia en el perfil primero (funciona cross-device)
        const { error: errSave } = await actualizarPerfil({ notif_push: true });
        if (errSave) {
          addNotificacion({ tipo: 'error', titulo: 'Error', mensaje: 'No se pudo guardar la preferencia.' });
          return;
        }
        // Intentar suscribir este dispositivo si el navegador lo soporta
        if (!pushReady) {
          addNotificacion({ tipo: 'success', titulo: 'Push activado', mensaje: 'Recibirás alertas en tus otros dispositivos. Este navegador no soporta push.' });
          return;
        }
        const subscription = await subscribeToPush();
        if (!subscription) {
          // No se pudo suscribir este dispositivo, pero la preferencia ya está guardada
          addNotificacion({ tipo: 'success', titulo: 'Push activado', mensaje: 'Recibirás alertas en tus otros dispositivos. Activa los permisos en este para recibir aquí también.' });
          return;
        }
        // Agregar esta suscripción al array del perfil (sin duplicados por endpoint)
        const subsActuales = Array.isArray(perfil?.push_subscriptions) ? perfil.push_subscriptions : (perfil?.push_subscription_json ? [perfil.push_subscription_json] : []);
        const endpoint = subscription.endpoint;
        const yaExiste = subsActuales.some(s => (typeof s === 'object' ? s.endpoint : null) === endpoint);
        const nuevasSubs = yaExiste ? subsActuales : [...subsActuales, subscription];
        const { error } = await actualizarPerfil({
          push_subscriptions: nuevasSubs,
          push_subscription_json: subscription, // mantener compatibilidad
        });
        if (error) {
          addNotificacion({ tipo: 'error', titulo: 'Error activando push', mensaje: 'No se pudo guardar la suscripción.' });
        } else {
          addNotificacion({ tipo: 'success', titulo: 'Push activado', mensaje: 'Recibirás alertas cuando haya resultados.' });
        }
        return;
      }

      // Desactivar push: NO desuscribir del navegador (invalidaría la suscripción
      // para siempre). Solo guardar notif_push=false. El servidor respeta el flag.
      // Las suscripciones guardadas siguen válidas y funcionarán al reactivar.
      const { error } = await actualizarPerfil({ notif_push: false });
      if (!error) {
        addNotificacion({ tipo: 'success', titulo: 'Push desactivado', mensaje: 'No recibirás más alertas push. Al reactivar, todos tus dispositivos funcionarán sin volver a dar permiso.' });
      }
      return;
    }

    const { error } = await actualizarPerfil({ [key]: nuevo });
    if (!error) {
      addNotificacion({ tipo: 'success', titulo: nuevo ? 'Notificación activada' : 'Notificación desactivada', mensaje: key === 'notif_correo' ? 'Preferencias de correo actualizadas.' : 'Preferencias actualizadas.' });
    }
  }

  const label = { fontSize: 11, fontWeight: 600, color: COLOR_TEXTO_SEC, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, display: 'block' };
  const card = { backgroundColor: COLOR_CARD, border: `1px solid ${COLOR_BORDE}`, borderRadius: 16, padding: 16 };

  const pendientes = boletosPendientes();
  const historicos = boletos.filter(b => b.resultado !== 'pendiente');
  const porCategoria = juegos.reduce((acc, j) => { if (!acc[j.categoria]) acc[j.categoria] = []; acc[j.categoria].push(j); return acc; }, {});
  const hayEscaneados = boletosEscaneados.length > 0;
  const hayNumero = numero.trim().length > 0;

  function abrirEdicionDesdeResultado() {
    const boleto = boletos.find(b => b.id === resultado?.boletoDuplicadoId);
    if (boleto) prepararEdicionBoleto(boleto);
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLOR_FONDO, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '10px', boxSizing: 'border-box' }}>

      {/* Toast notifications - top right */}
      {notificacionesUI.length > 0 && (
        <div style={{ position: 'fixed', top: 18, right: 18, zIndex: 1200, display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 340 }}>
          {notificacionesUI.map((item) => (
            <div key={item.id} style={{ backgroundColor: '#112438', border: `1px solid ${COLOR_BORDE}`, borderRadius: 16, padding: '14px 16px', boxShadow: '0 12px 30px rgba(0,0,0,0.35)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#fff' }}>{item.titulo}</p>
                  {item.mensaje && <p style={{ margin: '8px 0 0', fontSize: 12, color: COLOR_TEXTO_SEC, lineHeight: 1.5 }}>{item.mensaje}</p>}
                </div>
                <button onClick={() => dismissNotificacion(item.id)} style={{ background: 'transparent', border: 'none', color: COLOR_TEXTO_SEC, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>×</button>
              </div>
            </div>
          ))}
        </div>
      )}

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
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ position: 'relative' }}>
                  <button onClick={() => { setMostrarNotificacionesPanel((prev) => !prev); if (!mostrarNotificacionesPanel) cargarNotificacionesPersist(); }} style={{ background: COLOR_CARD, border: `1px solid ${COLOR_BORDE}`, borderRadius: 10, padding: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <Bell size={18} color={COLOR_ACENTO} />
                    {noLeidas > 0 && (
                      <span style={{ position: 'absolute', top: -4, right: -4, backgroundColor: '#E53E3E', color: '#fff', fontSize: 10, fontWeight: 700, minWidth: 18, height: 18, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', boxSizing: 'border-box' }}>
                        {noLeidas > 99 ? '99+' : noLeidas}
                      </span>
                    )}
                  </button>
                  {mostrarNotificacionesPanel && (
                    <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, zIndex: 1200, width: 300, maxHeight: 400, overflowY: 'auto', backgroundColor: '#112438', border: `1px solid ${COLOR_BORDE}`, borderRadius: 16, padding: '14px 16px', boxShadow: '0 12px 30px rgba(0,0,0,0.5)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#fff' }}>Notificaciones</p>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {noLeidas > 0 && (
                            <button onClick={marcarTodasLeidas} style={{ background: 'transparent', border: 'none', color: COLOR_ACENTO, cursor: 'pointer', fontSize: 11, fontWeight: 600, padding: '2px 6px' }}>
                              Marcar leídas
                            </button>
                          )}
                          <button onClick={() => setMostrarNotificacionesPanel(false)} style={{ background: 'transparent', border: 'none', color: COLOR_TEXTO_SEC, cursor: 'pointer', fontSize: 16, padding: '2px 4px' }}>
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                      {notificacionesPersist.length === 0 ? (
                        <p style={{ color: COLOR_TEXTO_SEC, fontSize: 13 }}>No tienes notificaciones.</p>
                      ) : (
                        notificacionesPersist.map((item) => (
                          <div key={item.id} style={{ backgroundColor: COLOR_CARD, borderRadius: 10, padding: '10px 12px', marginBottom: 8, opacity: item.leida ? 0.6 : 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                              <div>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#fff' }}>{item.titulo}</p>
                                {item.mensaje && <p style={{ margin: '4px 0 0', fontSize: 11, color: COLOR_TEXTO_SEC }}>{item.mensaje}</p>}
                                <p style={{ margin: '4px 0 0', fontSize: 10, color: COLOR_TEXTO_TERC }}>{new Date(item.created_at).toLocaleString()}</p>
                              </div>
                              {!item.leida && (
                                <span style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLOR_ACENTO, flexShrink: 0, marginTop: 4 }} />
                              )}
                            </div>
                          </div>
                        ))
                      )}
                      <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                        {perfil?.notif_push ? (
                          <button onClick={() => toggleNotif('notif_push')} style={{ background: 'transparent', border: `1px solid ${COLOR_BORDE}`, borderRadius: 8, padding: '8px 12px', color: COLOR_TEXTO_SEC, fontSize: 12, cursor: 'pointer' }}>Desactivar push</button>
                        ) : (
                          <button onClick={() => toggleNotif('notif_push')} style={{ background: COLOR_ACENTO, border: 'none', borderRadius: 8, padding: '8px 12px', color: '#1A1500', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Activar push</button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <button onClick={() => setTab('ajustes')} style={{ background: COLOR_CARD, border: `1px solid ${COLOR_BORDE}`, borderRadius: 10, padding: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Settings size={18} color="#fff" />
                </button>
              </div>
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
                <p style={{ color: '#fff', fontSize: '32px', fontWeight: 800, lineHeight: 1.1, marginBottom: 12 }}>Guarda tus números de loterías / chances <br />y recibe notificaciones cuando salgan los resultados</p>
                <p style={{ color: COLOR_TEXTO_SEC, fontSize: '19.5px', maxWidth: 700, margin: '0 auto', lineHeight: 1.6 }}>
                  juega, guarda, Notiloto
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
                  {cargandoNoticias ? (
                    <p style={{ color: COLOR_TEXTO_SEC, fontSize: 14 }}>Cargando noticias...</p>
                  ) : noticias.length > 0 ? noticias.map(n => (
                    <div key={n.id} style={{ ...card }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <span style={{ fontSize: 28 }}>{n.icono || '📰'}</span>
                        <span style={{ fontSize: 11, backgroundColor: COLOR_FONDO, color: COLOR_TEXTO_SEC, padding: '3px 8px', borderRadius: 20, fontWeight: 600 }}>{n.fecha || 'Nueva'}</span>
                      </div>
                      <p style={{ color: '#fff', fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{n.titulo}</p>
                      <p style={{ color: COLOR_TEXTO_SEC, fontSize: 13, lineHeight: 1.5 }}>{n.descripcion}</p>
                    </div>
                  )) : (
                    <p style={{ color: COLOR_TEXTO_SEC, fontSize: 14 }}>No hay noticias disponibles por el momento.</p>
                  )}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                {[{ num: `${juegos.length}+`, lbl: 'Juegos disponibles' }, { num: '5M+', lbl: 'Boletos verificados' }, { num: '24/7', lbl: 'Verificacion en vivo' }, { num: '100%', lbl: 'Datos encriptados' }].map((s, i) => (
                  <div key={i} style={{ ...card, textAlign: 'center', padding: 24 }}>
                    <p style={{ fontSize: 32, fontWeight: 800, color: COLOR_ACENTO }}>{s.num}</p>
                    <p style={{ fontSize: 13, color: COLOR_TEXTO_SEC, marginTop: 6 }}>{s.lbl}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── LOTERIAS / JUEGOS ── */}
          {tab === 'loterias' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {juegoDetalle ? (
                <div>
                  <button onClick={cerrarDetalleJuego} style={{ background: 'none', border: 'none', color: COLOR_TEXTO_SEC, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, padding: 0 }}>
                    <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} /> Volver a loterias
                  </button>

                  {/* Info del juego */}
                  <div style={{ ...card, marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                      {juegoDetalle.logo_url ? (
                        <img src={juegoDetalle.logo_url} alt={juegoDetalle.nombre} style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 56, height: 56, backgroundColor: COLOR_FONDO, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Ticket size={26} color={COLOR_ACENTO} />
                        </div>
                      )}
                      <div>
                        <p style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{juegoDetalle.nombre}</p>
                        {juegoDetalle.categoria && <span style={{ fontSize: 11, backgroundColor: COLOR_FONDO, color: COLOR_TEXTO_SEC, padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>{juegoDetalle.categoria}</span>}
                      </div>
                    </div>
                    {juegoDetalle.descripcion && <p style={{ color: COLOR_TEXTO_SEC, fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>{juegoDetalle.descripcion}</p>}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                      {juegoDetalle.dia_sorteo && (
                        <div style={{ backgroundColor: COLOR_FONDO, borderRadius: 10, padding: '12px 14px' }}>
                          <p style={{ fontSize: 11, color: COLOR_TEXTO_TERC, marginBottom: 4 }}>Dia del sorteo</p>
                          <p style={{ fontSize: 14, fontWeight: 700, color: '#E0F2FE' }}>{juegoDetalle.dia_sorteo}</p>
                        </div>
                      )}
                      {juegoDetalle.horario && (
                        <div style={{ backgroundColor: COLOR_FONDO, borderRadius: 10, padding: '12px 14px' }}>
                          <p style={{ fontSize: 11, color: COLOR_TEXTO_TERC, marginBottom: 4 }}>Horario</p>
                          <p style={{ fontSize: 14, fontWeight: 700, color: '#E0F2FE' }}>{juegoDetalle.horario}</p>
                        </div>
                      )}
                      {juegoDetalle.canal_en_vivo && (
                        <div style={{ backgroundColor: COLOR_FONDO, borderRadius: 10, padding: '12px 14px' }}>
                          <p style={{ fontSize: 11, color: COLOR_TEXTO_TERC, marginBottom: 4 }}>Ver en vivo</p>
                          <p style={{ fontSize: 14, fontWeight: 700, color: COLOR_ACENTO }}>{juegoDetalle.canal_en_vivo}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ultimo resultado guardado */}
                  {(() => {
                    const ultimo = resultadosReales.find(r => r.loteria.toLowerCase() === juegoDetalle.nombre.toLowerCase());
                    if (!ultimo) return (
                      <div style={{ ...card, textAlign: 'center', padding: 32 }}>
                        <p style={{ color: COLOR_TEXTO_SEC, fontSize: 14 }}>No hay resultados guardados para este juego aun.</p>
                      </div>
                    );
                    return (
                      <div style={{ ...card, marginBottom: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                          <span style={label}>Ultimo resultado</span>
                          <span style={{ fontSize: 10, backgroundColor: '#0a5a4a', color: '#10B981', padding: '3px 8px', borderRadius: 20, fontWeight: 600 }}>{ultimo.fecha}</span>
                        </div>
                        {(() => {
                          // Premio mayor: primer tier de tipo 'mayor' en premios_json, o datos principales
                          const tiers = Array.isArray(ultimo.premios_json) ? ultimo.premios_json : [];
                          const tierMayor = tiers.find(t => t.tipo === 'mayor') || tiers[0];
                          const gMayor = tierMayor?.ganadores?.[0];
                          const nombreMayor = tierMayor?.tier_nombre || tierMayor?.nombre || 'Premio mayor';
                          const numMayor = gMayor?.numero || ultimo.numero || '';
                          const serieMayor = gMayor?.serie || ultimo.serie || '';
                          const premioMayor = gMayor?.premio || tierMayor?.premio || ultimo.premio || '';
                          const demasTiers = tiers.filter((t, i) => t !== tierMayor && i !== 0 ? t !== tierMayor : false).filter(t => t.tipo !== 'mayor');
                          return (
                            <div>
                              {/* Premio mayor en amarillo */}
                              <div style={{ backgroundColor: 'rgba(255, 215, 0, 0.12)', border: `1px solid ${COLOR_ACENTO}`, borderRadius: 12, padding: '14px 16px', marginBottom: 12 }}>
                                <p style={{ fontSize: 11, color: COLOR_ACENTO, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{nombreMayor}</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                  <div style={{ textAlign: 'center' }}>
                                    <p style={{ fontSize: 30, fontWeight: 900, color: COLOR_ACENTO, letterSpacing: 4, lineHeight: 1 }}>{numMayor}</p>
                                    {serieMayor && <p style={{ fontSize: 11, color: COLOR_ACENTO, fontWeight: 600, marginTop: 4, opacity: 0.85 }}>Serie {serieMayor}</p>}
                                  </div>
                                  <div>
                                    {premioMayor && <p style={{ fontSize: 15, fontWeight: 700, color: COLOR_ACENTO }}>{premioMayor}</p>}
                                    {ultimo.signo && <p style={{ fontSize: 12, color: COLOR_ACENTO, marginTop: 4, opacity: 0.8 }}>Signo: {ultimo.signo}</p>}
                                  </div>
                                </div>
                              </div>
                              {/* Demas resultados (incluye series) */}
                              {demasTiers.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  {demasTiers.map((tier, idx) => {
                                    const ganadores = Array.isArray(tier.ganadores) ? tier.ganadores : [];
                                    const colorTipo = tier.tipo === 'seco' ? '#F59E0B' : tier.tipo === 'aproximacion' ? '#10B981' : tier.tipo === 'especial' ? '#8B5CF6' : '#555';
                                    return (
                                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                                        <span style={{ backgroundColor: colorTipo, color: '#fff', padding: '2px 7px', borderRadius: 6, fontWeight: 700, fontSize: 10, flexShrink: 0 }}>{tier.tier_nombre || tier.nombre}</span>
                                        <span style={{ color: '#E0F2FE', fontWeight: 700, letterSpacing: 1 }}>
                                          {ganadores.map(g => g.numero + (g.serie ? ` (Serie ${g.serie})` : '')).filter(Boolean).join(', ')}
                                        </span>
                                        {tier.premio && <span style={{ color: COLOR_TEXTO_SEC, marginLeft: 'auto' }}>{tier.premio}</span>}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })()}

                  {/* Resultados anteriores */}
                  <div>
                    <button onClick={() => setVerHistorico(v => !v)} style={{ width: '100%', background: 'transparent', border: `1px solid ${COLOR_BORDE}`, borderRadius: 12, padding: '14px 18px', color: COLOR_TEXTO_SEC, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      Ver resultados de sorteos anteriores
                      <ChevronRight size={16} style={{ transform: verHistorico ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>
                    {verHistorico && (
                      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {cargandoHistorico ? (
                          <p style={{ color: COLOR_TEXTO_SEC, fontSize: 14, textAlign: 'center', padding: 24 }}>Cargando historico...</p>
                        ) : historicoSorteos.length === 0 ? (
                          <p style={{ color: COLOR_TEXTO_SEC, fontSize: 14, textAlign: 'center', padding: 24 }}>No hay sorteos anteriores registrados.</p>
                        ) : (
                          historicoSorteos.map((s, i) => (
                            <div key={i} style={{ ...card }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <span style={{ fontSize: 12, color: COLOR_TEXTO_SEC, fontWeight: 600 }}>{s.fecha}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ backgroundColor: COLOR_FONDO, borderRadius: 8, padding: '8px 14px', textAlign: 'center' }}>
                                  <p style={{ fontSize: 22, fontWeight: 900, color: COLOR_ACENTO, letterSpacing: 3 }}>{s.numero}</p>
                                  {s.serie && <p style={{ fontSize: 10, color: COLOR_ACENTO, opacity: 0.7 }}>Serie {s.serie}</p>}
                                </div>
                                <div>
                                  {s.premio && <p style={{ fontSize: 14, fontWeight: 700, color: '#E0F2FE' }}>{s.premio}</p>}
                                  {s.signo && <p style={{ fontSize: 11, color: COLOR_TEXTO_SEC, marginTop: 2 }}>Signo: {s.signo}</p>}
                                </div>
                              </div>
                              {s.premios_json && Array.isArray(s.premios_json) && s.premios_json.length > 0 && (
                                <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${COLOR_BORDE}`, display: 'flex', flexDirection: 'column', gap: 5 }}>
                                  {s.premios_json.map((tier, idx) => {
                                    const ganadores = Array.isArray(tier.ganadores) ? tier.ganadores : [];
                                    const colorTipo = tier.tipo === 'mayor' ? '#C41230' : tier.tipo === 'seco' ? '#F59E0B' : tier.tipo === 'aproximacion' ? '#10B981' : '#8B5CF6';
                                    return (
                                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                                        <span style={{ backgroundColor: colorTipo, color: '#fff', padding: '2px 6px', borderRadius: 5, fontWeight: 700, fontSize: 9, flexShrink: 0 }}>{tier.tier_nombre || tier.nombre}</span>
                                        {ganadores.length > 0 && <span style={{ color: '#E0F2FE', fontWeight: 700, letterSpacing: 1 }}>{ganadores.map(g => g.numero + (g.serie ? ` (Serie ${g.serie})` : '')).filter(Boolean).join(', ')}</span>}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <span style={label}>Todas las loterias y juegos</span>
                  <p style={{ color: COLOR_TEXTO_TERC, fontSize: 13, marginBottom: 20 }}>Selecciona un juego para ver dias, horarios, donde ver en vivo y resultados.</p>
                  {juegos.length === 0 ? (
                    <p style={{ color: COLOR_TEXTO_SEC, fontSize: 14, textAlign: 'center', padding: 40 }}>Cargando juegos...</p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
                      {juegos.map(j => {
                        const ultimo = resultadosReales.find(r => r.loteria.toLowerCase() === j.nombre.toLowerCase());
                        return (
                          <button key={j.id} onClick={() => abrirDetalleJuego(j)} style={{ ...card, textAlign: 'left', cursor: 'pointer', border: `1px solid ${COLOR_BORDE}`, transition: 'border-color 0.2s' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                              {j.logo_url ? (
                                <img src={j.logo_url} alt={j.nombre} style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover' }} />
                              ) : (
                                <div style={{ width: 44, height: 44, backgroundColor: COLOR_FONDO, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Ticket size={20} color={COLOR_ACENTO} />
                                </div>
                              )}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{j.nombre}</p>
                                {j.categoria && <span style={{ fontSize: 10, color: COLOR_TEXTO_TERC }}>{j.categoria}</span>}
                              </div>
                              <ChevronRight size={18} color={COLOR_TEXTO_TERC} />
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              {j.dia_sorteo && <span style={{ fontSize: 10, backgroundColor: COLOR_FONDO, color: COLOR_TEXTO_SEC, padding: '3px 8px', borderRadius: 20, fontWeight: 600 }}>{j.dia_sorteo}</span>}
                              {j.horario && <span style={{ fontSize: 10, backgroundColor: COLOR_FONDO, color: COLOR_TEXTO_SEC, padding: '3px 8px', borderRadius: 20, fontWeight: 600 }}>{j.horario}</span>}
                              {j.canal_en_vivo && <span style={{ fontSize: 10, backgroundColor: '#3a2f0a', color: COLOR_ACENTO, padding: '3px 8px', borderRadius: 20, fontWeight: 600 }}>En vivo</span>}
                            </div>
                            {ultimo && (() => {
                              const tierMayor = Array.isArray(ultimo.premios_json) ? ultimo.premios_json.find(t => t.tipo === 'mayor') : null;
                              const serieMayor = tierMayor?.ganadores?.[0]?.serie || ultimo.serie || '';
                              return (
                              <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${COLOR_BORDE}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontSize: 16, fontWeight: 900, color: COLOR_ACENTO, letterSpacing: 2 }}>{ultimo.numero}</span>
                                  {serieMayor && <span style={{ fontSize: 10, color: COLOR_ACENTO, fontWeight: 600, opacity: 0.8 }}>Serie {serieMayor}</span>}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontSize: 10, color: COLOR_TEXTO_SEC, fontWeight: 600 }}>Sorteo {ultimo.numero}</span>
                                  <span style={{ fontSize: 10, color: COLOR_TEXTO_TERC }}>{ultimo.fecha}</span>
                                </div>
                              </div>
                              );
                            })()}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── VERIFICAR / GUARDAR ── */}
          {tab === 'verificar' && juegoSeleccionado && (
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
                      onChange={e => { setNumero(e.target.value); setResultado(null); }}
                      style={{ flex: '1 1 160px', minWidth: 0, backgroundColor: COLOR_FONDO, border: `1.5px solid ${COLOR_BORDE}`, borderRadius: 12, padding: '14px 8px', textAlign: 'center', fontSize: 28, fontWeight: 700, letterSpacing: 8, color: '#fff', outline: 'none' }}
                    />
                    {juegoSeleccionado.serie_digits > 0 && (
                      <>
                        <span style={{ color: COLOR_BORDE, fontSize: 24, flexShrink: 0 }}>–</span>
                        <input
                          type="text" maxLength={3} placeholder="A00" value={serie}
                          onChange={e => { setSerie(e.target.value); setResultado(null); }}
                          style={{ flex: '0 0 100px', minWidth: 100, backgroundColor: COLOR_FONDO, border: `1.5px solid ${COLOR_BORDE}`, borderRadius: 12, padding: '14px 8px', textAlign: 'center', fontSize: 22, fontWeight: 700, letterSpacing: 5, color: '#fff', outline: 'none' }}
                        />
                      </>
                    )}
                  </div>
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
                        <button key={f} type="button" onClick={() => toggleFraccion(f)} style={{ width: 40, height: 40, borderRadius: 10, border: `1.5px solid ${fraccionesSeleccionadas.includes(f) ? COLOR_ACENTO : COLOR_BORDE}`, backgroundColor: fraccionesSeleccionadas.includes(f) ? '#3a2f0a' : COLOR_FONDO, color: fraccionesSeleccionadas.includes(f) ? COLOR_ACENTO : COLOR_TEXTO_SEC, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}>
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

                {/* Botones de accion */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button onClick={boletoEditandoId ? guardarEdicionBoleto : (hayEscaneados ? verificarYGuardar : soloVerificar)} disabled={!hayNumero || verificando || guardando} style={{ width: '100%', backgroundColor: COLOR_ACENTO, border: 'none', borderRadius: 12, padding: '16px', fontSize: 16, fontWeight: 700, color: '#1A1500', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: (!hayNumero || verificando || guardando) ? 0.4 : 1, boxShadow: '0 4px 24px rgba(255,215,0,0.25)' }}>
                    <Search size={20} />
                    {verificando ? 'Verificando...' : guardando ? 'Guardando...' : boletoEditandoId ? 'Guardar cambios' : 'Verificar / Guardar'}
                  </button>
                  {boletoEditandoId && (
                    <button onClick={cancelarEdicion} style={{ width: '100%', backgroundColor: 'transparent', border: `1.5px solid ${COLOR_BORDE}`, borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 700, color: COLOR_TEXTO_SEC, cursor: 'pointer' }}>
                      Cancelar edición
                    </button>
                  )}
                </div>
              </div>

              {/* Columna derecha — boletos escaneados o resultado */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Lista de boletos escaneados */}
                {hayEscaneados && (
                  <div style={{ ...card }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <p style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>
                        📸 {boletosEscaneados.length} {boletosEscaneados.length === 1 ? 'boleto detectado' : 'boletos detectados'}
                      </p>
                      <button onClick={cerrarEscaneados} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLOR_TEXTO_SEC }}>
                        <X size={16} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {boletosEscaneados.map((b, i) => {
                        const estaSeleccionado = indiceSeleccionado === i && b.estado !== 'guardado';
                        const estaGuardado = b.estado === 'guardado';
                        return (
                          <div
                            key={i}
                            onClick={() => !estaGuardado && seleccionarBoletoEscaneado(i)}
                            style={{
                              border: `1.5px solid ${estaSeleccionado ? COLOR_ACENTO : estaGuardado ? '#10B981' : COLOR_BORDE}`,
                              borderRadius: 12, padding: '12px 14px',
                              backgroundColor: estaSeleccionado ? '#3a2f0a' : estaGuardado ? '#0a3a2a' : COLOR_FONDO,
                              cursor: estaGuardado ? 'default' : 'pointer',
                              display: 'flex', alignItems: 'center', gap: 12,
                              transition: 'all 0.15s',
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ color: estaGuardado ? '#10B981' : COLOR_TEXTO_SEC, fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
                                {b.loteria || 'Juego no detectado'}
                              </p>
                              <p style={{ color: estaGuardado ? '#10B981' : estaSeleccionado ? COLOR_ACENTO : '#E0F2FE', fontSize: 18, fontWeight: 800, letterSpacing: 2 }}>
                                {b.numero || '----'}{b.serie ? ` – ${b.serie}` : ''}
                              </p>
                              {b.fracciones?.length > 0 && (
                                <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                                  {b.fracciones.map(f => (
                                    <span key={f} style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 5, backgroundColor: estaGuardado ? '#0a5a4a' : '#3a2f0a', color: estaGuardado ? '#10B981' : COLOR_ACENTO }}>F{f}</span>
                                  ))}
                                </div>
                              )}
                              {estaGuardado && b.resultadoVerificacion && (
                                <p style={{ fontSize: 11, color: '#10B981', fontWeight: 600, marginTop: 4 }}>
                                  ✓ {b.resultadoVerificacion.titulo}
                                  {b.resultadoVerificacion.premio && ` · ${b.resultadoVerificacion.premio}`}
                                </p>
                              )}
                            </div>
                            <div style={{ flexShrink: 0 }}>
                              {estaGuardado ? (
                                <Check size={18} color="#10B981" />
                              ) : estaSeleccionado ? (
                                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: COLOR_ACENTO }} />
                              ) : (
                                <ChevronRight size={16} color={COLOR_TEXTO_TERC} />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {boletosEscaneados.every(b => b.estado === 'guardado') && (
                      <div style={{ marginTop: 14, textAlign: 'center' }}>
                        <p style={{ color: '#10B981', fontSize: 13, fontWeight: 700, marginBottom: 10 }}>✓ Todos los boletos guardados</p>
                        <button onClick={cerrarEscaneados} style={{ backgroundColor: 'transparent', border: `1px solid ${COLOR_BORDE}`, borderRadius: 10, padding: '10px 24px', color: COLOR_TEXTO_SEC, fontSize: 13, cursor: 'pointer' }}>
                          Cerrar
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Resultado de verificacion */}
                {resultado && (
                  <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${resultado.tipo === 'mayor' ? '#10B981' : resultado.tipo === 'seco' ? COLOR_ACENTO : resultado.tipo === 'warning' ? '#F59E0B' : COLOR_BORDE}` }}>
                    <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, backgroundColor: resultado.tipo === 'mayor' ? '#0a3a2a' : resultado.tipo === 'seco' ? '#3a2f0a' : resultado.tipo === 'warning' ? '#3a240a' : resultado.tipo === 'success' ? '#0a3a2a' : resultado.tipo === 'nada' ? '#1a1a1a' : COLOR_FONDO }}>
                      <div style={{ width: 52, height: 52, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, backgroundColor: resultado.tipo === 'mayor' ? '#0a5a4a' : resultado.tipo === 'seco' ? '#5a4a0a' : resultado.tipo === 'warning' ? '#5a3c0a' : resultado.tipo === 'success' ? '#0a5a4a' : COLOR_CARD, flexShrink: 0 }}>
                        {resultado.tipo === 'mayor' ? '🏆' : resultado.tipo === 'seco' ? '🪙' : resultado.tipo === 'pendiente' ? '⏳' : resultado.tipo === 'error' ? '⚠️' : resultado.tipo === 'warning' ? '🗓️' : resultado.tipo === 'success' ? '✅' : '❌'}
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 18, color: resultado.tipo === 'mayor' ? '#10B981' : resultado.tipo === 'seco' ? COLOR_ACENTO : resultado.tipo === 'warning' ? '#FCD34D' : resultado.tipo === 'success' ? '#10B981' : COLOR_TEXTO_SEC }}>{resultado.titulo}</p>
                        {resultado.premio && <p style={{ fontSize: 22, fontWeight: 800, color: resultado.tipo === 'mayor' ? '#10B981' : COLOR_ACENTO, marginTop: 4 }}>{resultado.premio}</p>}
                        {resultado.mensaje && <p style={{ fontSize: 13, color: '#FDE68A', marginTop: 6, fontWeight: 600 }}>{resultado.mensaje}</p>}
                        {resultado?.mostrarEditar && (
                          <button onClick={abrirEdicionDesdeResultado} style={{ marginTop: 10, backgroundColor: COLOR_ACENTO, border: 'none', borderRadius: 10, padding: '10px 14px', color: '#1A1500', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                            Editar este numero
                          </button>
                        )}
                      </div>
                    </div>

                    {resultado.tipo !== 'error' && (
                      <div style={{ padding: '16px 20px', backgroundColor: COLOR_FONDO, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[
                          { lbl: 'Numero', val: `${numero.padStart(juegoSeleccionado.numero_digits || 4, '0')}${serie ? ' – ' + serie.toUpperCase() : ''}` },
                          fraccionesSeleccionadas.length > 0 && { lbl: 'Fracciones', val: fraccionesSeleccionadas.join(', ') },
                          { lbl: 'Juego', val: juegoSeleccionado.nombre },
                          fechaSorteo && { lbl: 'Fecha', val: fechaSorteo },
                          resultado.sorteo && { lbl: 'Numero ganador', val: `${resultado.sorteo.numero}${resultado.sorteo.serie ? ' – ' + resultado.sorteo.serie : ''}` },
                        ].filter(Boolean).map(({ lbl, val }) => (
                          <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, paddingBottom: 10, borderBottom: `1px solid ${COLOR_BORDE}` }}>
                            <span style={{ color: COLOR_TEXTO_SEC }}>{lbl}</span>
                            <span style={{ color: '#E0F2FE', fontWeight: 600 }}>{val}</span>
                          </div>
                        ))}
                        {hayEscaneados && resultado.tipo !== 'warning' && (
                          <p style={{ fontSize: 12, color: '#10B981', textAlign: 'center', marginTop: 4 }}>✓ Guardado automaticamente</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Estado vacio */}
                {!hayEscaneados && !resultado && (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: `1px solid ${COLOR_BORDE}`, borderRadius: 16, padding: 40, textAlign: 'center', backgroundColor: COLOR_FONDO, minHeight: 300 }}>
                    <div style={{ width: 64, height: 64, backgroundColor: COLOR_CARD, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                      <Search size={28} color={COLOR_BORDE} />
                    </div>
                    <p style={{ color: COLOR_TEXTO_SEC, fontSize: 15, fontWeight: 500 }}>Ingresa un numero para verificar</p>
                    <p style={{ color: COLOR_TEXTO_TERC, fontSize: 13, marginTop: 8 }}>o escanea tu boleto con la camara</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── RESULTADOS ── */}
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
                      <p style={{ color: COLOR_TEXTO_SEC, fontSize: 14, textAlign: 'center', padding: '24px 0' }}>No tienes boletos pendientes</p>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
                        {pendientes.map((b) => (
                          <div key={b.id} style={{ ...card }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                              <p style={{ fontSize: 12, color: COLOR_TEXTO_SEC }}>{b.loteria}</p>
                              <button onClick={() => eliminarBoleto(b.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLOR_BORDE, padding: 4 }}><Trash2 size={14} /></button>
                            </div>
                            <p style={{ fontSize: 22, fontWeight: 900, color: '#E0F2FE', letterSpacing: 3 }}>{b.numero}{b.serie ? ` – ${b.serie}` : ''}</p>
                            {b.fracciones?.length > 0 && <p style={{ fontSize: 11, color: COLOR_ACENTO, marginTop: 4 }}>Fracciones: {b.fracciones.join(', ')}</p>}
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
                              <button onClick={() => eliminarBoleto(b.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLOR_BORDE, padding: 4 }}><Trash2 size={14} /></button>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <p style={{ fontSize: 22, fontWeight: 900, color: '#E0F2FE', letterSpacing: 3 }}>{b.numero}{b.serie ? ` – ${b.serie}` : ''}</p>
                              <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, backgroundColor: b.resultado === 'ganador' ? '#0a5a4a' : COLOR_FONDO, color: b.resultado === 'ganador' ? '#10B981' : COLOR_TEXTO_SEC }}>
                                {b.resultado === 'ganador' ? '🏆 Ganador' : '❌ Sin premio'}
                              </span>
                            </div>
                            {b.fracciones?.length > 0 && <p style={{ fontSize: 11, color: COLOR_TEXTO_SEC, marginTop: 4 }}>Fracciones: {b.fracciones.join(', ')}</p>}
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
                    <button onClick={() => window.location.href = '/login'} style={{ backgroundColor: COLOR_ACENTO, border: 'none', borderRadius: 10, padding: '13px 36px', color: '#1A1500', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Iniciar sesion</button>
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

        {/* Banner: Push activo en cuenta pero no en este dispositivo */}
      {mostrarBannerPush && (
        <div style={{ position: 'fixed', bottom: 80, right: 20, zIndex: 1100, maxWidth: 360, backgroundColor: '#112438', border: `1px solid ${COLOR_ACENTO}`, borderRadius: 14, padding: '14px 18px', boxShadow: '0 8px 30px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Bell size={20} color={COLOR_ACENTO} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#fff' }}>Notificaciones push activas en tu cuenta</p>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: COLOR_TEXTO_SEC, lineHeight: 1.4 }}>Actívalas también en este dispositivo para recibir alertas.</p>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button onClick={async () => {
              setMostrarBannerPush(false);
              const sub = await subscribeToPush();
              if (sub) {
                const subsActuales = Array.isArray(perfil?.push_subscriptions) ? perfil.push_subscriptions : (perfil?.push_subscription_json ? [perfil.push_subscription_json] : []);
                const endpoint = sub.endpoint;
                const yaExiste = subsActuales.some(s => (typeof s === 'object' ? s.endpoint : null) === endpoint);
                const nuevasSubs = yaExiste ? subsActuales : [...subsActuales, sub];
                await actualizarPerfil({ push_subscriptions: nuevasSubs, push_subscription_json: sub });
              }
            }} style={{ background: COLOR_ACENTO, border: 'none', borderRadius: 8, padding: '7px 14px', color: '#1A1500', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Activar
            </button>
            <button onClick={() => setMostrarBannerPush(false)} style={{ background: 'transparent', border: 'none', color: COLOR_TEXTO_SEC, cursor: 'pointer', fontSize: 16, padding: '4px 6px' }}>
              ×
            </button>
          </div>
        </div>
      )}

      {/* Menu Inferior */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: COLOR_FONDO, borderTop: `1px solid ${COLOR_BORDE}`, display: 'flex', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ width: '100%', maxWidth: 1800, display: 'flex', justifyContent: 'space-around' }}>
            {[
              { id: 'inicio', label: 'Inicio', icon: HomeIcon },
              { id: 'loterias', label: 'Juegos y Resultados', icon: Ticket },
              { id: 'verificar', label: 'Verificar/Guardar', icon: Search },
              { id: 'numeros', label: 'Mis Numeros', icon: Ticket },
            ].map(({ id, label: lbl, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)} style={{ flex: 1, padding: '14px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, border: 'none', borderTop: tab === id ? `3px solid ${COLOR_ACENTO}` : 'none', cursor: 'pointer', backgroundColor: 'transparent', color: tab === id ? COLOR_ACENTO : COLOR_TEXTO_SEC, transition: 'all 0.2s' }}>
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