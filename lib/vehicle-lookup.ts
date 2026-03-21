// ─── Vehicle Lookup Client ──────────────────────────────────────────────────
// Client-side helper for calling the vehicle lookup API route

export interface VehicleLookupResult {
  brand: string | null
  model: string | null
  year: number | null
  fuelType: string | null
  color: string | null
  engineSize: string | null
  power: string | null
  vehicleType: string | null
}

export interface VehicleLookupError {
  error: string
  message?: string
  configured?: boolean
}

/**
 * Look up vehicle data by Spanish license plate
 * Calls internal API route which proxies to MatriculaAPI
 *
 * @param licensePlate - Spanish license plate (e.g., "1234 ABC")
 * @returns Vehicle data or null if not found/not configured
 * @throws Error with user-friendly message
 */
export async function lookupByPlate(licensePlate: string): Promise<VehicleLookupResult> {
  const response = await fetch("/api/vehicle-lookup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ licensePlate }),
  })

  if (!response.ok) {
    const data: VehicleLookupError = await response.json()

    if (response.status === 503 && data.configured === false) {
      throw new Error("API_NOT_CONFIGURED")
    }

    throw new Error(data.error || "Error al consultar matrícula")
  }

  return response.json()
}
