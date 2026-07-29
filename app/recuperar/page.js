'use client';
import { useState } from 'react';
import { Mail, Calendar, ArrowLeft, Send } from 'lucide-react';
import Image from 'next/image';

export default function Recuperar() {
  const [email, setEmail] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [cargando, setCargando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState(null);

  const COLOR_FONDO = '#0B1F3A';
  const COLOR_CARD = '#142A4A';
  const COLOR_BORDE = '#1A3A5F';
  const COLOR_ACENTO = '#FFD700';
  const COLOR_TEXTO_SEC = '#8FB3E0';

  async function handleEnviar() {
    setError(null);
    if (!email || !fechaNacimiento) {
      setError('Completa tu correo y fecha de nacimiento.');
      return;
    }

    setCargando(true);
    try {
      const res = await fetch('/api/verificar-recuperacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, fechaNacimiento }),
      });
      const data = await res.json();

      if (data.ok || res.ok) {
        setEnviado(true);
      } else {
        setError('Ocurrio un error. Intenta de nuevo.');
      }
    } catch (err) {
      setError('Error de conexion. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  }

  const inputStyle = {
    width: '100%', backgroundColor: COLOR_CARD, border: `1px solid ${COLOR_BORDE}`,
    borderRadius: 12, padding: '12px 14px 12px 42px', fontSize: 14, color: '#E0F2FE', outline: 'none',
  };
  const labelStyle = { fontSize: 11, fontWeight: 600, color: COLOR_TEXTO_SEC, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, display: 'block' };

  const autofillFixCss = `
    input:-webkit-autofill,
    input:-webkit-autofill:hover,
    input:-webkit-autofill:focus {
      -webkit-text-fill-color: #E0F2FE !important;
      -webkit-box-shadow: 0 0 0px 1000px ${COLOR_CARD} inset !important;
      transition: background-color 5000s ease-in-out 0s;
    }
  `;

  return (
    <>
      <style>{autofillFixCss}</style>
      <div style={{ minHeight: '100vh', backgroundColor: COLOR_FONDO, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
        <div style={{ width: '100%', maxWidth: 420, backgroundColor: '#0D2240', borderRadius: 24, overflow: 'hidden', border: `1px solid ${COLOR_BORDE}`, boxShadow: '0 24px 80px rgba(0,0,0,0.8)' }}>

          <div style={{ background: `linear-gradient(135deg, ${COLOR_FONDO} 0%, ${COLOR_CARD} 100%)`, padding: '28px 24px 24px', textAlign: 'center', borderBottom: `1px solid ${COLOR_BORDE}` }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <Image src="/logo.png" alt="NotiLoto" width={56} height={56} style={{ borderRadius: 14, objectFit: 'cover' }} />
            </div>
            <p style={{ color: '#fff', fontWeight: 800, fontSize: 22 }}>Recuperar contraseña</p>
            <p style={{ color: COLOR_TEXTO_SEC, fontSize: 13, marginTop: 8 }}>Confirma tu identidad para continuar</p>
          </div>

          <div style={{ padding: 24 }}>
            {enviado ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ width: 56, height: 56, backgroundColor: '#0a3a2a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Send size={24} color="#10B981" />
                </div>
                <p style={{ color: '#E0F2FE', fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Solicitud procesada</p>
                <p style={{ color: COLOR_TEXTO_SEC, fontSize: 13, lineHeight: 1.6 }}>
                  Si los datos coinciden con una cuenta registrada, recibirás un correo con instrucciones para restablecer tu contraseña. Revisa tu bandeja de entrada y la carpeta de spam.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <span style={labelStyle}>Correo electrónico</span>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} color={COLOR_TEXTO_SEC} style={{ position: 'absolute', left: 14, top: 14 }} />
                    <input
                      type="email"
                      name="email"
                      autoComplete="email"
                      placeholder="tu@correo.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <span style={labelStyle}>Fecha de nacimiento</span>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={16} color={COLOR_TEXTO_SEC} style={{ position: 'absolute', left: 14, top: 14 }} />
                    <input
                      type="date"
                      name="bday"
                      autoComplete="bday"
                      value={fechaNacimiento}
                      onChange={e => setFechaNacimiento(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleEnviar()}
                      style={{ ...inputStyle, colorScheme: 'dark' }}
                    />
                  </div>
                  <p style={{ fontSize: 11, color: COLOR_TEXTO_SEC, marginTop: 5 }}>
                    Usamos esto para confirmar que eres el dueno de la cuenta.
                  </p>
                </div>

                {error && (
                  <div style={{ backgroundColor: '#1E0000', border: '1px solid #3A0000', borderRadius: 10, padding: '10px 14px' }}>
                    <p style={{ color: '#ff6b6b', fontSize: 13 }}>{error}</p>
                  </div>
                )}

                <button onClick={handleEnviar} disabled={cargando} style={{ width: '100%', backgroundColor: COLOR_ACENTO, border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700, color: '#1A1500', cursor: cargando ? 'not-allowed' : 'pointer', opacity: cargando ? 0.6 : 1 }}>
                  {cargando ? 'Verificando...' : 'Continuar'}
                </button>
              </div>
            )}

            <button onClick={() => window.location.href = '/login'} style={{ width: '100%', marginTop: 14, backgroundColor: 'transparent', border: `1px solid ${COLOR_BORDE}`, borderRadius: 12, padding: '12px', fontSize: 13, color: COLOR_TEXTO_SEC, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <ArrowLeft size={14} /> Volver al inicio de sesión
            </button>
          </div>

        </div>
      </div>
    </>
  );
}