'use client';
import { useState, useRef, useEffect } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle, Image as ImageIcon } from 'lucide-react';

export default function EscanerBoleto({ onResultado, onCerrar }) {
  const [esMobile, setEsMobile] = useState(false);
  const [fase, setFase] = useState('camara'); // camara | procesando | resultado | error
  const [datos, setDatos] = useState({ loteria: '', numero: '', serie: '', fraccion: '', valorApuesta: '', fechaSorteo: '', signo: '' });
  const [confianza, setConfianza] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const inputArchivoRef = useRef(null);

  useEffect(() => {
    setEsMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    if (fase !== 'camara') return;
    iniciarCamara();
    return () => detenerCamara();
  }, [fase]);

  async function iniciarCamara() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error('Error camara:', err);
      setErrorMsg('No se pudo acceder a la camara. Verifica los permisos del navegador.');
      setFase('error');
    }
  }

  function detenerCamara() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }

  function capturarFoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(blob => {
      if (blob) procesarImagen(blob);
    }, 'image/jpeg', 0.9);
  }

  function handleArchivoSeleccionado(e) {
    const archivo = e.target.files?.[0];
    if (archivo) procesarImagen(archivo);
  }

  function procesarImagen(blob) {
    detenerCamara();
    setPreviewUrl(URL.createObjectURL(blob));
    setFase('procesando');

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Completo = reader.result;
      const base64Limpio = base64Completo.split(',')[1];

      try {
        const res = await fetch('/api/escanear-boleto', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imagenBase64: base64Limpio, mimeType: blob.type || 'image/jpeg' }),
        });
        const data = await res.json();

        if (!res.ok || !data.ok) {
          setErrorMsg(data.error || 'No se pudo leer el boleto. Intenta con mejor luz o enfoque.');
          setFase('error');
          return;
        }

        setDatos({
          loteria: data.datos.loteria || '',
          numero: data.datos.numero || '',
          serie: data.datos.serie || '',
          fraccion: data.datos.fraccion || '',
          valorApuesta: data.datos.valorApuesta || '',
          fechaSorteo: data.datos.fechaSorteo || '',
          signo: data.datos.signo || '',
        });
        setConfianza(data.datos.confianza || '');
        setFase('resultado');
      } catch (err) {
        console.error(err);
        setErrorMsg('Error de conexion al procesar la imagen.');
        setFase('error');
      }
    };
    reader.readAsDataURL(blob);
  }

  function reintentar() {
    setDatos({ loteria: '', numero: '', serie: '', fraccion: '', valorApuesta: '', fechaSorteo: '', signo: '' });
    setConfianza('');
    setErrorMsg('');
    setPreviewUrl(null);
    setFase('camara');
  }

  function confirmar() {
    onResultado(datos);
    onCerrar();
  }

  const overlay = {
    position: 'fixed', inset: 0, zIndex: 9999,
    backgroundColor: 'rgba(0,0,0,0.95)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 16,
  };
  const contenedor = {
    width: '100%', maxWidth: 480, maxHeight: '92vh', overflowY: 'auto',
    backgroundColor: '#064089', borderRadius: 20,
    border: '1px solid #0d5a9f',
  };
  const header = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px', borderBottom: '1px solid #0d5a9f',
    position: 'sticky', top: 0, backgroundColor: '#064089', zIndex: 10,
  };
  const inputStyle = {
    width: '100%', backgroundColor: '#0a4a8f', border: '1px solid #0d5a9f',
    borderRadius: 10, padding: '11px 14px', fontSize: 15, color: '#fff', outline: 'none',
  };
  const labelStyle = { fontSize: 11, fontWeight: 600, color: '#64B5F6', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, display: 'block' };

  return (
    <div style={overlay}>
      <div style={contenedor}>
        <div style={header}>
          <p style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Escanear boleto con IA</p>
          <button onClick={() => { detenerCamara(); onCerrar(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#90CAF9' }}>
            <X size={20} />
          </button>
        </div>

        {fase === 'camara' && (
          <div>
            <div style={{ position: 'relative', backgroundColor: '#000', aspectRatio: '4/3' }}>
              <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{
                position: 'absolute', inset: '10%',
                border: '2px dashed #F59E0B', borderRadius: 12,
              }} />
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <div style={{ padding: 20 }}>
              <p style={{ color: '#90CAF9', fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
                Encuadra el boleto completo dentro del marco, con buena luz
              </p>
              <button onClick={capturarFoto} style={{
                width: '100%', backgroundColor: '#F59E0B', border: 'none', borderRadius: 12,
                padding: '15px', color: '#000', fontWeight: 700, fontSize: 15, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10,
              }}>
                <Camera size={18} /> Tomar foto
              </button>
              <label style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                backgroundColor: 'transparent', border: '1px solid #0d5a9f', borderRadius: 12,
                padding: '13px', color: '#64B5F6', fontSize: 14, cursor: 'pointer',
              }}>
                <ImageIcon size={16} /> Elegir de la galeria
                <input ref={inputArchivoRef} type="file" accept="image/*" onChange={handleArchivoSeleccionado} style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }} />
              </label>
            </div>
          </div>
        )}

        {fase === 'procesando' && (
          <div style={{ padding: 50, textAlign: 'center' }}>
            {previewUrl && (
              <img src={previewUrl} alt="Boleto capturado" style={{ width: '100%', maxHeight: 220, objectFit: 'contain', borderRadius: 12, marginBottom: 20, opacity: 0.6 }} />
            )}
            <RefreshCw size={28} color="#F59E0B" style={{ animation: 'spin 1s linear infinite', marginBottom: 14 }} />
            <p style={{ color: '#90CAF9', fontSize: 14 }}>Leyendo boleto con inteligencia artificial...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {fase === 'error' && (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <AlertCircle size={32} color="#ff6b6b" style={{ marginBottom: 16 }} />
            <p style={{ color: '#ff6b6b', fontSize: 14, marginBottom: 20 }}>{errorMsg}</p>
            <button onClick={reintentar} style={{ backgroundColor: '#F59E0B', border: 'none', borderRadius: 10, padding: '12px 28px', color: '#000', fontWeight: 700, cursor: 'pointer' }}>
              Intentar de nuevo
            </button>
          </div>
        )}

        {fase === 'resultado' && (
          <div style={{ padding: 20 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18,
              backgroundColor: confianza === 'alta' ? '#0a3a2a' : confianza === 'media' ? '#1a3a1a' : '#3a2a0a',
              border: `1px solid ${confianza === 'alta' ? '#10B981' : confianza === 'media' ? '#F59E0B' : '#F59E0B'}`,
              borderRadius: 10, padding: '10px 14px',
            }}>
              <Check size={18} color={confianza === 'alta' ? '#10B981' : '#F59E0B'} />
              <p style={{ color: confianza === 'alta' ? '#10B981' : '#F59E0B', fontSize: 13, fontWeight: 600 }}>
                Boleto leido (confianza {confianza || 'media'}). Revisa y corrige si es necesario.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <span style={labelStyle}>Loteria o juego {!datos.loteria && '(no detectado)'}</span>
                <input type="text" value={datos.loteria} onChange={e => setDatos({ ...datos, loteria: e.target.value })} style={inputStyle} placeholder="Ej: Loteria de Bogota" />
              </div>
              <div>
                <span style={labelStyle}>Numero {!datos.numero && '(no detectado, ingresalo)'}</span>
                <input type="text" maxLength={4} value={datos.numero} onChange={e => setDatos({ ...datos, numero: e.target.value })} style={inputStyle} placeholder="0000" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <span style={labelStyle}>Serie</span>
                  <input type="text" value={datos.serie} onChange={e => setDatos({ ...datos, serie: e.target.value })} style={inputStyle} placeholder="A00" />
                </div>
                <div>
                  <span style={labelStyle}>Fraccion</span>
                  <input type="text" value={datos.fraccion} onChange={e => setDatos({ ...datos, fraccion: e.target.value })} style={inputStyle} placeholder="1" />
                </div>
              </div>
              <div>
                <span style={labelStyle}>Valor de la apuesta</span>
                <input type="text" value={datos.valorApuesta} onChange={e => setDatos({ ...datos, valorApuesta: e.target.value })} style={inputStyle} placeholder="$2.000" />
              </div>
              <div>
                <span style={labelStyle}>Fecha del sorteo</span>
                <input type="date" value={datos.fechaSorteo} onChange={e => setDatos({ ...datos, fechaSorteo: e.target.value })} style={{ ...inputStyle, colorScheme: 'dark' }} />
              </div>
              {datos.signo && (
                <div>
                  <span style={labelStyle}>Signo zodiacal</span>
                  <input type="text" value={datos.signo} onChange={e => setDatos({ ...datos, signo: e.target.value })} style={inputStyle} />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={reintentar} style={{ flex: 1, backgroundColor: 'transparent', border: '1px solid #0d5a9f', borderRadius: 10, padding: '13px', color: '#90CAF9', fontSize: 14, cursor: 'pointer' }}>
                Tomar otra foto
              </button>
              <button onClick={confirmar} disabled={!datos.numero} style={{ flex: 1, backgroundColor: '#F59E0B', border: 'none', borderRadius: 10, padding: '13px', color: '#000', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: !datos.numero ? 0.4 : 1 }}>
                Usar estos datos
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}