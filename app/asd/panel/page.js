'use client';
import { useState, useEffect } from 'react';
import { LogOut, DollarSign, Ticket, Users, Plus, Copy, Check, X, Edit2, Trash2, Newspaper } from 'lucide-react';

export default function AdminPanel() {
  const [cargando, setCargando] = useState(true);
  const [sesion, setSesion] = useState(null);
  const [vista, setVista] = useState('inicio');

  useEffect(() => { checkSesion(); }, []);

  async function checkSesion() {
    try {
      const res = await fetch('/api/admin/sesion');
      if (!res.ok) { window.location.href = '/asd'; return; }
      const data = await res.json();
      setSesion(data);
    } catch { window.location.href = '/asd'; }
    finally { setCargando(false); }
  }

  async function cerrarSesion() {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.href = '/asd';
  }

  const card = { backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 16, padding: 24, cursor: 'pointer' };

  if (cargando) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#555', fontSize: 14 }}>Cargando...</p>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A0A0A', padding: 24 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <p style={{ color: '#fff', fontSize: 24, fontWeight: 800 }}>Panel Administrativo</p>
            <p style={{ color: '#555', fontSize: 13, marginTop: 4 }}>{sesion?.email} - {sesion?.rol === 'admin' ? 'Administrador' : 'Scraper'}</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {vista !== 'inicio' && (
              <button onClick={() => setVista('inicio')} style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, padding: '8px 16px', color: '#888', fontSize: 13, cursor: 'pointer' }}>Volver</button>
            )}
            <button onClick={cerrarSesion} style={{ background: '#2A0000', border: '1px solid #3A0000', borderRadius: 8, padding: '8px 16px', color: '#ff6b6b', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <LogOut size={14} /> Salir
            </button>
          </div>
        </div>

        {vista === 'inicio' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {sesion?.rol === 'admin' && (
              <div onClick={() => setVista('precios')} style={card}>
                <DollarSign size={28} color="#C41230" style={{ marginBottom: 12 }} />
                <p style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Precios y planes</p>
                <p style={{ color: '#555', fontSize: 13 }}>Edita precios, limites y nombres de planes.</p>
              </div>
            )}
            <div onClick={() => setVista('resultados')} style={card}>
              <Ticket size={28} color="#C41230" style={{ marginBottom: 12 }} />
              <p style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Resultados de loterías</p>
              <p style={{ color: '#555', fontSize: 13 }}>Actualiza números ganadores por categoría.</p>
            </div>
            {sesion?.rol === 'admin' && (
              <div onClick={() => setVista('juegos')} style={card}>
                <Plus size={28} color="#C41230" style={{ marginBottom: 12 }} />
                <p style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Juegos y loterias</p>
                <p style={{ color: '#555', fontSize: 13 }}>Agrega, edita o desactiva juegos por categoria.</p>
              </div>
            )}
            {sesion?.rol === 'admin' && (
              <div onClick={() => setVista('usuarios')} style={card}>
                <Users size={28} color="#C41230" style={{ marginBottom: 12 }} />
                <p style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Usuarios administrativos</p>
                <p style={{ color: '#555', fontSize: 13 }}>Crea y gestiona cuentas admin/scraper.</p>
              </div>
            )}
            {sesion?.rol === 'admin' && (
              <div onClick={() => setVista('noticias')} style={card}>
                <Newspaper size={28} color="#C41230" style={{ marginBottom: 12 }} />
                <p style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Noticias</p>
                <p style={{ color: '#555', fontSize: 13 }}>Agrega, edita o elimina las noticias del inicio.</p>
              </div>
            )}
          </div>
        )}

        {vista === 'precios' && <PanelPrecios />}
        {vista === 'resultados' && <PanelResultados />}
        {vista === 'juegos' && <PanelJuegos />}
        {vista === 'usuarios' && <PanelUsuarios />}
        {vista === 'noticias' && <PanelNoticias />}
      </div>
    </div>
  );
}

// ─── PANEL PRECIOS ───────────────────────────────────────────
function PanelPrecios() {
  const [config, setConfig] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setCargando(true);
    const res = await fetch('/api/configuracion');
    const data = await res.json();
    if (!data.error) setConfig(data);
    setCargando(false);
  }

  async function guardar() {
    setGuardando(true); setMensaje(null); setError(null);
    const res = await fetch('/api/admin/configuracion', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config) });
    const data = await res.json();
    if (!res.ok) setError(data.error || 'Error al guardar.');
    else { setMensaje('Configuracion guardada correctamente.'); setConfig(data.configuracion); }
    setGuardando(false);
  }

  const inputStyle = { width: '100%', backgroundColor: '#0A0A0A', border: '1px solid #2A2A2A', borderRadius: 10, padding: '10px 12px', fontSize: 14, color: '#E0E0E0', outline: 'none' };
  const labelStyle = { fontSize: 11, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, display: 'block' };

  if (cargando) return <p style={{ color: '#555' }}>Cargando...</p>;
  if (!config) return <p style={{ color: '#ff6b6b' }}>Error al cargar configuracion.</p>;

  return (
    <div>
      <p style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Precios, limites y nombres de planes</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { key: 'gratis', nombre: 'nombre_gratis', precio: null, precioFijo: '$0', limite: 'limite_gratis' },
          { key: 'basico', nombre: 'nombre_basico', precio: 'precio_basico', limite: 'limite_basico' },
          { key: 'pro', nombre: 'nombre_pro', precio: 'precio_pro', limite: 'limite_pro' },
          { key: 'premium', nombre: 'nombre_premium', precio: 'precio_premium', limite: null },
        ].map(p => (
          <div key={p.key} style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 16, padding: 20 }}>
            <p style={{ color: '#E0E0E0', fontSize: 15, fontWeight: 700, marginBottom: 16, textTransform: 'capitalize' }}>Plan {config[p.nombre] || p.key}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><span style={labelStyle}>Nombre del plan</span><input type="text" value={config[p.nombre] || ''} onChange={e => setConfig({ ...config, [p.nombre]: e.target.value })} style={inputStyle} /></div>
              <div><span style={labelStyle}>Precio mensual</span><input type="text" value={p.precioFijo || config[p.precio] || ''} disabled={!!p.precioFijo} onChange={e => setConfig({ ...config, [p.precio]: e.target.value })} style={{ ...inputStyle, opacity: p.precioFijo ? 0.4 : 1, cursor: p.precioFijo ? 'not-allowed' : 'text' }} /></div>
              <div><span style={labelStyle}>Límite de boletos</span>{p.limite ? <input type="number" min="1" value={config[p.limite] || ''} onChange={e => setConfig({ ...config, [p.limite]: e.target.value })} style={inputStyle} /> : <input type="text" value="Ilimitado" disabled style={{ ...inputStyle, opacity: 0.4, cursor: 'not-allowed' }} />}</div>
            </div>
          </div>
        ))}
      </div>
      {mensaje && <div style={{ backgroundColor: '#0d1f0d', border: '1px solid #1a3a1a', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}><p style={{ color: '#4ade80', fontSize: 13 }}>{mensaje}</p></div>}
      {error && <div style={{ backgroundColor: '#1E0000', border: '1px solid #3A0000', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}><p style={{ color: '#ff6b6b', fontSize: 13 }}>{error}</p></div>}
      <button onClick={guardar} disabled={guardando} style={{ background: '#C41230', border: 'none', borderRadius: 10, padding: '13px 32px', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: guardando ? 0.6 : 1 }}>{guardando ? 'Guardando...' : 'Guardar cambios'}</button>
    </div>
  );
}

// ─── PANEL NOTICIAS ───────────────────────────────────────
function PanelNoticias() {
  const [noticias, setNoticias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ titulo: '', descripcion: '', fecha: '', icono: '📰' });

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setCargando(true);
    const res = await fetch('/api/admin/noticias');
    const data = await res.json();
    if (data.noticias) setNoticias(data.noticias);
    setCargando(false);
  }

  function resetForm() {
    setForm({ titulo: '', descripcion: '', fecha: '', icono: '📰' });
    setEditando(null);
  }

  async function guardar() {
    setGuardando(true); setError(null); setMensaje(null);
    if (!form.titulo.trim() || !form.descripcion.trim()) { setError('Título y descripción son obligatorios.'); setGuardando(false); return; }

    const method = editando ? 'PUT' : 'POST';
    const body = editando ? { id: editando.id, ...form } : form;
    const res = await fetch('/api/admin/noticias', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) setError(data.error || 'Error al guardar.');
    else { setMensaje(editando ? 'Noticia actualizada.' : 'Noticia creada.'); await cargar(); resetForm(); }
    setGuardando(false);
  }

  async function eliminar(id) {
    if (!confirm('Seguro que quieres eliminar esta noticia?')) return;
    const res = await fetch('/api/admin/noticias', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    const data = await res.json();
    if (!res.ok) setError(data.error || 'Error al eliminar.');
    else { await cargar(); setMensaje('Noticia eliminada.'); }
  }

  function iniciarEdicion(noticia) {
    setEditando(noticia);
    setForm({ titulo: noticia.titulo || '', descripcion: noticia.descripcion || '', fecha: noticia.fecha || '', icono: noticia.icono || '📰' });
  }

  const inputStyle = { width: '100%', backgroundColor: '#0A0A0A', border: '1px solid #2A2A2A', borderRadius: 10, padding: '10px 12px', fontSize: 14, color: '#E0E0E0', outline: 'none' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <p style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>Noticias del inicio</p>
        <button onClick={() => { resetForm(); setEditando(null); }} style={{ background: '#C41230', border: 'none', borderRadius: 8, padding: '10px 18px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{editando ? 'Cancelar edición' : 'Nueva noticia'}</button>
      </div>

      {mensaje && <div style={{ backgroundColor: '#0d1f0d', border: '1px solid #1a3a1a', borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}><p style={{ color: '#4ade80', fontSize: 13 }}>{mensaje}</p></div>}
      {error && <div style={{ backgroundColor: '#1E0000', border: '1px solid #3A0000', borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}><p style={{ color: '#ff6b6b', fontSize: 13 }}>{error}</p></div>}

      <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 16, padding: 20, marginBottom: 20 }}>
        <p style={{ color: '#fff', fontSize: 15, fontWeight: 700, marginBottom: 16 }}>{editando ? 'Editar noticia' : 'Crear noticia'}</p>
        <div style={{ display: 'grid', gap: 12 }}>
          <input type="text" placeholder="Título" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} style={inputStyle} />
          <textarea placeholder="Descripción" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <input type="text" placeholder="Fecha (ej. Hoy)" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} style={inputStyle} />
            <input type="text" placeholder="Ícono (ej. 📰)" value={form.icono} onChange={e => setForm({ ...form, icono: e.target.value })} style={inputStyle} />
          </div>
          <button onClick={guardar} disabled={guardando} style={{ background: '#C41230', border: 'none', borderRadius: 10, padding: '12px 18px', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: guardando ? 0.6 : 1 }}>{guardando ? 'Guardando...' : editando ? 'Actualizar noticia' : 'Guardar noticia'}</button>
        </div>
      </div>

      {cargando ? <p style={{ color: '#555' }}>Cargando...</p> : (
        <div style={{ display: 'grid', gap: 12 }}>
          {noticias.map(noticia => (
            <div key={noticia.id} style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 16, padding: 16, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
              <div>
                <p style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>{noticia.titulo}</p>
                <p style={{ color: '#888', fontSize: 13, marginTop: 6 }}>{noticia.descripcion}</p>
                <p style={{ color: '#555', fontSize: 12, marginTop: 8 }}>{noticia.fecha || 'Nueva'} · {noticia.icono || '📰'}</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => iniciarEdicion(noticia)} style={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, padding: '8px 10px', color: '#fff', cursor: 'pointer' }}><Edit2 size={14} /></button>
                <button onClick={() => eliminar(noticia.id)} style={{ background: '#2A0000', border: '1px solid #3A0000', borderRadius: 8, padding: '8px 10px', color: '#ff6b6b', cursor: 'pointer' }}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PANEL JUEGOS ───────────────────────────────────────────
function PanelJuegos() {
  const [juegos, setJuegos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(formVacio());
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const categorias = ['Loteria', 'Chance', 'Especiales'];
  const tipos = ['loteria', 'chance', 'quinta', 'chance_millonario'];
  const tiposPremio = [
    { value: 'mayor', label: 'Premio mayor' },
    { value: 'seco', label: 'Seco' },
    { value: 'aproximacion', label: 'Aproximacion' },
    { value: 'especial', label: 'Especial' },
  ];

  function formVacio() {
    return { nombre: '', categoria: 'Loteria', tipo: 'loteria', dia_sorteo: '', horario: '', operador: '', canal_en_vivo: '', descripcion: '', orden: 99, numero_digits: 4, serie_digits: 0, total_fracciones: 1, tiene_fraccion: false, usa_signo: false, usa_quinta: false, activo: true, plan_premios: [] };
  }

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setCargando(true);
    const res = await fetch('/api/admin/juegos');
    const data = await res.json();
    if (data.juegos) setJuegos(data.juegos);
    setCargando(false);
  }

  function resetForm() { setForm(formVacio()); }

  function agregarPremio() {
    setForm(f => ({ ...f, plan_premios: [...(f.plan_premios || []), { nombre: '', posicion: (f.plan_premios?.length || 0) + 1, tipo: 'seco', cifras: '', cantidad_ganadores: 1, premio: '', descripcion: '', requiere_serie: false, comparar_serie: false }] }));
  }

  function actualizarPremio(idx, campo, valor) {
    setForm(f => {
      const plan = [...(f.plan_premios || [])];
      plan[idx] = { ...plan[idx], [campo]: valor };
      return { ...f, plan_premios: plan };
    });
  }

  function eliminarPremio(idx) {
    setForm(f => ({ ...f, plan_premios: (f.plan_premios || []).filter((_, i) => i !== idx) }));
  }

  async function guardar() {
    setError(null); setGuardando(true);
    if (!form.nombre.trim()) { setError('El nombre es obligatorio.'); setGuardando(false); return; }

    const method = editando ? 'PUT' : 'POST';
    const body = editando ? { id: editando.id, ...form } : form;

    const res = await fetch('/api/admin/juegos', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();

    if (!res.ok) { setError(data.error || 'Error al guardar.'); }
    else { await cargar(); setMostrarForm(false); setEditando(null); resetForm(); }
    setGuardando(false);
  }

  async function toggleActivo(juego) {
    await fetch('/api/admin/juegos', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: juego.id, activo: !juego.activo }) });
    await cargar();
  }

  async function eliminar(id) {
    if (!confirm('Seguro que quieres eliminar este juego?')) return;
    await fetch('/api/admin/juegos', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    await cargar();
  }

  function iniciarEdicion(juego) {
    setEditando(juego);
    setForm({
      nombre: juego.nombre || '',
      categoria: ['Loteria', 'Chance', 'Especiales'].includes(juego.categoria) ? juego.categoria : 'Loteria',
      tipo: juego.tipo || 'loteria',
      dia_sorteo: juego.dia_sorteo || '',
      horario: juego.horario || '',
      operador: juego.operador || '',
      canal_en_vivo: juego.canal_en_vivo || '',
      descripcion: juego.descripcion || '',
      orden: juego.orden || 99,
      numero_digits: juego.numero_digits || 4,
      serie_digits: juego.serie_digits || 0,
      total_fracciones: juego.total_fracciones || 1,
      tiene_fraccion: juego.tiene_fraccion ?? false,
      usa_signo: juego.usa_signo ?? false,
      usa_quinta: juego.usa_quinta ?? false,
      activo: juego.activo ?? true,
      plan_premios: Array.isArray(juego.plan_premios) ? juego.plan_premios.map(p => ({
        nombre: p.nombre || '',
        posicion: p.posicion || 1,
        tipo: p.tipo || 'seco',
        cifras: p.cifras ?? '',
        cantidad_ganadores: p.cantidad_ganadores ?? 1,
        premio: p.premio || '',
        descripcion: p.descripcion || '',
        requiere_serie: p.requiere_serie ?? false,
        comparar_serie: p.comparar_serie ?? false,
      })) : [],
    });
    setMostrarForm(true);
  }

  const inputStyle = { width: '100%', backgroundColor: '#0A0A0A', border: '1px solid #2A2A2A', borderRadius: 10, padding: '10px 12px', fontSize: 14, color: '#E0E0E0', outline: 'none' };
  const labelStyle = { fontSize: 11, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, display: 'block' };

  const porCategoria = juegos.reduce((acc, j) => {
    if (!acc[j.categoria]) acc[j.categoria] = [];
    acc[j.categoria].push(j);
    return acc;
  }, {});

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <p style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>Juegos y loterias</p>
        {!mostrarForm && (
          <button onClick={() => { setMostrarForm(true); setEditando(null); resetForm(); }}
            style={{ background: '#C41230', border: 'none', borderRadius: 8, padding: '10px 18px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> Nuevo juego
          </button>
        )}
      </div>

      {mostrarForm && (
        <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <p style={{ color: '#fff', fontSize: 15, fontWeight: 700, marginBottom: 16 }}>{editando ? 'Editar juego' : 'Nuevo juego'}</p>

          {/* Datos basicos */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
            <div><span style={labelStyle}>Nombre</span><input type="text" placeholder="Ej: Loteria de Bogota" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} style={inputStyle} /></div>
            <div><span style={labelStyle}>Categoria</span><select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} style={inputStyle}>{categorias.map(c => <option key={c} style={{ backgroundColor: '#0A0A0A' }}>{c}</option>)}</select></div>
            <div><span style={labelStyle}>Tipo de juego</span><select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} style={inputStyle}>{tipos.map(t => <option key={t} value={t} style={{ backgroundColor: '#0A0A0A' }}>{t}</option>)}</select></div>
            <div><span style={labelStyle}>Día del sorteo</span><input type="text" placeholder="Ej: Viernes" value={form.dia_sorteo} onChange={e => setForm({ ...form, dia_sorteo: e.target.value })} style={inputStyle} /></div>
            <div><span style={labelStyle}>Horario</span><input type="text" placeholder="Ej: 11:00 PM" value={form.horario} onChange={e => setForm({ ...form, horario: e.target.value })} style={inputStyle} /></div>
            <div><span style={labelStyle}>Canal en vivo</span><input type="text" placeholder="Ej: Telecaribe, Canal Capital" value={form.canal_en_vivo} onChange={e => setForm({ ...form, canal_en_vivo: e.target.value })} style={inputStyle} /></div>
            <div><span style={labelStyle}>Operador</span><input type="text" placeholder="Ej: Loteria de Bogota" value={form.operador} onChange={e => setForm({ ...form, operador: e.target.value })} style={inputStyle} /></div>
            <div><span style={labelStyle}>Digitos del numero</span><input type="number" min="1" max="6" value={form.numero_digits} onChange={e => setForm({ ...form, numero_digits: parseInt(e.target.value) || 0 })} style={inputStyle} /></div>
            <div><span style={labelStyle}>Digitos de la serie (0 si no tiene)</span><input type="number" min="0" max="4" value={form.serie_digits} onChange={e => setForm({ ...form, serie_digits: parseInt(e.target.value) || 0 })} style={inputStyle} /></div>
            <div><span style={labelStyle}>Fracciones (1 si no tiene)</span><input type="number" min="1" max="100" value={form.total_fracciones} onChange={e => setForm({ ...form, total_fracciones: parseInt(e.target.value) || 1 })} style={inputStyle} /></div>
            <div><span style={labelStyle}>Orden (menor = primero)</span><input type="number" min="1" value={form.orden} onChange={e => setForm({ ...form, orden: parseInt(e.target.value) || 99 })} style={inputStyle} /></div>
            <div style={{ gridColumn: '1 / -1' }}><span style={labelStyle}>Descripcion breve</span><input type="text" placeholder="Ej: Loteria tradicional de 4 cifras" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} style={inputStyle} /></div>
          </div>

          {/* Toggles */}
          <div style={{ display: 'flex', gap: 20, marginBottom: 16, flexWrap: 'wrap' }}>
            {[
              { key: 'tiene_fraccion', label: 'Tiene fracciones' },
              { key: 'usa_signo', label: 'Tiene signo zodiacal' },
              { key: 'usa_quinta', label: 'Tiene quinta' },
              { key: 'activo', label: 'Activo' },
            ].map(({ key, label }) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#888', fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={!!form[key]} onChange={e => setForm({ ...form, [key]: e.target.checked })} /> {label}
              </label>
            ))}
          </div>

          {/* Plan de premios */}
          <div style={{ backgroundColor: '#0F0F0F', border: '1px solid #2A2A2A', borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <p style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>Plan de premios</p>
                <p style={{ color: '#555', fontSize: 12, marginTop: 2 }}>Define cada premio: nombre, cantidad de números ganadores, monto y cómo se verifica.</p>
              </div>
              <button onClick={agregarPremio} style={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Plus size={13} /> Premio
              </button>
            </div>
            {(form.plan_premios || []).length === 0 && (
              <p style={{ color: '#444', fontSize: 12, fontStyle: 'italic' }}>Sin premios definidos.</p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(form.plan_premios || []).map((p, idx) => (
                <div key={idx} style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10, padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ color: '#888', fontSize: 12, fontWeight: 600 }}>Premio #{idx + 1}</span>
                    <button onClick={() => eliminarPremio(idx)} style={{ background: '#2A0000', border: '1px solid #3A0000', borderRadius: 6, padding: '4px 8px', color: '#ff6b6b', cursor: 'pointer' }}>
                      <X size={12} />
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
                    <div><span style={labelStyle}>Nombre</span><input type="text" placeholder="Ej: Premio mayor" value={p.nombre} onChange={e => actualizarPremio(idx, 'nombre', e.target.value)} style={inputStyle} /></div>
                    <div><span style={labelStyle}>Tipo</span><select value={p.tipo} onChange={e => actualizarPremio(idx, 'tipo', e.target.value)} style={inputStyle}>{tiposPremio.map(t => <option key={t.value} value={t.value} style={{ backgroundColor: '#0A0A0A' }}>{t.label}</option>)}</select></div>
                    <div><span style={labelStyle}>Cantidad (números ganadores)</span><input type="number" min="1" placeholder="2" value={p.cantidad_ganadores ?? ''} onChange={e => actualizarPremio(idx, 'cantidad_ganadores', e.target.value)} style={inputStyle} /></div>
                    <div><span style={labelStyle}>Premio (monto)</span><input type="text" placeholder="Ej: $16.000.000.000" value={p.premio} onChange={e => actualizarPremio(idx, 'premio', e.target.value)} style={inputStyle} /></div>
                    <div><span style={labelStyle}>Cifras a comparar</span><input type="number" min="1" max="6" placeholder="4" value={p.cifras ?? ''} onChange={e => actualizarPremio(idx, 'cifras', e.target.value)} style={inputStyle} /></div>
                    <div style={{ gridColumn: '1 / -1' }}><span style={labelStyle}>Descripcion</span><input type="text" placeholder="Ej: 4 cifras + serie exacta" value={p.descripcion} onChange={e => actualizarPremio(idx, 'descripcion', e.target.value)} style={inputStyle} /></div>
                  </div>
                  <div style={{ display: 'flex', gap: 20, marginTop: 8, flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#888', fontSize: 12, cursor: 'pointer' }}>
                      <input type="checkbox" checked={!!p.requiere_serie} onChange={e => actualizarPremio(idx, 'requiere_serie', e.target.checked)} /> Requiere serie
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#888', fontSize: 12, cursor: 'pointer' }}>
                      <input type="checkbox" checked={!!p.comparar_serie} onChange={e => actualizarPremio(idx, 'comparar_serie', e.target.checked)} /> Comparar serie exacta
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && <div style={{ backgroundColor: '#1E0000', border: '1px solid #3A0000', borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}><p style={{ color: '#ff6b6b', fontSize: 13 }}>{error}</p></div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setMostrarForm(false); setEditando(null); setError(null); }} style={{ flex: 1, background: 'transparent', border: '1px solid #2A2A2A', borderRadius: 10, padding: '12px', color: '#888', fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
            <button onClick={guardar} disabled={guardando} style={{ flex: 1, background: '#C41230', border: 'none', borderRadius: 10, padding: '12px', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: guardando ? 0.6 : 1 }}>{guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Agregar juego'}</button>
          </div>
        </div>
      )}

      {cargando ? <p style={{ color: '#555' }}>Cargando juegos...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {Object.entries(porCategoria).map(([cat, lista]) => (
            <div key={cat}>
              <p style={{ color: '#C41230', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>{cat} ({lista.length})</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {lista.map(j => (
                  <div key={j.id} style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 140 }}>
                      <p style={{ color: j.activo ? '#E0E0E0' : '#555', fontSize: 14, fontWeight: 600 }}>{j.nombre}</p>
                      <p style={{ color: '#444', fontSize: 12, marginTop: 2 }}>
                        {j.dia_sorteo && `${j.dia_sorteo} · `}{j.horario && `${j.horario} · `}{j.numero_digits || 4} cifras{j.serie_digits > 0 ? ` + ${j.serie_digits} serie` : ''}{j.tiene_fraccion && ` · ${j.total_fracciones || 1} fracciones`}
                      </p>
                      {j.canal_en_vivo && (
                        <p style={{ color: '#C41230', fontSize: 11, marginTop: 2 }}>📺 {j.canal_en_vivo}</p>
                      )}
                      {Array.isArray(j.plan_premios) && j.plan_premios.length > 0 && (
                        <p style={{ color: '#555', fontSize: 11, marginTop: 2 }}>{j.plan_premios.length} premio{j.plan_premios.length !== 1 ? 's' : ''} en el plan</p>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button onClick={() => toggleActivo(j)} style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, border: 'none', cursor: 'pointer', backgroundColor: j.activo ? '#0d1f0d' : '#2A2A2A', color: j.activo ? '#4ade80' : '#555' }}>
                        {j.activo ? 'Activo' : 'Inactivo'}
                      </button>
                      <button onClick={() => iniciarEdicion(j)} style={{ background: '#1E1E1E', border: '1px solid #2A2A2A', borderRadius: 8, padding: '6px 10px', color: '#888', cursor: 'pointer' }}>
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => eliminar(j.id)} style={{ background: '#1E0000', border: '1px solid #3A0000', borderRadius: 8, padding: '6px 10px', color: '#ff6b6b', cursor: 'pointer' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PANEL RESULTADOS ───────────────────────────────────────
function PanelResultados() {
  const [juegos, setJuegos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [expandido, setExpandido] = useState(null);
  const [resultados, setResultados] = useState({});
  const [guardando, setGuardando] = useState(null);
  const [mensaje, setMensaje] = useState({});
  const [testEmail, setTestEmail] = useState('');
  const [testStatus, setTestStatus] = useState(null);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setCargando(true);
    const resJuegos = await fetch('/api/admin/juegos');
    const dataJuegos = await resJuegos.json();
    const activos = (dataJuegos.juegos || []).filter(j => j.activo);
    setJuegos(activos);

    const resResultados = await fetch('/api/admin/resultados');
    const dataResultados = await resResultados.json();
    const existentes = dataResultados.resultados || [];

    const init = {};
    activos.forEach(j => {
      const ex = existentes.find(r => r.loteria === j.nombre);
      // Inicializar premios desde plan_premios del juego
      const plan = Array.isArray(j.plan_premios) ? j.plan_premios : [];
      const premiosInit = plan.map(p => ({
        tier_nombre: p.nombre || '',
        tier_posicion: p.posicion || 1,
        tipo: p.tipo || 'seco',
        cifras: p.cifras || 0,
        premio: p.premio || '',
        ganadores: Array.from({ length: p.cantidad_ganadores || 1 }, () => ({ numero: '', serie: '', premio: p.premio || '' })),
      }));
      // Si hay premios_json guardados, usarlos
      if (ex?.premios_json && Array.isArray(ex.premios_json) && ex.premios_json.length > 0) {
        const premiosGuardados = ex.premios_json.map(p => ({
          tier_nombre: p.nombre || '',
          tier_posicion: p.posicion || 1,
          tipo: p.tipo || 'seco',
          cifras: p.cifras || 0,
          premio: p.ganadores?.[0]?.premio || '',
          ganadores: (p.ganadores || []).map(g => ({ numero: g.numero || '', serie: g.serie || '', premio: g.premio || '' })),
        }));
        init[j.id] = {
          numero: ex?.numero || '', serie: ex?.serie || '', premio: ex?.premio || '',
          fecha: ex?.fecha || '',
          signo: ex?.signo || '', quinta: ex?.quinta || '',
          premios: premiosGuardados,
        };
      } else {
        init[j.id] = {
          numero: ex?.numero || '', serie: ex?.serie || '', premio: ex?.premio || '',
          fecha: ex?.fecha || '',
          signo: ex?.signo || '', quinta: ex?.quinta || '',
          premios: premiosInit,
        };
      }
    });
    setResultados(init);
    setCargando(false);
  }

  function actualizarCampo(juegoId, campo, valor) {
    setResultados(prev => ({ ...prev, [juegoId]: { ...prev[juegoId], [campo]: valor } }));
  }

  function actualizarGanador(juegoId, tierIdx, ganadorIdx, campo, valor) {
    setResultados(prev => {
      const premios = [...(prev[juegoId]?.premios || [])];
      if (!premios[tierIdx]) return prev;
      const ganadores = [...(premios[tierIdx].ganadores || [])];
      if (!ganadores[ganadorIdx]) return prev;
      ganadores[ganadorIdx] = { ...ganadores[ganadorIdx], [campo]: valor };
      premios[tierIdx] = { ...premios[tierIdx], ganadores };
      return { ...prev, [juegoId]: { ...prev[juegoId], premios } };
    });
  }

  function agregarGanador(juegoId, tierIdx) {
    setResultados(prev => {
      const premios = [...(prev[juegoId]?.premios || [])];
      if (!premios[tierIdx]) return prev;
      const ganadores = [...(premios[tierIdx].ganadores || [])];
      ganadores.push({ numero: '', serie: '', premio: premios[tierIdx].premio || '' });
      premios[tierIdx] = { ...premios[tierIdx], ganadores };
      return { ...prev, [juegoId]: { ...prev[juegoId], premios } };
    });
  }

  function quitarGanador(juegoId, tierIdx, ganadorIdx) {
    setResultados(prev => {
      const premios = [...(prev[juegoId]?.premios || [])];
      if (!premios[tierIdx]) return prev;
      const ganadores = [...(premios[tierIdx].ganadores || [])];
      if (ganadores.length <= 1) return prev; // mantener al menos 1
      ganadores.splice(ganadorIdx, 1);
      premios[tierIdx] = { ...premios[tierIdx], ganadores };
      return { ...prev, [juegoId]: { ...prev[juegoId], premios } };
    });
  }

  async function guardarResultado(juego) {
    setGuardando(juego.id); setMensaje(prev => ({ ...prev, [juego.id]: null }));
    const r = resultados[juego.id];
    if (!r.numero) { setMensaje(prev => ({ ...prev, [juego.id]: { tipo: 'error', texto: 'El número del sorteo es obligatorio.' } })); setGuardando(null); return; }
    if (!r.fecha) { setMensaje(prev => ({ ...prev, [juego.id]: { tipo: 'error', texto: 'La fecha del sorteo es obligatoria.' } })); setGuardando(null); return; }

    // Construir premios para enviar (siempre modo tier)
    const premiosParaEnviar = (r.premios || []).map(p => ({
      tier_nombre: p.tier_nombre,
      tier_posicion: p.tier_posicion,
      tipo: p.tipo,
      cifras: p.cifras,
      ganadores: (p.ganadores || []).filter(g => g.numero.trim()).map(g => ({
        numero: g.numero.trim().padStart(juego.numero_digits || 4, '0'),
        serie: (g.serie || '').toUpperCase(),
        premio: g.premio || p.premio || '',
      })),
    })).filter(p => p.ganadores.length > 0);

    // El premio mayor se toma del primer tier de tipo 'mayor' si existe
    const tierMayor = (r.premios || []).find(p => p.tipo === 'mayor');
    const premioMayorValor = tierMayor?.ganadores?.[0]?.premio || r.premio || '';
    const numeroMayor = tierMayor?.ganadores?.[0]?.numero || r.numero || '';

    const res = await fetch('/api/admin/resultados', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loteria: juego.nombre,
        numero: numeroMayor.padStart(juego.numero_digits || 4, '0'),
        serie: (r.serie || '').toUpperCase(),
        premio: premioMayorValor, fecha: r.fecha,
        secos: [],
        premios: premiosParaEnviar,
        signo: r.signo, quinta: r.quinta,
      }),
    });
    const data = await res.json();
    if (!res.ok) setMensaje(prev => ({ ...prev, [juego.id]: { tipo: 'error', texto: data.error || 'Error al guardar.' } }));
    else {
      setMensaje(prev => ({ ...prev, [juego.id]: { tipo: 'ok', texto: 'Guardado correctamente.' } }));
      // Limpiar campos del formulario tras guardar exitosamente
      const plan = Array.isArray(juego.plan_premios) ? juego.plan_premios : [];
      const premiosInit = plan.map(p => ({
        tier_nombre: p.nombre || '',
        tier_posicion: p.posicion || 1,
        tipo: p.tipo || 'seco',
        cifras: p.cifras || 0,
        premio: p.premio || '',
        ganadores: Array.from({ length: p.cantidad_ganadores || 1 }, () => ({ numero: '', serie: '', premio: p.premio || '' })),
      }));
      setResultados(prev => ({ ...prev, [juego.id]: { numero: '', serie: '', premio: '', fecha: '', signo: '', quinta: '', premios: premiosInit } }));
    }
    setGuardando(null);
  }

  async function enviarPruebaNotificacion() {
    setTestStatus({ tipo: 'info', texto: 'Enviando prueba...' });
    try {
      const res = await fetch('/api/admin/notificaciones/prueba', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail || '', tipo: 'email' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTestStatus({ tipo: 'error', texto: data.error || 'Error al enviar prueba.' });
      } else {
        setTestStatus({ tipo: 'ok', texto: 'Prueba enviada. Revisa tu correo.' });
      }
    } catch (err) {
      console.error('Error de prueba:', err);
      setTestStatus({ tipo: 'error', texto: 'Error de red al enviar prueba.' });
    }
  }

  async function enviarPruebaPushLocal() {
    setTestStatus({ tipo: 'info', texto: 'Registrando service worker y obteniendo suscripción...' });
    try {
      if (!('serviceWorker' in navigator)) {
        setTestStatus({ tipo: 'error', texto: 'Service Worker no soportado en este navegador.' });
        return;
      }
      const resKey = await fetch('/api/notificaciones');
      const keyData = await resKey.json();
      const vapidKey = (keyData.vapidPublicKey || '').trim();
      if (!vapidKey || !/^[A-Za-z0-9_-]+$/.test(vapidKey)) {
        setTestStatus({ tipo: 'error', texto: 'Clave VAPID inválida o no disponible.' });
        return;
      }
      const padding = '='.repeat((4 - (vapidKey.length % 4)) % 4);
      const base64 = (vapidKey + padding).replace(/-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64);
      const applicationServerKey = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) applicationServerKey[i] = rawData.charCodeAt(i);

      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      await registration.update();
      const activeRegistration = await navigator.serviceWorker.ready;
      let subscription = await activeRegistration.pushManager.getSubscription();
      if (!subscription) {
        const permiso = await Notification.requestPermission();
        if (permiso !== 'granted') {
          setTestStatus({ tipo: 'error', texto: 'Permiso de notificaciones denegado.' });
          return;
        }
        subscription = await activeRegistration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
      }

      const res = await fetch('/api/admin/notificaciones/prueba', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'push', subscription }),
      });
      const data = await res.json();
      if (!res.ok) setTestStatus({ tipo: 'error', texto: data.error || 'Error al enviar push de prueba.' });
      else setTestStatus({ tipo: 'ok', texto: `Push enviado (enviados=${data.enviados || 0}). Revisa tu dispositivo.` });
    } catch (err) {
      console.error('Error prueba push local:', err);
      setTestStatus({ tipo: 'error', texto: err?.message || 'Error al enviar push de prueba.' });
    }
  }

  async function enviarPruebaPushBroadcast() {
    setTestStatus({ tipo: 'info', texto: 'Enviando push a TODOS los dispositivos suscritos...' });
    try {
      const res = await fetch('/api/admin/notificaciones/prueba', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'push' }),
      });
      const data = await res.json();
      if (!res.ok) setTestStatus({ tipo: 'error', texto: data.error || 'Error al enviar push broadcast.' });
      else setTestStatus({ tipo: 'ok', texto: `Push broadcast enviado a ${data.enviados || 0} dispositivo(s).` });
    } catch (err) {
      console.error('Error prueba push broadcast:', err);
      setTestStatus({ tipo: 'error', texto: err?.message || 'Error al enviar push broadcast.' });
    }
  }

  const porCategoria = juegos.reduce((acc, j) => {
    if (!acc[j.categoria]) acc[j.categoria] = [];
    acc[j.categoria].push(j);
    return acc;
  }, {});

  const inputStyle = { width: '100%', backgroundColor: '#0A0A0A', border: '1px solid #2A2A2A', borderRadius: 10, padding: '10px 12px', fontSize: 14, color: '#E0E0E0', outline: 'none' };
  const labelStyle = { fontSize: 11, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, display: 'block' };
  const tierColors = { mayor: '#C41230', seco: '#F59E0B', aproximacion: '#10B981', especial: '#8B5CF6' };

  if (cargando) return <p style={{ color: '#555' }}>Cargando juegos...</p>;

  return (
    <div>
      <p style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Actualizar resultados</p>
      <p style={{ color: '#555', fontSize: 13, marginBottom: 24 }}>Toca un juego para abrir y registrar el resultado del sorteo. Ingresa el <strong style={{ color: '#888' }}>número del sorteo</strong> y la <strong style={{ color: '#888' }}>fecha</strong>, luego registra los números ganadores en cada premio del plan (incluye premio mayor y secos). Las notificaciones se envían automáticamente.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, marginBottom: 24, alignItems: 'end' }}>
        <div>
          <label style={{ display: 'block', color: '#AAA', fontSize: 12, marginBottom: 6 }}>Correo de prueba</label>
          <input value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="tu@correo.com" style={{ width: '100%', backgroundColor: '#0A0A0A', border: '1px solid #2A2A2A', borderRadius: 10, padding: '10px 12px', color: '#E0E0E0' }} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={enviarPruebaNotificacion} style={{ background: '#2563EB', border: 'none', borderRadius: 10, padding: '12px 18px', color: '#fff', cursor: 'pointer' }}>Enviar prueba (email)</button>
          <button onClick={enviarPruebaPushLocal} style={{ background: '#10B981', border: 'none', borderRadius: 10, padding: '12px 18px', color: '#04260f', cursor: 'pointer' }}>Enviar prueba (push a este navegador)</button>
          <button onClick={enviarPruebaPushBroadcast} style={{ background: '#F59E0B', border: 'none', borderRadius: 10, padding: '12px 18px', color: '#3a2a05', cursor: 'pointer' }}>Enviar prueba (push a TODOS)</button>
        </div>
      </div>
      {testStatus && (
        <div style={{ padding: '10px 14px', borderRadius: 10, backgroundColor: testStatus.tipo === 'ok' ? '#0B4228' : testStatus.tipo === 'error' ? '#3F0F0F' : '#1D1F28', color: testStatus.tipo === 'ok' ? '#86EFAC' : '#FCA5A5', marginBottom: 24 }}>
          {testStatus.texto}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {Object.entries(porCategoria).map(([cat, lista]) => (
          <div key={cat}>
            <p style={{ color: '#C41230', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>{cat}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {lista.map(j => {
                const r = resultados[j.id] || {};
                const abierto = expandido === j.id;
                const premios = r.premios || [];
                return (
                  <div key={j.id} style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 12, overflow: 'hidden' }}>
                    <div onClick={() => setExpandido(abierto ? null : j.id)} style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                      <div>
                        <p style={{ color: '#E0E0E0', fontSize: 14, fontWeight: 600 }}>{j.nombre}</p>
                        {r.numero && <p style={{ color: '#555', fontSize: 12, marginTop: 2 }}>Último: {r.numero}{r.serie ? ` - ${r.serie}` : ''}</p>}
                      </div>
                      <span style={{ color: '#555', fontSize: 13 }}>{abierto ? '−' : '+'}</span>
                    </div>
                    {abierto && (
                      <div style={{ padding: '0 18px 18px' }}>
                        {/* Datos principales: numero del sorteo + fecha */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 18 }}>
                          <div><span style={labelStyle}>Número del sorteo *</span><input type="text" maxLength={j.numero_digits || 4} value={r.numero} onChange={e => actualizarCampo(j.id, 'numero', e.target.value)} style={inputStyle} /></div>
                          {j.usa_signo && <div><span style={labelStyle}>Signo zodiacal</span><input type="text" value={r.signo} onChange={e => actualizarCampo(j.id, 'signo', e.target.value)} style={inputStyle} /></div>}
                          {j.usa_quinta && <div><span style={labelStyle}>Quinta</span><input type="text" value={r.quinta} onChange={e => actualizarCampo(j.id, 'quinta', e.target.value)} style={inputStyle} /></div>}
                          <div><span style={labelStyle}>Fecha del sorteo *</span><input type="date" value={r.fecha} onChange={e => actualizarCampo(j.id, 'fecha', e.target.value)} style={{ ...inputStyle, colorScheme: 'dark' }} /></div>
                        </div>

                        {/* PREMIOS POR TIER (incluye premio mayor y secos del plan) */}
                        {premios.length > 0 ? (
                          <div style={{ marginBottom: 18 }}>
                            <p style={{ color: '#888', fontSize: 12, fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Premios del plan</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                              {premios.map((tier, tierIdx) => (
                                <div key={tierIdx} style={{ backgroundColor: '#0A0A0A', border: '1px solid #2A2A2A', borderRadius: 10, padding: 14 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                    <span style={{ backgroundColor: tierColors[tier.tipo] || '#555', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase' }}>{tier.tipo}</span>
                                    <span style={{ color: '#E0E0E0', fontSize: 13, fontWeight: 600 }}>{tier.tier_nombre}</span>
                                    <span style={{ color: '#555', fontSize: 11 }}>({tier.cifras} cifras)</span>
                                  </div>
                                  {(tier.ganadores || []).map((g, gIdx) => (
                                    <div key={gIdx} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                                      <input type="text" placeholder="Número" maxLength={j.numero_digits || 4} value={g.numero} onChange={e => actualizarGanador(j.id, tierIdx, gIdx, 'numero', e.target.value)} style={{ ...inputStyle, width: 100 }} />
                                      {j.serie_digits > 0 && <input type="text" placeholder="Serie" value={g.serie} onChange={e => actualizarGanador(j.id, tierIdx, gIdx, 'serie', e.target.value)} style={{ ...inputStyle, width: 80 }} />}
                                      <input type="text" placeholder="Premio" value={g.premio} onChange={e => actualizarGanador(j.id, tierIdx, gIdx, 'premio', e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                                      {(tier.ganadores || []).length > 1 && (
                                        <button onClick={() => quitarGanador(j.id, tierIdx, gIdx)} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', padding: 4 }} title="Quitar ganador"><X size={14} /></button>
                                      )}
                                    </div>
                                  ))}
                                  <button onClick={() => agregarGanador(j.id, tierIdx)} style={{ background: 'none', border: '1px dashed #333', borderRadius: 8, padding: '6px 12px', color: '#888', fontSize: 12, cursor: 'pointer', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }} title="Agregar ganador">
                                    <Plus size={12} /> Agregar ganador
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div style={{ marginBottom: 18, padding: 16, backgroundColor: '#0A0A0A', border: '1px solid #2A2A2A', borderRadius: 10 }}>
                            <p style={{ color: '#555', fontSize: 13 }}>Este juego no tiene un plan de premios configurado. Configura el plan de premios en la seccion de Juegos para registrar resultados por tier.</p>
                          </div>
                        )}

                        {mensaje[j.id] && <div style={{ backgroundColor: mensaje[j.id].tipo === 'ok' ? '#0d1f0d' : '#1E0000', border: `1px solid ${mensaje[j.id].tipo === 'ok' ? '#1a3a1a' : '#3A0000'}`, borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}><p style={{ color: mensaje[j.id].tipo === 'ok' ? '#4ade80' : '#ff6b6b', fontSize: 13 }}>{mensaje[j.id].texto}</p></div>}
                        <button onClick={() => guardarResultado(j)} disabled={guardando === j.id} style={{ background: '#C41230', border: 'none', borderRadius: 10, padding: '11px 24px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: guardando === j.id ? 0.6 : 1 }}>
                          {guardando === j.id ? 'Guardando...' : 'Guardar resultado'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PANEL USUARIOS ───────────────────────────────────────────
function PanelUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', rol: 'scraper' });
  const [error, setError] = useState(null);
  const [creando, setCreando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => { cargarUsuarios(); }, []);

  async function cargarUsuarios() {
    setCargando(true);
    try {
      const res = await fetch('/api/admin/usuarios');
      const data = await res.json();
      if (res.ok) setUsuarios(data.usuarios);
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  }

  async function crearUsuario() {
    setError(null);
    if (!form.email || !form.password) { setError('Completa todos los campos.'); return; }
    if (form.password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return; }

    setCreando(true);
    try {
      const res = await fetch('/api/admin/crear-usuario', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al crear usuario.'); setCreando(false); return; }
      setResultado(data);
      setForm({ email: '', password: '', rol: 'scraper' });
      cargarUsuarios();
    } catch { setError('Error de conexion.'); }
    finally { setCreando(false); }
  }

  function copiarSecreto() { navigator.clipboard.writeText(resultado.totpSecret); setCopiado(true); setTimeout(() => setCopiado(false), 2000); }

  const inputStyle = { width: '100%', backgroundColor: '#0A0A0A', border: '1px solid #2A2A2A', borderRadius: 10, padding: '11px 14px', fontSize: 14, color: '#E0E0E0', outline: 'none' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <p style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>Usuarios administrativos</p>
        {!mostrarForm && !resultado && (
          <button onClick={() => setMostrarForm(true)} style={{ background: '#C41230', border: 'none', borderRadius: 8, padding: '10px 18px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> Nuevo usuario
          </button>
        )}
      </div>

      {resultado && (
        <div style={{ backgroundColor: '#0d1f0d', border: '1px solid #1a3a1a', borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <p style={{ color: '#4ade80', fontSize: 15, fontWeight: 700 }}>Usuario creado correctamente</p>
            <button onClick={() => setResultado(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4ade80' }}><X size={18} /></button>
          </div>
          <p style={{ color: '#aaa', fontSize: 13, marginBottom: 4 }}>Correo: <strong style={{ color: '#fff' }}>{resultado.email}</strong></p>
          <p style={{ color: '#aaa', fontSize: 13, marginBottom: 16 }}>Rol: <strong style={{ color: '#fff' }}>{resultado.rol === 'admin' ? 'Administrador' : 'Scraper'}</strong></p>
          <p style={{ color: '#facc15', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Codigo TOTP (solo se muestra una vez):</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#0A0A0A', border: '1px solid #2A2A2A', borderRadius: 10, padding: '12px 16px' }}>
            <p style={{ color: '#fff', fontSize: 16, fontWeight: 700, letterSpacing: 2, fontFamily: 'monospace', flex: 1, wordBreak: 'break-all' }}>{resultado.totpSecret}</p>
            <button onClick={copiarSecreto} style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, padding: 8, cursor: 'pointer', color: copiado ? '#4ade80' : '#888' }}>
              {copiado ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </div>
      )}

      {mostrarForm && !resultado && (
        <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Correo', type: 'email', key: 'email', placeholder: 'usuario@notiloto.com' },
              { label: 'Contraseña', type: 'text', key: 'password', placeholder: 'Contraseña temporal' },
            ].map(f => (
              <div key={f.key}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, display: 'block' }}>{f.label}</span>
                <input type={f.type} placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} style={inputStyle} />
              </div>
            ))}
            <div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, display: 'block' }}>Rol</span>
              <select value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })} style={inputStyle}>
                <option value="scraper" style={{ backgroundColor: '#0A0A0A' }}>Scraper (solo resultados)</option>
                <option value="admin" style={{ backgroundColor: '#0A0A0A' }}>Administrador (acceso total)</option>
              </select>
            </div>
            {error && <div style={{ backgroundColor: '#1E0000', border: '1px solid #3A0000', borderRadius: 10, padding: '10px 14px' }}><p style={{ color: '#ff6b6b', fontSize: 13 }}>{error}</p></div>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setMostrarForm(false); setError(null); }} style={{ flex: 1, background: 'transparent', border: '1px solid #2A2A2A', borderRadius: 10, padding: '12px', color: '#888', fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={crearUsuario} disabled={creando} style={{ flex: 1, background: '#C41230', border: 'none', borderRadius: 10, padding: '12px', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: creando ? 0.6 : 1 }}>{creando ? 'Creando...' : 'Crear usuario'}</button>
            </div>
          </div>
        </div>
      )}

      {cargando ? <p style={{ color: '#555', fontSize: 13 }}>Cargando usuarios...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {usuarios.map(u => (
            <div key={u.id} style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 12, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <p style={{ color: '#E0E0E0', fontSize: 14, fontWeight: 600 }}>{u.email}</p>
                <p style={{ color: '#555', fontSize: 12, marginTop: 2 }}>Creado: {new Date(u.created_at).toLocaleDateString('es-CO')}</p>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, backgroundColor: u.rol === 'admin' ? '#1a0020' : '#1a1a1a', color: u.rol === 'admin' ? '#C084FC' : '#888', border: `1px solid ${u.rol === 'admin' ? '#3a0040' : '#2a2a2a'}` }}>
                {u.rol === 'admin' ? 'Administrador' : 'Scraper'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}