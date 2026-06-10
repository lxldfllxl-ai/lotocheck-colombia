'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, X, RotateCcw, Check } from 'lucide-react';

export default function EscanerBoleto({ onResultado, onCerrar }) {
  const [fase, setFase] = useState('camara');
  const [imagenPreview, setImagenPreview] = useState(null);
  const [textoDetectado, setTextoDetectado] = useState({
    numero: '',
    serie: ''
  });
  const [progreso, setProgreso] = useState(0);
  const [esMovil, setEsMovil] = useState(false);

  const inputRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setEsMovil(/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent));
    }
  }, []);

  async function procesarImagen(file) {
    setFase('procesando');
    setProgreso(0);

    try {
      const { createWorker } = await import('tesseract.js');

      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgreso(Math.round(m.progress * 100));
          }
        }
      });

      await worker.setParameters({
        tessedit_char_whitelist:
          '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz- ',
        tessedit_pageseg_mode: '6'
      });

      const {
        data: { text }
      } = await worker.recognize(file);

      await worker.terminate();

      const resultado = extraerDatosBoleto(text);

      setTextoDetectado(resultado);
      setFase('resultado');
    } catch (err) {
      console.error('Error OCR:', err);
      setFase('error');
    }
  }

  function extraerDatosBoleto(texto) {
    console.log('Texto detectado:', texto);

    const lineas = texto
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    let numero = '';
    let serie = '';

    for (const linea of lineas) {
      const matchJunto = linea.match(
        /(\d{4})[\s\-]+([A-Z]{1,2}\d{2,3})/i
      );

      if (matchJunto) {
        numero = matchJunto[1];
        serie = matchJunto[2].toUpperCase();
        break;
      }

      const matchNumero = linea.match(/\b(\d{4})\b/);

      if (matchNumero && !numero) {
        numero = matchNumero[1];
      }

      const matchSerie = linea.match(/\b([A-Z]{1,2}\d{2,3})\b/i);

      if (matchSerie && !serie) {
        serie = matchSerie[1].toUpperCase();
      }
    }

    return { numero, serie };
  }

  function handleArchivo(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    const url = URL.createObjectURL(file);

    setImagenPreview(url);

    procesarImagen(file);
  }

  function reintentar() {
    setFase('camara');
    setImagenPreview(null);
    setTextoDetectado({
      numero: '',
      serie: ''
    });
    setProgreso(0);
  }

  function confirmar() {
    onResultado(textoDetectado);
    onCerrar();
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0,0,0,0.95)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid #1E1E1E'
        }}
      >
        <p
          style={{
            color: '#fff',
            fontWeight: 700,
            fontSize: 16
          }}
        >
          Escanear boleto
        </p>

        <button
          onClick={onCerrar}
          style={{
            background: '#1A1A1A',
            border: '1px solid #2A2A2A',
            borderRadius: 8,
            padding: '6px 12px',
            color: '#888',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13
          }}
        >
          <X size={14} />
          Cerrar
        </button>
      </div>

      {/* Contenido */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          gap: 24
        }}
      >
        {/* CAMARA */}
        {fase === 'camara' && (
          <>
            <div
              style={{
                textAlign: 'center',
                marginBottom: 8
              }}
            >
              <p
                style={{
                  color: '#E0E0E0',
                  fontSize: 16,
                  fontWeight: 600,
                  marginBottom: 8
                }}
              >
                {esMovil
                  ? 'Toma una foto del boleto'
                  : 'Sube una imagen del boleto'}
              </p>

              <p
                style={{
                  color: '#555',
                  fontSize: 13
                }}
              >
                Enfoca el número y la serie claramente
              </p>
            </div>

            <div
              style={{
                position: 'relative',
                width: 280,
                height: 160,
                border: '2px dashed #C41230',
                borderRadius: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#1A0000'
              }}
            >
              <div
                style={{
                  textAlign: 'center'
                }}
              >
                <Camera
                  size={36}
                  color="#C41230"
                  style={{ marginBottom: 8 }}
                />

                <p
                  style={{
                    color: '#555',
                    fontSize: 12
                  }}
                >
                  Número y serie aquí
                </p>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                width: '100%',
                maxWidth: 320
              }}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleArchivo}
                style={{
                  position: 'absolute',
                  opacity: 0,
                  width: 1,
                  height: 1,
                  pointerEvents: 'none'
                }}
              />

              <button
                onClick={() => inputRef.current?.click()}
                style={{
                  width: '100%',
                  backgroundColor: '#C41230',
                  border: 'none',
                  borderRadius: 12,
                  padding: '16px',
                  fontSize: 15,
                  fontWeight: 700,
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  boxShadow: '0 4px 24px rgba(196,18,48,0.4)'
                }}
              >
                <Camera size={22} />

                {esMovil
                  ? 'Tomar foto'
                  : 'Subir imagen del boleto'}
              </button>

              {esMovil && (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleArchivo}
                    id="galeria-input"
                    style={{ display: 'none' }}
                  />

                  <button
                    onClick={() =>
                      document.getElementById('galeria-input').click()
                    }
                    style={{
                      width: '100%',
                      backgroundColor: 'transparent',
                      border: '1.5px solid #2A2A2A',
                      borderRadius: 12,
                      padding: '14px',
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#888',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 10
                    }}
                  >
                    Elegir de galería
                  </button>
                </>
              )}
            </div>

            <div
              style={{
                backgroundColor: '#1A1A1A',
                border: '1px solid #2A2A2A',
                borderRadius: 12,
                padding: '12px 16px',
                maxWidth: 320,
                width: '100%'
              }}
            >
              <p
                style={{
                  color: '#555',
                  fontSize: 12,
                  lineHeight: 1.6
                }}
              >
                💡 <strong style={{ color: '#888' }}>Consejos:</strong>{' '}
                Buena iluminación, fondo contrastante, enfoca bien el
                número.
              </p>
            </div>
          </>
        )}

        {/* PROCESANDO */}
        {fase === 'procesando' && (
          <div
            style={{
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 24
            }}
          >
            {imagenPreview && (
              <img
                src={imagenPreview}
                alt="Boleto"
                style={{
                  maxWidth: 300,
                  maxHeight: 200,
                  borderRadius: 12,
                  objectFit: 'contain',
                  border: '1px solid #2A2A2A'
                }}
              />
            )}

            <div>
              <p
                style={{
                  color: '#E0E0E0',
                  fontSize: 16,
                  fontWeight: 600,
                  marginBottom: 8
                }}
              >
                Leyendo boleto...
              </p>

              <p
                style={{
                  color: '#555',
                  fontSize: 13
                }}
              >
                Analizando imagen con OCR
              </p>
            </div>

            <div
              style={{
                width: 280,
                backgroundColor: '#1A1A1A',
                borderRadius: 999,
                height: 6,
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  height: '100%',
                  backgroundColor: '#C41230',
                  borderRadius: 999,
                  width: `${progreso}%`,
                  transition: 'width 0.3s ease'
                }}
              />
            </div>

            <p
              style={{
                color: '#555',
                fontSize: 13
              }}
            >
              {progreso}%
            </p>
          </div>
        )}

        {/* RESULTADO */}
        {fase === 'resultado' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 20,
              width: '100%',
              maxWidth: 360
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: 10,
                width: '100%'
              }}
            >
              <button
                onClick={reintentar}
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  border: '1.5px solid #2A2A2A',
                  borderRadius: 12,
                  padding: '13px',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#888',
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={16} />
                Reintentar
              </button>

              <button
                onClick={confirmar}
                disabled={!textoDetectado.numero}
                style={{
                  flex: 1,
                  backgroundColor: textoDetectado.numero
                    ? '#C41230'
                    : '#2A2A2A',
                  border: 'none',
                  borderRadius: 12,
                  padding: '13px',
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#fff',
                  cursor: textoDetectado.numero
                    ? 'pointer'
                    : 'not-allowed'
                }}
              >
                <Check size={16} />
                Usar estos datos
              </button>
            </div>
          </div>
        )}

        {/* ERROR */}
        {fase === 'error' && (
          <div
            style={{
              textAlign: 'center'
            }}
          >
            <p
              style={{
                color: '#fff',
                marginBottom: 16
              }}
            >
              Error al procesar imagen
            </p>

            <button
              onClick={reintentar}
              style={{
                backgroundColor: '#C41230',
                border: 'none',
                borderRadius: 12,
                padding: '13px 32px',
                fontSize: 14,
                fontWeight: 700,
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              Intentar de nuevo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}