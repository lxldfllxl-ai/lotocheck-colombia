'use client';
import { useState, useEffect } from 'react';
import { LogOut, DollarSign, Ticket, Users, Plus, Copy, Check, X } from 'lucide-react';

export default function AdminPanel() {
  const [cargando, setCargando] = useState(true);
  const [sesion, setSesion] = useState(null);
  const [vista, setVista] = useState('inicio');

  useEffect(() => {
    checkSesion();
  }, []);

  async function checkSesion() {
    try {
      const res = await fetch('/api/admin/sesion');
      if (!res.ok) {
        window.location.href = '/asd';
        return;
      }
      const data = await res.json();
      setSesion(data);
    } catch {
      window.location.href = '/asd';
    } finally {
      setCargando(false);
    }
  }

  async function cerrarSesion() {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.href = '/asd';
  }

  if (cargando) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#555', fontSize: 14 }}>Cargando...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A0A0A', padding: 24 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <p style={{ color: '#fff', fontSize: 24, fontWeight: 800 }}>Panel Administrativo</p>
            <p style={{ color: '#555', fontSize: 13, marginTop: 4 }}>
              {sesion?.email} - Rol: {sesion?.rol === 'admin' ? 'Administrador' : 'Scraper'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {vista !== 'inicio' && (
              <button
                onClick={() => setVista('inicio')}
                style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, padding: '8px 16px', color: '#888', fontSize: 13, cursor: 'pointer' }}
              >
                Volver
              </button>
            )}
            <button
              onClick={cerrarSesion}
              style={{ background: '#2A0000', border: '1px solid #3A0000', borderRadius: 8, padding: '8px 16px', color: '#ff6b6b', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <LogOut size={14} /> Salir
            </button>
          </div>
        </div>

        {vista === 'inicio' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>

            {sesion?.rol === 'admin' && (
              <div
                onClick={() => setVista('precios')}
                style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 16, padding: 24, cursor: 'pointer' }}
              >
                <DollarSign size={28} color="#C41230" style={{ marginBottom: 12 }} />
                <p style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Precios y planes</p>
                <p style={{ color: '#555', fontSize: 13 }}>Edita los precios de los planes Basico y Pro.</p>
              </div>
            )}

            <div
              onClick={() => setVista('resultados')}
              style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 16, padding: 24, cursor: 'pointer' }}
            >
              <Ticket size={28} color="#C41230" style={{ marginBottom: 12 }} />
              <p style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Resultados de loterias</p>
              <p style={{ color: '#555', fontSize: 13 }}>Actualiza los numeros ganadores y secos.</p>
            </div>

            {sesion?.rol === 'admin' && (
              <div
                onClick={() => setVista('usuarios')}
                style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 16, padding: 24, cursor: 'pointer' }}
              >
                <Users size={28} color="#C41230" style={{ marginBottom: 12 }} />
                <p style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Usuarios administrativos</p>
                <p style={{ color: '#555', fontSize: 13 }}>Crea y gestiona cuentas admin/scraper.</p>
              </div>
            )}

          </div>
        )}

        {vista === 'usuarios' && <PanelUsuarios />}
        {vista === 'precios' && <PanelPrecios />}
        {vista === 'resultados' && <p style={{ color: '#555' }}>Proximamente: editar resultados.</p>}

      </div>
    </div>
  );
}

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

    if (!form.email || !form.password) {
      setError('Completa todos los campos.');
      return;
    }
    if (form.password.length < 8) {
      setError('La contrasena debe tener al menos 8 caracteres.');
      return;
    }

    setCreando(true);

    try {
      const res = await fetch('/api/admin/crear-usuario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al crear usuario.');
        setCreando(false);
        return;
      }

      setResultado(data);
      setForm({ email: '', password: '', rol: 'scraper' });
      cargarUsuarios();
    } catch (e) {
      setError('Error de conexion.');
    } finally {
      setCreando(false);
    }
  }

  function copiarSecreto() {
    navigator.clipboard.writeText(resultado.totpSecret);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  function cerrarResultado() {
    setResultado(null);
    setMostrarForm(false);
  }

  const inputStyle = {
    width: '100%',
    backgroundColor: '#0A0A0A',
    border: '1px solid #2A2A2A',
    borderRadius: 10,
    padding: '11px 14px',
    fontSize: 14,
    color: '#E0E0E0',
    outline: 'none',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <p style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>Usuarios administrativos</p>
        {!mostrarForm && !resultado && (
          <button
            onClick={() => setMostrarForm(true)}
            style={{ background: '#C41230', border: 'none', borderRadius: 8, padding: '10px 18px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={14} /> Nuevo usuario
          </button>
        )}
      </div>

      {/* Resultado tras crear */}
      {resultado && (
        <div style={{ backgroundColor: '#0d1f0d', border: '1px solid #1a3a1a', borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <p style={{ color: '#4ade80', fontSize: 15, fontWeight: 700 }}>Usuario creado correctamente</p>
            <button onClick={cerrarResultado} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4ade80' }}>
              <X size={18} />
            </button>
          </div>
          <p style={{ color: '#aaa', fontSize: 13, marginBottom: 4 }}>Correo: <strong style={{ color: '#fff' }}>{resultado.email}</strong></p>
          <p style={{ color: '#aaa', fontSize: 13, marginBottom: 16 }}>Rol: <strong style={{ color: '#fff' }}>{resultado.rol === 'admin' ? 'Administrador' : 'Scraper'}</strong></p>

          <p style={{ color: '#facc15', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
            ⚠️ Codigo secreto TOTP (solo se muestra una vez):
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#0A0A0A', border: '1px solid #2A2A2A', borderRadius: 10, padding: '12px 16px' }}>
            <p style={{ color: '#fff', fontSize: 16, fontWeight: 700, letterSpacing: 2, fontFamily: 'monospace', flex: 1, wordBreak: 'break-all' }}>{resultado.totpSecret}</p>
            <button onClick={copiarSecreto} style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, padding: 8, cursor: 'pointer', color: copiado ? '#4ade80' : '#888' }}>
              {copiado ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
          <p style={{ color: '#666', fontSize: 12, marginTop: 12, lineHeight: 1.6 }}>
            Comparte este codigo de forma segura con el nuevo usuario para que lo agregue en Google Authenticator
            ("Ingresar clave de configuracion" - tipo: basado en tiempo). Junto con su correo y contrasena, podra iniciar sesion.
          </p>
        </div>
      )}

      {/* Formulario nuevo usuario */}
      {mostrarForm && !resultado && (
        <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, display: 'block' }}>Correo</span>
              <input type="email" placeholder="usuario@notiloto.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} />
            </div>

            <div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, display: 'block' }}>Contrasena (minimo 8 caracteres)</span>
              <input type="text" placeholder="Contrasena temporal" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={inputStyle} />
            </div>

            <div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, display: 'block' }}>Rol</span>
              <select value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })} style={inputStyle}>
                <option value="scraper" style={{ backgroundColor: '#0A0A0A' }}>Scraper (solo resultados)</option>
                <option value="admin" style={{ backgroundColor: '#0A0A0A' }}>Administrador (acceso total)</option>
              </select>
            </div>

            {error && (
              <div style={{ backgroundColor: '#1E0000', border: '1px solid #3A0000', borderRadius: 10, padding: '10px 14px' }}>
                <p style={{ color: '#ff6b6b', fontSize: 13 }}>{error}</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setMostrarForm(false); setError(null); }} style={{ flex: 1, background: 'transparent', border: '1px solid #2A2A2A', borderRadius: 10, padding: '12px', color: '#888', fontSize: 14, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={crearUsuario} disabled={creando} style={{ flex: 1, background: '#C41230', border: 'none', borderRadius: 10, padding: '12px', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: creando ? 0.6 : 1 }}>
                {creando ? 'Creando...' : 'Crear usuario'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Lista de usuarios */}
      {cargando ? (
        <p style={{ color: '#555', fontSize: 13 }}>Cargando usuarios...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {usuarios.map(u => (
            <div key={u.id} style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 12, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <p style={{ color: '#E0E0E0', fontSize: 14, fontWeight: 600 }}>{u.email}</p>
                <p style={{ color: '#555', fontSize: 12, marginTop: 2 }}>Creado: {new Date(u.created_at).toLocaleDateString('es-CO')}</p>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
                backgroundColor: u.rol === 'admin' ? '#1a0020' : '#1a1a1a',
                color: u.rol === 'admin' ? '#C084FC' : '#888',
                border: `1px solid ${u.rol === 'admin' ? '#3a0040' : '#2a2a2a'}`,
              }}>
                {u.rol === 'admin' ? 'Administrador' : 'Scraper'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function PanelPrecios() {
  const [config, setConfig] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => { cargarConfig(); }, []);

  async function cargarConfig() {
    setCargando(true);
    try {
      const res = await fetch('/api/configuracion');
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
      } else {
        setConfig(data);
      }
    } catch (e) {
      setError('Error de conexion.');
    } finally {
      setCargando(false);
    }
  }

  async function guardar() {
    setGuardando(true);
    setMensaje(null);
    setError(null);

    try {
      const res = await fetch('/api/admin/configuracion', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          precio_basico: config.precio_basico,
          precio_pro: config.precio_pro,
          precio_premium: config.precio_premium,
          limite_basico: config.limite_basico,
          limite_pro: config.limite_pro,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al guardar.');
      } else {
        setMensaje('Precios actualizados correctamente.');
        setConfig(data.configuracion);
      }
    } catch (e) {
      setError('Error de conexion.');
    } finally {
      setGuardando(false);
    }
  }

  const inputStyle = {
    width: '100%',
    backgroundColor: '#0A0A0A',
    border: '1px solid #2A2A2A',
    borderRadius: 10,
    padding: '11px 14px',
    fontSize: 14,
    color: '#E0E0E0',
    outline: 'none',
  };

  const labelStyle = {
    fontSize: 11, fontWeight: 600, color: '#555',
    textTransform: 'uppercase', letterSpacing: 1,
    marginBottom: 6, display: 'block',
  };

  if (cargando) return <p style={{ color: '#555', fontSize: 13 }}>Cargando configuracion...</p>;
  if (!config) return <p style={{ color: '#ff6b6b', fontSize: 13 }}>{error || 'Error al cargar.'}</p>;

  return (
    <div>
      <p style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Precios y planes</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>

        {/* Gratis - fijo */}
        <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 16, padding: 20, opacity: 0.6 }}>
          <p style={{ color: '#fff', fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Gratis</p>
          <p style={{ color: '#555', fontSize: 12, marginBottom: 16 }}>Plan fijo, no editable</p>
          <p style={{ color: '#888', fontSize: 13 }}>Precio: $0</p>
          <p style={{ color: '#888', fontSize: 13, marginTop: 4 }}>Limite: 2 boletos</p>
        </div>

        {/* Basico */}
        <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 16, padding: 20 }}>
          <p style={{ color: '#fff', fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Basico</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <span style={labelStyle}>Precio mensual</span>
              <input
                type="text"
                value={config.precio_basico}
                onChange={e => setConfig({ ...config, precio_basico: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <span style={labelStyle}>Limite de boletos</span>
              <input
                type="number"
                min="1"
                value={config.limite_basico}
                onChange={e => setConfig({ ...config, limite_basico: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Pro */}
        <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 16, padding: 20 }}>
          <p style={{ color: '#fff', fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Pro</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <span style={labelStyle}>Precio mensual</span>
              <input
                type="text"
                value={config.precio_pro}
                onChange={e => setConfig({ ...config, precio_pro: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <span style={labelStyle}>Limite de boletos</span>
              <input
                type="number"
                min="1"
                value={config.limite_pro}
                onChange={e => setConfig({ ...config, limite_pro: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Premium */}
        <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 16, padding: 20 }}>
          <p style={{ color: '#fff', fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Premium</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <span style={labelStyle}>Precio mensual</span>
              <input
                type="text"
                value={config.precio_premium}
                onChange={e => setConfig({ ...config, precio_premium: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <span style={labelStyle}>Limite de boletos</span>
              <input
                type="text"
                value="Ilimitado"
                disabled
                style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }}
              />
            </div>
          </div>
        </div>

      </div>

      {mensaje && (
        <div style={{ backgroundColor: '#0d1f0d', border: '1px solid #1a3a1a', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
          <p style={{ color: '#4ade80', fontSize: 13 }}>{mensaje}</p>
        </div>
      )}
      {error && (
        <div style={{ backgroundColor: '#1E0000', border: '1px solid #3A0000', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
          <p style={{ color: '#ff6b6b', fontSize: 13 }}>{error}</p>
        </div>
      )}

      <button
        onClick={guardar}
        disabled={guardando}
        style={{
          background: '#C41230', border: 'none', borderRadius: 10, padding: '13px 32px',
          color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: guardando ? 0.6 : 1,
        }}
      >
        {guardando ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </div>
  );
}