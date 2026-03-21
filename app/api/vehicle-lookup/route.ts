import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// ─── Vehicle Lookup API Route ───────────────────────────────────────────────
// POST /api/vehicle-lookup
// Body: { licensePlate: string }
// Returns vehicle data from external API (MatriculaAPI or similar)
//
// The API key is stored in the Supabase settings table under key "matricula_api_key"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function getApiKey(): Promise<string | null> {
  const supabase = createClient(supabaseUrl, supabaseKey)
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "matricula_api_key")
    .single()
  return data?.value || null
}

interface MatriculaApiResponse {
  marca?: string
  modelo?: string
  año?: number
  combustible?: string
  cilindrada?: string
  potencia?: string
  tipo?: string
  color?: string
  fecha_matriculacion?: string
  // Fields may vary by API provider
  [key: string]: unknown
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { licensePlate } = body

    if (!licensePlate || typeof licensePlate !== "string") {
      return NextResponse.json(
        { error: "Se requiere una matrícula válida" },
        { status: 400 }
      )
    }

    // Clean the plate: remove spaces, dashes, uppercase
    const cleanPlate = licensePlate.replace(/[\s-]/g, "").toUpperCase()

    // Get API key from settings
    const apiKey = await getApiKey()

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "API no configurada",
          message: "Configura tu API key de MatriculaAPI en Configuración > Integraciones para activar la consulta por matrícula.",
          configured: false,
        },
        { status: 503 }
      )
    }

    // Call MatriculaAPI (https://www.matriculaapi.com)
    // Endpoint: GET https://api.matriculaapi.com/v1/vehicle/{plate}
    const response = await fetch(
      `https://api.matriculaapi.com/v1/vehicle/${cleanPlate}`,
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Accept": "application/json",
        },
      }
    )

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json(
          { error: "API key inválida. Verifica tu clave en Configuración > Integraciones." },
          { status: 401 }
        )
      }
      if (response.status === 404) {
        return NextResponse.json(
          { error: `No se encontró el vehículo con matrícula ${cleanPlate}` },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: "Error al consultar la API de matrículas" },
        { status: response.status }
      )
    }

    const data: MatriculaApiResponse = await response.json()

    // Normalize fuel type to match our schema
    const fuelTypeMap: Record<string, string> = {
      gasolina: "gasolina",
      gasoline: "gasolina",
      diesel: "diésel",
      diésel: "diésel",
      "díesel": "diésel",
      eléctrico: "eléctrico",
      electric: "eléctrico",
      híbrido: "híbrido",
      hybrid: "híbrido",
    }

    const result = {
      brand: data.marca || null,
      model: data.modelo || null,
      year: data.año || (data.fecha_matriculacion ? parseInt(data.fecha_matriculacion.slice(0, 4), 10) : null),
      fuelType: data.combustible ? (fuelTypeMap[data.combustible.toLowerCase()] || data.combustible) : null,
      color: data.color || null,
      engineSize: data.cilindrada || null,
      power: data.potencia || null,
      vehicleType: data.tipo || null,
      raw: data, // Include raw response for debugging
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Vehicle lookup error:", error)
    return NextResponse.json(
      { error: "Error interno al consultar matrícula" },
      { status: 500 }
    )
  }
}
