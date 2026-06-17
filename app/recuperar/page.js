'use client';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import Image from 'next/image';

export default function Recuperar() {
  const [email, setEmail] = useState('');
  const [cargando, setCargando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState(null);

  async function handleEnviar() {
    setError(null);
    if (!email) { setError('Ingresa tu correo electronico.'); return; }

    setCargando(true);
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/recuperar/nueva-contrasena`,
    });

    if (authError) {
      setError('No se pudo enviar el correo. Intenta de nuevo.');
    } else {
      setEnviado(true);
    }
    setCargando(false);
  }

  const inputStyle = {
    width: '100%', backgroundColor: '#0a4a8f', border: '1px solid #0d5a9f',
    borderRadius: 12, padding: '12px 14px 12px 42px', fontSize: 14, color: '#E0F2FE', outline: 'none',
  };
  const labelStyle = { fontSize: 11, fontWeight: 600, color: '#64B5F6', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, display: 'block' };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#064089', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: 420, backgroundColor: '#0a3a7f', borderRadius: 24, overflow: 'hidden', border: '1px solid #0d5a9f', boxShadow: '0 24px 80px rgba(0,0,0,0.8)' }}>

        <div style={{ background: 'linear-gradient(135deg, #064089 0%, #0a4a8f 100%)', padding: '28px 24px 24px', textAlign: 'center', borderBottom: '1px solid #0d5a9f' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <Image src="/logo.png" alt="NotiLoto" width={56} height={56} style={{ borderRadius: 14, objectFit: 'cover' }} />
          </div>
          <p style={{ color: '#fff', fontWeight: 800, fontSize: 22 }}>Recuperar contrasena</p>
          <p style={{ color: '#90CAF9', fontSize: 13, marginTop: 8 }}>Te enviaremos un enlace a tu correo</p>
        </div>

        <div style={{ padding: 24 }}>
          {enviado ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: 56, height: 56, backgroundColor: '#0a3a2a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Send size={24} color="#10B981" />
              </div>
              <p style={{ color: '#E0F2FE', fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Correo enviado</p>
              <p style={{ color: '#90CAF9', fontSize: 13, lineHeight: 1.6 }}>
                Revisa tu bandeja de entrada en <strong>{email}</strong> y sigue el enlace para crear una nueva contrasena.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <span style={labelStyle}>Correo electronico</span>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="#64B5F6" style={{ position: 'absolute', left: 14, top: 14 }} />
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleEnviar()}
                    style={inputStyle}
                  />
                </div>
              </div>

              {error && (
                <div style={{ backgroundColor: '#1E0000', border: '1px solid #3A0000', borderRadius: 10, padding: '10px 14px' }}>
                  <p style={{ color: '#ff6b6b', fontSize: 13 }}>{error}</p>
                </div>
              )}

              <button onClick={handleEnviar} disabled={cargando} style={{ width: '100%', backgroundColor: '#F59E0B', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700, color: '#000', cursor: cargando ? 'not-allowed' : 'pointer', opacity: cargando ? 0.6 : 1 }}>
                {cargando ? 'Enviando...' : 'Enviar enlace de recuperacion'}
              </button>
            </div>
          )}

          <button onClick={() => window.location.href = '/login'} style={{ width: '100%', marginTop: 14, backgroundColor: 'transparent', border: '1px solid #0d5a9f', borderRadius: 12, padding: '12px', fontSize: 13, color: '#64B5F6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <ArrowLeft size={14} /> Volver al inicio de sesion
          </button>
        </div>

      </div>
    </div>
  );
}