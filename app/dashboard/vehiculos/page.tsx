"use client"

import { useState, useEffect, useRef } from "react"
import { Car, Search, Filter, Camera, ChevronLeft, ChevronRight, ImageOff, Euro, Wrench, History, Upload, Info, ClipboardList, Gauge, Droplets, CircleDot, CalendarDays, Plus, Pencil, Trash2, X } from "lucide-react"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useStore } from "@/lib/store"
import { useAuth } from "@/lib/auth"
import { uploadVehiclePhoto } from "@/lib/supabase-service"
import { getAllBrands, getModelsForBrand } from "@/lib/car-brands"
import type { Vehicle, VehicleStatus, FuelType, TransmissionType } from "@/types"

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

type VehicleTab = "info" | "fotos" | "mantenimiento" | "historial"

function VehicleDetail({ vehicle }: { vehicle: Vehicle }) {
  const { getServiceRecordsByVehicle, getUserById, getClientVehicleInfoFn, updateVehicle } = useStore()
  const [currentPhoto, setCurrentPhoto] = useState(0)
  const [activeTab, setActiveTab] = useState<VehicleTab>("info")
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handlePhotoUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const urls = await Promise.all(
        Array.from(files).map((file) => uploadVehiclePhoto(vehicle.id, file))
      )
      updateVehicle(vehicle.id, { images: [...vehicle.images, ...urls] })
    } catch (err) {
      console.error("Error subiendo fotos:", err)
    } finally {
      setUploading(false)
    }
  }
  const hasPhotos = vehicle.images.length > 0
  const margin = vehicle.price - vehicle.purchasePrice
  const marginPct = ((margin / vehicle.purchasePrice) * 100).toFixed(1)
  const tracking = getClientVehicleInfoFn(vehicle.id)
  const records = getServiceRecordsByVehicle(vehicle.id)

  const vtabs: { id: VehicleTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "info", label: "Info", icon: <Info className="h-3.5 w-3.5" /> },
    { id: "fotos", label: "Fotos", icon: <Camera className="h-3.5 w-3.5" />, badge: vehicle.images.length },
    { id: "mantenimiento", label: "Mantenimiento", icon: <Gauge className="h-3.5 w-3.5" /> },
    { id: "historial", label: "Historial", icon: <History className="h-3.5 w-3.5" />, badge: records.length },
  ]

  return (
    <div className="space-y-4">
      {/* Status + price summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={statusConfig[vehicle.status].className}>
            {statusConfig[vehicle.status].label}
          </Badge>
          <span className="text-xs text-muted-foreground">{vehicle.year} · {formatMileage(vehicle.mileage)}</span>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-primary">{formatCurrency(vehicle.price)}</p>
          <p className={`text-xs font-medium ${margin >= 0 ? "text-green-600" : "text-destructive"}`}>
            Margen: {formatCurrency(margin)} ({marginPct}%)
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-lg border p-1">
        {vtabs.map((tab) => (
          <Button key={tab.id} variant={activeTab === tab.id ? "default" : "ghost"} size="sm" className="h-8 px-3 text-xs" onClick={() => setActiveTab(tab.id)}>
            {tab.icon}
            <span className="ml-1">{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="ml-1 text-[10px] bg-primary/20 text-primary rounded-full px-1.5">{tab.badge}</span>
            )}
          </Button>
        ))}
      </div>

      {/* TAB: Info */}
      {activeTab === "info" && (
        <div className="space-y-4">
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
              <p className="text-sm mt-1 bg-muted/30 rounded-lg p-3">{vehicle.description}</p>
            </div>
          )}
        </div>
      )}

      {/* TAB: Fotos */}
      {activeTab === "fotos" && (
        <div className="space-y-4">
          {/* Upload button */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{vehicle.images.length} fotos</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => { handlePhotoUpload(e.target.files); e.target.value = "" }}
            />
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              {uploading ? "Subiendo..." : "Subir fotos"}
            </Button>
          </div>

          {hasPhotos ? (
            <div className="rounded-lg border overflow-hidden">
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
                    <Button variant="secondary" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 backdrop-blur" onClick={() => setCurrentPhoto((p) => (p === 0 ? vehicle.images.length - 1 : p - 1))}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="secondary" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 backdrop-blur" onClick={() => setCurrentPhoto((p) => (p === vehicle.images.length - 1 ? 0 : p + 1))}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Camera className="h-3 w-3" />
                  {currentPhoto + 1}/{vehicle.images.length}
                </div>
              </div>
              {vehicle.images.length > 1 && (
                <div className="flex gap-1 p-2 bg-muted/30 overflow-x-auto">
                  {vehicle.images.map((img, i) => (
                    <button key={i} className={`shrink-0 h-12 w-16 rounded overflow-hidden border-2 transition-colors ${i === currentPhoto ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"}`} onClick={() => setCurrentPhoto(i)}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-8 flex flex-col items-center justify-center gap-3">
              <ImageOff className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No hay fotos de este vehículo</p>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                {uploading ? "Subiendo..." : "Subir primera foto"}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* TAB: Mantenimiento */}
      {activeTab === "mantenimiento" && (
        <div className="space-y-4">
          {tracking ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {tracking.lastMileage && (
                  <Card className="border-border/50">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <Gauge className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-[10px] text-muted-foreground">Último km registrado</p>
                          <p className="text-sm font-bold">{new Intl.NumberFormat("es-ES").format(tracking.lastMileage)} km</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {tracking.nextOilChangeKm && (
                  <Card className="border-border/50">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <Droplets className="h-4 w-4 text-yellow-600" />
                        <div>
                          <p className="text-[10px] text-muted-foreground">Próx. cambio aceite</p>
                          <p className="text-sm font-bold">{new Intl.NumberFormat("es-ES").format(tracking.nextOilChangeKm)} km</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {tracking.nextTireChangeKm && (
                  <Card className="border-border/50">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <CircleDot className="h-4 w-4 text-orange-600" />
                        <div>
                          <p className="text-[10px] text-muted-foreground">Próx. neumáticos</p>
                          <p className="text-sm font-bold">{new Intl.NumberFormat("es-ES").format(tracking.nextTireChangeKm)} km</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {tracking.nextRevisionDate && (
                  <Card className="border-border/50">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-[10px] text-muted-foreground">Próx. revisión</p>
                          <p className="text-sm font-bold">{new Date(tracking.nextRevisionDate).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
              {tracking.notes && (
                <div className="rounded-lg bg-muted/30 p-3">
                  <p className="text-[10px] text-muted-foreground mb-1">Notas</p>
                  <p className="text-xs">{tracking.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Gauge className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Sin datos de seguimiento para este vehículo</p>
              <p className="text-[10px] text-muted-foreground mt-1">Se generará automáticamente al cerrar citas de taller</p>
            </div>
          )}
        </div>
      )}

      {/* TAB: Historial */}
      {activeTab === "historial" && (
        <div className="space-y-3">
          {records.length > 0 ? (
            records.map((rec) => {
              const mechanic = getUserById(rec.mechanicId)
              const totalCost = rec.workItems.reduce((s, w) => s + w.cost, 0)
              return (
                <Card key={rec.id} className="border-border/50">
                  <CardContent className="p-4 space-y-2">
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
                      <span className="text-muted-foreground">{new Intl.NumberFormat("es-ES").format(rec.mileage)} km</span>
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
                    {rec.notes && <p className="text-[10px] text-muted-foreground italic">{rec.notes}</p>}
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <History className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Sin historial de taller</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Vehicle Form Dialog ──────────────────────────────────────────────────

interface VehicleFormProps {
  open: boolean
  onClose: () => void
  vehicle?: Vehicle | null
}

const emptyForm = {
  brand: "", model: "", year: new Date().getFullYear(), color: "",
  licensePlate: "", vin: "", mileage: 0, purchasePrice: 0, price: 0,
  fuelType: "gasolina" as FuelType, transmission: "manual" as TransmissionType,
  status: "disponible" as VehicleStatus, description: "", images: [] as string[],
}

function VehicleFormDialog({ open, onClose, vehicle }: VehicleFormProps) {
  const { addVehicle, updateVehicle } = useStore()
  const isEdit = !!vehicle
  const [form, setForm] = useState(emptyForm)
  const [formUploading, setFormUploading] = useState(false)
  const formFileInputRef = useRef<HTMLInputElement>(null)

  async function handleFormPhotoUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setFormUploading(true)
    try {
      const vehicleId = vehicle?.id || "new-" + Date.now()
      const urls = await Promise.all(
        Array.from(files).map((file) => uploadVehiclePhoto(vehicleId, file))
      )
      setForm((f) => ({ ...f, images: [...f.images, ...urls] }))
    } catch (err) {
      console.error("Error subiendo fotos:", err)
    } finally {
      setFormUploading(false)
    }
  }

  function removeFormImage(index: number) {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== index) }))
  }

  useEffect(() => {
    if (vehicle) {
      setForm({
        brand: vehicle.brand, model: vehicle.model, year: vehicle.year, color: vehicle.color,
        licensePlate: vehicle.licensePlate, vin: vehicle.vin, mileage: vehicle.mileage,
        purchasePrice: vehicle.purchasePrice, price: vehicle.price,
        fuelType: vehicle.fuelType, transmission: vehicle.transmission,
        status: vehicle.status, description: vehicle.description || "", images: vehicle.images,
      })
    } else {
      setForm(emptyForm)
    }
  }, [vehicle, open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.brand || !form.model || !form.licensePlate) return
    if (isEdit) {
      updateVehicle(vehicle.id, form)
    } else {
      addVehicle(form)
    }
    onClose()
  }

  const set = (field: string, value: string | number | null) => { if (value !== null) setForm((f) => ({ ...f, [field]: value })) }

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            {isEdit ? "Editar vehículo" : "Nuevo vehículo"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Brand + Model with autocomplete */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5 relative">
              <Label>Marca *</Label>
              <Input
                value={form.brand}
                onChange={(e) => set("brand", e.target.value)}
                placeholder="Ej: Toyota"
                required
                list="brand-suggestions"
              />
              <datalist id="brand-suggestions">
                {getAllBrands()
                  .filter((b) => !form.brand || b.toLowerCase().includes(form.brand.toLowerCase()))
                  .map((b) => <option key={b} value={b} />)}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label>Modelo *</Label>
              <Input
                value={form.model}
                onChange={(e) => set("model", e.target.value)}
                placeholder="Ej: Corolla 1.8 Hybrid"
                required
                list="model-suggestions"
              />
              <datalist id="model-suggestions">
                {getModelsForBrand(form.brand)
                  .filter((m) => !form.model || m.toLowerCase().includes(form.model.toLowerCase()))
                  .map((m) => <option key={m} value={m} />)}
              </datalist>
            </div>
          </div>

          {/* Year + Color + Plate */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Año</Label>
              <Input type="number" value={form.year} onChange={(e) => set("year", Number(e.target.value))} min={1990} max={2030} />
            </div>
            <div className="space-y-1.5">
              <Label>Color</Label>
              <Input value={form.color} onChange={(e) => set("color", e.target.value)} placeholder="Ej: Blanco" />
            </div>
            <div className="space-y-1.5">
              <Label>Matrícula *</Label>
              <Input value={form.licensePlate} onChange={(e) => set("licensePlate", e.target.value)} placeholder="Ej: 1234 ABC" required />
            </div>
          </div>

          {/* VIN + Mileage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>VIN</Label>
              <Input value={form.vin} onChange={(e) => set("vin", e.target.value)} placeholder="Número de bastidor" />
            </div>
            <div className="space-y-1.5">
              <Label>Kilometraje</Label>
              <Input type="number" value={form.mileage} onChange={(e) => set("mileage", Number(e.target.value))} min={0} />
            </div>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Precio de compra (€)</Label>
              <Input type="number" value={form.purchasePrice} onChange={(e) => set("purchasePrice", Number(e.target.value))} min={0} step={100} />
            </div>
            <div className="space-y-1.5">
              <Label>Precio de venta (€)</Label>
              <Input type="number" value={form.price} onChange={(e) => set("price", Number(e.target.value))} min={0} step={100} />
            </div>
          </div>

          {/* Fuel + Transmission + Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Combustible</Label>
              <Select value={form.fuelType} onValueChange={(v) => set("fuelType", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gasolina">Gasolina</SelectItem>
                  <SelectItem value="diesel">Diésel</SelectItem>
                  <SelectItem value="híbrido">Híbrido</SelectItem>
                  <SelectItem value="eléctrico">Eléctrico</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Transmisión</Label>
              <Select value={form.transmission} onValueChange={(v) => set("transmission", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="automático">Automático</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="disponible">Disponible</SelectItem>
                  <SelectItem value="reservado">Reservado</SelectItem>
                  <SelectItem value="vendido">Vendido</SelectItem>
                  <SelectItem value="en_taller">En taller</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>Descripción</Label>
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Detalles adicionales del vehículo..." rows={3} />
          </div>

          {/* Photos */}
          <div className="space-y-1.5">
            <Label>Fotos</Label>
            <input
              ref={formFileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => { handleFormPhotoUpload(e.target.files); e.target.value = "" }}
            />
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => formFileInputRef.current?.click()} disabled={formUploading}>
              {formUploading ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              {formUploading ? "Subiendo..." : "Añadir fotos"}
            </Button>
            {form.images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.images.map((img, i) => (
                  <div key={i} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={`Foto ${i + 1}`} className="h-16 w-20 rounded border object-cover" />
                    <button
                      type="button"
                      className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeFormImage(i)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">{isEdit ? "Guardar cambios" : "Añadir vehículo"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VehiculosPage() {
  const { vehicles, deleteVehicle, appointments, getUserById } = useStore()
  const { canEdit } = useAuth()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("todos")
  const [fuelFilter, setFuelFilter] = useState<string>("todos")
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [activeSection, setActiveSection] = useState<"stock" | "taller">("stock")

  const stockCount = vehicles.filter((v) => v.status !== "vendido").length
  const tallerCount = vehicles.filter((v) => v.status === "en_taller").length

  // Build a map of vehicleId -> active appointment for the "En taller" tab
  const tallerAppointmentMap = new Map(
    appointments
      .filter((a) => a.status === "pendiente" || a.status === "en_progreso")
      .map((a) => [a.vehicleId, a])
  )

  const filtered = vehicles.filter((v) => {
    // Section filter
    if (activeSection === "stock" && v.status === "vendido") return false
    if (activeSection === "taller" && v.status !== "en_taller") return false

    const matchesSearch =
      v.brand.toLowerCase().includes(search.toLowerCase()) ||
      v.model.toLowerCase().includes(search.toLowerCase()) ||
      v.licensePlate.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "todos" || v.status === statusFilter
    const matchesFuel = fuelFilter === "todos" || v.fuelType === fuelFilter
    return matchesSearch && matchesStatus && matchesFuel
  })

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Vehículos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {vehicles.length} vehículos en inventario
          </p>
        </div>
        {canEdit("vehiculos") && (
          <Button onClick={() => { setEditingVehicle(null); setFormOpen(true) }} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Nuevo vehículo
          </Button>
        )}
      </div>

      {/* Section tabs */}
      <div className="flex items-center gap-1 rounded-lg border p-1 w-fit">
        <Button variant={activeSection === "stock" ? "default" : "ghost"} size="sm" className="h-9 px-4" onClick={() => setActiveSection("stock")}>
          <Car className="h-4 w-4 mr-1.5" />
          Stock ({stockCount})
        </Button>
        <Button variant={activeSection === "taller" ? "default" : "ghost"} size="sm" className="h-9 px-4" onClick={() => setActiveSection("taller")}>
          <Wrench className="h-4 w-4 mr-1.5" />
          En taller ({tallerCount})
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-0 w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por marca, modelo o matrícula..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "todos")}>
          <SelectTrigger className="w-full md:w-[160px] h-9">
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
          <SelectTrigger className="w-full md:w-[160px] h-9">
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

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {filtered.map((vehicle) => {
          const cfg = statusConfig[vehicle.status]
          const appt = activeSection === "taller" ? tallerAppointmentMap.get(vehicle.id) : undefined
          const mechanic = appt ? getUserById(appt.mechanicId) : undefined
          return (
            <Card key={vehicle.id} className="border-border/50 cursor-pointer" onClick={() => setSelectedVehicle(vehicle)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted shrink-0">
                      <Car className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{vehicle.brand} {vehicle.model}</p>
                      <p className="text-xs text-muted-foreground">{vehicle.year} · {vehicle.licensePlate}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-semibold">{formatCurrency(vehicle.price)}</p>
                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium ${cfg.className}`}>
                      {cfg.label}
                    </span>
                  </div>
                </div>
                {activeSection === "taller" && appt && (
                  <div className="mt-2 pt-2 border-t flex items-center gap-2 text-xs text-muted-foreground">
                    <Wrench className="h-3 w-3 text-orange-600 shrink-0" />
                    <span>{serviceTypeLabels[appt.serviceType] || appt.serviceType}</span>
                    {mechanic && <span>· {mechanic.name}</span>}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No se encontraron vehículos
          </div>
        )}
      </div>

      {/* Desktop table */}
      <Card className="border-border/50 hidden md:block">
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
                {activeSection === "taller" && <TableHead>Servicio</TableHead>}
                {activeSection === "taller" && <TableHead>Mecánico</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((vehicle) => {
                const cfg = statusConfig[vehicle.status]
                const appt = activeSection === "taller" ? tallerAppointmentMap.get(vehicle.id) : undefined
                const mechanic = appt ? getUserById(appt.mechanicId) : undefined
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
                    {activeSection === "taller" && (
                      <TableCell className="text-sm">
                        {appt ? (serviceTypeLabels[appt.serviceType] || appt.serviceType) : "—"}
                      </TableCell>
                    )}
                    {activeSection === "taller" && (
                      <TableCell className="text-sm">
                        {mechanic ? mechanic.name : "—"}
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={activeSection === "taller" ? 9 : 7} className="h-24 text-center text-muted-foreground">
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
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              {selectedVehicle?.brand} {selectedVehicle?.model}
            </DialogTitle>
          </DialogHeader>
          {selectedVehicle && (
            <>
              <VehicleDetail vehicle={selectedVehicle} />
              {canEdit("vehiculos") && (
                <div className="flex justify-end gap-2 border-t pt-3 mt-2">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
                    setSelectedVehicle(null)
                    setEditingVehicle(selectedVehicle)
                    setFormOpen(true)
                  }}>
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                  <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => {
                    if (confirm("¿Eliminar este vehículo? Esta acción no se puede deshacer.")) {
                      deleteVehicle(selectedVehicle.id)
                      setSelectedVehicle(null)
                    }
                  }}>
                    <Trash2 className="h-3.5 w-3.5" />
                    Eliminar
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Vehicle Form Dialog (create/edit) */}
      <VehicleFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingVehicle(null) }}
        vehicle={editingVehicle}
      />
    </div>
  )
}
