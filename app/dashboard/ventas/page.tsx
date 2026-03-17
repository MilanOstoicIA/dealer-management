"use client"

import { useState, useEffect } from "react"
import { Search, Filter, Euro, TrendingUp, CreditCard, FileText, Car, User, Percent, ArrowRightLeft, Banknote, Tag, Plus, CheckCircle2, XCircle, Clock, Pencil } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import type { Sale, SaleStatus, PaymentMethod } from "@/types"

const statusConfig: Record<SaleStatus, { label: string; className: string }> = {
  en_proceso: { label: "En proceso", className: "bg-yellow-500/15 text-yellow-600 border-yellow-500/20" },
  completada: { label: "Completada", className: "bg-green-500/15 text-green-600 border-green-500/20" },
  cancelada: { label: "Cancelada", className: "bg-destructive/15 text-destructive border-destructive/20" },
}

const paymentLabels: Record<PaymentMethod, string> = {
  contado: "Contado",
  "financiación": "Financiación",
  leasing: "Leasing",
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount)
}

// ─── Sale Form Dialog ─────────────────────────────────────────────────────

interface SaleFormProps {
  open: boolean
  onClose: () => void
}

function SaleFormDialog({ open, onClose }: SaleFormProps) {
  const { clients, vehicles, users, createSale } = useStore()
  const sellers = users.filter((u) => u.role === "vendedor" || u.role === "admin")
  const availableVehicles = vehicles.filter((v) => v.status === "disponible")

  const [form, setForm] = useState({
    clientId: "", vehicleId: "", sellerId: "", saleDate: new Date().toISOString().split("T")[0],
    paymentMethod: "contado" as PaymentMethod, commissionRate: 3, discount: 0, notes: "",
  })

  const selectedVehicle = vehicles.find((v) => v.id === form.vehicleId)
  const salePrice = selectedVehicle?.price || 0

  useEffect(() => {
    if (open) {
      setForm({
        clientId: "", vehicleId: "", sellerId: sellers[0]?.id || "", saleDate: new Date().toISOString().split("T")[0],
        paymentMethod: "contado", commissionRate: 3, discount: 0, notes: "",
      })
    }
  }, [open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.clientId || !form.vehicleId || !form.sellerId) return
    createSale({
      vehicleId: form.vehicleId, clientId: form.clientId, sellerId: form.sellerId,
      saleDate: form.saleDate, salePrice, paymentMethod: form.paymentMethod,
      status: "en_proceso", commissionRate: form.commissionRate,
      discount: form.discount || undefined, notes: form.notes || undefined,
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Euro className="h-5 w-5" />
            Nueva venta
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Vehículo *</Label>
            <Select value={form.vehicleId} onValueChange={(v) => v && setForm((f) => ({ ...f, vehicleId: v }))}>
              <SelectTrigger><SelectValue placeholder="Seleccionar vehículo disponible" /></SelectTrigger>
              <SelectContent>
                {availableVehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.brand} {v.model} — {formatCurrency(v.price)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Cliente *</Label>
              <Select value={form.clientId} onValueChange={(v) => v && setForm((f) => ({ ...f, clientId: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Vendedor *</Label>
              <Select value={form.sellerId} onValueChange={(v) => v && setForm((f) => ({ ...f, sellerId: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {sellers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Fecha</Label>
              <Input type="date" value={form.saleDate} onChange={(e) => setForm((f) => ({ ...f, saleDate: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Método de pago</Label>
              <Select value={form.paymentMethod} onValueChange={(v) => v && setForm((f) => ({ ...f, paymentMethod: v as PaymentMethod }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="contado">Contado</SelectItem>
                  <SelectItem value="financiación">Financiación</SelectItem>
                  <SelectItem value="leasing">Leasing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Comisión (%)</Label>
              <Input type="number" value={form.commissionRate} onChange={(e) => setForm((f) => ({ ...f, commissionRate: Number(e.target.value) }))} min={0} max={100} step={0.5} />
            </div>
          </div>
          {selectedVehicle && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <p>Precio: <span className="font-bold">{formatCurrency(salePrice)}</span></p>
              <p className="text-xs text-muted-foreground">Comisión: {formatCurrency(salePrice * (form.commissionRate / 100))}</p>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Notas</Label>
            <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Observaciones..." rows={2} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Registrar venta</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function VentasPage() {
  const { sales, getClientById, getVehicleById, getUserById, completeSale, cancelSale } = useStore()
  const { canEdit } = useAuth()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("todos")
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [formOpen, setFormOpen] = useState(false)

  const filtered = sales.filter((s) => {
    const client = getClientById(s.clientId)
    const vehicle = getVehicleById(s.vehicleId)
    const searchLower = search.toLowerCase()
    const matchesSearch =
      client?.name.toLowerCase().includes(searchLower) ||
      vehicle?.brand.toLowerCase().includes(searchLower) ||
      vehicle?.model.toLowerCase().includes(searchLower)
    const matchesStatus = statusFilter === "todos" || s.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalRevenue = sales
    .filter((s) => s.status === "completada")
    .reduce((sum, s) => sum + s.salePrice, 0)
  const totalCommissions = sales
    .filter((s) => s.status === "completada")
    .reduce((sum, s) => sum + s.commission, 0)
  const inProcessCount = sales.filter((s) => s.status === "en_proceso").length

  const selectedClient = selectedSale ? getClientById(selectedSale.clientId) : null
  const selectedVehicle = selectedSale ? getVehicleById(selectedSale.vehicleId) : null
  const selectedSeller = selectedSale ? getUserById(selectedSale.sellerId) : null

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Ventas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Registro y seguimiento de ventas
          </p>
        </div>
        {canEdit("ventas") && (
          <Button onClick={() => setFormOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Nueva venta
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/15">
              <Euro className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-bold">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-muted-foreground">Ingresos totales</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold">{formatCurrency(totalCommissions)}</p>
              <p className="text-xs text-muted-foreground">Comisiones</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/15">
              <CreditCard className="h-4 w-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-lg font-bold">{inProcessCount}</p>
              <p className="text-xs text-muted-foreground">En proceso</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-0 w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente o vehículo..."
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
            <SelectItem value="en_proceso">En proceso</SelectItem>
            <SelectItem value="completada">Completada</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {filtered.map((sale) => {
          const client = getClientById(sale.clientId)
          const vehicle = getVehicleById(sale.vehicleId)
          const cfg = statusConfig[sale.status]
          return (
            <Card key={sale.id} className="border-border/50 cursor-pointer" onClick={() => setSelectedSale(sale)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{vehicle?.brand} {vehicle?.model}</p>
                    <p className="text-xs text-muted-foreground">{client?.name}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-semibold">{formatCurrency(sale.salePrice)}</p>
                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium ${cfg.className}`}>
                      {cfg.label}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No se encontraron ventas
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
                <TableHead>Cliente</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Comisión</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((sale) => {
                const client = getClientById(sale.clientId)
                const vehicle = getVehicleById(sale.vehicleId)
                const seller = getUserById(sale.sellerId)
                const cfg = statusConfig[sale.status]
                return (
                  <TableRow
                    key={sale.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedSale(sale)}
                  >
                    <TableCell>
                      <p className="text-sm font-medium">{vehicle?.brand} {vehicle?.model}</p>
                      <p className="text-xs text-muted-foreground">{vehicle?.licensePlate}</p>
                    </TableCell>
                    <TableCell className="text-sm">{client?.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{seller?.name}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(sale.saleDate).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                      })}
                    </TableCell>
                    <TableCell className="text-sm">{paymentLabels[sale.paymentMethod]}</TableCell>
                    <TableCell className="text-sm font-semibold">{formatCurrency(sale.salePrice)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{sale.commissionRate}% · {formatCurrency(sale.commission)}</TableCell>
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
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    No se encontraron ventas
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Sale Detail Dialog */}
      <Dialog open={!!selectedSale} onOpenChange={() => setSelectedSale(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de venta</DialogTitle>
          </DialogHeader>
          {selectedSale && (() => {
            const purchasePrice = selectedVehicle?.purchasePrice ?? 0
            const margin = selectedSale.salePrice - purchasePrice - selectedSale.commission - (selectedSale.discount ?? 0)
            const marginPct = purchasePrice > 0 ? ((margin / purchasePrice) * 100).toFixed(1) : "0"
            const tradeInVehicle = selectedSale.tradeInVehicleId ? getVehicleById(selectedSale.tradeInVehicleId) : null

            return (
              <div className="space-y-5">
                {/* Status badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={statusConfig[selectedSale.status].className}>
                    {statusConfig[selectedSale.status].label}
                  </Badge>
                  <Badge variant="outline">{paymentLabels[selectedSale.paymentMethod]}</Badge>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    <Percent className="h-3 w-3 mr-1" />
                    Comisión {selectedSale.commissionRate}%
                  </Badge>
                </div>

                {/* Vehicle */}
                <div className="rounded-lg border p-4 space-y-1">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <p className="text-lg font-bold">{selectedVehicle?.brand} {selectedVehicle?.model}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedVehicle?.year} · {selectedVehicle?.color} · {selectedVehicle?.licensePlate}
                  </p>
                </div>

                {/* Client & Seller */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" /> Cliente</p>
                    <p className="text-sm font-medium">{selectedClient?.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedClient?.phone} · {selectedClient?.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" /> Vendedor</p>
                    <p className="text-sm font-medium">{selectedSeller?.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fecha de venta</p>
                    <p className="text-sm font-medium">
                      {new Date(selectedSale.saleDate).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Método de pago</p>
                    <p className="text-sm font-medium">{paymentLabels[selectedSale.paymentMethod]}</p>
                  </div>
                </div>

                {/* Financial Breakdown */}
                <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <Banknote className="h-3.5 w-3.5" /> Desglose financiero
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Precio de compra</p>
                      <p className="text-sm font-medium">{formatCurrency(purchasePrice)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Precio de venta</p>
                      <p className="text-xl font-bold">{formatCurrency(selectedSale.salePrice)}</p>
                    </div>
                    {selectedSale.discount && selectedSale.discount > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Tag className="h-3 w-3" /> Descuento</p>
                        <p className="text-sm font-medium text-red-500">-{formatCurrency(selectedSale.discount)}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">Comisión ({selectedSale.commissionRate}%)</p>
                      <p className="text-sm font-medium text-green-600">{formatCurrency(selectedSale.commission)}</p>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-border/50">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">Margen neto</p>
                        <p className={`text-lg font-bold ${margin >= 0 ? "text-green-600" : "text-red-500"}`}>
                          {formatCurrency(margin)} <span className="text-xs font-normal text-muted-foreground">({marginPct}%)</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trade-in */}
                {(tradeInVehicle || selectedSale.tradeInValue) && (
                  <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-4 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                      <ArrowRightLeft className="h-3.5 w-3.5" /> Vehículo de intercambio
                    </p>
                    {tradeInVehicle && (
                      <p className="text-sm font-medium">{tradeInVehicle.brand} {tradeInVehicle.model} ({tradeInVehicle.year})</p>
                    )}
                    {selectedSale.tradeInValue && (
                      <p className="text-sm">Valor: <span className="font-semibold">{formatCurrency(selectedSale.tradeInValue)}</span></p>
                    )}
                  </div>
                )}

                {/* Financing Details */}
                {selectedSale.financingDetails && (
                  <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                      <CreditCard className="h-3.5 w-3.5" /> Detalles de financiación
                    </p>
                    <p className="text-sm">{selectedSale.financingDetails}</p>
                  </div>
                )}

                {/* Notes */}
                {selectedSale.notes && (
                  <div>
                    <p className="text-xs text-muted-foreground">Notas</p>
                    <p className="text-sm mt-1 bg-muted/30 rounded-lg p-3">{selectedSale.notes}</p>
                  </div>
                )}

                {/* Actions for in-process sales */}
                {selectedSale.status === "en_proceso" && (
                  <div className="border-t pt-4 space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Acciones</p>
                    {canEdit("ventas") && (
                      <div className="grid grid-cols-2 gap-2">
                        <Button size="sm" className="gap-1.5 bg-green-600 hover:bg-green-700" onClick={() => {
                          if (confirm("¿Completar esta venta? El vehículo pasará a estado 'vendido'.")) {
                            completeSale(selectedSale.id)
                            setSelectedSale(null)
                          }
                        }}>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Completar venta
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => {
                          if (confirm("¿Cancelar esta venta? El vehículo volverá a estar disponible.")) {
                            cancelSale(selectedSale.id)
                            setSelectedSale(null)
                          }
                        }}>
                          <XCircle className="h-3.5 w-3.5" />
                          Cancelar venta
                        </Button>
                      </div>
                    )}
                    <div className="rounded-lg bg-muted/30 p-3 space-y-2">
                      <p className="text-xs font-medium">Opciones de cierre:</p>
                      <div className="space-y-1.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <FileText className="h-3 w-3" />
                          <span>Generar factura con IVA 21%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-3 w-3" />
                          <span>Cambiar método de pago</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Tag className="h-3 w-3" />
                          <span>Aplicar descuento adicional</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ArrowRightLeft className="h-3 w-3" />
                          <span>Añadir vehículo de intercambio</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Percent className="h-3 w-3" />
                          <span>Ajustar comisión del vendedor</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center">
                      Estas acciones se activarán con Supabase
                    </p>
                  </div>
                )}
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* Sale Form Dialog */}
      <SaleFormDialog open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  )
}
