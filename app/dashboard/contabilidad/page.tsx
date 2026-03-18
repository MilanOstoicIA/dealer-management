"use client"

import { useState } from "react"
import {
  Euro,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Car,
  Users,
  Receipt,
  BarChart3,
  CalendarDays,
  PieChart as PieChartIcon,
  Table2,
  ArrowUp,
  ArrowDown,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
} from "recharts"
import { useStore } from "@/lib/store"

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount)
}

function formatShort(amount: number): string {
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}k`
  return `${amount}`
}

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
const PIE_COLORS = ["#3b82f6", "#ef4444", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316", "#6b7280"]

const expenseCategoryLabels: Record<string, string> = {
  compra_vehiculo: "Compra vehículos",
  reparacion: "Reparaciones",
  pieza: "Piezas",
  nomina: "Nóminas",
  alquiler: "Alquiler",
  publicidad: "Publicidad",
  seguro: "Seguros",
  impuesto: "Impuestos",
  otro: "Otros",
}

type TabId = "resumen" | "vendedores" | "gastos" | "historial"

export default function ContabilidadPage() {
  const { vehicles, sales, expenses, users, getUserById, getVehicleById, getClientById } = useStore()
  const [selectedYear, setSelectedYear] = useState("2026")
  const [activeTab, setActiveTab] = useState<TabId>("resumen")

  const completedSales = sales.filter((s) => s.status === "completada")
  const totalRevenue = completedSales.reduce((sum, s) => sum + s.salePrice, 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

  const soldVehicles = vehicles.filter((v) => v.status === "vendido")
  const totalPurchaseCost = soldVehicles.reduce((sum, v) => sum + v.purchasePrice, 0)
  const grossProfit = totalRevenue - totalPurchaseCost

  const operatingExpenses = expenses
    .filter((e) => e.category !== "compra_vehiculo")
    .reduce((sum, e) => sum + e.amount, 0)
  const netProfit = grossProfit - operatingExpenses

  const stockVehicles = vehicles.filter((v) => v.status !== "vendido")
  const stockInvestment = stockVehicles.reduce((sum, v) => sum + v.purchasePrice, 0)
  const stockSaleValue = stockVehicles.reduce((sum, v) => sum + v.price, 0)
  const potentialProfit = stockSaleValue - stockInvestment

  const monthlyData = MONTHS.map((name, i) => {
    const monthStr = `${selectedYear}-${String(i + 1).padStart(2, "0")}`
    const monthSales = completedSales.filter((s) => s.saleDate.startsWith(monthStr))
    const monthExpenses = expenses.filter((e) => e.date.startsWith(monthStr))
    const revenue = monthSales.reduce((sum, s) => sum + s.salePrice, 0)
    const expenseTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0)
    const commissions = monthSales.reduce((sum, s) => sum + s.commission, 0)
    const profit = revenue - expenseTotal
    return { name, ingresos: revenue, gastos: expenseTotal, comisiones: commissions, ventas: monthSales.length, beneficio: profit }
  })

  const expenseByCategory = Object.entries(
    expenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount
      return acc
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amount]) => ({
      name: expenseCategoryLabels[cat] || cat,
      value: amount,
      pct: ((amount / totalExpenses) * 100).toFixed(1),
    }))

  const sellers = users.filter((u) => u.role === "vendedor")
  const sellerStats = sellers.map((seller) => {
    const sellerSales = completedSales.filter((s) => s.sellerId === seller.id)
    const allSellerSales = sales.filter((s) => s.sellerId === seller.id)
    return {
      seller,
      salesCount: sellerSales.length,
      totalCount: allSellerSales.length,
      totalRevenue: sellerSales.reduce((sum, s) => sum + s.salePrice, 0),
      totalCommission: sellerSales.reduce((sum, s) => sum + s.commission, 0),
      avgCommissionRate: sellerSales.length > 0
        ? (sellerSales.reduce((sum, s) => sum + s.commissionRate, 0) / sellerSales.length).toFixed(1)
        : "0",
      avgSalePrice: sellerSales.length > 0
        ? sellerSales.reduce((sum, s) => sum + s.salePrice, 0) / sellerSales.length
        : 0,
    }
  })

  const sellerMonthlyData = MONTHS.map((name, i) => {
    const monthStr = `${selectedYear}-${String(i + 1).padStart(2, "0")}`
    const row: Record<string, string | number> = { name }
    sellers.forEach((s) => {
      const sellerMonthSales = completedSales.filter(
        (sale) => sale.sellerId === s.id && sale.saleDate.startsWith(monthStr)
      )
      row[s.name.split(" ")[0]] = sellerMonthSales.reduce((sum, sale) => sum + sale.salePrice, 0)
    })
    return row
  })

  const currentMonth = "2026-03"
  const prevMonth = "2026-02"
  const currentMonthRevenue = completedSales
    .filter((s) => s.saleDate.startsWith(currentMonth))
    .reduce((sum, s) => sum + s.salePrice, 0)
  const prevMonthRevenue = completedSales
    .filter((s) => s.saleDate.startsWith(prevMonth))
    .reduce((sum, s) => sum + s.salePrice, 0)
  const revenueChange = prevMonthRevenue > 0
    ? ((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue * 100).toFixed(1)
    : "N/A"
  const currentMonthExpenses = expenses
    .filter((e) => e.date.startsWith(currentMonth))
    .reduce((sum, e) => sum + e.amount, 0)
  const prevMonthExpenses = expenses
    .filter((e) => e.date.startsWith(prevMonth))
    .reduce((sum, e) => sum + e.amount, 0)

  const sortedSales = [...sales].sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime())

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "resumen", label: "Resumen", icon: <BarChart3 className="h-4 w-4" /> },
    { id: "vendedores", label: "Vendedores", icon: <Users className="h-4 w-4" /> },
    { id: "gastos", label: "Gastos", icon: <Receipt className="h-4 w-4" /> },
    { id: "historial", label: "Historial", icon: <Table2 className="h-4 w-4" /> },
  ]

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Contabilidad</h1>
          <p className="text-sm text-muted-foreground mt-1">Resumen financiero del concesionario</p>
        </div>
        <Select value={selectedYear} onValueChange={(v) => setSelectedYear(v ?? "2026")}>
          <SelectTrigger className="w-[120px] h-9">
            <CalendarDays className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2025">2025</SelectItem>
            <SelectItem value="2026">2026</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPIs - bigger and color-coded */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ingresos ventas</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/15">
                <ArrowUpRight className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight text-green-600">{formatCurrency(totalRevenue)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{completedSales.length} ventas completadas</p>
          </CardContent>
        </Card>
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Gastos totales</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/15">
                <ArrowDownRight className="h-4 w-4 text-destructive" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight text-destructive">{formatCurrency(totalExpenses)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{expenses.length} registros</p>
          </CardContent>
        </Card>
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Beneficio bruto</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15">
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight text-blue-600">{formatCurrency(grossProfit)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Ventas - Coste vehículos</p>
          </CardContent>
        </Card>
        <Card className="border-primary/30 bg-primary/5 ring-1 ring-primary/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Beneficio neto</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
                <Euro className="h-4 w-4 text-primary" />
              </div>
            </div>
            <p className={`mt-3 text-3xl font-bold tracking-tight ${netProfit >= 0 ? "text-green-600" : "text-destructive"}`}>{formatCurrency(netProfit)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Después de gastos operativos</p>
          </CardContent>
        </Card>
      </div>

      {/* Month comparison */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/15">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ingresos marzo</p>
                <p className="text-2xl font-bold">{formatCurrency(currentMonthRevenue)}</p>
                {revenueChange !== "N/A" && (
                  <div className={`flex items-center gap-1 text-xs font-medium ${Number(revenueChange) >= 0 ? "text-green-600" : "text-red-500"}`}>
                    {Number(revenueChange) >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                    {Math.abs(Number(revenueChange))}% vs febrero
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/15">
                <TrendingDown className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Gastos marzo</p>
                <p className="text-2xl font-bold">{formatCurrency(currentMonthExpenses)}</p>
                <p className="text-xs text-muted-foreground">Feb: {formatCurrency(prevMonthExpenses)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
                <Car className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Invertido en stock</p>
                <p className="text-2xl font-bold">{formatCurrency(stockInvestment)}</p>
                <p className="text-xs font-medium text-green-600">+{formatCurrency(potentialProfit)} potencial</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-lg border p-1 w-full overflow-x-auto md:w-fit">
        {tabs.map((tab) => (
          <Button key={tab.id} variant={activeTab === tab.id ? "default" : "ghost"} size="sm" className="h-9 px-3 md:px-4 shrink-0" onClick={() => setActiveTab(tab.id)}>
            {tab.icon}
            <span className="ml-1.5 text-xs md:text-sm">{tab.label}</span>
          </Button>
        ))}
      </div>

      {activeTab === "resumen" && (
        <div className="space-y-6">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Ingresos vs Gastos por mes ({selectedYear})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[380px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={formatShort} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "13px" }} />
                    <Legend wrapperStyle={{ fontSize: "13px", paddingTop: "10px" }} />
                    <Bar dataKey="ingresos" name="Ingresos" fill="#22c55e" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="gastos" name="Gastos" fill="#ef4444" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="comisiones" name="Comisiones" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Evolución del beneficio ({selectedYear})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={formatShort} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "13px" }} />
                    <Area type="monotone" dataKey="beneficio" name="Beneficio" stroke="#22c55e" strokeWidth={2} fill="url(#profitGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "vendedores" && (
        <div className="space-y-6">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" /> Ventas por vendedor ({selectedYear})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sellerMonthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={formatShort} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "13px" }} />
                    <Legend wrapperStyle={{ fontSize: "13px" }} />
                    {sellers.map((s, i) => (
                      <Line key={s.id} type="monotone" dataKey={s.name.split(" ")[0]} stroke={PIE_COLORS[i % PIE_COLORS.length]} strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {sellerStats.map(({ seller, salesCount, totalRevenue: rev, totalCommission, avgCommissionRate, avgSalePrice }) => (
              <Card key={seller.id} className="border-border/50">
                <CardContent className="p-4">
                  <p className="text-sm font-semibold">{seller.name}</p>
                  <p className="text-xs text-muted-foreground mb-2">{seller.email}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-muted-foreground">Ventas:</span> <span className="font-bold">{salesCount}</span></div>
                    <div><span className="text-muted-foreground">Ingresos:</span> <span className="font-bold">{formatCurrency(rev)}</span></div>
                    <div><span className="text-muted-foreground">Comisión:</span> <Badge variant="secondary" className="bg-green-500/10 text-green-600 text-[10px]">{avgCommissionRate}%</Badge></div>
                    <div><span className="text-muted-foreground">Ticket:</span> <span className="font-medium">{formatCurrency(avgSalePrice)}</span></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {/* Desktop table */}
          <Card className="border-border/50 hidden md:block">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" /> Rendimiento por vendedor
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Ventas</TableHead>
                    <TableHead>Ingresos</TableHead>
                    <TableHead>Comisión %</TableHead>
                    <TableHead>Total comisiones</TableHead>
                    <TableHead>Ticket medio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sellerStats.map(({ seller, salesCount, totalCount, totalRevenue: rev, totalCommission, avgCommissionRate, avgSalePrice }) => (
                    <TableRow key={seller.id}>
                      <TableCell>
                        <p className="text-sm font-medium">{seller.name}</p>
                        <p className="text-xs text-muted-foreground">{seller.email}</p>
                      </TableCell>
                      <TableCell>
                        <span className="text-lg font-bold">{salesCount}</span>
                        {totalCount > salesCount && <span className="text-xs text-muted-foreground ml-1">/ {totalCount}</span>}
                      </TableCell>
                      <TableCell className="text-sm font-bold">{formatCurrency(rev)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-green-500/10 text-green-600 text-xs">{avgCommissionRate}%</Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-green-600">{formatCurrency(totalCommission)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatCurrency(avgSalePrice)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "gastos" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4" /> Distribución de gastos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={expenseByCategory} cx="50%" cy="50%" innerRadius={60} outerRadius={110} paddingAngle={3} dataKey="value">
                        {expenseByCategory.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "13px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Desglose por categoría</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {expenseByCategory.map((cat, i) => (
                  <div key={cat.name} className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">{cat.name}</p>
                        <p className="text-sm font-bold">{formatCurrency(cat.value)}</p>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${Number(cat.pct)}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{cat.pct}% del total</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          {/* Mobile expense cards */}
          <div className="space-y-2 md:hidden">
            <p className="text-base font-semibold flex items-center gap-2">
              <Receipt className="h-4 w-4" /> Todos los gastos
            </p>
            {[...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((e) => {
              const vehicle = e.vehicleId ? getVehicleById(e.vehicleId) : null
              return (
                <Card key={e.id} className="border-border/50">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{e.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-[10px]">{expenseCategoryLabels[e.category] || e.category}</Badge>
                          <span className="text-[10px] text-muted-foreground">{new Date(e.date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</span>
                        </div>
                        {vehicle && <p className="text-[10px] text-muted-foreground mt-0.5">{vehicle.brand} {vehicle.model}</p>}
                      </div>
                      <p className="text-sm font-bold text-destructive shrink-0 ml-3">{formatCurrency(e.amount)}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          {/* Desktop expense table */}
          <Card className="border-border/50 hidden md:block">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Receipt className="h-4 w-4" /> Todos los gastos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Vehículo</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Importe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((e) => {
                    const vehicle = e.vehicleId ? getVehicleById(e.vehicleId) : null
                    return (
                      <TableRow key={e.id}>
                        <TableCell className="text-sm font-medium">{e.description}</TableCell>
                        <TableCell><Badge variant="secondary" className="text-[10px]">{expenseCategoryLabels[e.category] || e.category}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{vehicle ? `${vehicle.brand} ${vehicle.model}` : "\—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(e.date).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}</TableCell>
                        <TableCell className="text-sm text-right font-bold text-destructive">{formatCurrency(e.amount)}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "historial" && (
        <>
          {/* Mobile history cards */}
          <div className="space-y-2 md:hidden">
            {sortedSales.map((sale) => {
              const vehicle = getVehicleById(sale.vehicleId)
              const client = getClientById(sale.clientId)
              const statusCfg: Record<string, { label: string; cls: string }> = {
                en_proceso: { label: "En proceso", cls: "bg-yellow-500/15 text-yellow-600" },
                completada: { label: "Completada", cls: "bg-green-500/15 text-green-600" },
                cancelada: { label: "Cancelada", cls: "bg-red-500/15 text-red-500" },
              }
              const cfg = statusCfg[sale.status] || statusCfg.en_proceso
              return (
                <Card key={sale.id} className="border-border/50">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{vehicle?.brand} {vehicle?.model}</p>
                        <p className="text-xs text-muted-foreground">{client?.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className={`text-[10px] ${cfg.cls}`}>{cfg.label}</Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(sale.saleDate).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm font-bold shrink-0 ml-3">{formatCurrency(sale.salePrice)}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          {/* Desktop history table */}
          <Card className="border-border/50 hidden md:block">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Table2 className="h-4 w-4" /> Historial completo de ventas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Vehículo</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Precio venta</TableHead>
                    <TableHead>Coste</TableHead>
                    <TableHead>Comisión</TableHead>
                    <TableHead>Margen</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedSales.map((sale) => {
                    const vehicle = getVehicleById(sale.vehicleId)
                    const client = getClientById(sale.clientId)
                    const seller = getUserById(sale.sellerId)
                    const purchasePrice = vehicle?.purchasePrice ?? 0
                    const margin = sale.salePrice - purchasePrice - sale.commission
                    const statusCfg: Record<string, { label: string; cls: string }> = {
                      en_proceso: { label: "En proceso", cls: "bg-yellow-500/15 text-yellow-600" },
                      completada: { label: "Completada", cls: "bg-green-500/15 text-green-600" },
                      cancelada: { label: "Cancelada", cls: "bg-red-500/15 text-red-500" },
                    }
                    const cfg = statusCfg[sale.status] || statusCfg.en_proceso
                    const payLabels: Record<string, string> = { contado: "Contado", "financiación": "Financiación", leasing: "Leasing" }
                    return (
                      <TableRow key={sale.id}>
                        <TableCell className="text-xs">{new Date(sale.saleDate).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</TableCell>
                        <TableCell>
                          <p className="text-sm font-medium">{vehicle?.brand} {vehicle?.model}</p>
                          <p className="text-[10px] text-muted-foreground">{vehicle?.licensePlate}</p>
                        </TableCell>
                        <TableCell className="text-sm">{client?.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{seller?.name?.split(" ")[0]}</TableCell>
                        <TableCell className="text-xs">{payLabels[sale.paymentMethod] || sale.paymentMethod}</TableCell>
                        <TableCell className="text-sm font-bold">{formatCurrency(sale.salePrice)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatCurrency(purchasePrice)}</TableCell>
                        <TableCell className="text-xs text-green-600">{sale.commissionRate}% ({formatCurrency(sale.commission)})</TableCell>
                        <TableCell className={`text-sm font-bold ${margin >= 0 ? "text-green-600" : "text-destructive"}`}>{formatCurrency(margin)}</TableCell>
                        <TableCell><Badge variant="secondary" className={`text-[10px] ${cfg.cls}`}>{cfg.label}</Badge></TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
