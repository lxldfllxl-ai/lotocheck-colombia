'use client';
import { X, Check, Zap } from 'lucide-react';

export default function ModalPremium({ onClose }) {
  const planes = [
    {
      id: 'gratis',
      nombre: 'Gratis',
      precio: '$0',
      desc: 'Perfecto para empezar',
      features: [
        { txt: '2 boletos guardados', ok: true },
        { txt: 'Verificar resultados', ok: true },
        { txt: 'Sin notificaciones automáticas', ok: false },
        { txt: 'Anuncios en la app', ok: false },
        { txt: 'Acceso a todas las loterías', ok: true },
      ],
      botón: 'Plan actual',
      destacado: false,
    },
    {
      id: 'basico',
      nombre: 'Básico',
      precio: '$3.900/mes',
      desc: 'Lo más popular',
      features: [
        { txt: '10 boletos guardados', ok: true },
        { txt: 'Verificar resultados', ok: true },
        { txt: 'Notificaciones por correo', ok: true },
        { txt: 'Sin anuncios', ok: true },
        { txt: 'Acceso a todas las loterías', ok: true },
      ],
      botón: 'Comenzar prueba gratis',
      destacado: true,
    },
    {
      id: 'pro',
      nombre: 'Pro',
      precio: '$7.900/mes',
      desc: 'Para jugadores serios',
      features: [
        { txt: 'Boletos ilimitados', ok: true },
        { txt: 'Verificar resultados', ok: true },
        { txt: 'Notificaciones por correo y push', ok: true },
        { txt: 'Sin anuncios', ok: true },
        { txt: 'Acceso a todas las loterías', ok: true },
        { txt: 'Soporte prioritario', ok: true },
      ],
      botón: 'Comenzar prueba gratis',
      destacado: false,
    },
  ];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      backgroundColor: 'rgba(0, 0, 0, 0.92)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      overflowY: 'auto',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 1100,
        backgroundColor: '#064089',
        borderRadius: 24,
        border: '1px solid #0a5a9f',
        overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
      }}>

        {/* Header */}
        <div style={{
          padding: '28px 32px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #0a5a9f',
        }}>
          <div>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: 24 }}>Planes de NotiCheck</p>
            <p style={{ color: '#90CAF9', fontSize: 13, marginTop: 6 }}>Elige el plan perfecto para ti</p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#0a4a8f',
              border: '1px solid #0d5a9f',
              borderRadius: 8,
              padding: '8px 12px',
              color: '#90CAF9',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Cards */}
        <div style={{
          padding: '32px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 20,
        }}>
          {planes.map(plan => (
            <div
              key={plan.id}
              style={{
                backgroundColor: plan.destacado ? '#0a5a9f' : '#0a4a8f',
                border: plan.destacado ? '2px solid #F59E0B' : '1px solid #0d5a9f',
                borderRadius: 16,
                padding: 28,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {plan.destacado && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  backgroundColor: '#F59E0B',
                  padding: '6px 0',
                  textAlign: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                }}>
                  <Zap size={13} /> RECOMENDADO
                </div>
              )}

              <div style={{ marginTop: plan.destacado ? 24 : 0, marginBottom: 20 }}>
                <p style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>{plan.nombre}</p>
                <p style={{ color: '#90CAF9', fontSize: 13, marginTop: 6 }}>{plan.desc}</p>
              </div>

              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 36, fontWeight: 800, color: '#fff' }}>{plan.precio}</p>
                {plan.precio !== '$0' && (
                  <p style={{ fontSize: 12, color: '#64B5F6', marginTop: 4 }}>Cancelación en cualquier momento</p>
                )}
              </div>

              <button
                style={{
                  width: '100%',
                  backgroundColor: plan.destacado ? '#F59E0B' : 'transparent',
                  border: plan.destacado ? 'none' : '1.5px solid #F59E0B',
                  borderRadius: 12,
                  padding: '14px',
                  fontSize: 14,
                  fontWeight: 700,
                  color: plan.destacado ? '#000' : '#F59E0B',
                  cursor: 'pointer',
                  marginBottom: 24,
                }}
              >
                {plan.botón}
              </button>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {plan.features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {f.ok ? (
                      <Check size={18} color="#10B981" style={{ flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: '#0d5a9f' }} />
                    )}
                    <p style={{ fontSize: 13, color: f.ok ? '#E0F2FE' : '#64B5F6' }}>{f.txt}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px 32px 28px',
          borderTop: '1px solid #0a5a9f',
          textAlign: 'center',
        }}>
          <p style={{ color: '#64B5F6', fontSize: 12, lineHeight: 1.6 }}>
            💳 Los pagos se procesan a través de <strong>Wompi</strong>. Facturación segura e inmediata.<br />
            Para más info: <span style={{ color: '#F59E0B' }}>soporte@noticheck.com</span>
          </p>
        </div>

      </div>
    </div>
  );
}