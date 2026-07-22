export async function verificarBoletoContraResultados({ loteria, numero, serie, fechaSorteo, tipoJuego, numeroDigits, resultadosReales, planPremios }) {
  if (!fechaSorteo) {
    return { resultado: 'pendiente', premio: null, detalle: { motivo: 'sin_fecha' } };
  }

  const numIngresado = numero.padStart(numeroDigits || 4, '0');
  const serieIngresada = (serie || '').toUpperCase();

  try {
    const resHist = await fetch(`/api/sorteos-historico?loteria=${encodeURIComponent(loteria)}&fecha=${fechaSorteo}`);
    const dataHist = await resHist.json();

    if (dataHist.sorteo) {
      return evaluar(dataHist.sorteo, numIngresado, serieIngresada, tipoJuego, true, planPremios);
    }

    const sorteo = resultadosReales.find(r => r.loteria === loteria);
    if (!sorteo) {
      return { resultado: 'pendiente', premio: null, detalle: { motivo: 'sin_resultado_aun' } };
    }

    if (sorteo.fecha === fechaSorteo) {
      return evaluar(sorteo, numIngresado, serieIngresada, tipoJuego, false, planPremios);
    }

    return { resultado: 'pendiente', premio: null, detalle: { motivo: 'sorteo_futuro' } };
  } catch (e) {
    console.error('Error verificando boleto:', e);
    return { resultado: 'pendiente', premio: null, detalle: { motivo: 'error' } };
  }
}

function evaluar(sorteo, numIngresado, serieIngresada, tipoJuego, esHistorico, planPremios) {
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

  // ─── LOTERÍA: usar premios_json (nuevo) o fallback a secos (legacy) ───

  // Si hay premios_json estructurados, usar esos
  if (sorteo.premios_json && Array.isArray(sorteo.premios_json) && sorteo.premios_json.length > 0) {
    return evaluarConPremiosJson(sorteo, numIngresado, serieIngresada, esHistorico);
  }

  // Fallback: usar plan_premios + secos (legacy)
  return evaluarLegacy(sorteo, numIngresado, serieIngresada, esHistorico, planPremios);
}

// ─── NUEVA EVALUACIÓN CON premios_json ───────────────────────────────
function evaluarConPremiosJson(sorteo, numIngresado, serieIngresada, esHistorico) {
  const premios = sorteo.premios_json;

  // 1. Premio Mayor (tipo === 'mayor')
  const tierMayor = premios.find(p => p.tipo === 'mayor');
  if (tierMayor) {
    for (const g of (tierMayor.ganadores || [])) {
      if (numIngresado === g.numero && serieIngresada === (g.serie || '')) {
        return { resultado: 'ganador', premio: g.premio || tierMayor.premio, detalle: { tipo: 'mayor', tier: tierMayor.nombre, sorteo, esHistorico } };
      }
    }
  }

  // 2. Aproximaciones (tipo === 'aproximacion')
  const tiersAprox = premios.filter(p => p.tipo === 'aproximacion');
  for (const tier of tiersAprox) {
    for (const g of (tier.ganadores || [])) {
      if (numIngresado === g.numero) {
        // Si el tier requiere misma serie, verificar
        if (tier.comparar_serie && serieIngresada !== (g.serie || '')) continue;
        return { resultado: 'ganador', premio: g.premio || tier.premio, detalle: { tipo: 'aproximacion', nombre: tier.nombre, sorteo, esHistorico } };
      }
    }
  }

  // 3. Secos (tipo === 'seco')
  const tiersSecos = premios.filter(p => p.tipo === 'seco');
  for (const tier of tiersSecos) {
    for (const g of (tier.ganadores || [])) {
      if (numIngresado === g.numero) {
        return { resultado: 'ganador', premio: g.premio || tier.premio, detalle: { tipo: 'seco', nombre: tier.nombre, sorteo, esHistorico } };
      }
    }
  }

  // 4. Especiales
  const tiersEspeciales = premios.filter(p => p.tipo === 'especial');
  for (const tier of tiersEspeciales) {
    for (const g of (tier.ganadores || [])) {
      if (numIngresado === g.numero) {
        return { resultado: 'ganador', premio: g.premio || tier.premio, detalle: { tipo: 'especial', nombre: tier.nombre, sorteo, esHistorico } };
      }
    }
  }

  return { resultado: 'perdedor', premio: null, detalle: { tipo: 'nada', sorteo, esHistorico } };
}

// ─── LEGACY: evaluación con secos + plan_premios ────────────────────
function evaluarLegacy(sorteo, numIngresado, serieIngresada, esHistorico, planPremios) {
  // Premio mayor
  if (numIngresado === sorteo.numero && (!sorteo.serie || serieIngresada === sorteo.serie)) {
    const premioMayor = buscarPremioPlan(planPremios, { posicion: 1 }) || sorteo.premio;
    return { resultado: 'ganador', premio: premioMayor, detalle: { tipo: 'mayor', sorteo, esHistorico } };
  }
  if (numIngresado === sorteo.numero) {
    const premioMayorSinSerie = buscarPremioPlan(planPremios, { posicion: 1, sinSerie: true }) || sorteo.premio;
    return { resultado: 'ganador', premio: premioMayorSinSerie, detalle: { tipo: 'mayor_sin_serie', sorteo, esHistorico } };
  }

  // Secos
  const secos = sorteo.secos || [];
  if (Array.isArray(planPremios) && planPremios.length > 0) {
    const tiers = planPremios
      .filter(p => p.cifras && p.cifras >= 1)
      .sort((a, b) => b.cifras - a.cifras);
    for (const tier of tiers) {
      const sufijo = numIngresado.slice(-tier.cifras);
      if (secos.includes(sufijo)) {
        return { resultado: 'ganador', premio: tier.premio || '$0', detalle: { tipo: `seco_${tier.cifras}`, sorteo, esHistorico, planPremio: tier } };
      }
    }
  } else {
    if (secos.includes(numIngresado.slice(-3))) return { resultado: 'ganador', premio: '$75.000', detalle: { tipo: 'seco_3', sorteo, esHistorico } };
    if (secos.includes(numIngresado.slice(-2))) return { resultado: 'ganador', premio: '$25.000', detalle: { tipo: 'seco_2', sorteo, esHistorico } };
    if (secos.includes(numIngresado.slice(-1))) return { resultado: 'ganador', premio: '$3.000', detalle: { tipo: 'seco_1', sorteo, esHistorico } };
  }

  return { resultado: 'perdedor', premio: null, detalle: { tipo: 'nada', sorteo, esHistorico } };
}

// Busca el premio en plan_premios segun posicion. sinSerie=true busca un tier
// marcado como "sin serie" (descripcion contenga "sin serie"), sino el de posicion 1.
function buscarPremioPlan(planPremios, { posicion, sinSerie = false }) {
  if (!Array.isArray(planPremios) || planPremios.length === 0) return null;
  if (sinSerie) {
    const tier = planPremios.find(p => (p.descripcion || '').toLowerCase().includes('sin serie'));
    if (tier) return tier.premio || null;
  }
  const tier = planPremios.find(p => parseInt(p.posicion) === posicion);
  return tier ? (tier.premio || null) : null;
}