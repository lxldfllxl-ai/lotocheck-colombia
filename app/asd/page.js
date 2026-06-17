'use client';
import { useState } from 'react';
import { Lock, Mail, Shield, Eye, EyeOff } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [codigo, setCodigo] = useState('');
  const [verPass, setVerPass] = useState(false);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit() {
    setError(null);

    if (!email || !password || !codigo) {
      setError('Complet todos los campos.');
      return;
    }
    if (codigo.length !== 6) {
      setError('El código debe tener 6 dígitos.');
      return;
    }

    setCargando(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, codigo }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al iniciar sesión.');
        setCargando(false);
        return;
      }

      window.location.href = '/asd/panel';
    } catch (err) {
      setError('Error de conexión.');
      setCargando(false);
    }
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
    <div style={{ minHeight: '100vh', backgroundColor: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: 420, backgroundColor: '#111', borderRadius: 24, overflow: 'hidden', border: '1px solid #222', boxShadow: '0 24px 80px rgba(0,0,0,0.8)' }}>

        <div style={{ background: 'linear-gradient(135deg, #1a0000 0%, #2d0000 100%)', padding: '28px 24px 24px', textAlign: 'center', borderBottom: '1px solid #2A0000' }}>
          <div style={{ width: 56, height: 56, backgroundColor: '#2A0000', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <Shield size={28} color="#C41230" />
          </div>
          <p style={{ color: '#fff', fontWeight: 800, fontSize: 20, letterSpacing: -0.5 }}>Panel Administrativo</p>
          <p style={{ color: '#666', fontSize: 13, marginTop: 6 }}>Acceso restringido - NotiLoto</p>
        </div>

        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div>
              <span style={labelStyle}>Correo electronico</span>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#555" style={{ position: 'absolute', left: 14, top: 14 }} />
                <input
                  type="email"
                  placeholder="admin@notiloto.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <span style={labelStyle}>Contrasena</span>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#555" style={{ position: 'absolute', left: 14, top: 14 }} />
                <input
                  type={verPass ? 'text' : 'password'}
                  placeholder="Tu contrasena"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ ...inputStyle, paddingRight: 44 }}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                />
                <button
                  onClick={() => setVerPass(!verPass)}
                  style={{ position: 'absolute', right: 14, top: 13, background: 'none', border: 'none', cursor: 'pointer', color: '#555' }}
                >
                  {verPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <span style={labelStyle}>Codigo de verificacion (Google Authenticator)</span>
              <div style={{ position: 'relative' }}>
                <Shield size={16} color="#555" style={{ position: 'absolute', left: 14, top: 14 }} />
                <input
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={codigo}
                  onChange={e => setCodigo(e.target.value.replace(/\D/g, ''))}
                  style={{ ...inputStyle, fontSize: 20, letterSpacing: 6, fontWeight: 700, textAlign: 'center', paddingLeft: 14 }}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                />
              </div>
            </div>

            {error && (
              <div style={{ backgroundColor: '#1E0000', border: '1px solid #3A0000', borderRadius: 10, padding: '10px 14px' }}>
                <p style={{ color: '#ff6b6b', fontSize: 13 }}>{error}</p>
              </div>
            )}

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
              {cargando ? 'Verificando...' : 'Ingresar'}
            </button>

          </div>
        </div>

        <div style={{ padding: '0 24px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#333', lineHeight: 1.6 }}>
            Este panel esta protegido con autenticacion de dos factores.<br />
            Los intentos de acceso no autorizado son registrados.
          </p>
        </div>

      </div>
    </div>
  );
}