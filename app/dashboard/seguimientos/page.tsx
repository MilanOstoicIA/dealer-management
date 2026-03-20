"use client"

import { useState } from "react"
import {
  ClipboardCheck,
  Plus,
  Package,
  FileText,
  Car,
  ArrowRightLeft,
  Shield,
  CreditCard,
  CircleDot,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Trash2,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useStore } from "@/lib/store"
import { useAuth } from "@/lib/auth"
import type { TrackingCategory, TrackingStatus, TrackingPriority } from "@/types"

const categoryConfig: Record<TrackingCategory, { label: string; icon: React.ReactNode; color: string }> = {
  pedido_piezas: { label: "Pedido de piezas", icon: <Package className="h-4 w-4" />, color: "bg-blue-500/15 text-blue-600 border-blue-500/20" },
  documentacion: { label: "Documentaci\u00f3n", icon: <FileText className="h-4 w-4" />, color: "bg-purple-500/15 text-purple-600 border-purple-500/20" },
  matriculacion: { label: "Matriculaci\u00f3n", icon: <Car className="h-4 w-4" />, color: "bg-green-500/15 text-green-600 border-green-500/20" },
  transferencia: { label: "Transferencia", icon: <ArrowRightLeft className="h-4 w-4" />, color: "bg-orange-500/15 text-orange-600 border-orange-500/20" },
  itv: { label: "ITV", icon: <Shield className="h-4 w-4" />, color: "bg-cyan-500/15 text-cyan-600 border-cyan-500/20" },
  seguro: { label: "Seguro", icon: <Shield className="h-4 w-4" />, color: "bg-teal-500/15 text-teal-600 border-teal-500/20" },
  financiacion: { label: "Financiaci\u00f3n", icon: <CreditCard className="h-4 w-4" />, color: "bg-yellow-500/15 text-yellow-600 border-yellow-500/20" },
  otro: { label: "Otro", icon: <CircleDot className="h-4 w-4" />, color: "bg-gray-500/15 text-gray-600 border-gray-500/20" },
}

const statusConfig: Record<TrackingStatus, { label: string; icon: React.ReactNode; color: string }> = {
  pendiente: { label: "Pendiente", icon: <Clock className="h-3.5 w-3.5" />, color: "bg-yellow-500/15 text-yellow-600 border-yellow-500/20" },
  en_progreso: { label: "En progreso", icon: <CircleDot className="h-3.5 w-3.5" />, color: "bg-blue-500/15 text-blue-600 border-blue-500/20" },
  completado: { label: "Completado", icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: "bg-green-500/15 text-green-600 border-green-500/20" },
  cancelado: { label: "Cancelado", icon: <XCircle className="h-3.5 w-3.5" />, color: "bg-destructive/15 text-destructive border-destructive/20" },
}

const priorityConfig: Record<TrackingPriority, { label: string; color: string }> = {
  baja: { label: "Baja", color: "bg-gray-500/15 text-gray-600 border-gray-500/20" },
  media: { label: "Media", color: "bg-blue-500/15 text-blue-600 border-blue-500/20" },
  alta: { label: "Alta", color: "bg-orange-500/15 text-orange-600 border-orange-500/20" },
  urgente: { label: "Urgente", color: "bg-red-500/15 text-red-600 border-red-500/20" },
}

export default function SeguimientosPage() {
  const { trackings, vehicles, clients, sales, users, addTracking, updateTracking, deleteTracking, getVehicleById, getClientById, getUserById } = useStore()
  const { user, canEdit, isViewer } = useAuth()
  const canEditSection = canEdit("seguimientos")

  const [filterStatus, setFilterStatus] = useState<TrackingStatus | "todos">("todos")
  const [filterCategory, setFilterCategory] = useState<TrackingCategory | "todos">("todos")
  const [search, setSearch] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedTracking, setSelectedTracking] = useState<string | null>(null)

  // Form state
  const [formCategory, setFormCategory] = useState<TrackingCategory>("pedido_piezas")
  const [formTitle, setFormTitle] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formPriority, setFormPriority] = useState<TrackingPriority>("media")
  const [formVehicleId, setFormVehicleId] = useState("")
  const [formClientId, setFormClientId] = useState("")
  const [formSaleId, setFormSaleId] = useState("")
  const [formAssignedTo, setFormAssignedTo] = useState("")
  const [formDueDate, setFormDueDate] = useState("")
  const [formNotes, setFormNotes] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)

  // Filter and sort
  const filtered = trackings
    .filter((t) => {
      if (filterStatus !== "todos" && t.status !== filterStatus) return false
      if (filterCategory !== "todos" && t.category !== filterCategory) return false
      if (search) {
        const s = search.toLowerCase()
        const vehicle = t.vehicleId ? getVehicleById(t.vehicleId) : null
        const client = t.clientId ? getClientById(t.clientId) : null
        return (
          t.title.toLowerCase().includes(s) ||
          (t.description || "").toLowerCase().includes(s) ||
          (vehicle && `${vehicle.brand} ${vehicle.model}`.toLowerCase().includes(s)) ||
          (client && client.name.toLowerCase().includes(s))
        )
      }
      return true
    })
    .sort((a, b) => {
      // Active first, then by priority, then by date
      const statusOrder: Record<TrackingStatus, number> = { pendiente: 0, en_progreso: 1, completado: 2, cancelado: 3 }
      const priorityOrder: Record<TrackingPriority, number> = { urgente: 0, alta: 1, media: 2, baja: 3 }
      if (statusOrder[a.status] !== statusOrder[b.status]) return statusOrder[a.status] - statusOrder[b.status]
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) return priorityOrder[a.priority] - priorityOrder[b.priority]
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  const stats = {
    pendiente: trackings.filter((t) => t.status === "pendiente").length,
    en_progreso: trackings.filter((t) => t.status === "en_progreso").length,
    completado: trackings.filter((t) => t.status === "completado").length,
    total: trackings.length,
  }

  function resetForm() {
    setFormCategory("pedido_piezas")
    setFormTitle("")
    setFormDescription("")
    setFormPriority("media")
    setFormVehicleId("")
    setFormClientId("")
    setFormSaleId("")
    setFormAssignedTo("")
    setFormDueDate("")
    setFormNotes("")
    setEditingId(null)
  }

  function openNewForm() {
    resetForm()
    setFormOpen(true)
  }

  function openEditForm(id: string) {
    const t = trackings.find((tr) => tr.id === id)
    if (!t) return
    setEditingId(id)
    setFormCategory(t.category)
    setFormTitle(t.title)
    setFormDescription(t.description || "")
    setFormPriority(t.priority)
    setFormVehicleId(t.vehicleId || "")
    setFormClientId(t.clientId || "")
    setFormSaleId(t.saleId || "")
    setFormAssignedTo(t.assignedTo || "")
    setFormDueDate(t.dueDate || "")
    setFormNotes(t.notes || "")
    setFormOpen(true)
  }

  function handleSubmit() {
    if (!formTitle.trim()) return
    const data = {
      category: formCategory,
      title: formTitle.trim(),
      description: formDescription.trim() || undefined,
      status: "pendiente" as TrackingStatus,
      priority: formPriority,
      vehicleId: formVehicleId || undefined,
      clientId: formClientId || undefined,
      saleId: formSaleId || undefined,
      assignedTo: formAssignedTo || undefined,
      dueDate: formDueDate || undefined,
      notes: formNotes.trim() || undefined,
    }
    if (editingId) {
      updateTracking(editingId, data)
    } else {
      addTracking(data)
    }
    setFormOpen(false)
    resetForm()
  }

  function handleStatusChange(id: string, newStatus: TrackingStatus) {
    const updates: Partial<{ status: TrackingStatus; completedAt: string }> = { status: newStatus }
    if (newStatus === "completado") {
      updates.completedAt = new Date().toISOString()
    }
    updateTracking(id, updates)
  }

  const detail = selectedTracking ? trackings.find((t) => t.id === selectedTracking) : null

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Seguimientos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Control de pedidos, documentaci&oacute;n, matriculaciones y tr&aacute;mites
          </p>
        </div>
        {canEditSection && (
          <Button onClick={openNewForm} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Nuevo seguimiento
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/15">
              <Clock className="h-4 w-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-lg font-bold">{stats.pendiente}</p>
              <p className="text-xs text-muted-foreground">Pendientes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15">
              <CircleDot className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-bold">{stats.en_progreso}</p>
              <p className="text-xs text-muted-foreground">En progreso</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/15">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-bold">{stats.completado}</p>
              <p className="text-xs text-muted-foreground">Completados</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
              <ClipboardCheck className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Input
          placeholder="Buscar seguimiento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64"
        />
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as TrackingStatus | "todos")}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue>{filterStatus === "todos" ? "Todos los estados" : statusConfig[filterStatus].label}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="en_progreso">En progreso</SelectItem>
            <SelectItem value="completado">Completado</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as TrackingCategory | "todos")}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue>{filterCategory === "todos" ? "Todas las categor\u00edas" : categoryConfig[filterCategory].label}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas las categor&iacute;as</SelectItem>
            {Object.entries(categoryConfig).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tracking list */}
      <div className="space-y-3">
        {filtered.map((tracking) => {
          const catCfg = categoryConfig[tracking.category]
          const stsCfg = statusConfig[tracking.status]
          const priCfg = priorityConfig[tracking.priority]
          const vehicle = tracking.vehicleId ? getVehicleById(tracking.vehicleId) : null
          const client = tracking.clientId ? getClientById(tracking.clientId) : null
          const assigned = tracking.assignedTo ? getUserById(tracking.assignedTo) : null
          const isOverdue = tracking.dueDate && tracking.status !== "completado" && tracking.status !== "cancelado" && new Date(tracking.dueDate) < new Date()

          return (
            <Card
              key={tracking.id}
              className={`border-border/50 cursor-pointer hover:bg-muted/50 transition-colors ${isOverdue ? "border-red-500/40" : ""}`}
              onClick={() => { setSelectedTracking(tracking.id); setDetailOpen(true) }}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Category icon */}
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${catCfg.color.split(" ")[0]}`}>
                    {catCfg.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{tracking.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {catCfg.label}
                          {vehicle && <> &middot; {vehicle.brand} {vehicle.model}</>}
                          {client && <> &middot; {client.name}</>}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium ${stsCfg.color}`}>
                          {stsCfg.icon}
                          {stsCfg.label}
                        </span>
                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium ${priCfg.color}`}>
                          {priCfg.label}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                      {assigned && <span>Asignado: {assigned.name}</span>}
                      {tracking.dueDate && (
                        <span className={isOverdue ? "text-red-500 font-medium" : ""}>
                          {isOverdue && <AlertTriangle className="h-3 w-3 inline mr-0.5" />}
                          Vence: {new Date(tracking.dueDate).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                        </span>
                      )}
                      <span>Creado: {new Date(tracking.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No hay seguimientos{filterStatus !== "todos" || filterCategory !== "todos" || search ? " con los filtros seleccionados" : ""}
          </div>
        )}
      </div>

      {/* New/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar seguimiento" : "Nuevo seguimiento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Categor&iacute;a</Label>
                <Select value={formCategory} onValueChange={(v) => setFormCategory(v as TrackingCategory)}>
                  <SelectTrigger><SelectValue>{categoryConfig[formCategory].label}</SelectValue></SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryConfig).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Prioridad</Label>
                <Select value={formPriority} onValueChange={(v) => setFormPriority(v as TrackingPriority)}>
                  <SelectTrigger><SelectValue>{priorityConfig[formPriority].label}</SelectValue></SelectTrigger>
                  <SelectContent>
                    {Object.entries(priorityConfig).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>T&iacute;tulo *</Label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Ej: Pedir pastillas de freno para BMW X3" />
            </div>

            <div className="space-y-1.5">
              <Label>Descripci&oacute;n</Label>
              <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Detalles del seguimiento..." rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Veh&iacute;culo</Label>
                <Select value={formVehicleId || "none"} onValueChange={(v) => setFormVehicleId(v === "none" ? "" : v ?? "")}>
                  <SelectTrigger><SelectValue>{formVehicleId ? (() => { const v = vehicles.find(x => x.id === formVehicleId); return v ? `${v.brand} ${v.model}` : "Ninguno" })() : "Ninguno"}</SelectValue></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ninguno</SelectItem>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.brand} {v.model} ({v.licensePlate})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Cliente</Label>
                <Select value={formClientId || "none"} onValueChange={(v) => setFormClientId(v === "none" ? "" : v ?? "")}>
                  <SelectTrigger><SelectValue>{formClientId ? clients.find(c => c.id === formClientId)?.name || "Ninguno" : "Ninguno"}</SelectValue></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ninguno</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Asignado a</Label>
                <Select value={formAssignedTo || "none"} onValueChange={(v) => setFormAssignedTo(v === "none" ? "" : v ?? "")}>
                  <SelectTrigger><SelectValue>{formAssignedTo ? users.find(u => u.id === formAssignedTo)?.name || "Sin asignar" : "Sin asignar"}</SelectValue></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin asignar</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Fecha l&iacute;mite</Label>
                <Input type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Notas</Label>
              <Textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Notas adicionales..." rows={2} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={!formTitle.trim()}>
                {editingId ? "Guardar cambios" : "Crear seguimiento"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {detail && (() => {
            const catCfg = categoryConfig[detail.category]
            const stsCfg = statusConfig[detail.status]
            const priCfg = priorityConfig[detail.priority]
            const vehicle = detail.vehicleId ? getVehicleById(detail.vehicleId) : null
            const client = detail.clientId ? getClientById(detail.clientId) : null
            const assigned = detail.assignedTo ? getUserById(detail.assignedTo) : null
            const sale = detail.saleId ? sales.find((s) => s.id === detail.saleId) : null

            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${catCfg.color.split(" ")[0]}`}>
                      {catCfg.icon}
                    </span>
                    {detail.title}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                  {/* Status & priority badges */}
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium ${stsCfg.color}`}>
                      {stsCfg.icon} {stsCfg.label}
                    </span>
                    <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium ${priCfg.color}`}>
                      {priCfg.label}
                    </span>
                    <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium ${catCfg.color}`}>
                      {catCfg.label}
                    </span>
                  </div>

                  {detail.description && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Descripci&oacute;n</p>
                      <p className="text-sm">{detail.description}</p>
                    </div>
                  )}

                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/50 p-3">
                    {vehicle && (
                      <div>
                        <p className="text-xs text-muted-foreground">Veh&iacute;culo</p>
                        <p className="text-sm font-medium">{vehicle.brand} {vehicle.model}</p>
                        <p className="text-xs text-muted-foreground">{vehicle.licensePlate}</p>
                      </div>
                    )}
                    {client && (
                      <div>
                        <p className="text-xs text-muted-foreground">Cliente</p>
                        <p className="text-sm font-medium">{client.name}</p>
                      </div>
                    )}
                    {assigned && (
                      <div>
                        <p className="text-xs text-muted-foreground">Asignado a</p>
                        <p className="text-sm font-medium">{assigned.name}</p>
                      </div>
                    )}
                    {detail.dueDate && (
                      <div>
                        <p className="text-xs text-muted-foreground">Fecha l&iacute;mite</p>
                        <p className="text-sm font-medium">{new Date(detail.dueDate).toLocaleDateString("es-ES")}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">Creado</p>
                      <p className="text-sm font-medium">{new Date(detail.createdAt).toLocaleDateString("es-ES")}</p>
                    </div>
                    {detail.completedAt && (
                      <div>
                        <p className="text-xs text-muted-foreground">Completado</p>
                        <p className="text-sm font-medium">{new Date(detail.completedAt).toLocaleDateString("es-ES")}</p>
                      </div>
                    )}
                  </div>

                  {detail.notes && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Notas</p>
                      <p className="text-sm whitespace-pre-wrap">{detail.notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  {canEditSection && detail.status !== "completado" && detail.status !== "cancelado" && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
                      {detail.status === "pendiente" && (
                        <Button size="sm" variant="outline" onClick={() => { handleStatusChange(detail.id, "en_progreso"); setDetailOpen(false) }}>
                          <CircleDot className="h-3.5 w-3.5 mr-1.5" /> Iniciar
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="text-green-600 border-green-500/30 hover:bg-green-500/10" onClick={() => { handleStatusChange(detail.id, "completado"); setDetailOpen(false) }}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Completar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { openEditForm(detail.id); setDetailOpen(false) }}>
                        Editar
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => { handleStatusChange(detail.id, "cancelado"); setDetailOpen(false) }}>
                        <XCircle className="h-3.5 w-3.5 mr-1.5" /> Cancelar
                      </Button>
                    </div>
                  )}

                  {canEditSection && (
                    <div className="flex justify-end pt-1">
                      <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 text-xs" onClick={() => { deleteTracking(detail.id); setDetailOpen(false) }}>
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Eliminar
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
