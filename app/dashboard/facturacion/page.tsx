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
import { useAuth } from "@/lib/auth"

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

function generateInvoicePDF(invoice: Invoice) {
  const fmt = (n: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n)
  const html = `
    <!DOCTYPE html>
    <html><head>
      <title>Factura ${invoice.number}</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1a1a1a; }
        .header { display: flex; justify-content: space-between; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
        .company { font-size: 24px; font-weight: bold; color: #2563eb; }
        .company-details { font-size: 12px; color: #666; margin-top: 5px; }
        .invoice-number { font-size: 20px; font-weight: bold; text-align: right; }
        .invoice-date { font-size: 12px; color: #666; text-align: right; }
        .client-section { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .client-label { font-size: 11px; text-transform: uppercase; color: #666; letter-spacing: 1px; }
        .client-name { font-size: 16px; font-weight: 600; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th { background: #f1f5f9; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #666; }
        td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
        .totals { float: right; width: 300px; }
        .totals .row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
        .totals .total { border-top: 2px solid #2563eb; font-size: 18px; font-weight: bold; color: #2563eb; }
        .footer { margin-top: 60px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #e2e8f0; padding-top: 20px; }
        @media print { body { padding: 20px; } }
      </style>
    </head><body>
      <div class="header">
        <div>
          <div class="company">DealerHub S.L.</div>
          <div class="company-details">CIF: B12345678<br>Av. de la Constituci\u00f3n 50, Madrid<br>Tel: 912 345 678</div>
        </div>
        <div>
          <div class="invoice-number">${invoice.number}</div>
          <div class="invoice-date">${new Date(invoice.date).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</div>
        </div>
      </div>
      <div class="client-section">
        <div class="client-label">Facturar a</div>
        <div class="client-name">${invoice.clientName}</div>
        <div style="font-size:13px;color:#666;margin-top:4px">DNI/NIF: ${invoice.clientDni || "\u2014"}</div>
      </div>
      <table>
        <thead><tr><th>Concepto</th><th style="text-align:right">Importe</th></tr></thead>
        <tbody><tr><td>${invoice.concept}</td><td style="text-align:right">${fmt(invoice.subtotal)}</td></tr></tbody>
      </table>
      <div class="totals">
        <div class="row"><span>Subtotal</span><span>${fmt(invoice.subtotal)}</span></div>
        <div class="row"><span>IVA (21%)</span><span>${fmt(invoice.iva)}</span></div>
        <div class="row total"><span>Total</span><span>${fmt(invoice.total)}</span></div>
      </div>
      <div style="clear:both"></div>
      <div class="footer">DealerHub S.L. \u2014 Factura generada autom\u00e1ticamente</div>
      <script>window.print()<\/script>
    </body></html>
  `
  const w = window.open("", "_blank")
  if (w) { w.document.write(html); w.document.close() }
}

export default function FacturacionPage() {
  const { sales, getClientById, getVehicleById } = useStore()
  const { canEdit, user } = useAuth()
  const isAdmin = user?.role === "admin"
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
        {isAdmin && (
          <Button size="sm" className="h-9 gap-1.5">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Crear factura manual</span>
            <span className="sm:hidden">Crear</span>
          </Button>
        )}
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

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {filtered.map((inv) => {
          const cfg = statusConfig[inv.status]
          return (
            <Card key={inv.id} className="border-border/50 cursor-pointer" onClick={() => setSelectedInvoice(inv)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{inv.clientName}</p>
                    <p className="text-xs text-muted-foreground font-mono">{inv.number}</p>
                    <p className="text-xs text-muted-foreground truncate">{inv.concept}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3 flex flex-col items-end gap-1">
                    <p className="text-sm font-semibold">{formatCurrency(inv.total)}</p>
                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium ${cfg.className}`}>
                      {cfg.label}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => { e.stopPropagation(); generateInvoicePDF(inv) }}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No se encontraron facturas
          </div>
        )}
      </div>

      {/* Desktop table */}
      <Card className="border-border/50 hidden md:block">
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
                <TableHead className="w-10"></TableHead>
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
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => { e.stopPropagation(); generateInvoicePDF(inv) }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
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

              <div className="flex items-center justify-between">
                <Badge variant="outline" className={statusConfig[selectedInvoice.status].className}>
                  {statusConfig[selectedInvoice.status].label}
                </Badge>
                <Button size="sm" className="gap-1.5" onClick={() => generateInvoicePDF(selectedInvoice)}>
                  <Download className="h-4 w-4" />
                  Descargar PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
