// ─── VeriFactu — Preparación para facturación electrónica española ────────────
//
// VeriFactu (Verificable Factura) es el sistema de facturación electrónica
// obligatorio en España desde enero 2027 (RD 1007/2023).
//
// Requisitos clave:
// 1. Cada factura tiene un hash SHA-256 que incluye el hash de la factura anterior
//    → Cadena de hashes inmutable (como blockchain)
// 2. XML firmado se envía a la AEAT (Agencia Tributaria)
// 3. Cada factura lleva un código QR para verificación
//
// Este módulo prepara la infraestructura. El envío real a AEAT se activará
// cuando sea obligatorio (2027).

import type { Invoice, TaxRegime } from "@/types"

// ─── Tipos VeriFactu ──────────────────────────────────────────────────────────

export type VeriFactuStatus = "pending" | "hashed" | "sent" | "accepted" | "rejected"

export interface VeriFactuRecord {
  invoiceNumber: string
  issuedDate: string
  total: number
  taxRegime: TaxRegime
  hash: string
  previousHash: string | null
  status: VeriFactuStatus
}

export interface HashChainValidation {
  isValid: boolean
  totalInvoices: number
  validLinks: number
  brokenAt?: string // invoiceNumber where chain breaks
  errors: string[]
}

// ─── Generación de hash SHA-256 ─────────────────────────────────────────────

/**
 * Genera el contenido que se hashea para una factura.
 * Según la especificación VeriFactu, el hash incluye:
 * - NIF del emisor
 * - Número de factura
 * - Fecha de emisión
 * - Tipo de factura
 * - Importe total
 * - Hash de la factura anterior
 */
function buildHashInput(invoice: Invoice, previousHash: string | null, emisorNif: string = "B12345678"): string {
  const parts = [
    `NIF:${emisorNif}`,
    `NUM:${invoice.invoiceNumber}`,
    `FECHA:${invoice.issuedDate}`,
    `TIPO:${invoice.taxRegime === "rebu" ? "R1" : "F1"}`, // R1=REBU, F1=Factura normal
    `TOTAL:${invoice.total.toFixed(2)}`,
    `PREV:${previousHash || "GENESIS"}`,
  ]
  return parts.join("|")
}

/**
 * Genera un hash SHA-256 para una factura
 * Usa Web Crypto API (disponible en browser y Node 18+)
 */
export async function generateInvoiceHash(
  invoice: Invoice,
  previousHash: string | null,
  emisorNif?: string
): Promise<string> {
  const input = buildHashInput(invoice, previousHash, emisorNif)
  const encoder = new TextEncoder()
  const data = encoder.encode(input)

  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

/**
 * Genera hashes para una lista ordenada de facturas (cadena completa)
 * Las facturas deben estar ordenadas por fecha de emisión ASC
 */
export async function buildHashChain(
  invoices: Invoice[],
  emisorNif?: string
): Promise<VeriFactuRecord[]> {
  const sorted = [...invoices].sort(
    (a, b) => new Date(a.issuedDate).getTime() - new Date(b.issuedDate).getTime()
  )

  const records: VeriFactuRecord[] = []
  let previousHash: string | null = null

  for (const invoice of sorted) {
    const hash = await generateInvoiceHash(invoice, previousHash, emisorNif)
    records.push({
      invoiceNumber: invoice.invoiceNumber,
      issuedDate: invoice.issuedDate,
      total: invoice.total,
      taxRegime: invoice.taxRegime,
      hash,
      previousHash,
      status: "hashed",
    })
    previousHash = hash
  }

  return records
}

// ─── Validación de cadena de hashes ──────────────────────────────────────────

/**
 * Verifica la integridad de la cadena de hashes.
 * Recalcula cada hash y compara con el almacenado.
 * Si alguno no coincide, la cadena está rota (posible manipulación).
 */
export async function validateHashChain(
  invoices: Invoice[],
  emisorNif?: string
): Promise<HashChainValidation> {
  if (invoices.length === 0) {
    return { isValid: true, totalInvoices: 0, validLinks: 0, errors: [] }
  }

  const sorted = [...invoices].sort(
    (a, b) => new Date(a.issuedDate).getTime() - new Date(b.issuedDate).getTime()
  )

  const errors: string[] = []
  let validLinks = 0
  let previousHash: string | null = null
  let brokenAt: string | undefined

  for (const invoice of sorted) {
    // Verificar que el previousHash almacenado coincide
    if (invoice.previousHash !== undefined && invoice.previousHash !== previousHash) {
      if (!brokenAt) brokenAt = invoice.invoiceNumber
      errors.push(
        `${invoice.invoiceNumber}: previousHash no coincide (esperado: ${previousHash?.slice(0, 8) || "GENESIS"}, almacenado: ${invoice.previousHash?.slice(0, 8) || "null"})`
      )
    }

    // Recalcular hash y verificar
    const expectedHash = await generateInvoiceHash(invoice, previousHash, emisorNif)
    if (invoice.hash && invoice.hash !== expectedHash) {
      if (!brokenAt) brokenAt = invoice.invoiceNumber
      errors.push(
        `${invoice.invoiceNumber}: hash no coincide (recalculado: ${expectedHash.slice(0, 8)}..., almacenado: ${invoice.hash.slice(0, 8)}...)`
      )
    } else if (invoice.hash) {
      validLinks++
    }

    previousHash = invoice.hash || expectedHash
  }

  return {
    isValid: errors.length === 0,
    totalInvoices: sorted.length,
    validLinks,
    brokenAt,
    errors,
  }
}

// ─── Generación XML para AEAT (skeleton) ────────────────────────────────────

/**
 * Genera el XML de una factura en formato VeriFactu para envío a AEAT.
 * NOTA: Este es un skeleton — el formato final se ajustará cuando
 * la AEAT publique las especificaciones técnicas definitivas.
 */
export function generateVeriFactuXML(
  invoice: Invoice,
  emisor: { nif: string; nombre: string; direccion: string } = {
    nif: "B12345678",
    nombre: "DealerHub S.L.",
    direccion: "Av. de la Constitución 50, Madrid",
  }
): string {
  const isRebu = invoice.taxRegime === "rebu"
  const tipoFactura = isRebu ? "R1" : "F1"

  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:sii="https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/ssii/fact/ws/SuministroInformacion.xsd">
  <soapenv:Header/>
  <soapenv:Body>
    <sii:SuministroLRFacturasEmitidas>
      <sii:Cabecera>
        <sii:IDVersionSii>1.1</sii:IDVersionSii>
        <sii:Titular>
          <sii:NombreRazon>${emisor.nombre}</sii:NombreRazon>
          <sii:NIF>${emisor.nif}</sii:NIF>
        </sii:Titular>
        <sii:TipoComunicacion>A0</sii:TipoComunicacion>
      </sii:Cabecera>
      <sii:RegistroLRFacturasEmitidas>
        <sii:PeriodoLiquidacion>
          <sii:Ejercicio>${invoice.issuedDate.slice(0, 4)}</sii:Ejercicio>
          <sii:Periodo>${invoice.issuedDate.slice(5, 7)}</sii:Periodo>
        </sii:PeriodoLiquidacion>
        <sii:IDFactura>
          <sii:IDEmisorFactura>
            <sii:NIF>${emisor.nif}</sii:NIF>
          </sii:IDEmisorFactura>
          <sii:NumSerieFacturaEmisor>${invoice.invoiceNumber}</sii:NumSerieFacturaEmisor>
          <sii:FechaExpedicionFacturaEmisor>${formatDateAEAT(invoice.issuedDate)}</sii:FechaExpedicionFacturaEmisor>
        </sii:IDFactura>
        <sii:FacturaExpedida>
          <sii:TipoFactura>${tipoFactura}</sii:TipoFactura>
          <sii:ClaveRegimenEspecialOTrascendencia>${isRebu ? "04" : "01"}</sii:ClaveRegimenEspecialOTrascendencia>
          <sii:ImporteTotal>${invoice.total.toFixed(2)}</sii:ImporteTotal>
          <sii:DescripcionOperacion>${invoice.concept}</sii:DescripcionOperacion>
          <sii:Contraparte>
            <sii:NombreRazon>${invoice.clientName}</sii:NombreRazon>
            <sii:NIF>${invoice.clientDni || ""}</sii:NIF>
          </sii:Contraparte>
          ${isRebu ? `
          <sii:TipoDesglose>
            <sii:DesgloseFactura>
              <sii:NoSujeta>
                <sii:ImportePorArticulos7_14_Otros>${invoice.total.toFixed(2)}</sii:ImportePorArticulos7_14_Otros>
              </sii:NoSujeta>
            </sii:DesgloseFactura>
          </sii:TipoDesglose>` : `
          <sii:TipoDesglose>
            <sii:DesgloseFactura>
              <sii:Sujeta>
                <sii:NoExenta>
                  <sii:TipoNoExenta>S1</sii:TipoNoExenta>
                  <sii:DesgloseIVA>
                    <sii:DetalleIVA>
                      <sii:TipoImpositivo>${(invoice.ivaRate || 21).toFixed(2)}</sii:TipoImpositivo>
                      <sii:BaseImponible>${invoice.subtotal.toFixed(2)}</sii:BaseImponible>
                      <sii:CuotaRepercutida>${invoice.ivaAmount.toFixed(2)}</sii:CuotaRepercutida>
                    </sii:DetalleIVA>
                  </sii:DesgloseIVA>
                </sii:NoExenta>
              </sii:Sujeta>
            </sii:DesgloseFactura>
          </sii:TipoDesglose>`}
          <!-- VeriFactu Hash Chain -->
          <sii:Huella>
            <sii:Hash>${invoice.hash || ""}</sii:Hash>
            <sii:HashAnterior>${invoice.previousHash || "GENESIS"}</sii:HashAnterior>
          </sii:Huella>
        </sii:FacturaExpedida>
      </sii:RegistroLRFacturasEmitidas>
    </sii:SuministroLRFacturasEmitidas>
  </soapenv:Body>
</soapenv:Envelope>`
}

// ─── Generación de código QR (URL de verificación) ──────────────────────────

/**
 * Genera la URL de verificación que se usará en el código QR de la factura.
 * Cuando VeriFactu esté activo, esta URL permitirá al cliente verificar
 * la factura directamente en la web de la AEAT.
 */
export function generateVerificationURL(
  invoice: Invoice,
  emisorNif: string = "B12345678"
): string {
  const params = new URLSearchParams({
    nif: emisorNif,
    numserie: invoice.invoiceNumber,
    fecha: invoice.issuedDate,
    importe: invoice.total.toFixed(2),
  })
  // URL de verificación de la AEAT (será la real cuando se active)
  return `https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/VerificarFactura?${params.toString()}`
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convierte ISO date a formato AEAT (dd-MM-yyyy) */
function formatDateAEAT(isoDate: string): string {
  const d = new Date(isoDate)
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const yyyy = d.getFullYear()
  return `${dd}-${mm}-${yyyy}`
}

/**
 * Resumen de estado VeriFactu para UI
 */
export function getVeriFactuStatusLabel(status: VeriFactuStatus): { label: string; color: string } {
  switch (status) {
    case "pending":
      return { label: "Pendiente", color: "bg-yellow-500/15 text-yellow-600 border-yellow-500/20" }
    case "hashed":
      return { label: "Hash generado", color: "bg-blue-500/15 text-blue-600 border-blue-500/20" }
    case "sent":
      return { label: "Enviada a AEAT", color: "bg-purple-500/15 text-purple-600 border-purple-500/20" }
    case "accepted":
      return { label: "Aceptada", color: "bg-green-500/15 text-green-600 border-green-500/20" }
    case "rejected":
      return { label: "Rechazada", color: "bg-destructive/15 text-destructive border-destructive/20" }
  }
}
