'use client';
import { useState, useEffect } from 'react';
import { LogOut, DollarSign, Ticket, Settings } from 'lucide-react';

export default function AdminPanel() {
  const [cargando, setCargando] = useState(true);
  const [sesion, setSesion] = useState(null);

  useEffect(() => {
    checkSesion();
  }, []);

  async function checkSesion() {
    try {
      const res = await fetch('/api/admin/sesion');
      if (!res.ok) {
        window.location.href = '/asd';
        return;
      }
      const data = await res.json();
      setSesion(data);
    } catch {
      window.location.href = '/asd';
    } finally {
      setCargando(false);
    }
  }

  async function cerrarSesion() {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.href = '/asd';
  }

  if (cargando) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#555', fontSize: 14 }}>Cargando...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A0A0A', padding: 24 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <p style={{ color: '#fff', fontSize: 24, fontWeight: 800 }}>Panel Administrativo</p>
            <p style={{ color: '#555', fontSize: 13, marginTop: 4 }}>
              {sesion?.email} - Rol: {sesion?.rol === 'admin' ? 'Administrador' : 'Scraper'}
            </p>
          </div>
          <button
            onClick={cerrarSesion}
            style={{ background: '#2A0000', border: '1px solid #3A0000', borderRadius: 8, padding: '8px 16px', color: '#ff6b6b', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <LogOut size={14} /> Salir
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>

          {sesion?.rol === 'admin' && (
            <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 16, padding: 24 }}>
              <DollarSign size={28} color="#C41230" style={{ marginBottom: 12 }} />
              <p style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Precios y planes</p>
              <p style={{ color: '#555', fontSize: 13 }}>Edita los precios de los planes Basico y Pro.</p>
            </div>
          )}

          <div style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 16, padding: 24 }}>
            <Ticket size={28} color="#C41230" style={{ marginBottom: 12 }} />
            <p style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Resultados de loterias</p>
            <p style={{ color: '#555', fontSize: 13 }}>Actualiza los numeros ganadores y secos.</p>
          </div>

        </div>

      </div>
    </div>
  );
}