import type { Tracking, Supplier, Vehicle, Client } from "@/types"

interface TemplateContext {
  tracking: Tracking
  supplier?: Supplier
  vehicle?: Vehicle
  client?: Client
}

// Clean phone number and add Spain country code
function cleanPhone(phone: string): string {
  const digits = phone.replace(/[^0-9+]/g, "")
  if (digits.startsWith("+")) return digits
  if (digits.startsWith("34")) return "+" + digits
  return "+34" + digits
}

export function getEmailTemplate(ctx: TemplateContext): { subject: string; body: string } {
  const { tracking, vehicle, client } = ctx
  const vehicleInfo = vehicle ? `${vehicle.brand} ${vehicle.model}${vehicle.licensePlate ? ` (${vehicle.licensePlate})` : ""}` : ""
  const clientInfo = client ? client.name : ""
  const trackingRef = tracking.trackingNumber ? `\nReferencia: ${tracking.trackingNumber}` : ""

  switch (tracking.category) {
    case "pedido_piezas":
      return {
        subject: `Consulta pedido - ${tracking.title}`,
        body: `Buenos días,\n\nLe escribo para consultar el estado del pedido:\n\n${tracking.title}${vehicleInfo ? `\nVehículo: ${vehicleInfo}` : ""}${trackingRef}\n\nQuedo a la espera de su respuesta.\n\nUn saludo,\nDealerHub`,
      }
    case "documentacion":
      return {
        subject: `Consulta documentación${vehicleInfo ? ` - ${vehicleInfo}` : ""}`,
        body: `Buenos días,\n\nLe escribo para consultar el estado de la documentación:\n\n${tracking.title}${vehicleInfo ? `\nVehículo: ${vehicleInfo}` : ""}${clientInfo ? `\nCliente: ${clientInfo}` : ""}\n\nQuedo a la espera de su respuesta.\n\nUn saludo,\nDealerHub`,
      }
    case "matriculacion":
      return {
        subject: `Consulta matriculación${vehicleInfo ? ` - ${vehicleInfo}` : ""}`,
        body: `Buenos días,\n\nLe escribo para consultar el estado de la matriculación:\n\n${tracking.title}${vehicleInfo ? `\nVehículo: ${vehicleInfo}` : ""}\n\n¿Podrían indicarme en qué fase se encuentra el trámite?\n\nUn saludo,\nDealerHub`,
      }
    case "transferencia":
      return {
        subject: `Consulta transferencia${vehicleInfo ? ` - ${vehicleInfo}` : ""}`,
        body: `Buenos días,\n\nLe escribo para consultar el estado de la transferencia:\n\n${tracking.title}${vehicleInfo ? `\nVehículo: ${vehicleInfo}` : ""}${clientInfo ? `\nComprador: ${clientInfo}` : ""}\n\nUn saludo,\nDealerHub`,
      }
    case "seguro":
      return {
        subject: `Consulta seguro${vehicleInfo ? ` - ${vehicleInfo}` : ""}`,
        body: `Buenos días,\n\nLe escribo para consultar sobre el seguro:\n\n${tracking.title}${vehicleInfo ? `\nVehículo: ${vehicleInfo}` : ""}${clientInfo ? `\nAsegurado: ${clientInfo}` : ""}\n\nUn saludo,\nDealerHub`,
      }
    case "financiacion":
      return {
        subject: `Consulta financiación${clientInfo ? ` - ${clientInfo}` : ""}`,
        body: `Buenos días,\n\nLe escribo para consultar el estado de la financiación:\n\n${tracking.title}${clientInfo ? `\nCliente: ${clientInfo}` : ""}${vehicleInfo ? `\nVehículo: ${vehicleInfo}` : ""}\n\nUn saludo,\nDealerHub`,
      }
    case "itv":
      return {
        subject: `Consulta ITV${vehicleInfo ? ` - ${vehicleInfo}` : ""}`,
        body: `Buenos días,\n\nLe escribo para consultar sobre la ITV:\n\n${tracking.title}${vehicleInfo ? `\nVehículo: ${vehicleInfo}` : ""}\n\nUn saludo,\nDealerHub`,
      }
    default:
      return {
        subject: tracking.title,
        body: `Buenos días,\n\nLe escribo en relación a:\n\n${tracking.title}${tracking.description ? `\n${tracking.description}` : ""}${vehicleInfo ? `\nVehículo: ${vehicleInfo}` : ""}\n\nUn saludo,\nDealerHub`,
      }
  }
}

export function getWhatsAppMessage(ctx: TemplateContext): string {
  const { tracking, vehicle, client } = ctx
  const vehicleInfo = vehicle ? `${vehicle.brand} ${vehicle.model}${vehicle.licensePlate ? ` (${vehicle.licensePlate})` : ""}` : ""
  const trackingRef = tracking.trackingNumber ? ` - Ref: ${tracking.trackingNumber}` : ""

  switch (tracking.category) {
    case "pedido_piezas":
      return `Hola, buenos días. Le escribo desde DealerHub para consultar el estado del pedido: *${tracking.title}*${vehicleInfo ? ` para el vehículo ${vehicleInfo}` : ""}${trackingRef}. ¿Me puede indicar cómo va? Gracias.`
    case "documentacion":
      return `Hola, buenos días. Quería consultar el estado de la documentación: *${tracking.title}*${vehicleInfo ? ` del vehículo ${vehicleInfo}` : ""}. ¿Hay alguna novedad? Gracias.`
    case "matriculacion":
      return `Hola, buenos días. Quería saber cómo va la matriculación: *${tracking.title}*${vehicleInfo ? ` del vehículo ${vehicleInfo}` : ""}. ¿En qué fase está? Gracias.`
    case "transferencia":
      return `Hola, buenos días. Consulto por la transferencia: *${tracking.title}*${vehicleInfo ? ` del vehículo ${vehicleInfo}` : ""}. ¿Cómo va el trámite? Gracias.`
    case "seguro":
      return `Hola, buenos días. Quería consultar sobre el seguro: *${tracking.title}*${vehicleInfo ? ` del vehículo ${vehicleInfo}` : ""}. Gracias.`
    case "financiacion":
      return `Hola, buenos días. Quería saber el estado de la financiación: *${tracking.title}*${client ? ` para ${client.name}` : ""}. ¿Hay novedades? Gracias.`
    default:
      return `Hola, buenos días. Le escribo desde DealerHub en relación a: *${tracking.title}*. ¿Me puede dar información? Gracias.`
  }
}

export function getMailtoLink(email: string, ctx: TemplateContext): string {
  const { subject, body } = getEmailTemplate(ctx)
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export function getWhatsAppLink(phone: string, ctx: TemplateContext): string {
  const clean = cleanPhone(phone).replace("+", "")
  const message = getWhatsAppMessage(ctx)
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`
}

export function getTelLink(phone: string): string {
  return `tel:${cleanPhone(phone)}`
}

// Direct contact links (without tracking context, for supplier page)
export function getDirectMailtoLink(email: string): string {
  return `mailto:${email}`
}

export function getDirectWhatsAppLink(phone: string): string {
  const clean = cleanPhone(phone).replace("+", "")
  return `https://wa.me/${clean}`
}

export function getDirectTelLink(phone: string): string {
  return `tel:${cleanPhone(phone)}`
}
