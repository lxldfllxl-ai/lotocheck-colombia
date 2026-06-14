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
        { txt: 'Puedes guardar hasta 2 boletos pendientes', ok: true },
        { txt: 'Verificar resultados', ok: true },
        { txt: 'Notificaciones push', ok: true },
        { txt: 'Sin notificaciones por correo', ok: false },
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
        { txt: 'Puedes guardar hasta 10 boletos pendientes', ok: true },
        { txt: 'Verificar resultados', ok: true },
        { txt: 'Notificaciones push', ok: true },
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
      precio: '$6.900/mes',
      desc: 'Para jugadores serios',
      features: [
        { txt: 'Boletos pendientes ilimitados', ok: true },
        { txt: 'Verificar resultados', ok: true },
        { txt: 'Notificaciones push', ok: true },
        { txt: 'Notificaciones por correo', ok: true },
        { txt: 'Sin anuncios', ok: true },
        { txt: 'Acceso a todas las loterías', ok: true },
        { txt: 'Soporte prioritario', ok: true },
      ],
      botón: 'Comenzar prueba gratis',
      destacado: false,
    },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.92)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '20px',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 1100,
          backgroundColor: '#064089',
          borderRadius: 24,
          border: '1px solid #0a5a9f',
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
          marginTop: 'auto',
          marginBottom: 'auto',
        }}
      >

        {/* Header */}
        <div style={{
          padding: '24px 24px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #0a5a9f',
          position: 'sticky',
          top: 0,
          backgroundColor: '#064089',
          zIndex: 1,
        }}>
          <div>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: 22 }}>Planes de NotiLoto</p>
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
              flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Cards */}
        <div style={{
          padding: '24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20,
        }}>
          {planes.map(plan => (
            <div
              key={plan.id}
              style={{
                backgroundColor: plan.destacado ? '#0a5a9f' : '#0a4a8f',
                border: plan.destacado ? '2px solid #F59E0B' : '1px solid #0d5a9f',
                borderRadius: 16,
                padding: 24,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'visible',
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
                  borderRadius: '14px 14px 0 0',
                }}>
                  <Zap size={13} /> RECOMENDADO
                </div>
              )}

              <div style={{ marginTop: plan.destacado ? 28 : 0, marginBottom: 20 }}>
                <p style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>{plan.nombre}</p>
                <p style={{ color: '#90CAF9', fontSize: 13, marginTop: 6 }}>{plan.desc}</p>
              </div>

              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 32, fontWeight: 800, color: '#fff' }}>{plan.precio}</p>
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
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    {f.ok ? (
                      <Check size={18} color="#10B981" style={{ flexShrink: 0, marginTop: 1 }} />
                    ) : (
                      <div style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: '#0d5a9f', flexShrink: 0, marginTop: 1 }} />
                    )}
                    <p style={{ fontSize: 13, color: f.ok ? '#E0F2FE' : '#64B5F6', lineHeight: 1.4 }}>{f.txt}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px 24px 28px',
          borderTop: '1px solid #0a5a9f',
          textAlign: 'center',
        }}>
          <p style={{ color: '#64B5F6', fontSize: 12, lineHeight: 1.6 }}>
            💳 Los pagos se procesan a través de <strong>Wompi</strong>. Facturación segura e inmediata.<br />
            Para más info: <span style={{ color: '#F59E0B' }}>soporte@notiloto.com</span>
          </p>
        </div>

      </div>
    </div>
  );
}