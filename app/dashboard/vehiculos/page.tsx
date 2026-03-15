"use client"

import { useState } from "react"
import { Car, Search, Filter, Camera, ChevronLeft, ChevronRight, ImageOff, Euro, Wrench, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { vehicles, getServiceRecordsByVehicle, getUserById, getClientVehicleInfo } from "@/lib/data"
import type { Vehicle, VehicleStatus } from "@/types"

const statusConfig: Record<VehicleStatus, { label: string; className: string }> = {
  disponible: { label: "Disponible", className: "bg-green-500/15 text-green-600 border-green-500/20" },
  reservado: { label: "Reservado", className: "bg-yellow-500/15 text-yellow-600 border-yellow-500/20" },
  vendido: { label: "Vendido", className: "bg-blue-500/15 text-blue-600 border-blue-500/20" },
  en_taller: { label: "En taller", className: "bg-orange-500/15 text-orange-600 border-orange-500/20" },
}

const serviceTypeLabels: Record<string, string> = {
  revision_general: "Revisión general",
  cambio_aceite: "Cambio de aceite",
  frenos: "Frenos",
  neumaticos: "Neumáticos",
  aire_acondicionado: "Aire acondicionado",
  carroceria: "Carrocería",
  diagnostico: "Diagnóstico",
  otro: "Otro",
}

const fuelLabels: Record<string, string> = {
  gasolina: "Gasolina",
  diesel: "Diésel",
  "híbrido": "Híbrido",
  "eléctrico": "Eléctrico",
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount)
}

function formatMileage(km: number): string {
  return new Intl.NumberFormat("es-ES").format(km) + " km"
}

function VehicleDetail({ vehicle }: { vehicle: Vehicle }) {
  const [currentPhoto, setCurrentPhoto] = useState(0)
  const hasPhotos = vehicle.images.length > 0
  const margin = vehicle.price - vehicle.purchasePrice
  const marginPct = ((margin / vehicle.purchasePrice) * 100).toFixed(1)

  return (
    <div className="space-y-4">
      {/* Photo gallery */}
      <div className="rounded-lg border overflow-hidden">
        {hasPhotos ? (
          <div className="relative">
            <div className="aspect-video bg-muted flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={vehicle.images[currentPhoto]}
                alt={`${vehicle.brand} ${vehicle.model} - Foto ${currentPhoto + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
            {vehicle.images.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 backdrop-blur"
                  onClick={() => setCurrentPhoto((p) => (p === 0 ? vehicle.images.length - 1 : p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 backdrop-blur"
                  onClick={() => setCurrentPhoto((p) => (p === vehicle.images.length - 1 ? 0 : p + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {vehicle.images.map((_, i) => (
                    <button
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${
                        i === currentPhoto ? "w-4 bg-white" : "w-1.5 bg-white/50"
                      }`}
                      onClick={() => setCurrentPhoto(i)}
                    />
                  ))}
                </div>
              </>
            )}
            <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1">
              <Camera className="h-3 w-3" />
              {currentPhoto + 1}/{vehicle.images.length}
            </div>
          </div>
        ) : (
          <div className="aspect-video bg-muted/50 flex flex-col items-center justify-center gap-2">
            <ImageOff className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">Sin fotos — se añadirán con Supabase Storage</p>
          </div>
        )}
        {/* Thumbnail strip */}
        {hasPhotos && vehicle.images.length > 1 && (
          <div className="flex gap-1 p-2 bg-muted/30 overflow-x-auto">
            {vehicle.images.map((img, i) => (
              <button
                key={i}
                className={`shrink-0 h-12 w-16 rounded overflow-hidden border-2 transition-colors ${
                  i === currentPhoto ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
                }`}
                onClick={() => setCurrentPhoto(i)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Prices */}
      <div className="rounded-lg bg-muted/50 p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Precio de compra</span>
          <span>{formatCurrency(vehicle.purchasePrice)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Precio de venta</span>
          <span className="font-bold text-primary">{formatCurrency(vehicle.price)}</span>
        </div>
        <div className="border-t pt-2 flex justify-between text-sm">
          <span className="font-medium">Margen</span>
          <span className={`font-bold ${margin >= 0 ? "text-green-600" : "text-destructive"}`}>
            {formatCurrency(margin)} ({marginPct}%)
          </span>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Matrícula</p>
          <p className="text-sm font-medium font-mono">{vehicle.licensePlate}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">VIN</p>
          <p className="text-[11px] font-medium font-mono">{vehicle.vin}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Año</p>
          <p className="text-sm font-medium">{vehicle.year}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Color</p>
          <p className="text-sm font-medium">{vehicle.color}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Combustible</p>
          <p className="text-sm font-medium">{fuelLabels[vehicle.fuelType]}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Transmisión</p>
          <p className="text-sm font-medium capitalize">{vehicle.transmission}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Kilometraje</p>
          <p className="text-sm font-medium">{formatMileage(vehicle.mileage)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Estado</p>
          <Badge variant="outline" className={`mt-0.5 ${statusConfig[vehicle.status].className}`}>
            {statusConfig[vehicle.status].label}
          </Badge>
        </div>
      </div>

      {vehicle.description && (
        <div>
          <p className="text-xs text-muted-foreground">Descripción</p>
          <p className="text-sm mt-1">{vehicle.description}</p>
        </div>
      )}

      {/* Vehicle tracking info */}
      {(() => {
        const tracking = getClientVehicleInfo(vehicle.id)
        if (!tracking) return null
        return (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Car className="h-3.5 w-3.5" />
              Seguimiento de mantenimiento
            </p>
            <div className="grid grid-cols-2 gap-3 rounded-lg border p-3">
              {tracking.lastMileage && (
                <div>
                  <p className="text-[10px] text-muted-foreground">Último km registrado</p>
                  <p className="text-sm font-medium">{new Intl.NumberFormat("es-ES").format(tracking.lastMileage)} km</p>
                </div>
              )}
              {tracking.nextOilChangeKm && (
                <div>
                  <p className="text-[10px] text-muted-foreground">Próx. cambio aceite</p>
                  <p className="text-sm font-medium">{new Intl.NumberFormat("es-ES").format(tracking.nextOilChangeKm)} km</p>
                </div>
              )}
              {tracking.nextTireChangeKm && (
                <div>
                  <p className="text-[10px] text-muted-foreground">Próx. cambio neumáticos</p>
                  <p className="text-sm font-medium">{new Intl.NumberFormat("es-ES").format(tracking.nextTireChangeKm)} km</p>
                </div>
              )}
              {tracking.nextRevisionDate && (
                <div>
                  <p className="text-[10px] text-muted-foreground">Próx. revisión</p>
                  <p className="text-sm font-medium">{new Date(tracking.nextRevisionDate).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
              )}
              {tracking.notes && (
                <div className="col-span-2">
                  <p className="text-[10px] text-muted-foreground">Notas</p>
                  <p className="text-xs">{tracking.notes}</p>
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {/* Service history */}
      {(() => {
        const records = getServiceRecordsByVehicle(vehicle.id)
        if (records.length === 0) return null
        return (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <History className="h-3.5 w-3.5" />
              Historial de taller ({records.length})
            </p>
            <div className="space-y-2">
              {records.map((rec) => {
                const mechanic = getUserById(rec.mechanicId)
                const totalCost = rec.workItems.reduce((s, w) => s + w.cost, 0)
                return (
                  <div key={rec.id} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wrench className="h-3.5 w-3.5 text-orange-600" />
                        <span className="text-sm font-medium">{serviceTypeLabels[rec.serviceType] || rec.serviceType}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(rec.date).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Mecánico: <span className="font-medium text-foreground">{mechanic?.name}</span>
                      </span>
                      <span className="text-muted-foreground">
                        {new Intl.NumberFormat("es-ES").format(rec.mileage)} km
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {rec.workItems.map((w, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{w.description}</span>
                          <span className="font-medium shrink-0 ml-2">{formatCurrency(w.cost)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs border-t pt-1">
                      <span className="font-medium">Total</span>
                      <span className="font-bold text-primary">{formatCurrency(totalCost)}</span>
                    </div>
                    {rec.notes && (
                      <p className="text-[10px] text-muted-foreground italic">{rec.notes}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}
    </div>
  )
}

export default function VehiculosPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("todos")
  const [fuelFilter, setFuelFilter] = useState<string>("todos")
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)

  const filtered = vehicles.filter((v) => {
    const matchesSearch =
      v.brand.toLowerCase().includes(search.toLowerCase()) ||
      v.model.toLowerCase().includes(search.toLowerCase()) ||
      v.licensePlate.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "todos" || v.status === statusFilter
    const matchesFuel = fuelFilter === "todos" || v.fuelType === fuelFilter
    return matchesSearch && matchesStatus && matchesFuel
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vehículos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {vehicles.length} vehículos en inventario
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por marca, modelo o matrícula..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "todos")}>
          <SelectTrigger className="w-[160px] h-9">
            <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="disponible">Disponible</SelectItem>
            <SelectItem value="reservado">Reservado</SelectItem>
            <SelectItem value="vendido">Vendido</SelectItem>
            <SelectItem value="en_taller">En taller</SelectItem>
          </SelectContent>
        </Select>
        <Select value={fuelFilter} onValueChange={(v) => setFuelFilter(v ?? "todos")}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Combustible" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todo combustible</SelectItem>
            <SelectItem value="gasolina">Gasolina</SelectItem>
            <SelectItem value="diesel">Diésel</SelectItem>
            <SelectItem value="híbrido">Híbrido</SelectItem>
            <SelectItem value="eléctrico">Eléctrico</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehículo</TableHead>
                <TableHead>Matrícula</TableHead>
                <TableHead>Año</TableHead>
                <TableHead>Combustible</TableHead>
                <TableHead>Km</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((vehicle) => {
                const cfg = statusConfig[vehicle.status]
                return (
                  <TableRow
                    key={vehicle.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedVehicle(vehicle)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                          <Car className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{vehicle.brand} {vehicle.model}</p>
                          <p className="text-xs text-muted-foreground">{vehicle.color}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-mono">{vehicle.licensePlate}</TableCell>
                    <TableCell className="text-sm">{vehicle.year}</TableCell>
                    <TableCell className="text-sm">{fuelLabels[vehicle.fuelType]}</TableCell>
                    <TableCell className="text-sm">{formatMileage(vehicle.mileage)}</TableCell>
                    <TableCell className="text-sm font-semibold">{formatCurrency(vehicle.price)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium ${cfg.className}`}>
                        {cfg.label}
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No se encontraron vehículos
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Vehicle Detail Dialog */}
      <Dialog open={!!selectedVehicle} onOpenChange={() => setSelectedVehicle(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              {selectedVehicle?.brand} {selectedVehicle?.model}
            </DialogTitle>
          </DialogHeader>
          {selectedVehicle && (
            <VehicleDetail vehicle={selectedVehicle} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
