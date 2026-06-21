'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Eye, EyeOff, User, Mail, Lock, Calendar, ArrowLeft } from 'lucide-react';
import Image from 'next/image';

export default function Login() {
  const [modo, setModo] = useState('login');
  const [verPass, setVerPass] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [verificandoSesion, setVerificandoSesion] = useState(true);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  const COLOR_FONDO = '#0B1F3A';
  const COLOR_CARD = '#142A4A';
  const COLOR_BORDE = '#1A3A5F';
  const COLOR_ACENTO = '#FFD700';
  const COLOR_TEXTO_SEC = '#8FB3E0';

  const [form, setForm] = useState({
    email: '',
    password: '',
    nombre: '',
    fechaNacimiento: '',
    terminos: false,
  });

  useEffect(() => {
    checkSesionExistente();
  }, []);

  async function checkSesionExistente() {
    if (!supabase) { setVerificandoSesion(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      window.location.href = '/';
    } else {
      setVerificandoSesion(false);
    }
  }

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

    if (!supabase) {
      setError('Error de configuracion. Intenta de nuevo en unos minutos.');
      return;
    }

    if (!form.email || !form.password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    if (modo === 'registro') {
      if (!form.nombre.trim()) { setError('Ingresa tu nombre completo.'); return; }
      if (!form.fechaNacimiento) { setError('Ingresa tu fecha de nacimiento.'); return; }
      if (calcularEdad(form.fechaNacimiento) < 18) {
        setError('Debes tener 18 anos o mas para registrarte. Los juegos de azar estan prohibidos para menores de edad.');
        return;
      }
      if (!form.terminos) { setError('Debes aceptar los terminos y condiciones.'); return; }
      if (form.password.length < 8) { setError('La contrasena debe tener al menos 8 caracteres.'); return; }
    }

    setCargando(true);

    try {
      if (modo === 'registro') {
        const { data: signUpData, error: authError } = await supabase.auth.signUp({
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
            ? 'Este correo ya esta registrado. Intenta iniciar sesion.'
            : authError.message);
        } else {
          if (signUpData?.user?.id) {
            await supabase.from('profiles').update({
              fecha_nacimiento: form.fechaNacimiento,
            }).eq('id', signUpData.user.id);
          }
          setMensaje('Cuenta creada! Ya puedes iniciar sesion.');
          setModo('login');
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });

        if (authError) {
          setError('Correo o contrasena incorrectos.');
        } else {
          window.location.href = '/';
        }
      }
    } catch (err) {
      console.error('Error en login/registro:', err);
      setError('Ocurrio un error inesperado. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  }

  const inputStyle = {
    width: '100%',
    backgroundColor: COLOR_CARD,
    border: `1px solid ${COLOR_BORDE}`,
    borderRadius: 12,
    padding: '12px 14px 12px 42px',
    fontSize: 14,
    color: '#E0F2FE',
    outline: 'none',
  };

  const labelStyle = {
    fontSize: 11,
    fontWeight: 600,
    color: COLOR_TEXTO_SEC,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
    display: 'block',
  };

  const autofillFixCss = `
    input:-webkit-autofill,
    input:-webkit-autofill:hover,
    input:-webkit-autofill:focus {
      -webkit-text-fill-color: #E0F2FE !important;
      -webkit-box-shadow: 0 0 0px 1000px ${COLOR_CARD} inset !important;
      transition: background-color 5000s ease-in-out 0s;
    }
  `;

  if (verificandoSesion) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: COLOR_FONDO, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: COLOR_TEXTO_SEC, fontSize: 14 }}>Cargando...</p>
      </div>
    );
  }

  return (
    <>
      <style>{autofillFixCss}</style>
      <div style={{
        minHeight: '100vh',
        backgroundColor: COLOR_FONDO,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}>
        <div style={{
          width: '100%',
          maxWidth: 420,
          backgroundColor: '#0D2240',
          borderRadius: 24,
          overflow: 'hidden',
          border: `1px solid ${COLOR_BORDE}`,
          boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
        }}>

          <div style={{ background: `linear-gradient(135deg, ${COLOR_FONDO} 0%, ${COLOR_CARD} 100%)`, padding: '28px 24px 24px', textAlign: 'center', borderBottom: `1px solid ${COLOR_BORDE}` }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <Image src="/logo.png" alt="NotiLoto" width={56} height={56} style={{ borderRadius: 14, objectFit: 'cover' }} />
            </div>
            <p style={{ color: '#fff', fontWeight: 800, fontSize: 22, letterSpacing: -0.5 }}>NotiLoto</p>
            <p style={{ color: COLOR_ACENTO, fontSize: 12, fontWeight: 500, marginTop: 3 }}>Colombia</p>
            <p style={{ color: COLOR_TEXTO_SEC, fontSize: 13, marginTop: 8 }}>
              {modo === 'login' ? 'Inicia sesion en tu cuenta' : 'Crea tu cuenta gratis'}
            </p>
          </div>

          <div style={{ display: 'flex', padding: '16px 24px 0' }}>
            {[{ id: 'login', label: 'Iniciar sesion' }, { id: 'registro', label: 'Registrarse' }].map(t => (
              <button
                key={t.id}
                onClick={() => { setModo(t.id); setError(null); setMensaje(null); }}
                style={{
                  flex: 1, padding: '10px', fontSize: 13, fontWeight: 600,
                  border: 'none', borderBottom: `2px solid ${modo === t.id ? COLOR_ACENTO : COLOR_CARD}`,
                  backgroundColor: 'transparent',
                  color: modo === t.id ? COLOR_ACENTO : COLOR_TEXTO_SEC,
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={e => { e.preventDefault(); handleSubmit(); }} style={{ padding: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {modo === 'registro' && (
                <div>
                  <span style={labelStyle}>Nombre completo</span>
                  <div style={{ position: 'relative' }}>
                    <User size={16} color={COLOR_TEXTO_SEC} style={{ position: 'absolute', left: 14, top: 14 }} />
                    <input
                      type="text"
                      name="name"
                      autoComplete="name"
                      placeholder="Tu nombre completo"
                      value={form.nombre}
                      onChange={e => setField('nombre', e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>
              )}

              <div>
                <span style={labelStyle}>Correo electronico</span>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color={COLOR_TEXTO_SEC} style={{ position: 'absolute', left: 14, top: 14 }} />
                  <input
                    type="email"
                    name="email"
                    autoComplete="username"
                    placeholder="tu@correo.com"
                    value={form.email}
                    onChange={e => setField('email', e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <span style={labelStyle}>Contrasena {modo === 'registro' && '(minimo 8 caracteres)'}</span>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color={COLOR_TEXTO_SEC} style={{ position: 'absolute', left: 14, top: 14 }} />
                  <input
                    type={verPass ? 'text' : 'password'}
                    name="password"
                    autoComplete={modo === 'registro' ? 'new-password' : 'current-password'}
                    placeholder={modo === 'registro' ? 'Minimo 8 caracteres' : 'Tu contrasena'}
                    value={form.password}
                    onChange={e => setField('password', e.target.value)}
                    style={{ ...inputStyle, paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setVerPass(!verPass)}
                    style={{ position: 'absolute', right: 14, top: 13, background: 'none', border: 'none', cursor: 'pointer', color: COLOR_TEXTO_SEC }}
                  >
                    {verPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {modo === 'login' && (
                  <p style={{ textAlign: 'right', marginTop: 8 }}>
                    <a href="/recuperar" style={{ fontSize: 12, color: COLOR_ACENTO, textDecoration: 'none' }}>
                      Olvidaste tu contrasena?
                    </a>
                  </p>
                )}
              </div>

              {modo === 'registro' && (
                <div>
                  <span style={labelStyle}>Fecha de nacimiento</span>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={16} color={COLOR_TEXTO_SEC} style={{ position: 'absolute', left: 14, top: 14 }} />
                    <input
                      type="date"
                      name="bday"
                      autoComplete="bday"
                      value={form.fechaNacimiento}
                      onChange={e => setField('fechaNacimiento', e.target.value)}
                      max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                      style={{ ...inputStyle, colorScheme: 'dark' }}
                    />
                  </div>
                  <p style={{ fontSize: 11, color: COLOR_TEXTO_SEC, marginTop: 5 }}>
                    Debes tener 18 anos o mas. Los juegos de azar estan regulados por Coljuegos.
                  </p>
                </div>
              )}

              {modo === 'registro' && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setField('terminos', !form.terminos)}
                    style={{
                      width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
                      border: `2px solid ${form.terminos ? COLOR_ACENTO : COLOR_BORDE}`,
                      backgroundColor: form.terminos ? COLOR_ACENTO : 'transparent',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {form.terminos && <span style={{ color: '#1A1500', fontSize: 12, fontWeight: 700 }}>✓</span>}
                  </button>
                  <p style={{ fontSize: 12, color: COLOR_TEXTO_SEC, lineHeight: 1.5 }}>
                    Acepto los <span style={{ color: COLOR_ACENTO, cursor: 'pointer' }}>terminos y condiciones</span> y la <span style={{ color: COLOR_ACENTO, cursor: 'pointer' }}>politica de privacidad</span>. Confirmo que tengo 18 anos o mas.
                  </p>
                </div>
              )}

              {error && (
                <div style={{ backgroundColor: '#1E0000', border: '1px solid #3A0000', borderRadius: 10, padding: '10px 14px' }}>
                  <p style={{ color: '#ff6b6b', fontSize: 13 }}>{error}</p>
                </div>
              )}

              {mensaje && (
                <div style={{ backgroundColor: '#0a3a2a', border: '1px solid #10B981', borderRadius: 10, padding: '10px 14px' }}>
                  <p style={{ color: '#10B981', fontSize: 13 }}>{mensaje}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={cargando}
                style={{
                  width: '100%', backgroundColor: COLOR_ACENTO, border: 'none', borderRadius: 12,
                  padding: '14px', fontSize: 15, fontWeight: 700, color: '#1A1500',
                  cursor: cargando ? 'not-allowed' : 'pointer',
                  opacity: cargando ? 0.6 : 1,
                  boxShadow: '0 4px 24px rgba(255,215,0,0.25)',
                }}
              >
                {cargando ? 'Cargando...' : modo === 'login' ? 'Iniciar sesion' : 'Crear cuenta'}
              </button>

              <button
                type="button"
                onClick={() => window.location.href = '/'}
                style={{ width: '100%', backgroundColor: 'transparent', border: `1px solid ${COLOR_BORDE}`, borderRadius: 12, padding: '12px', fontSize: 13, color: COLOR_TEXTO_SEC, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <ArrowLeft size={14} /> Volver sin iniciar sesion
              </button>

            </div>
          </form>

          <div style={{ padding: '0 24px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: COLOR_TEXTO_SEC, lineHeight: 1.6 }}>
              NotiLoto no vende boletos de loteria. Solo verificamos resultados.<br />
              Juega con responsabilidad. Linea de ayuda: <span style={{ color: COLOR_ACENTO }}>01800-522-422</span>
            </p>
          </div>

        </div>
      </div>
    </>
  );
}