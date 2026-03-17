"use client"

import { useState, useEffect } from "react"
import { Search, Users, Mail, Phone, MapPin, Car, Wrench, ShoppingCart, CalendarDays, Gauge, Droplets, CircleDot, Plus, Pencil, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useStore } from "@/lib/store"
import { useAuth } from "@/lib/auth"
import type { Client, Sale, Appointment } from "@/types"

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

const statusLabels: Record<string, string> = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  completada: "Completada",
  cancelada: "Cancelada",
}

const statusColors: Record<string, string> = {
  pendiente: "bg-yellow-500/10 text-yellow-600",
  en_progreso: "bg-blue-500/10 text-blue-600",
  completada: "bg-green-500/10 text-green-600",
  cancelada: "bg-red-500/10 text-red-600",
}

const saleStatusLabels: Record<string, string> = {
  en_proceso: "En proceso",
  completada: "Completada",
  cancelada: "Cancelada",
}

const paymentLabels: Record<string, string> = {
  contado: "Contado",
  financiación: "Financiación",
  leasing: "Leasing",
}

function ClientDetail({
  client,
  clientSales,
  clientAppointments,
}: {
  client: Client
  clientSales: Sale[]
  clientAppointments: Appointment[]
}) {
  const { getVehicleById, getUserById, getServiceRecordsByVehicle, getClientVehicleInfoFn } = useStore()

  // Get unique vehicle IDs from sales and appointments
  const vehicleIds = [
    ...new Set([
      ...clientSales.map((s) => s.vehicleId),
      ...clientAppointments.map((a) => a.vehicleId),
    ]),
  ]

  return (
    <div className="space-y-6">
      {/* Contact Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2 text-sm">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span>{client.email}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span>{client.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-sm col-span-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span>{client.address}, {client.postalCode} {client.city}</span>
        </div>
        <div className="text-sm text-muted-foreground col-span-2">
          Cliente desde {new Date(client.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
        </div>
      </div>
      {client.notes && (
        <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">{client.notes}</p>
      )}

      {/* Vehicle Tracking */}
      {vehicleIds.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Car className="h-4 w-4" />
            Vehículos asociados
          </h3>
          <div className="space-y-3">
            {vehicleIds.map((vId) => {
              const vehicle = getVehicleById(vId)
              if (!vehicle) return null
              const tracking = getClientVehicleInfoFn(vId)
              const records = getServiceRecordsByVehicle(vId)

              return (
                <Card key={vId} className="border-border/50">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {vehicle.brand} {vehicle.model} ({vehicle.year})
                      </p>
                      <span className="text-xs text-muted-foreground font-mono">{vehicle.licensePlate}</span>
                    </div>

                    {/* Tracking Info */}
                    {tracking && (
                      <div className="grid grid-cols-2 gap-2">
                        {tracking.lastMileage && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>Último km: <span className="font-medium">{tracking.lastMileage.toLocaleString("es-ES")} km</span></span>
                          </div>
                        )}
                        {tracking.nextOilChangeKm && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <Droplets className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>Próx. aceite: <span className="font-medium">{tracking.nextOilChangeKm.toLocaleString("es-ES")} km</span></span>
                          </div>
                        )}
                        {tracking.nextTireChangeKm && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <CircleDot className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>Próx. neumáticos: <span className="font-medium">{tracking.nextTireChangeKm.toLocaleString("es-ES")} km</span></span>
                          </div>
                        )}
                        {tracking.nextRevisionDate && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>Próx. revisión: <span className="font-medium">{new Date(tracking.nextRevisionDate).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}</span></span>
                          </div>
                        )}
                        {tracking.notes && (
                          <p className="text-xs text-muted-foreground col-span-2 mt-1">{tracking.notes}</p>
                        )}
                      </div>
                    )}

                    {/* Service History for this vehicle */}
                    {records.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                          <Wrench className="h-3 w-3" /> Historial de taller
                        </p>
                        <div className="space-y-1.5">
                          {records.map((r) => {
                            const mechanic = getUserById(r.mechanicId)
                            return (
                              <div key={r.id} className="flex items-center justify-between text-xs bg-muted/30 rounded px-2 py-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">
                                    {new Date(r.date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                                  </span>
                                  <span>{serviceTypeLabels[r.serviceType] || r.serviceType}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">{mechanic?.name?.split(" ")[0]}</span>
                                  <span className="font-medium">{r.workItems.reduce((s, w) => s + w.cost, 0).toLocaleString("es-ES")}€</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Purchase History */}
      {clientSales.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Compras ({clientSales.length})
          </h3>
          <div className="space-y-2">
            {clientSales.map((sale) => {
              const vehicle = getVehicleById(sale.vehicleId)
              return (
                <div key={sale.id} className="flex items-center justify-between text-sm bg-muted/30 rounded-lg px-3 py-2">
                  <div>
                    <p className="font-medium">{vehicle ? `${vehicle.brand} ${vehicle.model}` : "Vehículo"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(sale.saleDate).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                      {" · "}{paymentLabels[sale.paymentMethod] || sale.paymentMethod}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{sale.salePrice.toLocaleString("es-ES")}€</p>
                    <Badge variant="secondary" className={`text-[10px] ${statusColors[sale.status] || ""}`}>
                      {saleStatusLabels[sale.status] || sale.status}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Appointment History */}
      {clientAppointments.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Citas ({clientAppointments.length})
          </h3>
          <div className="space-y-2">
            {clientAppointments.map((apt) => {
              const vehicle = getVehicleById(apt.vehicleId)
              return (
                <div key={apt.id} className="flex items-center justify-between text-sm bg-muted/30 rounded-lg px-3 py-2">
                  <div>
                    <p className="font-medium">{serviceTypeLabels[apt.serviceType] || apt.serviceType}</p>
                    <p className="text-xs text-muted-foreground">
                      {vehicle ? `${vehicle.brand} ${vehicle.model}` : ""}{" · "}
                      {new Date(apt.date).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{(apt.finalCost ?? apt.estimatedCost).toLocaleString("es-ES")}€</p>
                    <Badge variant="secondary" className={`text-[10px] ${statusColors[apt.status] || ""}`}>
                      {statusLabels[apt.status] || apt.status}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Client Form Dialog ───────────────────────────────────────────────────

interface ClientFormProps {
  open: boolean
  onClose: () => void
  client?: Client | null
}

const emptyClientForm = {
  name: "", email: "", phone: "", dni: "", address: "", city: "", postalCode: "", notes: "",
}

function ClientFormDialog({ open, onClose, client }: ClientFormProps) {
  const { addClient, updateClient } = useStore()
  const isEdit = !!client
  const [form, setForm] = useState(emptyClientForm)

  useEffect(() => {
    if (client) {
      setForm({
        name: client.name, email: client.email, phone: client.phone, dni: client.dni,
        address: client.address, city: client.city, postalCode: client.postalCode, notes: client.notes || "",
      })
    } else {
      setForm(emptyClientForm)
    }
  }, [client, open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.phone) return
    if (isEdit) {
      updateClient(client.id, form)
    } else {
      addClient(form)
    }
    onClose()
  }

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }))

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {isEdit ? "Editar cliente" : "Nuevo cliente"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label>Nombre completo *</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ej: Antonio Rodríguez García" required />
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono *</Label>
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="Ej: 612 345 678" required />
            </div>
            <div className="space-y-1.5">
              <Label>DNI / NIE</Label>
              <Input value={form.dni} onChange={(e) => set("dni", e.target.value)} placeholder="Ej: 12345678A" />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="correo@ejemplo.com" />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Dirección</Label>
              <Input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Calle, número, piso..." />
            </div>
            <div className="space-y-1.5">
              <Label>Ciudad</Label>
              <Input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Ej: Madrid" />
            </div>
            <div className="space-y-1.5">
              <Label>Código postal</Label>
              <Input value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} placeholder="Ej: 28001" />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Notas</Label>
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Observaciones sobre el cliente..." rows={2} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">{isEdit ? "Guardar cambios" : "Añadir cliente"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

export default function ClientesPage() {
  const { clients, sales, appointments, deleteClient } = useStore()
  const { canEdit } = useAuth()
  const [search, setSearch] = useState("")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.dni.toLowerCase().includes(search.toLowerCase())
  )

  const clientSales = selectedClient
    ? sales.filter((s) => s.clientId === selectedClient.id)
    : []
  const clientAppointments = selectedClient
    ? appointments.filter((a) => a.clientId === selectedClient.id)
    : []

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {clients.length} clientes registrados
          </p>
        </div>
        {canEdit("clientes") && (
          <Button onClick={() => { setEditingClient(null); setFormOpen(true) }} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Nuevo cliente
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative w-full md:max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, email, teléfono o DNI..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {filtered.map((client) => (
          <Card key={client.id} className="border-border/50 cursor-pointer" onClick={() => setSelectedClient(client)}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {getInitials(client.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{client.name}</p>
                  <p className="text-xs text-muted-foreground">{client.phone}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">{client.city}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No se encontraron clientes
          </div>
        )}
      </div>

      {/* Desktop table */}
      <Card className="border-border/50 hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>DNI</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead>Registro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((client) => (
                <TableRow
                  key={client.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedClient(client)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                          {getInitials(client.name)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-sm font-medium">{client.name}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{client.email}</TableCell>
                  <TableCell className="text-sm">{client.phone}</TableCell>
                  <TableCell className="text-sm font-mono">{client.dni}</TableCell>
                  <TableCell className="text-sm">{client.city}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(client.createdAt).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No se encontraron clientes
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Client Detail Dialog */}
      <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                  {selectedClient ? getInitials(selectedClient.name) : ""}
                </AvatarFallback>
              </Avatar>
              <div>
                {selectedClient?.name}
                <p className="text-xs text-muted-foreground font-normal">DNI: {selectedClient?.dni}</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <>
              <ClientDetail
                client={selectedClient}
                clientSales={clientSales}
                clientAppointments={clientAppointments}
              />
              {canEdit("clientes") && (
                <div className="flex justify-end gap-2 border-t pt-3 mt-2">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
                    setSelectedClient(null)
                    setEditingClient(selectedClient)
                    setFormOpen(true)
                  }}>
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                  <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => {
                    if (confirm("¿Eliminar este cliente? Esta acción no se puede deshacer.")) {
                      deleteClient(selectedClient.id)
                      setSelectedClient(null)
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

      {/* Client Form Dialog */}
      <ClientFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingClient(null) }}
        client={editingClient}
      />
    </div>
  )
}
