"use client"

import { useState } from "react"
import { Receipt, FileText, Download, Search, Plus, Euro } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useStore } from "@/lib/store"

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount)
}

interface Invoice {
  id: string;
  number: string;
  saleId: string;
  clientName: string;
  clientDni: string;
  concept: string;
  subtotal: number;
  iva: number;
  total: number;
  date: string;
  status: "emitida" | "pagada" | "pendiente";
}

const statusConfig: Record<string, { label: string; className: string }> = {
  emitida: { label: "Emitida", className: "bg-blue-500/15 text-blue-600 border-blue-500/20" },
  pagada: { label: "Pagada", className: "bg-green-500/15 text-green-600 border-green-500/20" },
  pendiente: { label: "Pendiente", className: "bg-yellow-500/15 text-yellow-600 border-yellow-500/20" },
}

export default function FacturacionPage() {
  const { sales, getClientById, getVehicleById } = useStore()
  const [search, setSearch] = useState("")
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

  // Generate invoices from completed sales
  const invoices: Invoice[] = sales
    .filter((s) => s.status === "completada")
    .map((sale, idx) => {
      const client = getClientById(sale.clientId)
      const vehicle = getVehicleById(sale.vehicleId)
      const subtotal = sale.salePrice
      const iva = subtotal * 0.21
      return {
        id: `inv-${idx + 1}`,
        number: `FAC-2026-${String(idx + 1).padStart(4, "0")}`,
        saleId: sale.id,
        clientName: client?.name || "",
        clientDni: client?.dni || "",
        concept: `${vehicle?.brand} ${vehicle?.model} (${vehicle?.licensePlate})`,
        subtotal,
        iva,
        total: subtotal + iva,
        date: sale.saleDate,
        status: "pagada",
      }
    })

  const filtered = invoices.filter(
    (inv) =>
      inv.clientName.toLowerCase().includes(search.toLowerCase()) ||
      inv.number.toLowerCase().includes(search.toLowerCase()) ||
      inv.concept.toLowerCase().includes(search.toLowerCase())
  )

  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0)
  const totalIva = invoices.reduce((sum, inv) => sum + inv.iva, 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Facturación</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión de facturas del concesionario
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
              <Receipt className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold">{invoices.length}</p>
              <p className="text-xs text-muted-foreground">Facturas emitidas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/15">
              <Euro className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-bold">{formatCurrency(totalInvoiced)}</p>
              <p className="text-xs text-muted-foreground">Total facturado (IVA incl.)</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/15">
              <FileText className="h-4 w-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-lg font-bold">{formatCurrency(totalIva)}</p>
              <p className="text-xs text-muted-foreground">IVA repercutido (21%)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente, nº factura o concepto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      {/* Invoices table */}
      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Factura</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead>Subtotal</TableHead>
                <TableHead>IVA</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((inv) => {
                const cfg = statusConfig[inv.status]
                return (
                  <TableRow
                    key={inv.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedInvoice(inv)}
                  >
                    <TableCell className="font-mono text-sm font-medium">{inv.number}</TableCell>
                    <TableCell className="text-sm">{inv.clientName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{inv.concept}</TableCell>
                    <TableCell className="text-sm">{formatCurrency(inv.subtotal)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatCurrency(inv.iva)}</TableCell>
                    <TableCell className="text-sm font-semibold">{formatCurrency(inv.total)}</TableCell>
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
                    No se encontraron facturas
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invoice detail dialog */}
      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Factura {selectedInvoice?.number}
            </DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-5">
              {/* Header */}
              <div className="rounded-lg border p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-lg font-bold">DealerHub S.L.</p>
                    <p className="text-xs text-muted-foreground">CIF: B12345678</p>
                    <p className="text-xs text-muted-foreground">Av. de la Constitución 50, Madrid</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-primary">{selectedInvoice.number}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(selectedInvoice.date).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Client */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Cliente</p>
                <p className="text-sm font-medium">{selectedInvoice.clientName}</p>
                <p className="text-xs text-muted-foreground">DNI: {selectedInvoice.clientDni}</p>
              </div>

              {/* Concept */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Concepto</p>
                <p className="text-sm">{selectedInvoice.concept}</p>
              </div>

              {/* Amounts */}
              <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">IVA (21%)</span>
                  <span>{formatCurrency(selectedInvoice.iva)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="text-lg font-bold text-primary">{formatCurrency(selectedInvoice.total)}</span>
                </div>
              </div>

              <Badge variant="outline" className={statusConfig[selectedInvoice.status].className}>
                {statusConfig[selectedInvoice.status].label}
              </Badge>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
