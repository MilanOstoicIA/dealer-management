// ─── Simulador de financiación para concesionarios ───────────────────────────
//
// Calculadora de cuotas mensuales usando la fórmula de amortización francesa.
// NO conecta a ninguna API externa (Cetelem, Santander, etc.).
// Es una herramienta interna para que el vendedor simule cuotas con el cliente.
//
// En el futuro, cuando se firme acuerdo con financiera, se podrá conectar
// a sus APIs para obtener TAEs reales y enviar solicitudes.

export interface FinancingParams {
  vehiclePrice: number       // precio del vehículo (EUR)
  downPayment: number        // entrada (EUR)
  termMonths: number         // plazo en meses (12, 24, 36, 48, 60, 72, 84)
  annualRate: number         // tipo de interés anual (%) — TIN, no TAE
  openingFee?: number        // comisión de apertura (%) — default 0
  residualValue?: number     // valor residual (EUR) — para leasing
}

export interface FinancingResult {
  amountFinanced: number     // importe financiado (precio - entrada)
  monthlyPayment: number     // cuota mensual
  totalPayments: number      // total pagado (cuotas * meses)
  totalInterest: number      // total intereses pagados
  openingFeeAmount: number   // importe comisión apertura
  tae: number                // TAE aproximada
  totalCost: number          // coste total (entrada + pagos + comisión)
  residualValue: number      // valor residual
  amortizationTable: AmortizationRow[]
}

export interface AmortizationRow {
  month: number
  payment: number            // cuota mensual
  principal: number          // amortización de capital
  interest: number           // intereses del mes
  remainingBalance: number   // saldo pendiente
}

/** Plazos estándar en financiación de vehículos */
export const STANDARD_TERMS = [12, 24, 36, 48, 60, 72, 84]

/** Tipos de interés referencia del mercado español (2024-2026) */
export const REFERENCE_RATES = {
  excellent: { tin: 5.99, label: "Excelente (5,99% TIN)" },
  good: { tin: 7.99, label: "Bueno (7,99% TIN)" },
  standard: { tin: 9.99, label: "Estándar (9,99% TIN)" },
  subprime: { tin: 14.99, label: "Subprime (14,99% TIN)" },
}

/**
 * Calcula la financiación de un vehículo usando amortización francesa.
 *
 * Fórmula: M = P × [r(1+r)^n] / [(1+r)^n - 1]
 *   M = cuota mensual
 *   P = principal (importe financiado)
 *   r = tipo mensual (anual / 12 / 100)
 *   n = número de meses
 */
export function calculateFinancing(params: FinancingParams): FinancingResult {
  const {
    vehiclePrice,
    downPayment,
    termMonths,
    annualRate,
    openingFee = 0,
    residualValue = 0,
  } = params

  const amountFinanced = round2(vehiclePrice - downPayment - residualValue)

  if (amountFinanced <= 0) {
    return {
      amountFinanced: 0,
      monthlyPayment: 0,
      totalPayments: 0,
      totalInterest: 0,
      openingFeeAmount: 0,
      tae: 0,
      totalCost: round2(downPayment),
      residualValue,
      amortizationTable: [],
    }
  }

  const monthlyRate = annualRate / 12 / 100
  const openingFeeAmount = round2(amountFinanced * (openingFee / 100))

  let monthlyPayment: number
  if (monthlyRate === 0) {
    // Sin intereses
    monthlyPayment = round2(amountFinanced / termMonths)
  } else {
    // Amortización francesa
    const factor = Math.pow(1 + monthlyRate, termMonths)
    monthlyPayment = round2(amountFinanced * (monthlyRate * factor) / (factor - 1))
  }

  const totalPayments = round2(monthlyPayment * termMonths)
  const totalInterest = round2(totalPayments - amountFinanced)
  const totalCost = round2(downPayment + totalPayments + openingFeeAmount + residualValue)

  // TAE aproximada (simplificada — la real requiere ecuación de Newton-Raphson)
  const tae = round2(calculateApproximateTAE(amountFinanced - openingFeeAmount, monthlyPayment, termMonths))

  // Tabla de amortización
  const amortizationTable = generateAmortizationTable(amountFinanced, monthlyRate, monthlyPayment, termMonths)

  return {
    amountFinanced,
    monthlyPayment,
    totalPayments,
    totalInterest,
    openingFeeAmount,
    tae,
    totalCost,
    residualValue,
    amortizationTable,
  }
}

/**
 * Genera la tabla de amortización completa
 */
function generateAmortizationTable(
  principal: number,
  monthlyRate: number,
  monthlyPayment: number,
  termMonths: number
): AmortizationRow[] {
  const table: AmortizationRow[] = []
  let balance = principal

  for (let month = 1; month <= termMonths; month++) {
    const interest = round2(balance * monthlyRate)
    const principalPaid = round2(monthlyPayment - interest)
    balance = round2(balance - principalPaid)

    // Última cuota: ajustar por redondeo
    if (month === termMonths) {
      balance = 0
    }

    table.push({
      month,
      payment: monthlyPayment,
      principal: principalPaid,
      interest,
      remainingBalance: Math.max(0, balance),
    })
  }

  return table
}

/**
 * TAE aproximada usando método iterativo simplificado
 */
function calculateApproximateTAE(netAmount: number, monthlyPayment: number, months: number): number {
  if (netAmount <= 0 || monthlyPayment <= 0) return 0

  // Bisección para encontrar la tasa mensual que iguala el valor actual
  let low = 0
  let high = 0.1 // 10% mensual máximo
  const tolerance = 0.0001

  for (let i = 0; i < 100; i++) {
    const mid = (low + high) / 2
    const pv = monthlyPayment * (1 - Math.pow(1 + mid, -months)) / mid
    if (Math.abs(pv - netAmount) < tolerance) {
      return round2((Math.pow(1 + mid, 12) - 1) * 100)
    }
    if (pv > netAmount) {
      low = mid
    } else {
      high = mid
    }
  }

  return round2((Math.pow(1 + (low + high) / 2, 12) - 1) * 100)
}

/**
 * Calculo rápido de cuota sin tabla de amortización
 */
export function quickMonthlyPayment(price: number, downPayment: number, months: number, annualRate: number): number {
  const amount = price - downPayment
  if (amount <= 0) return 0
  const r = annualRate / 12 / 100
  if (r === 0) return round2(amount / months)
  const factor = Math.pow(1 + r, months)
  return round2(amount * (r * factor) / (factor - 1))
}

/**
 * Formatea para mostrar en UI
 */
export function formatFinancingSummary(result: FinancingResult, downPayment: number): string {
  const fmt = (n: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n)
  return `Entrada: ${fmt(downPayment)} + ${result.amortizationTable.length} cuotas de ${fmt(result.monthlyPayment)} (TAE: ${result.tae}%)`
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
