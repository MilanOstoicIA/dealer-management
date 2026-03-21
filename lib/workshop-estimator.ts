// ─── Estimador de tiempos y costes de taller ─────────────────────────────────
//
// Proporciona tiempos estándar y costes estimados para servicios de taller.
// Basado en tiempos medios del mercado español para coches usados.
//
// En el futuro, cuando se integre GT Motive o Audatex, estos tiempos
// se sustituirán por los datos reales de sus bases de datos.

export interface WorkshopEstimate {
  serviceType: string
  description: string
  estimatedHours: number     // horas de mano de obra
  laborCost: number          // coste mano de obra (EUR)
  partsCostMin: number       // coste mínimo piezas (EUR)
  partsCostMax: number       // coste máximo piezas (EUR)
  totalMin: number           // coste total mínimo
  totalMax: number           // coste total máximo
  notes?: string
}

export interface WorkshopRates {
  laborRatePerHour: number   // €/hora mano de obra
  ivaRate: number            // IVA (21%)
}

/** Tarifas por defecto de un taller medio en España */
export const DEFAULT_RATES: WorkshopRates = {
  laborRatePerHour: 45,      // 40-55€/hora es rango típico
  ivaRate: 21,
}

/** Tipos de servicio estándar con tiempos medios */
const SERVICE_CATALOG: Record<string, {
  description: string
  hours: number
  partsMin: number
  partsMax: number
  notes?: string
}> = {
  // ── Mantenimiento básico ──
  cambio_aceite: {
    description: "Cambio de aceite y filtro",
    hours: 0.5,
    partsMin: 25,
    partsMax: 60,
    notes: "Incluye aceite 5W30/5W40 + filtro. Sintético +15€",
  },
  revision_basica: {
    description: "Revisión básica (aceite, filtros, niveles)",
    hours: 1.5,
    partsMin: 60,
    partsMax: 150,
    notes: "Aceite + filtro aceite + filtro aire + filtro habitáculo + revisión niveles",
  },
  revision_completa: {
    description: "Revisión completa (mantenimiento mayor)",
    hours: 3,
    partsMin: 150,
    partsMax: 400,
    notes: "Incluye todos los filtros, bujías, líquidos, correa si procede",
  },
  // ── Frenos ──
  pastillas_freno: {
    description: "Cambio de pastillas de freno (eje)",
    hours: 1,
    partsMin: 30,
    partsMax: 80,
  },
  discos_pastillas: {
    description: "Cambio de discos + pastillas (eje)",
    hours: 1.5,
    partsMin: 80,
    partsMax: 200,
  },
  liquido_frenos: {
    description: "Cambio líquido de frenos",
    hours: 0.5,
    partsMin: 10,
    partsMax: 25,
  },
  // ── Neumáticos ──
  cambio_neumaticos: {
    description: "Cambio de 4 neumáticos + equilibrado",
    hours: 1,
    partsMin: 160,
    partsMax: 600,
    notes: "Precio varía según marca y medida. Rango: budget a premium",
  },
  alineacion: {
    description: "Alineación de dirección",
    hours: 0.5,
    partsMin: 0,
    partsMax: 0,
  },
  // ── Motor ──
  correa_distribucion: {
    description: "Cambio kit distribución + bomba agua",
    hours: 4,
    partsMin: 150,
    partsMax: 400,
    notes: "Servicio crítico. Intervalo: 80.000-120.000 km según fabricante",
  },
  correa_accesorios: {
    description: "Cambio correa de accesorios",
    hours: 1,
    partsMin: 20,
    partsMax: 60,
  },
  bujias: {
    description: "Cambio de bujías (4 cilindros)",
    hours: 0.5,
    partsMin: 15,
    partsMax: 50,
  },
  embrague: {
    description: "Cambio kit de embrague",
    hours: 5,
    partsMin: 200,
    partsMax: 500,
    notes: "Incluye disco, prensa y collarín. Volante bimasa aparte (+300-600€)",
  },
  // ── Suspensión ──
  amortiguadores: {
    description: "Cambio amortiguadores (eje)",
    hours: 2,
    partsMin: 80,
    partsMax: 250,
  },
  rotula_brazo: {
    description: "Cambio rótula / brazo de suspensión",
    hours: 1.5,
    partsMin: 30,
    partsMax: 120,
  },
  // ── Electricidad ──
  bateria: {
    description: "Cambio de batería",
    hours: 0.5,
    partsMin: 60,
    partsMax: 180,
  },
  alternador: {
    description: "Cambio / reparación alternador",
    hours: 2,
    partsMin: 100,
    partsMax: 300,
  },
  motor_arranque: {
    description: "Cambio motor de arranque",
    hours: 1.5,
    partsMin: 80,
    partsMax: 250,
  },
  // ── Climatización ──
  carga_ac: {
    description: "Carga de aire acondicionado",
    hours: 0.5,
    partsMin: 20,
    partsMax: 50,
  },
  compresor_ac: {
    description: "Cambio compresor A/C",
    hours: 3,
    partsMin: 200,
    partsMax: 500,
  },
  // ── ITV ──
  pre_itv: {
    description: "Pre-ITV (revisión + ajustes para pasar ITV)",
    hours: 1.5,
    partsMin: 0,
    partsMax: 100,
    notes: "Incluye revisión de luces, frenos, emisiones, holguras. Piezas si procede.",
  },
  // ── Diagnosis ──
  diagnosis: {
    description: "Diagnóstico electrónico completo",
    hours: 1,
    partsMin: 0,
    partsMax: 0,
    notes: "Lectura de centralitas, borrado de errores, informe",
  },
}

/**
 * Genera una estimación de coste para un servicio
 */
export function estimateService(
  serviceKey: string,
  rates: WorkshopRates = DEFAULT_RATES
): WorkshopEstimate | null {
  const service = SERVICE_CATALOG[serviceKey]
  if (!service) return null

  const laborCost = round2(service.hours * rates.laborRatePerHour)
  const totalMin = round2(laborCost + service.partsMin)
  const totalMax = round2(laborCost + service.partsMax)

  return {
    serviceType: serviceKey,
    description: service.description,
    estimatedHours: service.hours,
    laborCost,
    partsCostMin: service.partsMin,
    partsCostMax: service.partsMax,
    totalMin,
    totalMax,
    notes: service.notes,
  }
}

/**
 * Genera estimación para múltiples servicios (presupuesto combinado)
 */
export function estimateMultipleServices(
  serviceKeys: string[],
  rates: WorkshopRates = DEFAULT_RATES
): { estimates: WorkshopEstimate[]; totalMin: number; totalMax: number; totalHours: number } {
  const estimates = serviceKeys
    .map((key) => estimateService(key, rates))
    .filter((e): e is WorkshopEstimate => e !== null)

  const totalMin = round2(estimates.reduce((sum, e) => sum + e.totalMin, 0))
  const totalMax = round2(estimates.reduce((sum, e) => sum + e.totalMax, 0))
  const totalHours = estimates.reduce((sum, e) => sum + e.estimatedHours, 0)

  return { estimates, totalMin, totalMax, totalHours }
}

/**
 * Lista todos los servicios disponibles (para selector UI)
 */
export function getServiceCatalog(): { key: string; description: string; category: string }[] {
  const categories: Record<string, string[]> = {
    "Mantenimiento": ["cambio_aceite", "revision_basica", "revision_completa"],
    "Frenos": ["pastillas_freno", "discos_pastillas", "liquido_frenos"],
    "Neumáticos": ["cambio_neumaticos", "alineacion"],
    "Motor": ["correa_distribucion", "correa_accesorios", "bujias", "embrague"],
    "Suspensión": ["amortiguadores", "rotula_brazo"],
    "Electricidad": ["bateria", "alternador", "motor_arranque"],
    "Climatización": ["carga_ac", "compresor_ac"],
    "Otros": ["pre_itv", "diagnosis"],
  }

  const result: { key: string; description: string; category: string }[] = []
  for (const [category, keys] of Object.entries(categories)) {
    for (const key of keys) {
      const service = SERVICE_CATALOG[key]
      if (service) {
        result.push({ key, description: service.description, category })
      }
    }
  }
  return result
}

/**
 * Aplica IVA al total estimado
 */
export function applyIVA(amount: number, rate: number = 21): { sinIva: number; iva: number; conIva: number } {
  return {
    sinIva: round2(amount),
    iva: round2(amount * (rate / 100)),
    conIva: round2(amount * (1 + rate / 100)),
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
