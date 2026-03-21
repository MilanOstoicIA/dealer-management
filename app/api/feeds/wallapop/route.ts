import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { generateWallapopCSV } from "@/lib/feed-generators"
import type { Vehicle } from "@/types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data } = await supabase.from("vehicles").select("*").eq("status", "disponible")

    const vehicles: Vehicle[] = (data || []).map((r) => ({
      id: r.id, brand: r.brand, model: r.model, year: r.year,
      color: r.color || "", licensePlate: r.license_plate || "",
      vin: r.vin || "", mileage: r.mileage, purchasePrice: Number(r.purchase_price),
      price: Number(r.price), fuelType: r.fuel_type, transmission: r.transmission,
      status: r.status, description: r.description || "", images: r.images || [],
      createdAt: r.created_at,
    }))

    const csv = generateWallapopCSV(vehicles)
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="wallapop-vehicles-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("Wallapop feed error:", error)
    return NextResponse.json({ error: "Error generating feed" }, { status: 500 })
  }
}
