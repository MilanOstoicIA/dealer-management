// ─── Enlaces externos para gestiones de vehículos en España ──────────────────
//
// Accesos directos a plataformas externas que usa un concesionario:
// - DGT: consultas, trámites, informes
// - Swipoo / Tramicar: gestiones de matriculación y transferencia online
// - AEAT: declaraciones fiscales
// - Otros: ITV, seguros, financieras

export interface ExternalLink {
  id: string
  name: string
  description: string
  url: string
  category: ExternalLinkCategory
  icon: string       // lucide icon name for reference
  color: string      // tailwind color class
}

export type ExternalLinkCategory =
  | "dgt"
  | "gestoria_online"
  | "fiscal"
  | "itv"
  | "seguros"
  | "financieras"
  | "recambios"

const EXTERNAL_LINKS: ExternalLink[] = [
  // ── DGT ──
  {
    id: "dgt_sede",
    name: "DGT — Sede Electrónica",
    description: "Portal principal de la DGT para trámites con certificado digital",
    url: "https://sede.dgt.gob.es/",
    category: "dgt",
    icon: "Building",
    color: "text-red-600",
  },
  {
    id: "dgt_consulta_vehiculo",
    name: "DGT — Consulta datos vehículo",
    description: "Consultar datos de un vehículo por matrícula o bastidor",
    url: "https://sede.dgt.gob.es/es/vehiculos/consulta-datos-vehiculo/",
    category: "dgt",
    icon: "Search",
    color: "text-red-600",
  },
  {
    id: "dgt_informe_vehiculo",
    name: "DGT — Informe de vehículo",
    description: "Solicitar informe del historial del vehículo (cargas, embargos, ITV)",
    url: "https://sede.dgt.gob.es/es/vehiculos/informe-vehiculo/",
    category: "dgt",
    icon: "FileText",
    color: "text-red-600",
  },
  {
    id: "dgt_transferencia",
    name: "DGT — Transferencia de vehículo",
    description: "Iniciar trámite de transferencia de titularidad",
    url: "https://sede.dgt.gob.es/es/vehiculos/transferencia-vehiculos/",
    category: "dgt",
    icon: "ArrowRightLeft",
    color: "text-red-600",
  },
  {
    id: "dgt_matriculacion",
    name: "DGT — Matriculación",
    description: "Trámite de primera matriculación de vehículo",
    url: "https://sede.dgt.gob.es/es/vehiculos/matriculacion/",
    category: "dgt",
    icon: "CreditCard",
    color: "text-red-600",
  },
  {
    id: "dgt_baja",
    name: "DGT — Baja de vehículo",
    description: "Tramitar baja temporal o definitiva",
    url: "https://sede.dgt.gob.es/es/vehiculos/baja-vehiculos/",
    category: "dgt",
    icon: "XCircle",
    color: "text-red-600",
  },
  // ── Gestorías online ──
  {
    id: "swipoo",
    name: "Swipoo",
    description: "Transferencias y matriculaciones online. Sin ir a la DGT.",
    url: "https://www.swipoo.com/",
    category: "gestoria_online",
    icon: "Zap",
    color: "text-violet-600",
  },
  {
    id: "tramicar",
    name: "Tramicar",
    description: "Gestiones de tráfico para profesionales del automóvil",
    url: "https://www.tramicar.es/",
    category: "gestoria_online",
    icon: "Car",
    color: "text-blue-600",
  },
  {
    id: "transferencia24",
    name: "Transferencia24",
    description: "Transferencia de vehículos online en 24h",
    url: "https://www.transferencia24.es/",
    category: "gestoria_online",
    icon: "Clock",
    color: "text-green-600",
  },
  // ── Fiscal ──
  {
    id: "aeat_sede",
    name: "AEAT — Sede Electrónica",
    description: "Portal de la Agencia Tributaria (Modelo 303, 390, etc.)",
    url: "https://sede.agenciatributaria.gob.es/",
    category: "fiscal",
    icon: "Landmark",
    color: "text-emerald-700",
  },
  {
    id: "aeat_modelo_303",
    name: "AEAT — Modelo 303 (IVA trimestral)",
    description: "Presentar declaración trimestral de IVA",
    url: "https://sede.agenciatributaria.gob.es/Sede/procedimientoini/GI34.shtml",
    category: "fiscal",
    icon: "Calculator",
    color: "text-emerald-700",
  },
  // ── ITV ──
  {
    id: "itv_cita",
    name: "ITV — Pedir cita",
    description: "Pedir cita para la inspección técnica de vehículos",
    url: "https://www.itvcita.com/",
    category: "itv",
    icon: "ClipboardCheck",
    color: "text-orange-600",
  },
  // ── Seguros ──
  {
    id: "rastreator",
    name: "Rastreator — Comparar seguros",
    description: "Comparador de seguros de coche en España",
    url: "https://www.rastreator.com/seguros-coche.aspx",
    category: "seguros",
    icon: "Shield",
    color: "text-cyan-600",
  },
  // ── Financieras ──
  {
    id: "cetelem",
    name: "Cetelem — Financiación vehículos",
    description: "Simulador de financiación para concesionarios",
    url: "https://www.cetelem.es/credito-coche",
    category: "financieras",
    icon: "Banknote",
    color: "text-amber-600",
  },
  // ── Recambios online ──
  {
    id: "oscaro",
    name: "Oscaro — Recambios",
    description: "Tienda online de recambios de coche",
    url: "https://www.oscaro.es/",
    category: "recambios",
    icon: "Wrench",
    color: "text-sky-600",
  },
  {
    id: "autodoc",
    name: "Autodoc — Recambios",
    description: "Recambios de coche a precios de mayorista",
    url: "https://www.autodoc.es/",
    category: "recambios",
    icon: "Package",
    color: "text-indigo-600",
  },
]

/**
 * Obtiene todos los enlaces externos
 */
export function getAllExternalLinks(): ExternalLink[] {
  return EXTERNAL_LINKS
}

/**
 * Obtiene enlaces por categoría
 */
export function getExternalLinksByCategory(category: ExternalLinkCategory): ExternalLink[] {
  return EXTERNAL_LINKS.filter((link) => link.category === category)
}

/**
 * Obtiene enlaces relevantes para un tipo de seguimiento
 */
export function getLinksForTrackingCategory(trackingCategory: string): ExternalLink[] {
  switch (trackingCategory) {
    case "matriculacion":
      return EXTERNAL_LINKS.filter((l) =>
        l.id === "dgt_matriculacion" || l.id === "swipoo" || l.id === "tramicar"
      )
    case "transferencia":
      return EXTERNAL_LINKS.filter((l) =>
        l.id === "dgt_transferencia" || l.id === "swipoo" || l.id === "tramicar" || l.id === "transferencia24"
      )
    case "documentacion":
      return EXTERNAL_LINKS.filter((l) =>
        l.category === "dgt" || l.category === "gestoria_online"
      )
    case "seguro":
      return EXTERNAL_LINKS.filter((l) => l.category === "seguros")
    case "financiacion":
      return EXTERNAL_LINKS.filter((l) => l.category === "financieras")
    case "pedido_piezas":
      return EXTERNAL_LINKS.filter((l) => l.category === "recambios")
    case "itv":
      return EXTERNAL_LINKS.filter((l) => l.category === "itv" || l.id === "dgt_informe_vehiculo")
    default:
      return []
  }
}

/**
 * Obtiene la URL de consulta DGT pre-rellenada con matrícula
 */
export function getDGTVehicleConsultURL(licensePlate?: string): string {
  return licensePlate
    ? `https://sede.dgt.gob.es/es/vehiculos/consulta-datos-vehiculo/?matricula=${encodeURIComponent(licensePlate)}`
    : "https://sede.dgt.gob.es/es/vehiculos/consulta-datos-vehiculo/"
}

/**
 * Obtiene la URL de Swipoo pre-rellenada para transferencia
 */
export function getSwipooTransferURL(): string {
  return "https://www.swipoo.com/transferencia-coche"
}

/**
 * Categorías disponibles para el UI
 */
export const LINK_CATEGORIES: { key: ExternalLinkCategory; label: string; icon: string }[] = [
  { key: "dgt", label: "DGT", icon: "Building" },
  { key: "gestoria_online", label: "Gestorías online", icon: "Globe" },
  { key: "fiscal", label: "Fiscal / AEAT", icon: "Landmark" },
  { key: "itv", label: "ITV", icon: "ClipboardCheck" },
  { key: "seguros", label: "Seguros", icon: "Shield" },
  { key: "financieras", label: "Financieras", icon: "Banknote" },
  { key: "recambios", label: "Recambios", icon: "Wrench" },
]
