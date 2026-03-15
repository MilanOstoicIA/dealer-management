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
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
} from "recharts"
import { vehicles, sales, expenses, users, getUserById, getVehicleById } from "@/lib/data"

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount)
}

function formatShort(amount: number): string {
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}k€`
  return `${amount}€`
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

export default function ContabilidadPage() {
  const [selectedYear, setSelectedYear] = useState("2026")

  // ── Cálculos generales ──
  const completedSales = sales.filter((s) => s.status === "completada")
  const totalRevenue = completedSales.reduce((sum, s) => sum + s.salePrice, 0)
  const totalCommissions = completedSales.reduce((sum, s) => sum + s.commission, 0)
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

  // ── Datos mensuales para gráficos ──
  const monthlyData = MONTHS.map((name, i) => {
    const monthStr = `${selectedYear}-${String(i + 1).padStart(2, "0")}`
    const monthSales = completedSales.filter((s) => s.saleDate.startsWith(monthStr))
    const monthExpenses = expenses.filter((e) => e.date.startsWith(monthStr))
    const revenue = monthSales.reduce((sum, s) => sum + s.salePrice, 0)
    const expenseTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0)
    const commissions = monthSales.reduce((sum, s) => sum + s.commission, 0)
    return { name, ingresos: revenue, gastos: expenseTotal, comisiones: commissions, ventas: monthSales.length }
  })

  // ── Gastos por categoría ──
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
    }))

  // ── Ventas por vendedor ──
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

  // ── Ventas por vendedor por mes (para gráfico de líneas) ──
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

  // ── Comparativa mes actual vs anterior ──
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contabilidad</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Resumen financiero del concesionario
          </p>
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

      {/* Main KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ingresos ventas</p>
              <ArrowUpRight className="h-4 w-4 text-green-600" />
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-green-600">{formatCurrency(totalRevenue)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{completedSales.length} ventas completadas</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Gastos totales</p>
              <ArrowDownRight className="h-4 w-4 text-destructive" />
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-destructive">{formatCurrency(totalExpenses)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{expenses.length} registros</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Beneficio bruto</p>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight">{formatCurrency(grossProfit)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Ventas - Coste vehículos vendidos</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-primary/5">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Beneficio neto</p>
              <Euro className="h-4 w-4 text-primary" />
            </div>
            <p className={`mt-2 text-2xl font-bold tracking-tight ${netProfit >= 0 ? "text-green-600" : "text-destructive"}`}>
              {formatCurrency(netProfit)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Después de gastos operativos</p>
          </CardContent>
        </Card>
      </div>

      {/* Month comparison */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/15">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ingresos marzo</p>
                <p className="text-xl font-bold">{formatCurrency(currentMonthRevenue)}</p>
                {revenueChange !== "N/A" && (
                  <p className={`text-xs ${Number(revenueChange) >= 0 ? "text-green-600" : "text-red-500"}`}>
                    {Number(revenueChange) >= 0 ? "+" : ""}{revenueChange}% vs febrero
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/15">
                <TrendingDown className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Gastos marzo</p>
                <p className="text-xl font-bold">{formatCurrency(currentMonthExpenses)}</p>
                <p className="text-xs text-muted-foreground">
                  Feb: {formatCurrency(prevMonthExpenses)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
                <Car className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Invertido en stock</p>
                <p className="text-xl font-bold">{formatCurrency(stockInvestment)}</p>
                <p className="text-xs text-green-600">+{formatCurrency(potentialProfit)} potencial</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue vs Expenses chart */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Ingresos vs Gastos por mes ({selectedYear})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={formatShort} />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="ingresos" name="Ingresos" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="gastos" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="comisiones" name="Comisiones" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Seller performance chart */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Ventas por vendedor ({selectedYear})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sellerMonthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={formatShort} />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  {sellers.map((s, i) => (
                    <Line
                      key={s.id}
                      type="monotone"
                      dataKey={s.name.split(" ")[0]}
                      stroke={PIE_COLORS[i % PIE_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Expense pie chart */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Gastos por categoría
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                    style={{ fontSize: "10px" }}
                  >
                    {expenseByCategory.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed tables */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Seller stats table */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Rendimiento por vendedor
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Ventas</TableHead>
                  <TableHead>Ingresos</TableHead>
                  <TableHead>Comisión media</TableHead>
                  <TableHead>Ticket medio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sellerStats.map(({ seller, salesCount, totalCount, totalRevenue: rev, totalCommission, avgCommissionRate, avgSalePrice }) => (
                  <TableRow key={seller.id}>
                    <TableCell className="font-medium">{seller.name}</TableCell>
                    <TableCell>
                      {salesCount}
                      {totalCount > salesCount && (
                        <span className="text-xs text-muted-foreground ml-1">({totalCount} total)</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(rev)}</TableCell>
                    <TableCell>
                      <span className="text-green-600 font-medium">{avgCommissionRate}%</span>
                      <span className="text-xs text-muted-foreground ml-1">({formatCurrency(totalCommission)})</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatCurrency(avgSalePrice)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Expense table */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Últimos gastos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Importe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...expenses]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 10)
                  .map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="text-sm">{e.description}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px]">
                          {expenseCategoryLabels[e.category] || e.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(e.date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                      </TableCell>
                      <TableCell className="text-destructive font-medium">{formatCurrency(e.amount)}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
