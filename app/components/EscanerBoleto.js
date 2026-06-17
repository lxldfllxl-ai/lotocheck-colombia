'use client';
import { useState, useEffect, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { Camera, X, RefreshCw, Check, AlertCircle } from 'lucide-react';

// Intenta extraer numero, serie y fraccion de un texto crudo de codigo de barras/QR.
// Como no hay un estandar unico entre operadores, probamos varios patrones comunes.
function parsearCodigo(texto) {
  const limpio = texto.trim();
  const resultado = { numero: '', serie: '', fraccion: '', valorApuesta: '', crudo: limpio };

  // Patron 1: JSON (algunos QR de chance digital traen JSON)
  try {
    const json = JSON.parse(limpio);
    if (json.numero) resultado.numero = String(json.numero);
    if (json.serie) resultado.serie = String(json.serie);
    if (json.fraccion) resultado.fraccion = String(json.fraccion);
    if (json.valor || json.apuesta) resultado.valorApuesta = String(json.valor || json.apuesta);
    return resultado;
  } catch { /* no es JSON, seguimos */ }

  // Patron 2: separado por guiones o pipes, ej "4821-B34-05" o "4821|B34|05"
  const separadoPorGuionOPipe = limpio.split(/[-|]/).map(s => s.trim()).filter(Boolean);
  if (separadoPorGuionOPipe.length >= 2) {
    resultado.numero = separadoPorGuionOPipe[0];
    resultado.serie = separadoPorGuionOPipe[1] || '';
    resultado.fraccion = separadoPorGuionOPipe[2] || '';
    return resultado;
  }

  // Patron 3: solo digitos largos (codigo de barras numerico tipo Code128)
  // Asumimos: primeros 4 = numero, siguientes 2-3 = serie, ultimo 1-2 = fraccion
  if (/^\d+$/.test(limpio)) {
    if (limpio.length >= 9) {
      resultado.numero = limpio.slice(0, 4);
      resultado.serie = limpio.slice(4, 7);
      resultado.fraccion = limpio.slice(7);
    } else if (limpio.length >= 4) {
      resultado.numero = limpio.slice(0, 4);
      resultado.serie = limpio.slice(4);
    } else {
      resultado.numero = limpio;
    }
    return resultado;
  }

  // No se pudo interpretar con ningun patron conocido: dejamos el numero vacio
  // para que el usuario complete todo manualmente, pero guardamos el texto crudo
  return resultado;
}

export default function EscanerBoleto({ onResultado, onCerrar }) {
  const [esMobile, setEsMobile] = useState(false);
  const [fase, setFase] = useState('camara'); // camara | procesando | resultado | error
  const [datos, setDatos] = useState({ numero: '', serie: '', fraccion: '', valorApuesta: '' });
  const [textoCrudo, setTextoCrudo] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const videoRef = useRef(null);
  const readerRef = useRef(null);

  useEffect(() => {
    setEsMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    if (fase !== 'camara') return;

    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    reader.decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
      if (result) {
        const texto = result.getText();
        manejarDeteccion(texto);
      }
      // err se dispara constantemente mientras no encuentra nada; lo ignoramos.
    }).catch((err) => {
      console.error('Error iniciando camara:', err);
      setErrorMsg('No se pudo acceder a la camara. Verifica los permisos.');
      setFase('error');
    });

    return () => {
      try { reader.reset(); } catch {}
    };
  }, [fase]);

  function manejarDeteccion(texto) {
    setFase('procesando');
    try { readerRef.current?.reset(); } catch {}

    setTextoCrudo(texto);
    const parseado = parsearCodigo(texto);
    setDatos({
      numero: parseado.numero,
      serie: parseado.serie,
      fraccion: parseado.fraccion,
      valorApuesta: parseado.valorApuesta,
    });
    setFase('resultado');
  }

  function reintentar() {
    setDatos({ numero: '', serie: '', fraccion: '', valorApuesta: '' });
    setTextoCrudo('');
    setErrorMsg('');
    setFase('camara');
  }

  function confirmar() {
    onResultado(datos);
    onCerrar();
  }

  function handleArchivoSeleccionado(e) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setFase('procesando');

    const reader = new BrowserMultiFormatReader();
    const img = new Image();
    const url = URL.createObjectURL(archivo);
    img.onload = () => {
      reader.decodeFromImage(img)
        .then(result => manejarDeteccion(result.getText()))
        .catch(() => {
          setErrorMsg('No se detecto ningun codigo en la imagen. Intenta con mejor luz o enfoque.');
          setFase('error');
        })
        .finally(() => URL.revokeObjectURL(url));
    };
    img.src = url;
  }

  const overlay = {
    position: 'fixed', inset: 0, zIndex: 9999,
    backgroundColor: 'rgba(0,0,0,0.95)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 16,
  };
  const contenedor = {
    width: '100%', maxWidth: 480,
    backgroundColor: '#064089', borderRadius: 20,
    border: '1px solid #0d5a9f', overflow: 'hidden',
  };
  const header = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px', borderBottom: '1px solid #0d5a9f',
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
          <p style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Escanear codigo de barras o QR</p>
          <button onClick={onCerrar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#90CAF9' }}>
            <X size={20} />
          </button>
        </div>

        {fase === 'camara' && (
          <div>
            <div style={{ position: 'relative', backgroundColor: '#000', aspectRatio: '4/3' }}>
              <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
              <div style={{
                position: 'absolute', inset: '20%',
                border: '2px solid #F59E0B', borderRadius: 12,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)',
              }} />
            </div>
            <div style={{ padding: 20 }}>
              <p style={{ color: '#90CAF9', fontSize: 13, textAlign: 'center', marginBottom: 14 }}>
                Apunta la camara al codigo de barras o QR del boleto
              </p>
              {esMobile && (
                <label style={{
                  display: 'block', textAlign: 'center', backgroundColor: '#0a4a8f',
                  border: '1px solid #0d5a9f', borderRadius: 10, padding: '12px',
                  color: '#64B5F6', fontSize: 13, cursor: 'pointer',
                }}>
                  O selecciona una foto de tu galeria
                  <input type="file" accept="image/*" capture="environment" onChange={handleArchivoSeleccionado} style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }} />
                </label>
              )}
            </div>
          </div>
        )}

        {fase === 'procesando' && (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <RefreshCw size={32} color="#F59E0B" style={{ animation: 'spin 1s linear infinite', marginBottom: 16 }} />
            <p style={{ color: '#90CAF9', fontSize: 14 }}>Leyendo codigo...</p>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, backgroundColor: '#0a3a2a', border: '1px solid #10B981', borderRadius: 10, padding: '10px 14px' }}>
              <Check size={18} color="#10B981" />
              <p style={{ color: '#10B981', fontSize: 13, fontWeight: 600 }}>Codigo detectado. Revisa y completa los datos.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <span style={labelStyle}>Numero {!datos.numero && '(no detectado, ingresalo)'}</span>
                <input type="text" maxLength={4} value={datos.numero} onChange={e => setDatos({ ...datos, numero: e.target.value })} style={inputStyle} placeholder="0000" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <span style={labelStyle}>Serie {!datos.serie && '(opcional)'}</span>
                  <input type="text" value={datos.serie} onChange={e => setDatos({ ...datos, serie: e.target.value })} style={inputStyle} placeholder="A00" />
                </div>
                <div>
                  <span style={labelStyle}>Fraccion {!datos.fraccion && '(opcional)'}</span>
                  <input type="text" value={datos.fraccion} onChange={e => setDatos({ ...datos, fraccion: e.target.value })} style={inputStyle} placeholder="1" />
                </div>
              </div>
              <div>
                <span style={labelStyle}>Valor de la apuesta (si aplica)</span>
                <input type="text" value={datos.valorApuesta} onChange={e => setDatos({ ...datos, valorApuesta: e.target.value })} style={inputStyle} placeholder="$2.000" />
              </div>

              {textoCrudo && (
                <details style={{ marginTop: 4 }}>
                  <summary style={{ color: '#64B5F6', fontSize: 12, cursor: 'pointer' }}>Ver texto crudo detectado</summary>
                  <p style={{ color: '#90CAF9', fontSize: 11, marginTop: 6, wordBreak: 'break-all', backgroundColor: '#0a3a5f', padding: 10, borderRadius: 8 }}>{textoCrudo}</p>
                </details>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={reintentar} style={{ flex: 1, backgroundColor: 'transparent', border: '1px solid #0d5a9f', borderRadius: 10, padding: '13px', color: '#90CAF9', fontSize: 14, cursor: 'pointer' }}>
                Escanear otro
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