import {
  Car,
  Users,
  CalendarDays,
  TrendingUp,
  Euro,
  AlertCircle,
  CheckCircle,
  Clock,
  ShoppingCart,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  getDashboardStats,
  appointments,
  sales,
  vehicles,
  getClientById,
  getVehicleById,
  getUserById,
} from "@/lib/data"

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

const appointmentStatusConfig: Record<string, { label: string; className: string }> = {
  pendiente: { label: "Pendiente", className: "bg-yellow-500/15 text-yellow-600 border-yellow-500/20" },
  en_progreso: { label: "En progreso", className: "bg-blue-500/15 text-blue-600 border-blue-500/20" },
  completada: { label: "Completada", className: "bg-green-500/15 text-green-600 border-green-500/20" },
  cancelada: { label: "Cancelada", className: "bg-destructive/15 text-destructive border-destructive/20" },
}

const saleStatusConfig: Record<string, { label: string; className: string }> = {
  en_proceso: { label: "En proceso", className: "bg-yellow-500/15 text-yellow-600 border-yellow-500/20" },
  completada: { label: "Completada", className: "bg-green-500/15 text-green-600 border-green-500/20" },
  cancelada: { label: "Cancelada", className: "bg-destructive/15 text-destructive border-destructive/20" },
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount)
}

export default function DashboardPage() {
  const stats = getDashboardStats()
  const pendingAppointments = appointments
    .filter((a) => a.status === "pendiente")
    .slice(0, 5)
  const recentSales = sales.slice(-5).reverse()
  const vehiclesInShop = vehicles.filter((v) => v.status === "en_taller")

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Resumen general del concesionario
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Vehículos totales
              </p>
              <Car className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight">{stats.totalVehicles}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {stats.availableVehicles} disponibles · {stats.vehiclesSold} vendidos
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Clientes
              </p>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight">{stats.totalClients}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Clientes registrados
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Citas pendientes
              </p>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight">{stats.pendingAppointments}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {vehiclesInShop.length} vehículos en taller
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Ventas del mes
              </p>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight">
              {formatCurrency(stats.monthlySalesRevenue)}
            </p>
            <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {formatCurrency(stats.monthlyCommissions)} en comisiones
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Próximas citas */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Próximas citas</CardTitle>
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 text-xs">
                {pendingAppointments.length} pendientes
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {pendingAppointments.map((appt) => {
                const client = getClientById(appt.clientId)
                const vehicle = getVehicleById(appt.vehicleId)
                const cfg = appointmentStatusConfig[appt.status]
                const date = new Date(appt.date)
                return (
                  <div key={appt.id} className="flex items-center justify-between px-6 py-3.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{client?.name}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {vehicle?.brand} {vehicle?.model} · {serviceTypeLabels[appt.serviceType]}
                      </p>
                    </div>
                    <div className="ml-4 flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-xs font-medium">
                        {date.toLocaleDateString("es-ES", { day: "numeric", month: "short" })} · {date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium ${cfg.className}`}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                )
              })}
              {pendingAppointments.length === 0 && (
                <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                  No hay citas pendientes
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Últimas ventas */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Últimas ventas</CardTitle>
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">
                {sales.filter((s) => s.status === "completada").length} completadas
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {recentSales.map((sale) => {
                const client = getClientById(sale.clientId)
                const vehicle = getVehicleById(sale.vehicleId)
                const seller = getUserById(sale.sellerId)
                const cfg = saleStatusConfig[sale.status]
                return (
                  <div key={sale.id} className="flex items-center justify-between px-6 py-3.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                          {vehicle?.brand} {vehicle?.model}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {client?.name} · {seller?.name}
                      </p>
                    </div>
                    <div className="ml-4 flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-sm font-semibold">{formatCurrency(sale.salePrice)}</span>
                      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium ${cfg.className}`}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/50 bg-primary/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">En taller</p>
                <p className="text-xl font-bold">{vehiclesInShop.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-green-500/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/15">
                <ShoppingCart className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ventas en proceso</p>
                <p className="text-xl font-bold">
                  {sales.filter((s) => s.status === "en_proceso").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-yellow-500/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/15">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Reservados</p>
                <p className="text-xl font-bold">
                  {vehicles.filter((v) => v.status === "reservado").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
