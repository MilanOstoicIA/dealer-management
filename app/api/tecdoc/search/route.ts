import { NextResponse } from "next/server"

// ─── TecDoc API Skeleton ──────────────────────────────────────────────────────
//
// TecDoc es la base de datos de referencia para recambios de automóvil en Europa.
// Licencia: 200-500€/mes para acceso API.
//
// Este endpoint es un SKELETON preparado para cuando se contrate la licencia.
// Por ahora devuelve datos mock para que la UI pueda desarrollarse.
//
// API real: https://webservice.tecalliance.services/pegasus-3-0/services/TecdocToCatWS
// Documentación: https://www.tecalliance.net/

interface TecDocSearchRequest {
  vehicleType?: string       // marca/modelo o TecDoc ID
  partCategory?: string      // categoría de pieza (ej: "frenos", "filtros")
  partNumber?: string        // referencia del fabricante
  vin?: string               // búsqueda por VIN
}

interface TecDocPart {
  partNumber: string
  brand: string
  description: string
  category: string
  oeNumbers: string[]        // referencias originales del fabricante
  price?: number
  availability?: string
  imageUrl?: string
}

// Mock data para desarrollo de UI
const MOCK_PARTS: TecDocPart[] = [
  {
    partNumber: "0986494524",
    brand: "Bosch",
    description: "Pastillas de freno delanteras",
    category: "Frenos",
    oeNumbers: ["1K0698151", "JZW698151B"],
    price: 32.50,
    availability: "en_stock",
  },
  {
    partNumber: "OC 593/4",
    brand: "Mahle",
    description: "Filtro de aceite",
    category: "Filtros",
    oeNumbers: ["03C115561H", "03C115561D"],
    price: 8.90,
    availability: "en_stock",
  },
  {
    partNumber: "LX 1566",
    brand: "Mahle",
    description: "Filtro de aire motor",
    category: "Filtros",
    oeNumbers: ["1F0129620"],
    price: 14.20,
    availability: "en_stock",
  },
  {
    partNumber: "CT1028WP2",
    brand: "Contitech",
    description: "Kit distribución + bomba agua",
    category: "Distribución",
    oeNumbers: ["038198119C"],
    price: 145.00,
    availability: "2-3_dias",
  },
  {
    partNumber: "KYB334833",
    brand: "KYB",
    description: "Amortiguador delantero",
    category: "Suspensión",
    oeNumbers: ["1K0413031BF"],
    price: 58.70,
    availability: "en_stock",
  },
]

export async function POST(request: Request) {
  try {
    const body: TecDocSearchRequest = await request.json()

    // Check if TecDoc API key is configured
    // In the future: const apiKey = await dbGetSetting("tecdoc_api_key")
    const apiKey = null // No API key yet

    if (!apiKey) {
      // Return mock data for development
      let results = [...MOCK_PARTS]

      // Filter by category if provided
      if (body.partCategory) {
        const cat = body.partCategory.toLowerCase()
        results = results.filter((p) =>
          p.category.toLowerCase().includes(cat) ||
          p.description.toLowerCase().includes(cat)
        )
      }

      // Filter by part number if provided
      if (body.partNumber) {
        const num = body.partNumber.toLowerCase()
        results = results.filter((p) =>
          p.partNumber.toLowerCase().includes(num) ||
          p.oeNumbers.some((oe) => oe.toLowerCase().includes(num))
        )
      }

      return NextResponse.json({
        success: true,
        source: "mock",
        message: "TecDoc no configurado — usando datos de ejemplo. Contrate licencia en tecalliance.net",
        parts: results,
        totalResults: results.length,
      })
    }

    // Future: Real TecDoc API call
    // const tecDocResponse = await fetch("https://webservice.tecalliance.services/...", {
    //   method: "POST",
    //   headers: { "x-api-key": apiKey },
    //   body: JSON.stringify({ ... }),
    // })

    return NextResponse.json({
      success: false,
      message: "TecDoc integration not yet implemented",
    })
  } catch (error) {
    console.error("TecDoc search error:", error)
    return NextResponse.json({ error: "Error in TecDoc search" }, { status: 500 })
  }
}
