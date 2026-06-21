export async function verificarBoletoContraResultados({ loteria, numero, serie, fechaSorteo, tipoJuego, numeroDigits, resultadosReales }) {
  if (!fechaSorteo) {
    return { resultado: 'pendiente', premio: null, detalle: { motivo: 'sin_fecha' } };
  }

  const numIngresado = numero.padStart(numeroDigits || 4, '0');
  const serieIngresada = (serie || '').toUpperCase();

  try {
    const resHist = await fetch(`/api/sorteos-historico?loteria=${encodeURIComponent(loteria)}&fecha=${fechaSorteo}`);
    const dataHist = await resHist.json();

    if (dataHist.sorteo) {
      return evaluar(dataHist.sorteo, numIngresado, serieIngresada, tipoJuego, true);
    }

    const sorteo = resultadosReales.find(r => r.loteria === loteria);
    if (!sorteo) {
      return { resultado: 'pendiente', premio: null, detalle: { motivo: 'sin_resultado_aun' } };
    }

    if (sorteo.fecha === fechaSorteo) {
      return evaluar(sorteo, numIngresado, serieIngresada, tipoJuego, false);
    }

    return { resultado: 'pendiente', premio: null, detalle: { motivo: 'sorteo_futuro' } };
  } catch (e) {
    console.error('Error verificando boleto:', e);
    return { resultado: 'pendiente', premio: null, detalle: { motivo: 'error' } };
  }
}

function evaluar(sorteo, numIngresado, serieIngresada, tipoJuego, esHistorico) {
  if (tipoJuego === 'astro') {
    if (numIngresado === sorteo.numero) {
      return { resultado: 'ganador', premio: sorteo.premio, detalle: { tipo: 'mayor', sorteo, esHistorico } };
    }
    return { resultado: 'perdedor', premio: null, detalle: { tipo: 'nada', sorteo, esHistorico } };
  }

  if (tipoJuego === 'chance' || tipoJuego === 'quinta' || tipoJuego === 'chance_millonario') {
    if (numIngresado === sorteo.numero) {
      return { resultado: 'ganador', premio: sorteo.premio, detalle: { tipo: 'mayor', sorteo, esHistorico } };
    }
    return { resultado: 'perdedor', premio: null, detalle: { tipo: 'nada', sorteo, esHistorico } };
  }

  if (numIngresado === sorteo.numero && (!sorteo.serie || serieIngresada === sorteo.serie)) {
    return { resultado: 'ganador', premio: sorteo.premio, detalle: { tipo: 'mayor', sorteo, esHistorico } };
  }
  if (numIngresado === sorteo.numero) {
    return { resultado: 'ganador', premio: sorteo.premio, detalle: { tipo: 'mayor_sin_serie', sorteo, esHistorico } };
  }
  const secos = sorteo.secos || [];
  if (secos.includes(numIngresado.slice(-3))) return { resultado: 'ganador', premio: '$75.000', detalle: { tipo: 'seco_3', sorteo, esHistorico } };
  if (secos.includes(numIngresado.slice(-2))) return { resultado: 'ganador', premio: '$25.000', detalle: { tipo: 'seco_2', sorteo, esHistorico } };
  if (secos.includes(numIngresado.slice(-1))) return { resultado: 'ganador', premio: '$3.000', detalle: { tipo: 'seco_1', sorteo, esHistorico } };

  return { resultado: 'perdedor', premio: null, detalle: { tipo: 'nada', sorteo, esHistorico } };
}