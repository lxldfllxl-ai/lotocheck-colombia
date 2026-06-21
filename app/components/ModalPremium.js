'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Crown } from 'lucide-react';

function formatearPrecio(valor) {
  if (valor === undefined || valor === null || valor === '') return '$0';
  const numero = parseInt(String(valor).replace(/[^\d]/g, ''));
  if (isNaN(numero)) return '$0';
  return '$' + numero.toLocaleString('es-CO');
}

export default function ModalPremium({ onClose }) {
  const [config, setConfig] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [montado, setMontado] = useState(false);

  const COLOR_FONDO = '#0B1F3A';
  const COLOR_CARD = '#142A4A';
  const COLOR_BORDE = '#1A3A5F';
  const COLOR_ACENTO = '#FFD700';
  const COLOR_TEXTO_SEC = '#8FB3E0';

  useEffect(() => {
    setMontado(true);
    cargarConfig();
  }, []);

  async function cargarConfig() {
    try {
      const res = await fetch('/api/configuracion');
      const data = await res.json();
      if (!data.error) setConfig(data);
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  }

  if (!montado) return null;

  const planes = config ? [
    {
      id: 'gratis',
      nombre: config.nombre_gratis || 'Gratis',
      precio: '$0',
      precioSufijo: '',
      limite: config.limite_gratis ? `Guarda hasta ${config.limite_gratis} numeros pendientes` : '2 boletos guardados',
      beneficios: ['Notificaciones push', 'Verificacion ilimitada', 'Con anuncios'],
      destacado: false,
    },
    {
      id: 'basico',
      nombre: config.nombre_basico || 'Basico',
      precio: formatearPrecio(config.precio_basico),
      precioSufijo: '/mes',
      limite: config.limite_basico ? `Guarda hasta ${config.limite_basico} numeros pendientes` : '10 boletos guardados',
      beneficios: ['Notificaciones push y correo', 'Sin anuncios', 'Verificacion ilimitada'],
      destacado: false,
    },
    {
      id: 'pro',
      nombre: config.nombre_pro || 'Pro',
      precio: formatearPrecio(config.precio_pro),
      precioSufijo: '/mes',
      limite: config.limite_pro ? `Guarda hasta ${config.limite_pro} numeros pendientes` : '25 boletos guardados',
      beneficios: ['Notificaciones push y correo', 'Sin anuncios', 'Soporte prioritario'],
      destacado: true,
    },
    {
      id: 'premium',
      nombre: config.nombre_premium || 'Premium',
      precio: formatearPrecio(config.precio_premium),
      precioSufijo: '/mes',
      limite: 'Numeros ilimitados',
      beneficios: ['Notificaciones push y correo', 'Sin anuncios', 'Soporte prioritario', 'Boletos ilimitados'],
      destacado: false,
    },
  ] : [];

  const modal = (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      backgroundColor: 'rgba(0,0,0,0.92)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      overflowY: 'auto', padding: '40px 16px',
    }}>
      <div style={{
        width: '100%', maxWidth: 1100,
        backgroundColor: COLOR_FONDO, borderRadius: 24,
        border: `1px solid ${COLOR_BORDE}`, padding: '32px 28px',
        position: 'relative',
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 20, right: 20,
          background: COLOR_CARD, border: `1px solid ${COLOR_BORDE}`, borderRadius: 8,
          padding: 8, cursor: 'pointer', color: COLOR_TEXTO_SEC,
        }}>
          <X size={18} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Crown size={32} color={COLOR_ACENTO} style={{ marginBottom: 10 }} />
          <p style={{ color: '#fff', fontSize: 24, fontWeight: 800 }}>Elige tu plan</p>
          <p style={{ color: COLOR_TEXTO_SEC, fontSize: 14, marginTop: 6 }}>Guarda mas Números y recibe notificaciones sin perderte ningun resultado.</p>
        </div>

        {cargando ? (
          <p style={{ textAlign: 'center', color: COLOR_TEXTO_SEC, padding: 40 }}>Cargando planes...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {planes.map(plan => (
              <div key={plan.id} style={{
                backgroundColor: plan.destacado ? COLOR_CARD : '#0D2240',
                border: plan.destacado ? `2px solid ${COLOR_ACENTO}` : `1px solid ${COLOR_BORDE}`,
                borderRadius: 16, padding: 22,
                position: 'relative',
                display: 'flex', flexDirection: 'column',
              }}>
                {plan.destacado && (
                  <span style={{
                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    backgroundColor: COLOR_ACENTO, color: '#1A1500', fontSize: 11, fontWeight: 700,
                    padding: '4px 14px', borderRadius: 20,
                  }}>
                    Mas popular
                  </span>
                )}
                <p style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 4, textTransform: 'capitalize' }}>{plan.nombre}</p>
                <p style={{ color: COLOR_ACENTO, fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
                  {plan.precio}<span style={{ fontSize: 14, color: COLOR_TEXTO_SEC, fontWeight: 500 }}>{plan.precioSufijo}</span>
                </p>
                <p style={{ color: COLOR_TEXTO_SEC, fontSize: 13, marginBottom: 18 }}>{plan.limite}</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                  {plan.beneficios.map((b, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <Check size={15} color="#10B981" style={{ marginTop: 2, flexShrink: 0 }} />
                      <span style={{ color: '#E0F2FE', fontSize: 13 }}>{b}</span>
                    </div>
                  ))}
                </div>

                {plan.id !== 'gratis' && (
                  <button style={{
                    marginTop: 20, width: '100%',
                    backgroundColor: plan.destacado ? COLOR_ACENTO : 'transparent',
                    border: plan.destacado ? 'none' : `1.5px solid ${COLOR_ACENTO}`,
                    borderRadius: 10, padding: '12px',
                    color: plan.destacado ? '#1A1500' : COLOR_ACENTO,
                    fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  }}>
                    Elegir {plan.nombre}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <p style={{ textAlign: 'center', color: COLOR_TEXTO_SEC, fontSize: 12, marginTop: 24 }}>
          Los pagos se procesaran proximamente. Por ahora puedes explorar los planes disponibles.
        </p>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}