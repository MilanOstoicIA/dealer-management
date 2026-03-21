// ─── Utilidades de cálculo fiscal para concesionarios españoles ─────────────
//
// Dos regímenes fiscales:
// 1. IVA General (21%) — se aplica sobre el precio de venta completo
// 2. REBU (Régimen Especial de Bienes Usados, Art. 135-139 LIVA) —
//    el IVA se aplica solo sobre el margen (precio venta - precio compra)
//    Si el margen es ≤ 0, no hay IVA que repercutir.
//    En la factura REBU el cliente ve solo el precio total, sin desglose de IVA.

import type { TaxRegime } from "@/types"

// ─── Resultados tipados ─────────────────────────────────────────────────────

export interface IvaGeneralResult {
  regime: "iva_general"
  subtotal: number      // base imponible (precio sin IVA)
  ivaRate: number       // porcentaje (21)
  ivaAmount: number     // cuota de IVA
  total: number         // precio final con IVA
}

export interface RebuResult {
  regime: "rebu"
  salePrice: number     // precio de venta al público (lo que paga el cliente)
  purchasePrice: number // precio de compra del vehículo
  margin: number        // margen = salePrice - purchasePrice
  taxBase: number       // base imponible del margen (margin / 1.21 si margin > 0)
  ivaAmount: number     // IVA implícito en el margen
  total: number         // = salePrice (el cliente paga esto)
}

export type TaxResult = IvaGeneralResult | RebuResult

// ─── Cálculos ────────────────────────────────────────────────────────────────

/**
 * IVA General: subtotal + 21% = total
 * @param subtotal - Base imponible (precio sin IVA)
 * @param rate - Tipo de IVA (default 21%)
 */
export function calculateIvaGeneral(subtotal: number, rate: number = 21): IvaGeneralResult {
  const ivaAmount = round2(subtotal * (rate / 100))
  return {
    regime: "iva_general",
    subtotal: round2(subtotal),
    ivaRate: rate,
    ivaAmount,
    total: round2(subtotal + ivaAmount),
  }
}

/**
 * REBU: el IVA se calcula solo sobre el margen de beneficio
 * El cliente paga salePrice y no ve desglose de IVA en factura
 * El dealer declara el IVA implícito del margen en el Modelo 303
 *
 * @param salePrice - Precio de venta al público
 * @param purchasePrice - Precio de compra del vehículo
 */
export function calculateRebu(salePrice: number, purchasePrice: number): RebuResult {
  const margin = round2(salePrice - purchasePrice)

  if (margin <= 0) {
    return {
      regime: "rebu",
      salePrice: round2(salePrice),
      purchasePrice: round2(purchasePrice),
      margin,
      taxBase: 0,
      ivaAmount: 0,
      total: round2(salePrice),
    }
  }

  // El margen ya incluye el IVA implícito: taxBase = margin / 1.21
  const taxBase = round2(margin / 1.21)
  const ivaAmount = round2(margin - taxBase)

  return {
    regime: "rebu",
    salePrice: round2(salePrice),
    purchasePrice: round2(purchasePrice),
    margin,
    taxBase,
    ivaAmount,
    total: round2(salePrice),
  }
}

/**
 * Dispatcher: calcula impuestos según el régimen seleccionado
 */
export function calculateInvoiceTax(params: {
  salePrice: number
  purchasePrice: number
  taxRegime: TaxRegime
}): TaxResult {
  if (params.taxRegime === "rebu") {
    return calculateRebu(params.salePrice, params.purchasePrice)
  }
  // IVA General: el subtotal es el precio de venta sin IVA
  const subtotal = round2(params.salePrice / 1.21)
  return calculateIvaGeneral(subtotal)
}

/**
 * Formatea un resultado fiscal para mostrar en UI
 */
export function formatTaxSummary(result: TaxResult): string {
  if (result.regime === "rebu") {
    if (result.margin <= 0) {
      return `REBU — Margen: ${formatEur(result.margin)} (sin IVA a repercutir)`
    }
    return `REBU — Margen: ${formatEur(result.margin)} | Base: ${formatEur(result.taxBase)} | IVA implícito: ${formatEur(result.ivaAmount)}`
  }
  return `IVA General — Base: ${formatEur(result.subtotal)} + IVA ${result.ivaRate}%: ${formatEur(result.ivaAmount)} = ${formatEur(result.total)}`
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function formatEur(amount: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(amount)
}
