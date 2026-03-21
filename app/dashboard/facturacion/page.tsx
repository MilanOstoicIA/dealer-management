"use client"

import { useState, useEffect } from "react"
import { Receipt, FileText, Download, Search, Euro, Scale, ShieldCheck, ShieldAlert, Hash, Loader2 } from "lucide-react"
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
import type { Invoice, InvoiceStatus, VeriFactuStatus } from "@/types"
import { validateHashChain, getVeriFactuStatusLabel, type HashChainValidation } from "@/lib/verifactu"

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount)
}

const statusConfig: Record<InvoiceStatus, { label: string; className: string }> = {
  emitida: { label: "Emitida", className: "bg-blue-500/15 text-blue-600 border-blue-500/20" },
  pagada: { label: "Pagada", className: "bg-green-500/15 text-green-600 border-green-500/20" },
  pendiente: { label: "Pendiente", className: "bg-yellow-500/15 text-yellow-600 border-yellow-500/20" },
  anulada: { label: "Anulada", className: "bg-destructive/15 text-destructive border-destructive/20" },
}

// ─── PDF Generator (supports REBU and IVA General + VeriFactu hash) ─────────

function generateInvoicePDF(invoice: Invoice) {
  const fmt = (n: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n)
  const isRebu = invoice.taxRegime === "rebu"

  const verifactuHtml = invoice.hash
    ? `<div class="verifactu">
        <strong>🔐 VeriFactu</strong> — Hash: <code>${invoice.hash.slice(0, 16)}...</code>
        ${invoice.previousHash ? `<br>Enlace anterior: <code>${invoice.previousHash.slice(0, 16)}...</code>` : "<br>Factura génesis (primera de la cadena)"}
       </div>`
    : ""

  const totalsHtml = isRebu
    ? `
      <div class="totals">
        <div class="row total"><span>Total</span><span>${fmt(invoice.total)}</span></div>
      </div>
      <div style="clear:both"></div>
      <div class="rebu-notice">
        <strong>Operación sujeta al Régimen Especial de Bienes Usados</strong><br>
        (Art. 135-139 Ley 37/1992 del IVA)<br>
        IVA incluido en el precio — no se desglosa en factura.
      </div>
    `
    : `
      <div class="totals">
        <div class="row"><span>Base imponible</span><span>${fmt(invoice.subtotal)}</span></div>
        <div class="row"><span>IVA (${invoice.ivaRate || 21}%)</span><span>${fmt(invoice.ivaAmount)}</span></div>
        <div class="row total"><span>Total</span><span>${fmt(invoice.total)}</span></div>
      </div>
      <div style="clear:both"></div>
    `

  const html = `
    <!DOCTYPE html>
    <html><head>
      <title>Factura ${invoice.invoiceNumber}</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1a1a1a; }
        .header { display: flex; justify-content: space-between; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
        .company { font-size: 24px; font-weight: bold; color: #2563eb; }
        .company-details { font-size: 12px; color: #666; margin-top: 5px; }
        .invoice-number { font-size: 20px; font-weight: bold; text-align: right; }
        .invoice-date { font-size: 12px; color: #666; text-align: right; }
        .regime-badge { display: inline-block; background: ${isRebu ? "#f3e8ff" : "#dbeafe"}; color: ${isRebu ? "#7c3aed" : "#2563eb"}; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; margin-top: 6px; }
        .client-section { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .client-label { font-size: 11px; text-transform: uppercase; color: #666; letter-spacing: 1px; }
        .client-name { font-size: 16px; font-weight: 600; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th { background: #f1f5f9; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #666; }
        td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
        .totals { float: right; width: 300px; }
        .totals .row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
        .totals .total { border-top: 2px solid #2563eb; font-size: 18px; font-weight: bold; color: #2563eb; }
        .rebu-notice { margin-top: 20px; padding: 15px; background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 8px; font-size: 12px; color: #6b21a8; line-height: 1.5; }
        .verifactu { margin-top: 20px; padding: 12px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; font-size: 11px; color: #166534; line-height: 1.6; }
        .verifactu code { background: #dcfce7; padding: 1px 4px; border-radius: 3px; font-family: monospace; font-size: 10px; }
        .footer { margin-top: 60px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #e2e8f0; padding-top: 20px; }
        @media print { body { padding: 20px; } }
      </style>
    </head><body>
      <div class="header">
        <div>
          <div class="company">DealerHub S.L.</div>
          <div class="company-details">CIF: B12345678<br>Av. de la Constitución 50, Madrid<br>Tel: 912 345 678</div>
        </div>
        <div>
          <div class="invoice-number">${invoice.invoiceNumber}</div>
          <div class="invoice-date">${new Date(invoice.issuedDate).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</div>
          <div class="regime-badge">${isRebu ? "REBU" : "IVA General"}</div>
        </div>
      </div>
      <div class="client-section">
        <div class="client-label">Facturar a</div>
        <div class="client-name">${invoice.clientName}</div>
        <div style="font-size:13px;color:#666;margin-top:4px">DNI/NIF: ${invoice.clientDni || "—"}</div>
      </div>
      <table>
        <thead><tr><th>Concepto</th><th style="text-align:right">Importe</th></tr></thead>
        <tbody><tr><td>${invoice.concept}</td><td style="text-align:right">${fmt(invoice.total)}</td></tr></tbody>
      </table>
      ${totalsHtml}
      ${verifactuHtml}
      <div class="footer">DealerHub S.L. — Factura generada automáticamente</div>
      <script>window.print()<\/script>
    </body></html>
  `
  const w = window.open("", "_blank")
  if (w) { w.document.write(html); w.document.close() }
}

// ─── VeriFactu badge component ──────────────────────────────────────────────

function VeriFactuBadge({ status }: { status?: VeriFactuStatus }) {
  if (!status) return null
  const cfg = getVeriFactuStatusLabel(status)
  return (
    <Badge variant="outline" className={`${cfg.color} text-[10px] px-1.5 py-0`}>
      {status === "hashed" ? "🔐" : status === "accepted" ? "✓" : "⏳"} {cfg.label}
    </Badge>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function FacturacionPage() {
  const { invoices, updateInvoice } = useStore()
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"
  const [search, setSearch] = useState("")
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [chainValidation, setChainValidation] = useState<HashChainValidation | null>(null)
  const [validating, setValidating] = useState(false)

  // Validate hash chain when invoices change (only for admin)
  useEffect(() => {
    if (!isAdmin || invoices.length === 0) {
      setChainValidation(null)
      return
    }
    const hashedInvoices = invoices.filter((inv) => inv.hash)
    if (hashedInvoices.length === 0) {
      setChainValidation(null)
      return
    }
    setValidating(true)
    validateHashChain(hashedInvoices).then((result) => {
      setChainValidation(result)
      setValidating(false)
    }).catch(() => setValidating(false))
  }, [invoices, isAdmin])

  const filtered = invoices.filter(
    (inv) =>
      inv.clientName.toLowerCase().includes(search.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.concept.toLowerCase().includes(search.toLowerCase())
  )

  // Stats
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0)
  const rebuInvoices = invoices.filter((inv) => inv.taxRegime === "rebu")
  const ivaInvoices = invoices.filter((inv) => inv.taxRegime === "iva_general")
  const totalRebuIva = rebuInvoices.reduce((sum, inv) => sum + inv.ivaAmount, 0)
  const totalIvaGeneral = ivaInvoices.reduce((sum, inv) => sum + inv.ivaAmount, 0)
  const hashedCount = invoices.filter((inv) => inv.hash).length

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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
              <p className="text-xs text-muted-foreground">Total facturado</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/15">
              <Scale className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-lg font-bold">{formatCurrency(totalRebuIva)}</p>
              <p className="text-xs text-muted-foreground">IVA REBU ({rebuInvoices.length})</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/15">
              <FileText className="h-4 w-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-lg font-bold">{formatCurrency(totalIvaGeneral)}</p>
              <p className="text-xs text-muted-foreground">IVA General ({ivaInvoices.length})</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15">
              <Hash className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-lg font-bold">{hashedCount}/{invoices.length}</p>
              <p className="text-xs text-muted-foreground">VeriFactu hashed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* VeriFactu chain integrity (admin only) */}
      {isAdmin && chainValidation && (
        <Card className={`border-2 ${chainValidation.isValid ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5"}`}>
          <CardContent className="p-4 flex items-center gap-4">
            {validating ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : chainValidation.isValid ? (
              <ShieldCheck className="h-6 w-6 text-green-600 shrink-0" />
            ) : (
              <ShieldAlert className="h-6 w-6 text-destructive shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">
                {chainValidation.isValid
                  ? "🔐 Cadena de hashes VeriFactu íntegra"
                  : "⚠️ Cadena de hashes VeriFactu comprometida"}
              </p>
              <p className="text-xs text-muted-foreground">
                {chainValidation.validLinks} de {chainValidation.totalInvoices} facturas verificadas
                {chainValidation.brokenAt && ` — Rotura en: ${chainValidation.brokenAt}`}
              </p>
              {chainValidation.errors.length > 0 && (
                <div className="mt-2 space-y-0.5">
                  {chainValidation.errors.slice(0, 3).map((err, i) => (
                    <p key={i} className="text-[10px] text-destructive font-mono">{err}</p>
                  ))}
                  {chainValidation.errors.length > 3 && (
                    <p className="text-[10px] text-muted-foreground">...y {chainValidation.errors.length - 3} errores más</p>
                  )}
                </div>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">VeriFactu</p>
              <p className="text-xs font-medium">
                Obligatorio desde enero 2027
              </p>
            </div>
          </CardContent>
        </Card>
      )}

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
                    <p className="text-xs text-muted-foreground font-mono">{inv.invoiceNumber}</p>
                    <p className="text-xs text-muted-foreground truncate">{inv.concept}</p>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      <Badge variant="outline" className={inv.taxRegime === "rebu" ? "bg-purple-500/10 text-purple-600 border-purple-500/20 text-[10px] px-1.5 py-0" : "bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px] px-1.5 py-0"}>
                        {inv.taxRegime === "rebu" ? "REBU" : "IVA"}
                      </Badge>
                      <VeriFactuBadge status={inv.verifactuStatus} />
                    </div>
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
            {invoices.length === 0 ? "Las facturas se generan automáticamente al completar ventas" : "No se encontraron facturas"}
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
                <TableHead>Régimen</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>IVA</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>VeriFactu</TableHead>
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
                    <TableCell className="font-mono text-sm font-medium">{inv.invoiceNumber}</TableCell>
                    <TableCell className="text-sm">{inv.clientName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{inv.concept}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={inv.taxRegime === "rebu" ? "bg-purple-500/10 text-purple-600 border-purple-500/20" : "bg-blue-500/10 text-blue-600 border-blue-500/20"}>
                        {inv.taxRegime === "rebu" ? "REBU" : "IVA General"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-semibold">{formatCurrency(inv.total)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatCurrency(inv.ivaAmount)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium ${cfg.className}`}>
                        {cfg.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <VeriFactuBadge status={inv.verifactuStatus} />
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
                  <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                    {invoices.length === 0 ? "Las facturas se generan automáticamente al completar ventas" : "No se encontraron facturas"}
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
              Factura {selectedInvoice?.invoiceNumber}
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
                    <p className="font-mono font-bold text-primary">{selectedInvoice.invoiceNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(selectedInvoice.issuedDate).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                    <div className="flex gap-1 mt-1 justify-end flex-wrap">
                      <Badge variant="outline" className={selectedInvoice.taxRegime === "rebu" ? "bg-purple-500/10 text-purple-600 border-purple-500/20" : "bg-blue-500/10 text-blue-600 border-blue-500/20"}>
                        {selectedInvoice.taxRegime === "rebu" ? "REBU" : "IVA General"}
                      </Badge>
                      <VeriFactuBadge status={selectedInvoice.verifactuStatus} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Client */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Cliente</p>
                <p className="text-sm font-medium">{selectedInvoice.clientName}</p>
                <p className="text-xs text-muted-foreground">DNI: {selectedInvoice.clientDni || "—"}</p>
              </div>

              {/* Concept */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Concepto</p>
                <p className="text-sm">{selectedInvoice.concept}</p>
              </div>

              {/* Amounts */}
              <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                {selectedInvoice.taxRegime === "iva_general" ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Base imponible</span>
                      <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">IVA ({selectedInvoice.ivaRate || 21}%)</span>
                      <span>{formatCurrency(selectedInvoice.ivaAmount)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between">
                      <span className="font-semibold">Total</span>
                      <span className="text-lg font-bold text-primary">{formatCurrency(selectedInvoice.total)}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="border-b pb-2 flex justify-between">
                      <span className="font-semibold">Total</span>
                      <span className="text-lg font-bold text-primary">{formatCurrency(selectedInvoice.total)}</span>
                    </div>
                    <div className="pt-1 rounded-md bg-purple-500/5 border border-purple-500/10 p-3 text-xs text-purple-700 space-y-1">
                      <p className="font-semibold">Régimen Especial de Bienes Usados</p>
                      <p>Art. 135-139 Ley 37/1992 del IVA</p>
                      <p className="text-muted-foreground">IVA incluido en el precio — no se desglosa en factura</p>
                    </div>
                    {isAdmin && selectedInvoice.purchasePrice != null && (
                      <div className="pt-2 border-t text-xs space-y-1">
                        <p className="text-muted-foreground font-semibold uppercase tracking-wider">Datos internos (admin)</p>
                        <div className="grid grid-cols-2 gap-1">
                          <span className="text-muted-foreground">P. compra:</span>
                          <span className="font-medium">{formatCurrency(selectedInvoice.purchasePrice)}</span>
                          <span className="text-muted-foreground">Margen:</span>
                          <span className="font-medium">{formatCurrency(selectedInvoice.total - selectedInvoice.purchasePrice)}</span>
                          <span className="text-muted-foreground">IVA implícito:</span>
                          <span className="font-medium">{formatCurrency(selectedInvoice.ivaAmount)}</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* VeriFactu hash info (admin only) */}
              {isAdmin && selectedInvoice.hash && (
                <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3 space-y-1.5">
                  <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" /> VeriFactu — Cadena de hashes
                  </p>
                  <div className="text-[10px] font-mono text-muted-foreground space-y-0.5">
                    <p>Hash: {selectedInvoice.hash.slice(0, 32)}...</p>
                    <p>Anterior: {selectedInvoice.previousHash ? `${selectedInvoice.previousHash.slice(0, 32)}...` : "GENESIS (primera factura)"}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className={statusConfig[selectedInvoice.status].className}>
                    {statusConfig[selectedInvoice.status].label}
                  </Badge>
                  {isAdmin && selectedInvoice.status === "emitida" && (
                    <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => {
                      updateInvoice(selectedInvoice.id, { status: "pagada" })
                      setSelectedInvoice({ ...selectedInvoice, status: "pagada" })
                    }}>
                      Marcar pagada
                    </Button>
                  )}
                </div>
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
