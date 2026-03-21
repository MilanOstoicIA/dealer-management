"use client"

import { useState } from "react"
import {
  Building2,
  Plus,
  Wrench,
  FileText,
  Car,
  Shield,
  CreditCard,
  Truck,
  CircleDot,
  Mail,
  Phone,
  MessageCircle,
  Globe,
  MapPin,
  User,
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
import { getDirectMailtoLink, getDirectWhatsAppLink, getDirectTelLink } from "@/lib/communication-templates"
import type { SupplierCategory } from "@/types"

const categoryConfig: Record<SupplierCategory, { label: string; icon: React.ReactNode; color: string }> = {
  recambios: { label: "Recambios", icon: <Wrench className="h-4 w-4" />, color: "bg-blue-500/15 text-blue-600 border-blue-500/20" },
  gestoria: { label: "Gestoría", icon: <FileText className="h-4 w-4" />, color: "bg-purple-500/15 text-purple-600 border-purple-500/20" },
  trafico: { label: "Tráfico / DGT", icon: <Car className="h-4 w-4" />, color: "bg-green-500/15 text-green-600 border-green-500/20" },
  seguro: { label: "Seguros", icon: <Shield className="h-4 w-4" />, color: "bg-teal-500/15 text-teal-600 border-teal-500/20" },
  financiera: { label: "Financiera", icon: <CreditCard className="h-4 w-4" />, color: "bg-yellow-500/15 text-yellow-600 border-yellow-500/20" },
  transporte: { label: "Transporte", icon: <Truck className="h-4 w-4" />, color: "bg-orange-500/15 text-orange-600 border-orange-500/20" },
  otro: { label: "Otro", icon: <CircleDot className="h-4 w-4" />, color: "bg-gray-500/15 text-gray-600 border-gray-500/20" },
}

export default function ProveedoresPage() {
  const { suppliers, trackings, addSupplier, updateSupplier, deleteSupplier, getSupplierById } = useStore()
  const { canEdit } = useAuth()
  const canEditSection = canEdit("proveedores")

  const [filterCategory, setFilterCategory] = useState<SupplierCategory | "todos">("todos")
  const [search, setSearch] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null)

  // Form state
  const [formName, setFormName] = useState("")
  const [formCategory, setFormCategory] = useState<SupplierCategory>("recambios")
  const [formContactPerson, setFormContactPerson] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [formPhone, setFormPhone] = useState("")
  const [formWhatsapp, setFormWhatsapp] = useState("")
  const [formWebsite, setFormWebsite] = useState("")
  const [formAddress, setFormAddress] = useState("")
  const [formNotes, setFormNotes] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)

  // Filter and sort
  const filtered = suppliers
    .filter((s) => {
      if (filterCategory !== "todos" && s.category !== filterCategory) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          s.name.toLowerCase().includes(q) ||
          (s.contactPerson || "").toLowerCase().includes(q) ||
          (s.email || "").toLowerCase().includes(q) ||
          (s.phone || "").toLowerCase().includes(q)
        )
      }
      return true
    })
    .sort((a, b) => {
      // Active first, then by name
      if (a.active !== b.active) return a.active ? -1 : 1
      return a.name.localeCompare(b.name, "es")
    })

  const stats = {
    total: suppliers.length,
    recambios: suppliers.filter((s) => s.category === "recambios").length,
    gestoria: suppliers.filter((s) => s.category === "gestoria").length,
    active: suppliers.filter((s) => s.active).length,
  }

  function resetForm() {
    setFormName("")
    setFormCategory("recambios")
    setFormContactPerson("")
    setFormEmail("")
    setFormPhone("")
    setFormWhatsapp("")
    setFormWebsite("")
    setFormAddress("")
    setFormNotes("")
    setEditingId(null)
  }

  function openNewForm() {
    resetForm()
    setFormOpen(true)
  }

  function openEditForm(id: string) {
    const s = suppliers.find((sup) => sup.id === id)
    if (!s) return
    setEditingId(id)
    setFormName(s.name)
    setFormCategory(s.category)
    setFormContactPerson(s.contactPerson || "")
    setFormEmail(s.email || "")
    setFormPhone(s.phone || "")
    setFormWhatsapp(s.whatsapp || "")
    setFormWebsite(s.website || "")
    setFormAddress(s.address || "")
    setFormNotes(s.notes || "")
    setFormOpen(true)
  }

  function handleSubmit() {
    if (!formName.trim()) return
    const data = {
      name: formName.trim(),
      category: formCategory,
      contactPerson: formContactPerson.trim() || undefined,
      email: formEmail.trim() || undefined,
      phone: formPhone.trim() || undefined,
      whatsapp: formWhatsapp.trim() || undefined,
      website: formWebsite.trim() || undefined,
      address: formAddress.trim() || undefined,
      notes: formNotes.trim() || undefined,
      active: true,
    }
    if (editingId) {
      updateSupplier(editingId, data)
    } else {
      addSupplier(data)
    }
    setFormOpen(false)
    resetForm()
  }

  const detail = selectedSupplier ? suppliers.find((s) => s.id === selectedSupplier) : null
  const linkedTrackings = detail ? trackings.filter((t) => t.supplierId === detail.id) : []

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Proveedores</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión de proveedores, recambios, gestorías y servicios externos
          </p>
        </div>
        {canEditSection && (
          <Button onClick={openNewForm} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Nuevo proveedor
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15">
              <Wrench className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-bold">{stats.recambios}</p>
              <p className="text-xs text-muted-foreground">Recambios</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/15">
              <FileText className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-lg font-bold">{stats.gestoria}</p>
              <p className="text-xs text-muted-foreground">Gestorías</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/15">
              <CircleDot className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-bold">{stats.active}</p>
              <p className="text-xs text-muted-foreground">Activos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Input
          placeholder="Buscar proveedor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64"
        />
        <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as SupplierCategory | "todos")}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue>{filterCategory === "todos" ? "Todas las categorías" : categoryConfig[filterCategory].label}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas las categorías</SelectItem>
            {Object.entries(categoryConfig).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Supplier list */}
      <div className="space-y-3">
        {filtered.map((supplier) => {
          const catCfg = categoryConfig[supplier.category]

          return (
            <Card
              key={supplier.id}
              className={`border-border/50 cursor-pointer hover:bg-muted/50 transition-colors ${!supplier.active ? "opacity-60" : ""}`}
              onClick={() => { setSelectedSupplier(supplier.id); setDetailOpen(true) }}
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
                        <p className="text-sm font-semibold truncate">{supplier.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {supplier.contactPerson && <><User className="h-3 w-3 inline mr-0.5" />{supplier.contactPerson}</>}
                          {supplier.contactPerson && (supplier.email || supplier.phone) && <> &middot; </>}
                          {supplier.email && <>{supplier.email}</>}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium ${catCfg.color}`}>
                          {catCfg.icon}
                          {catCfg.label}
                        </span>
                        {!supplier.active && (
                          <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium bg-gray-500/15 text-gray-600 border-gray-500/20">
                            Inactivo
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {supplier.phone && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          onClick={(e) => { e.stopPropagation(); window.open(getDirectTelLink(supplier.phone!), "_self") }}
                        >
                          <Phone className="h-3 w-3 mr-1" /> Llamar
                        </Button>
                      )}
                      {supplier.email && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          onClick={(e) => { e.stopPropagation(); window.open(getDirectMailtoLink(supplier.email!), "_self") }}
                        >
                          <Mail className="h-3 w-3 mr-1" /> Email
                        </Button>
                      )}
                      {supplier.whatsapp && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          onClick={(e) => { e.stopPropagation(); window.open(getDirectWhatsAppLink(supplier.whatsapp!), "_blank") }}
                        >
                          <MessageCircle className="h-3 w-3 mr-1" /> WhatsApp
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No hay proveedores{filterCategory !== "todos" || search ? " con los filtros seleccionados" : ""}
          </div>
        )}
      </div>

      {/* New/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar proveedor" : "Nuevo proveedor"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label>Nombre *</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ej: Recambios García" />
              </div>
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label>Categoría</Label>
                <Select value={formCategory} onValueChange={(v) => setFormCategory(v as SupplierCategory)}>
                  <SelectTrigger><SelectValue>{categoryConfig[formCategory].label}</SelectValue></SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryConfig).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Persona de contacto</Label>
              <Input value={formContactPerson} onChange={(e) => setFormContactPerson(e.target.value)} placeholder="Nombre del contacto" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="email@ejemplo.com" />
              </div>
              <div className="space-y-1.5">
                <Label>Teléfono</Label>
                <Input type="tel" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="+34 600 000 000" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>WhatsApp</Label>
                <Input type="tel" value={formWhatsapp} onChange={(e) => setFormWhatsapp(e.target.value)} placeholder="+34 600 000 000" />
              </div>
              <div className="space-y-1.5">
                <Label>Web</Label>
                <Input value={formWebsite} onChange={(e) => setFormWebsite(e.target.value)} placeholder="https://ejemplo.com" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Dirección</Label>
              <Input value={formAddress} onChange={(e) => setFormAddress(e.target.value)} placeholder="Dirección completa" />
            </div>

            <div className="space-y-1.5">
              <Label>Notas</Label>
              <Textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Notas adicionales..." rows={3} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={!formName.trim()}>
                {editingId ? "Guardar cambios" : "Crear proveedor"}
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

            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${catCfg.color.split(" ")[0]}`}>
                      {catCfg.icon}
                    </span>
                    {detail.name}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                  {/* Category badge */}
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium ${catCfg.color}`}>
                      {catCfg.icon} {catCfg.label}
                    </span>
                    {detail.active ? (
                      <span className="inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium bg-green-500/15 text-green-600 border-green-500/20">
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium bg-gray-500/15 text-gray-600 border-gray-500/20">
                        Inactivo
                      </span>
                    )}
                  </div>

                  {/* Quick contact buttons */}
                  <div className="flex flex-wrap gap-2">
                    {detail.email && (
                      <Button size="sm" variant="outline" onClick={() => window.open(getDirectMailtoLink(detail.email!), "_self")}>
                        <Mail className="h-3.5 w-3.5 mr-1.5" /> Email
                      </Button>
                    )}
                    {detail.phone && (
                      <Button size="sm" variant="outline" onClick={() => window.open(getDirectTelLink(detail.phone!), "_self")}>
                        <Phone className="h-3.5 w-3.5 mr-1.5" /> Llamar
                      </Button>
                    )}
                    {detail.whatsapp && (
                      <Button size="sm" variant="outline" onClick={() => window.open(getDirectWhatsAppLink(detail.whatsapp!), "_blank")}>
                        <MessageCircle className="h-3.5 w-3.5 mr-1.5" /> WhatsApp
                      </Button>
                    )}
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/50 p-3">
                    {detail.contactPerson && (
                      <div>
                        <p className="text-xs text-muted-foreground">Persona de contacto</p>
                        <p className="text-sm font-medium flex items-center gap-1"><User className="h-3.5 w-3.5" /> {detail.contactPerson}</p>
                      </div>
                    )}
                    {detail.email && (
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="text-sm font-medium flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {detail.email}</p>
                      </div>
                    )}
                    {detail.phone && (
                      <div>
                        <p className="text-xs text-muted-foreground">Teléfono</p>
                        <p className="text-sm font-medium flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {detail.phone}</p>
                      </div>
                    )}
                    {detail.whatsapp && (
                      <div>
                        <p className="text-xs text-muted-foreground">WhatsApp</p>
                        <p className="text-sm font-medium flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> {detail.whatsapp}</p>
                      </div>
                    )}
                    {detail.website && (
                      <div>
                        <p className="text-xs text-muted-foreground">Web</p>
                        <a href={detail.website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium flex items-center gap-1 text-primary hover:underline">
                          <Globe className="h-3.5 w-3.5" /> {detail.website}
                        </a>
                      </div>
                    )}
                    {detail.address && (
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground">Dirección</p>
                        <p className="text-sm font-medium flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {detail.address}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">Creado</p>
                      <p className="text-sm font-medium">{new Date(detail.createdAt).toLocaleDateString("es-ES")}</p>
                    </div>
                  </div>

                  {detail.notes && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Notas</p>
                      <p className="text-sm whitespace-pre-wrap">{detail.notes}</p>
                    </div>
                  )}

                  {/* Linked trackings */}
                  {linkedTrackings.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Seguimientos vinculados</p>
                      <div className="space-y-2">
                        {linkedTrackings.map((tracking) => {
                          const tCatCfg = categoryConfig[tracking.category as SupplierCategory] || { label: tracking.category, color: "bg-gray-500/15 text-gray-600 border-gray-500/20" }
                          return (
                            <div key={tracking.id} className="flex items-center gap-2 rounded-lg bg-muted/50 p-2.5">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{tracking.title}</p>
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                  <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${
                                    tracking.status === "pendiente" ? "bg-yellow-500/15 text-yellow-600 border-yellow-500/20" :
                                    tracking.status === "en_progreso" ? "bg-blue-500/15 text-blue-600 border-blue-500/20" :
                                    tracking.status === "completado" ? "bg-green-500/15 text-green-600 border-green-500/20" :
                                    "bg-destructive/15 text-destructive border-destructive/20"
                                  }`}>
                                    {tracking.status === "pendiente" ? "Pendiente" :
                                     tracking.status === "en_progreso" ? "En progreso" :
                                     tracking.status === "completado" ? "Completado" : "Cancelado"}
                                  </span>
                                  <span className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground border-border">
                                    {tracking.category}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {canEditSection && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
                      <Button size="sm" variant="outline" onClick={() => { openEditForm(detail.id); setDetailOpen(false) }}>
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          updateSupplier(detail.id, { active: !detail.active })
                          setDetailOpen(false)
                        }}
                      >
                        {detail.active ? "Desactivar" : "Activar"}
                      </Button>
                    </div>
                  )}

                  {canEditSection && (
                    <div className="flex justify-end pt-1">
                      <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 text-xs" onClick={() => { deleteSupplier(detail.id); setDetailOpen(false) }}>
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
