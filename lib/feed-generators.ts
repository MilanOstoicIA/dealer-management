// ─── Feed Generators for Vehicle Portals ────────────────────────────────────
// Generate XML/CSV feeds for publishing vehicles to Spanish car portals
//
// Supported portals:
// - AutoScout24 (XML feed)
// - Coches.net (XML feed)
// - Wallapop (CSV bulk upload)

import type { Vehicle } from "@/types"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function escapeCsv(str: string): string {
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

const fuelTypeMap: Record<string, { autoscout: string; cochesnet: string; wallapop: string }> = {
  gasolina: { autoscout: "B", cochesnet: "gasolina", wallapop: "Gasolina" },
  diesel: { autoscout: "D", cochesnet: "diesel", wallapop: "Diésel" },
  "diésel": { autoscout: "D", cochesnet: "diesel", wallapop: "Diésel" },
  "híbrido": { autoscout: "H", cochesnet: "hibrido", wallapop: "Híbrido" },
  "eléctrico": { autoscout: "E", cochesnet: "electrico", wallapop: "Eléctrico" },
}

const transmissionMap: Record<string, { autoscout: string; cochesnet: string }> = {
  manual: { autoscout: "M", cochesnet: "manual" },
  "automático": { autoscout: "A", cochesnet: "automatico" },
}

// ─── AutoScout24 XML Feed ────────────────────────────────────────────────────
// Format based on AutoScout24 Dealer Data Feed specification

export function generateAutoScout24XML(vehicles: Vehicle[], dealerInfo?: { name: string; id: string }): string {
  const dealer = dealerInfo || { name: "DealerHub S.L.", id: "DEALERHUB001" }

  const vehiclesXml = vehicles.map((v) => {
    const fuel = fuelTypeMap[v.fuelType] || fuelTypeMap.gasolina
    const trans = transmissionMap[v.transmission] || transmissionMap.manual

    return `    <vehicle>
      <vehicle-id>${escapeXml(v.id)}</vehicle-id>
      <make>${escapeXml(v.brand)}</make>
      <model>${escapeXml(v.model)}</model>
      <model-description>${escapeXml(`${v.brand} ${v.model} ${v.year}`)}</model-description>
      <price>${v.price}</price>
      <currency>EUR</currency>
      <vat-type>margin</vat-type>
      <first-registration>
        <year>${v.year}</year>
        <month>01</month>
      </first-registration>
      <mileage>${v.mileage}</mileage>
      <fuel-type>${fuel.autoscout}</fuel-type>
      <gear-type>${trans.autoscout}</gear-type>
      <color>${escapeXml(v.color)}</color>
      <description>${escapeXml(v.description || `${v.brand} ${v.model} ${v.year} - ${v.mileage} km`)}</description>
      <seller-inventory-id>${escapeXml(v.licensePlate)}</seller-inventory-id>
${v.images.length > 0 ? `      <images>
${v.images.map((img, i) => `        <image>
          <uri>${escapeXml(img)}</uri>
          <position>${i + 1}</position>
        </image>`).join("\n")}
      </images>` : ""}
    </vehicle>`
  }).join("\n")

  return `<?xml version="1.0" encoding="UTF-8"?>
<vehicles xmlns="http://www.autoscout24.com/schemas/data-feed"
          dealer-id="${escapeXml(dealer.id)}"
          dealer-name="${escapeXml(dealer.name)}"
          generated="${new Date().toISOString()}">
${vehiclesXml}
</vehicles>`
}

// ─── Coches.net XML Feed ─────────────────────────────────────────────────────
// Format based on Coches.net inventory feed specification

export function generateCochesNetXML(vehicles: Vehicle[], dealerInfo?: { name: string; id: string }): string {
  const dealer = dealerInfo || { name: "DealerHub S.L.", id: "DEALERHUB001" }

  const vehiclesXml = vehicles.map((v) => {
    const fuel = fuelTypeMap[v.fuelType] || fuelTypeMap.gasolina
    const trans = transmissionMap[v.transmission] || transmissionMap.manual

    return `    <anuncio>
      <referencia>${escapeXml(v.id)}</referencia>
      <marca>${escapeXml(v.brand)}</marca>
      <modelo>${escapeXml(v.model)}</modelo>
      <anio>${v.year}</anio>
      <precio>${v.price}</precio>
      <moneda>EUR</moneda>
      <km>${v.mileage}</km>
      <combustible>${fuel.cochesnet}</combustible>
      <cambio>${trans.cochesnet}</cambio>
      <color>${escapeXml(v.color)}</color>
      <matricula>${escapeXml(v.licensePlate)}</matricula>
      <bastidor>${escapeXml(v.vin)}</bastidor>
      <descripcion>${escapeXml(v.description || `${v.brand} ${v.model} del ${v.year} con ${v.mileage.toLocaleString("es-ES")} km`)}</descripcion>
      <estado>usado</estado>
      <iva_incluido>si</iva_incluido>
${v.images.length > 0 ? `      <fotos>
${v.images.map((img) => `        <foto>${escapeXml(img)}</foto>`).join("\n")}
      </fotos>` : ""}
    </anuncio>`
  }).join("\n")

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed_coches version="1.0"
             concesionario="${escapeXml(dealer.name)}"
             id_concesionario="${escapeXml(dealer.id)}"
             fecha="${new Date().toISOString().split("T")[0]}">
  <anuncios>
${vehiclesXml}
  </anuncios>
</feed_coches>`
}

// ─── Wallapop CSV Feed ───────────────────────────────────────────────────────
// CSV format for Wallapop Pro bulk upload

export function generateWallapopCSV(vehicles: Vehicle[]): string {
  const headers = [
    "titulo", "descripcion", "precio", "marca", "modelo", "anio",
    "km", "combustible", "cambio", "color", "matricula", "imagen_1",
    "imagen_2", "imagen_3", "imagen_4",
  ]

  const rows = vehicles.map((v) => {
    const fuel = fuelTypeMap[v.fuelType] || fuelTypeMap.gasolina
    const title = `${v.brand} ${v.model} ${v.year} - ${v.mileage.toLocaleString("es-ES")} km`
    const desc = v.description || `${v.brand} ${v.model} del ${v.year}. ${v.mileage.toLocaleString("es-ES")} km. ${v.fuelType}. Cambio ${v.transmission}.`

    return [
      escapeCsv(title),
      escapeCsv(desc),
      v.price.toString(),
      escapeCsv(v.brand),
      escapeCsv(v.model),
      v.year.toString(),
      v.mileage.toString(),
      escapeCsv(fuel.wallapop),
      escapeCsv(v.transmission === "manual" ? "Manual" : "Automático"),
      escapeCsv(v.color),
      escapeCsv(v.licensePlate),
      v.images[0] || "",
      v.images[1] || "",
      v.images[2] || "",
      v.images[3] || "",
    ].join(",")
  })

  return [headers.join(","), ...rows].join("\n")
}

// ─── Download helper ─────────────────────────────────────────────────────────

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
