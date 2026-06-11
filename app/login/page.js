'use client';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Eye, EyeOff, Ticket, User, Mail, Lock, Calendar, ArrowLeft } from 'lucide-react';
import Image from 'next/image';

export default function Login() {
  const [modo, setModo] = useState('login');
  const [verPass, setVerPass] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  const [form, setForm] = useState({
    email: '',
    password: '',
    nombre: '',
    fechaNacimiento: '',
    terminos: false,
  });

  function setField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
    setError(null);
  }

  function calcularEdad(fechaNacimiento) {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return edad;
  }

  async function handleSubmit() {
    setError(null);
    setMensaje(null);

    if (!form.email || !form.password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    if (modo === 'registro') {
      if (!form.nombre.trim()) { setError('Ingresa tu nombre completo.'); return; }
      if (!form.fechaNacimiento) { setError('Ingresa tu fecha de nacimiento.'); return; }
      if (calcularEdad(form.fechaNacimiento) < 18) {
        setError('Debes tener 18 años o más para registrarte. Los juegos de azar están prohibidos para menores de edad.');
        return;
      }
      if (!form.terminos) { setError('Debes aceptar los términos y condiciones.'); return; }
      if (form.password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return; }
    }

    setCargando(true);

    if (modo === 'registro') {
      const { data, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            nombre: form.nombre,
            fecha_nacimiento: form.fechaNacimiento,
          }
        }
      });

      if (authError) {
        setError(authError.message === 'User already registered'
          ? 'Este correo ya está registrado. Intenta iniciar sesión.'
          : authError.message);
      } else {
        setMensaje('¡Cuenta creada! Ya puedes iniciar sesión.');
        setModo('login');
      }
    } else {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (authError) {
        setError('Correo o contraseña incorrectos.');
      } else {
        window.location.href = '/';
      }
    }

    setCargando(false);
  }

  const inputStyle = {
    width: '100%',
    backgroundColor: '#1A1A1A',
    border: '1px solid #2A2A2A',
    borderRadius: 12,
    padding: '12px 14px 12px 42px',
    fontSize: 14,
    color: '#E0E0E0',
    outline: 'none',
  };

  const labelStyle = {
    fontSize: 11,
    fontWeight: 600,
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
    display: 'block',
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0A0A0A',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        backgroundColor: '#111',
        borderRadius: 24,
        overflow: 'hidden',
        border: '1px solid #222',
        boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
      }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #1a0000 0%, #2d0000 100%)', padding: '28px 24px 24px', textAlign: 'center', borderBottom: '1px solid #2A0000' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <Image src="/logo.png" alt="LotoCheck" width={56} height={56} style={{ borderRadius: 14, objectFit: 'cover' }} />
          </div>
          <p style={{ color: '#fff', fontWeight: 800, fontSize: 22, letterSpacing: -0.5 }}>LotoCheck</p>
          <p style={{ color: '#C41230', fontSize: 12, fontWeight: 500, marginTop: 3 }}>Colombia</p>
          <p style={{ color: '#666', fontSize: 13, marginTop: 8 }}>
            {modo === 'login' ? 'Inicia sesión en tu cuenta' : 'Crea tu cuenta gratis'}
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', padding: '16px 24px 0' }}>
          {[{ id: 'login', label: 'Iniciar sesión' }, { id: 'registro', label: 'Registrarse' }].map(t => (
            <button
              key={t.id}
              onClick={() => { setModo(t.id); setError(null); setMensaje(null); }}
              style={{
                flex: 1, padding: '10px', fontSize: 13, fontWeight: 600,
                border: 'none', borderBottom: `2px solid ${modo === t.id ? '#C41230' : '#1E1E1E'}`,
                backgroundColor: 'transparent',
                color: modo === t.id ? '#C41230' : '#444',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Formulario */}
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Nombre — solo en registro */}
            {modo === 'registro' && (
              <div>
                <span style={labelStyle}>Nombre completo</span>
                <div style={{ position: 'relative' }}>
                  <User size={16} color="#555" style={{ position: 'absolute', left: 14, top: 14 }} />
                  <input
                    type="text"
                    placeholder="Tu nombre completo"
                    value={form.nombre}
                    onChange={e => setField('nombre', e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <span style={labelStyle}>Correo electrónico</span>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#555" style={{ position: 'absolute', left: 14, top: 14 }} />
                <input
                  type="email"
                  placeholder="tu@correo.com"
                  value={form.email}
                  onChange={e => setField('email', e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <span style={labelStyle}>Contraseña {modo === 'registro' && '(mínimo 8 caracteres)'}</span>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#555" style={{ position: 'absolute', left: 14, top: 14 }} />
                <input
                  type={verPass ? 'text' : 'password'}
                  placeholder={modo === 'registro' ? 'Mínimo 8 caracteres' : 'Tu contraseña'}
                  value={form.password}
                  onChange={e => setField('password', e.target.value)}
                  style={{ ...inputStyle, paddingRight: 44 }}
                />
                <button
                  onClick={() => setVerPass(!verPass)}
                  style={{ position: 'absolute', right: 14, top: 13, background: 'none', border: 'none', cursor: 'pointer', color: '#555' }}
                >
                  {verPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Fecha de nacimiento — solo en registro */}
            {modo === 'registro' && (
              <div>
                <span style={labelStyle}>Fecha de nacimiento</span>
                <div style={{ position: 'relative' }}>
                  <Calendar size={16} color="#555" style={{ position: 'absolute', left: 14, top: 14 }} />
                  <input
                    type="date"
                    value={form.fechaNacimiento}
                    onChange={e => setField('fechaNacimiento', e.target.value)}
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                    style={{ ...inputStyle, colorScheme: 'dark' }}
                  />
                </div>
                <p style={{ fontSize: 11, color: '#555', marginTop: 5 }}>
                  🔞 Debes tener 18 años o más. Los juegos de azar están regulados por Coljuegos.
                </p>
              </div>
            )}

            {/* Términos — solo en registro */}
            {modo === 'registro' && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <button
                  onClick={() => setField('terminos', !form.terminos)}
                  style={{
                    width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
                    border: `2px solid ${form.terminos ? '#C41230' : '#333'}`,
                    backgroundColor: form.terminos ? '#C41230' : 'transparent',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {form.terminos && <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>✓</span>}
                </button>
                <p style={{ fontSize: 12, color: '#555', lineHeight: 1.5 }}>
                  Acepto los <span style={{ color: '#C41230', cursor: 'pointer' }}>términos y condiciones</span> y la <span style={{ color: '#C41230', cursor: 'pointer' }}>política de privacidad</span>. Confirmo que tengo 18 años o más.
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{ backgroundColor: '#1E0000', border: '1px solid #3A0000', borderRadius: 10, padding: '10px 14px' }}>
                <p style={{ color: '#ff6b6b', fontSize: 13 }}>⚠️ {error}</p>
              </div>
            )}

            {/* Mensaje éxito */}
            {mensaje && (
              <div style={{ backgroundColor: '#0d1f0d', border: '1px solid #1a3a1a', borderRadius: 10, padding: '10px 14px' }}>
                <p style={{ color: '#4ade80', fontSize: 13 }}>✅ {mensaje}</p>
              </div>
            )}

            {/* Botón principal */}
            <button
              onClick={handleSubmit}
              disabled={cargando}
              style={{
                width: '100%', backgroundColor: '#C41230', border: 'none', borderRadius: 12,
                padding: '14px', fontSize: 15, fontWeight: 700, color: '#fff',
                cursor: cargando ? 'not-allowed' : 'pointer',
                opacity: cargando ? 0.6 : 1,
                boxShadow: '0 4px 24px rgba(196,18,48,0.35)',
              }}
            >
              {cargando ? 'Cargando...' : modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>

            {/* Volver a la app */}
            <button
              onClick={() => window.location.href = '/'}
              style={{ width: '100%', backgroundColor: 'transparent', border: '1px solid #1E1E1E', borderRadius: 12, padding: '12px', fontSize: 13, color: '#444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <ArrowLeft size={14} /> Volver sin iniciar sesión
            </button>

          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '0 24px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#333', lineHeight: 1.6 }}>
            LotoCheck no vende boletos de lotería. Solo verificamos resultados.<br />
            Juega con responsabilidad. Línea de ayuda: <span style={{ color: '#C41230' }}>01800-522-422</span>
          </p>
        </div>

      </div>
    </div>
  );
}