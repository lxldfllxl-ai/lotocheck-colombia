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
      limite: config.limite_gratis ? `${config.limite_gratis} boletos guardados` : '2 boletos guardados',
      beneficios: ['Notificaciones push', 'Verificacion ilimitada', 'Con anuncios'],
      destacado: false,
    },
    {
      id: 'basico',
      nombre: config.nombre_basico || 'Basico',
      precio: formatearPrecio(config.precio_basico),
      precioSufijo: '/mes',
      limite: config.limite_basico ? `${config.limite_basico} boletos guardados` : '10 boletos guardados',
      beneficios: ['Notificaciones push y correo', 'Sin anuncios', 'Verificacion ilimitada'],
      destacado: false,
    },
    {
      id: 'pro',
      nombre: config.nombre_pro || 'Pro',
      precio: formatearPrecio(config.precio_pro),
      precioSufijo: '/mes',
      limite: config.limite_pro ? `${config.limite_pro} boletos guardados` : '25 boletos guardados',
      beneficios: ['Notificaciones push y correo', 'Sin anuncios', 'Soporte prioritario'],
      destacado: true,
    },
    {
      id: 'premium',
      nombre: config.nombre_premium || 'Premium',
      precio: formatearPrecio(config.precio_premium),
      precioSufijo: '/mes',
      limite: 'Boletos ilimitados',
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
        width: '100%', maxWidth: 980,
        backgroundColor: '#064089', borderRadius: 24,
        border: '1px solid #0d5a9f', padding: '32px 28px',
        position: 'relative',
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 20, right: 20,
          background: '#0a4a8f', border: '1px solid #0d5a9f', borderRadius: 8,
          padding: 8, cursor: 'pointer', color: '#90CAF9',
        }}>
          <X size={18} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Crown size={32} color="#F59E0B" style={{ marginBottom: 10 }} />
          <p style={{ color: '#fff', fontSize: 24, fontWeight: 800 }}>Elige tu plan</p>
          <p style={{ color: '#90CAF9', fontSize: 14, marginTop: 6 }}>Guarda mas boletos y recibe notificaciones sin perderte ningun resultado.</p>
        </div>

        {cargando ? (
          <p style={{ textAlign: 'center', color: '#64B5F6', padding: 40 }}>Cargando planes...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {planes.map(plan => (
              <div key={plan.id} style={{
                backgroundColor: plan.destacado ? '#0a4a8f' : '#053a78',
                border: plan.destacado ? '2px solid #F59E0B' : '1px solid #0d5a9f',
                borderRadius: 16, padding: 22,
                position: 'relative',
                display: 'flex', flexDirection: 'column',
              }}>
                {plan.destacado && (
                  <span style={{
                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    backgroundColor: '#F59E0B', color: '#000', fontSize: 11, fontWeight: 700,
                    padding: '4px 14px', borderRadius: 20,
                  }}>
                    Mas popular
                  </span>
                )}
                <p style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 4, textTransform: 'capitalize' }}>{plan.nombre}</p>
                <p style={{ color: '#F59E0B', fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
                  {plan.precio}<span style={{ fontSize: 14, color: '#90CAF9', fontWeight: 500 }}>{plan.precioSufijo}</span>
                </p>
                <p style={{ color: '#64B5F6', fontSize: 13, marginBottom: 18 }}>{plan.limite}</p>

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
                    backgroundColor: plan.destacado ? '#F59E0B' : 'transparent',
                    border: plan.destacado ? 'none' : '1.5px solid #F59E0B',
                    borderRadius: 10, padding: '12px',
                    color: plan.destacado ? '#000' : '#F59E0B',
                    fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  }}>
                    Elegir {plan.nombre}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <p style={{ textAlign: 'center', color: '#64B5F6', fontSize: 12, marginTop: 24 }}>
          Los pagos se procesaran proximamente. Por ahora puedes explorar los planes disponibles.
        </p>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}