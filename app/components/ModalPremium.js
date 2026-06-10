'use client';
import { createPortal } from 'react-dom';
import { Crown } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ModalPremium({ onClose }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.88)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div style={{
        backgroundColor: '#111827',
        borderRadius: '24px',
        padding: '24px',
        width: '100%',
        maxWidth: '360px',
      }}>
        <div style={{ width: 40, height: 4, backgroundColor: '#374151', borderRadius: 9999, margin: '0 auto 24px' }} />

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            width: 64, height: 64,
            backgroundColor: 'rgba(234,179,8,0.15)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px',
          }}>
            <Crown size={32} color="#EAB308" />
          </div>
          <h2 style={{ color: '#ffffff', fontSize: 20, fontWeight: 700, margin: 0 }}>Hazte Premium</h2>
          <p style={{ color: '#9CA3AF', fontSize: 14, marginTop: 6 }}>Guarda boletos ilimitados y recibe notificaciones</p>
        </div>

        <div style={{ backgroundColor: '#1F2937', borderRadius: 16, padding: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ color: '#6B7280', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Gratis</span>
            <span style={{ color: '#6B7280', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Premium</span>
          </div>
          {[
            { label: 'Boletos guardados', gratis: '2', premium: 'Ilimitados' },
            { label: 'Notif. por correo', gratis: '✅', premium: '✅' },
            { label: 'Notif. push', gratis: '✅', premium: '✅' },
            { label: 'Solo notif. si gana', gratis: '✅', premium: '✅' },
          ].map(({ label, gratis, premium }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderTop: '1px solid #374151' }}>
              <span style={{ flex: 1, color: '#D1D5DB', fontSize: 14 }}>{label}</span>
              <span style={{ width: 64, textAlign: 'center', color: '#6B7280', fontSize: 14 }}>{gratis}</span>
              <span style={{ width: 80, textAlign: 'center', color: '#F87171', fontSize: 14, fontWeight: 600 }}>{premium}</span>
            </div>
          ))}
        </div>

        <button style={{
          width: '100%', backgroundColor: '#B91C1C', color: '#fff',
          border: 'none', borderRadius: 16, padding: '14px',
          fontSize: 16, fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          marginBottom: 8,
        }}>
          <Crown size={18} color="#fff" />
          Suscribirse — $3.200/mes
        </button>

        <button
          onClick={onClose}
          style={{
            width: '100%', background: 'none', border: 'none',
            color: '#6B7280', fontSize: 14, padding: '10px', cursor: 'pointer',
          }}
        >
          Ahora no
        </button>
      </div>
    </div>,
    document.body
  );
}