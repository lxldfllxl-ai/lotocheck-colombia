'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Lock, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';

export default function NuevaContrasena() {
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [verPass, setVerPass] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [listo, setListo] = useState(false);
  const [sesionValida, setSesionValida] = useState(null);

  const COLOR_FONDO = '#0B1F3A';
  const COLOR_CARD = '#142A4A';
  const COLOR_BORDE = '#1A3A5F';
  const COLOR_ACENTO = '#FFD700';
  const COLOR_TEXTO_SEC = '#8FB3E0';

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSesionValida(!!data.session);
    });
  }, []);

  async function handleActualizar() {
    setError(null);
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return; }
    if (password !== confirmar) { setError('Las contraseñas no coinciden.'); return; }

    setCargando(true);
    const { error: authError } = await supabase.auth.updateUser({ password });

    if (authError) {
      setError('No se pudo actualizar la contraseña. El enlace puede haber expirado.');
      setCargando(false);
      return;
    }

    await supabase.auth.signOut();

    setListo(true);
    setCargando(false);
    setTimeout(() => { window.location.href = '/login'; }, 2500);
  }

  const inputStyle = {
    width: '100%', backgroundColor: COLOR_CARD, border: `1px solid ${COLOR_BORDE}`,
    borderRadius: 12, padding: '12px 44px 12px 42px', fontSize: 14, color: '#E0F2FE', outline: 'none',
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
            <p style={{ color: '#fff', fontWeight: 800, fontSize: 22 }}>Nueva contraseña</p>
          </div>

          <div style={{ padding: 24 }}>
            {sesionValida === false ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p style={{ color: '#ff6b6b', fontSize: 14 }}>El enlace de recuperación no es válido o expiró.</p>
                <button onClick={() => window.location.href = '/recuperar'} style={{ marginTop: 16, backgroundColor: COLOR_ACENTO, border: 'none', borderRadius: 10, padding: '12px 28px', color: '#1A1500', fontWeight: 700, cursor: 'pointer' }}>
                  Solicitar nuevo enlace
                </button>
              </div>
            ) : listo ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p style={{ color: '#10B981', fontSize: 15, fontWeight: 600 }}>Contraseña actualizada</p>
                <p style={{ color: COLOR_TEXTO_SEC, fontSize: 13, marginTop: 8 }}>Te redirigiremos para que inicies sesión con tu nueva contraseña...</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <span style={labelStyle}>Nueva contraseña</span>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} color={COLOR_TEXTO_SEC} style={{ position: 'absolute', left: 14, top: 14 }} />
                    <input
                      type={verPass ? 'text' : 'password'}
                      name="new-password"
                      autoComplete="new-password"
                      placeholder="Mínimo 8 caracteres"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      style={inputStyle}
                    />
                    <button onClick={() => setVerPass(!verPass)} style={{ position: 'absolute', right: 14, top: 13, background: 'none', border: 'none', cursor: 'pointer', color: COLOR_TEXTO_SEC }}>
                      {verPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <span style={labelStyle}>Confirmar contraseña</span>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} color={COLOR_TEXTO_SEC} style={{ position: 'absolute', left: 14, top: 14 }} />
                    <input
                      type={verPass ? 'text' : 'password'}
                      name="confirm-password"
                      autoComplete="new-password"
                      placeholder="Repite la contraseña"
                      value={confirmar}
                      onChange={e => setConfirmar(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleActualizar()}
                      style={{ ...inputStyle, paddingRight: 14 }}
                    />
                  </div>
                </div>

                {error && (
                  <div style={{ backgroundColor: '#1E0000', border: '1px solid #3A0000', borderRadius: 10, padding: '10px 14px' }}>
                    <p style={{ color: '#ff6b6b', fontSize: 13 }}>{error}</p>
                  </div>
                )}

                <button onClick={handleActualizar} disabled={cargando} style={{ width: '100%', backgroundColor: COLOR_ACENTO, border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700, color: '#1A1500', cursor: cargando ? 'not-allowed' : 'pointer', opacity: cargando ? 0.6 : 1 }}>
                  {cargando ? 'Actualizando...' : 'Actualizar contraseña'}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}