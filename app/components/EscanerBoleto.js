'use client';
import { useState, useRef, useEffect } from 'react';
import { Camera, X, RefreshCw, AlertCircle, Image as ImageIcon } from 'lucide-react';

export default function EscanerBoleto({ onBoletosDetectados, onCerrar }) {
  const [fase, setFase] = useState('camara'); // camara | procesando | error
  const [errorMsg, setErrorMsg] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  const COLOR_FONDO = '#0B1F3A';
  const COLOR_CARD = '#142A4A';
  const COLOR_BORDE = '#1A3A5F';
  const COLOR_ACENTO = '#FFD700';
  const COLOR_TEXTO_SEC = '#8FB3E0';

  useEffect(() => {
    if (fase !== 'camara') return;
    iniciarCamara();
    return () => detenerCamara();
  }, [fase]);

  async function iniciarCamara() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1600 }, height: { ideal: 1200 } },
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
    }, 'image/jpeg', 0.92);
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

        const normalizados = data.boletos.map(b => ({
          loteria: b.loteria || '',
          numero: b.numero || '',
          serie: b.serie || '',
          fraccion: b.fraccion || '',
          valorApuesta: b.valorApuesta || '',
          fechaSorteo: b.fechaSorteo || '',
          signo: b.signo || '',
          confianza: b.confianza || 'media',
        }));

        onBoletosDetectados(normalizados);
        onCerrar();
      } catch (err) {
        console.error(err);
        setErrorMsg('Error de conexion al procesar la imagen.');
        setFase('error');
      }
    };
    reader.readAsDataURL(blob);
  }

  function reintentar() {
    setErrorMsg('');
    setPreviewUrl(null);
    setFase('camara');
  }

  const overlay = { position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 };
  const contenedor = { width: '100%', maxWidth: 480, maxHeight: '92vh', overflowY: 'auto', backgroundColor: COLOR_FONDO, borderRadius: 20, border: `1px solid ${COLOR_BORDE}` };
  const header = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${COLOR_BORDE}`, position: 'sticky', top: 0, backgroundColor: COLOR_FONDO, zIndex: 10 };

  return (
    <div style={overlay}>
      <div style={contenedor}>
        <div style={header}>
          <p style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Escanear boleto con IA</p>
          <button onClick={() => { detenerCamara(); onCerrar(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLOR_TEXTO_SEC }}>
            <X size={20} />
          </button>
        </div>

        {fase === 'camara' && (
          <div>
            <div style={{ position: 'relative', backgroundColor: '#000', aspectRatio: '4/3' }}>
              <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: '6%', border: `2px dashed ${COLOR_ACENTO}`, borderRadius: 12 }} />
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <div style={{ padding: 20 }}>
              <p style={{ color: COLOR_TEXTO_SEC, fontSize: 13, textAlign: 'center', marginBottom: 4 }}>
                Puedes encuadrar uno o varios boletos en la misma foto
              </p>
              <p style={{ color: '#5C7CA3', fontSize: 11, textAlign: 'center', marginBottom: 16 }}>
                Con buena luz y boletos bien separados se leen mejor
              </p>
              <button onClick={capturarFoto} style={{ width: '100%', backgroundColor: COLOR_ACENTO, border: 'none', borderRadius: 12, padding: '15px', color: '#1A1500', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
                <Camera size={18} /> Tomar foto
              </button>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'transparent', border: `1px solid ${COLOR_BORDE}`, borderRadius: 12, padding: '13px', color: COLOR_TEXTO_SEC, fontSize: 14, cursor: 'pointer', position: 'relative' }}>
                <ImageIcon size={16} /> Elegir de la galeria
                <input type="file" accept="image/*" onChange={handleArchivoSeleccionado} style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }} />
              </label>
            </div>
          </div>
        )}

        {fase === 'procesando' && (
          <div style={{ padding: 50, textAlign: 'center' }}>
            {previewUrl && (
              <img src={previewUrl} alt="Boletos capturados" style={{ width: '100%', maxHeight: 220, objectFit: 'contain', borderRadius: 12, marginBottom: 20, opacity: 0.6 }} />
            )}
            <RefreshCw size={28} color={COLOR_ACENTO} style={{ animation: 'spin 1s linear infinite', marginBottom: 14 }} />
            <p style={{ color: COLOR_TEXTO_SEC, fontSize: 14 }}>Leyendo boletos con inteligencia artificial...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {fase === 'error' && (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <AlertCircle size={32} color="#ff6b6b" style={{ marginBottom: 16 }} />
            <p style={{ color: '#ff6b6b', fontSize: 14, marginBottom: 20 }}>{errorMsg}</p>
            <button onClick={reintentar} style={{ backgroundColor: COLOR_ACENTO, border: 'none', borderRadius: 10, padding: '12px 28px', color: '#1A1500', fontWeight: 700, cursor: 'pointer' }}>
              Intentar de nuevo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}