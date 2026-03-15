"use client"

import { useState, useMemo } from "react"
import {
  CalendarDays,
  Search,
  Filter,
  Clock,
  User,
  Car,
  ChevronLeft,
  ChevronRight,
  List,
  LayoutGrid,
  Wrench,
  ClipboardCheck,
  Camera,
  CheckCircle2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { appointments, getClientById, getVehicleById, getUserById } from "@/lib/data"
import type { Appointment, AppointmentStatus } from "@/types"

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

const statusConfig: Record<AppointmentStatus, { label: string; className: string; dotColor: string }> = {
  pendiente: { label: "Pendiente", className: "bg-yellow-500/15 text-yellow-600 border-yellow-500/20", dotColor: "bg-yellow-500" },
  en_progreso: { label: "En progreso", className: "bg-blue-500/15 text-blue-600 border-blue-500/20", dotColor: "bg-blue-500" },
  completada: { label: "Completada", className: "bg-green-500/15 text-green-600 border-green-500/20", dotColor: "bg-green-500" },
  cancelada: { label: "Cancelada", className: "bg-destructive/15 text-destructive border-destructive/20", dotColor: "bg-destructive" },
}

const DAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount)
}

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate()
}

function getCalendarDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1)
  // Monday=0 ... Sunday=6
  let startDow = firstDay.getDay() - 1
  if (startDow < 0) startDow = 6
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  // pad to complete last week
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export default function CitasPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("todos")
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [view, setView] = useState<"calendar" | "list">("calendar")

  // Calendar state
  const today = new Date()
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const calendarDays = useMemo(() => getCalendarDays(calYear, calMonth), [calYear, calMonth])

  // Map of day -> appointments for current month
  const appointmentsByDay = useMemo(() => {
    const map: Record<number, Appointment[]> = {}
    appointments.forEach((a) => {
      const d = new Date(a.date)
      if (d.getFullYear() === calYear && d.getMonth() === calMonth) {
        const day = d.getDate()
        if (!map[day]) map[day] = []
        map[day].push(a)
      }
    })
    return map
  }, [calYear, calMonth])

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1) }
    else setCalMonth(calMonth - 1)
  }
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1) }
    else setCalMonth(calMonth + 1)
  }
  const goToday = () => {
    setCalYear(today.getFullYear())
    setCalMonth(today.getMonth())
    setSelectedDate(today)
  }

  // Appointments for selected date in calendar
  const selectedDateAppointments = useMemo(() => {
    if (!selectedDate) return []
    return appointments
      .filter((a) => isSameDay(new Date(a.date), selectedDate))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [selectedDate])

  // List view filtering
  const sorted = [...appointments].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const filtered = sorted.filter((a) => {
    const client = getClientById(a.clientId)
    const vehicle = getVehicleById(a.vehicleId)
    const searchLower = search.toLowerCase()
    const matchesSearch =
      client?.name.toLowerCase().includes(searchLower) ||
      vehicle?.brand.toLowerCase().includes(searchLower) ||
      vehicle?.model.toLowerCase().includes(searchLower) ||
      vehicle?.licensePlate.toLowerCase().includes(searchLower)
    const matchesStatus = statusFilter === "todos" || a.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const pendingCount = appointments.filter((a) => a.status === "pendiente").length
  const inProgressCount = appointments.filter((a) => a.status === "en_progreso").length
  const completedCount = appointments.filter((a) => a.status === "completada").length

  const selectedClient = selectedAppointment ? getClientById(selectedAppointment.clientId) : null
  const selectedVehicle = selectedAppointment ? getVehicleById(selectedAppointment.vehicleId) : null
  const selectedMechanic = selectedAppointment ? getUserById(selectedAppointment.mechanicId) : null

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Citas / Taller</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión de citas y servicios de taller
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border p-1">
          <Button
            variant={view === "calendar" ? "default" : "ghost"}
            size="sm"
            className="h-8 px-3"
            onClick={() => setView("calendar")}
          >
            <LayoutGrid className="h-4 w-4 mr-1.5" />
            Calendario
          </Button>
          <Button
            variant={view === "list" ? "default" : "ghost"}
            size="sm"
            className="h-8 px-3"
            onClick={() => setView("list")}
          >
            <List className="h-4 w-4 mr-1.5" />
            Lista
          </Button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/15">
              <Clock className="h-4 w-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-lg font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Pendientes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15">
              <CalendarDays className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-bold">{inProgressCount}</p>
              <p className="text-xs text-muted-foreground">En progreso</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/15">
              <CalendarDays className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-bold">{completedCount}</p>
              <p className="text-xs text-muted-foreground">Completadas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {view === "calendar" ? (
        /* ========== CALENDAR VIEW ========== */
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          {/* Calendar grid */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="text-lg font-semibold min-w-[180px] text-center">
                    {MONTH_NAMES[calMonth]} {calYear}
                  </h2>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="outline" size="sm" className="h-8" onClick={goToday}>
                  Hoy
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-1">
                {DAY_NAMES.map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
                    {d}
                  </div>
                ))}
              </div>
              {/* Day cells */}
              <div className="grid grid-cols-7">
                {calendarDays.map((day, idx) => {
                  if (day === null) return <div key={`empty-${idx}`} className="h-20 border-t border-border/30" />
                  const dayDate = new Date(calYear, calMonth, day)
                  const isToday = isSameDay(dayDate, today)
                  const isSelected = selectedDate && isSameDay(dayDate, selectedDate)
                  const dayAppts = appointmentsByDay[day] || []
                  const isWeekend = idx % 7 >= 5

                  return (
                    <div
                      key={`day-${day}`}
                      className={`h-20 border-t border-border/30 p-1 cursor-pointer transition-colors hover:bg-muted/40 ${
                        isSelected ? "bg-primary/10 ring-1 ring-primary/30" : ""
                      } ${isWeekend ? "bg-muted/20" : ""}`}
                      onClick={() => setSelectedDate(dayDate)}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                            isToday
                              ? "bg-primary text-primary-foreground"
                              : "text-foreground"
                          }`}
                        >
                          {day}
                        </span>
                        {dayAppts.length > 0 && (
                          <span className="text-[10px] font-medium text-muted-foreground">
                            {dayAppts.length}
                          </span>
                        )}
                      </div>
                      {/* Appointment dots */}
                      <div className="mt-1 flex flex-wrap gap-0.5">
                        {dayAppts.slice(0, 3).map((a) => (
                          <div
                            key={a.id}
                            className={`h-1.5 w-1.5 rounded-full ${statusConfig[a.status].dotColor}`}
                            title={`${getClientById(a.clientId)?.name} - ${serviceTypeLabels[a.serviceType]}`}
                          />
                        ))}
                        {dayAppts.length > 3 && (
                          <span className="text-[8px] text-muted-foreground ml-0.5">+{dayAppts.length - 3}</span>
                        )}
                      </div>
                      {/* First appointment preview */}
                      {dayAppts.length > 0 && (
                        <p className="mt-0.5 text-[10px] text-muted-foreground truncate leading-tight">
                          {getClientById(dayAppts[0].clientId)?.name?.split(" ")[0]}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Side panel: selected day appointments */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">
                {selectedDate
                  ? selectedDate.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })
                  : "Selecciona un día"}
              </h3>
            </div>

            {!selectedDate && (
              <p className="text-xs text-muted-foreground">
                Haz clic en un día del calendario para ver sus citas.
              </p>
            )}

            {selectedDate && selectedDateAppointments.length === 0 && (
              <Card className="border-border/50 border-dashed">
                <CardContent className="p-6 text-center">
                  <CalendarDays className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No hay citas este día</p>
                </CardContent>
              </Card>
            )}

            {selectedDateAppointments.map((appt) => {
              const client = getClientById(appt.clientId)
              const vehicle = getVehicleById(appt.vehicleId)
              const mechanic = getUserById(appt.mechanicId)
              const cfg = statusConfig[appt.status]
              const time = new Date(appt.date).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })

              return (
                <Card
                  key={appt.id}
                  className="border-border/50 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setSelectedAppointment(appt)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-center shrink-0">
                        <p className="text-sm font-bold text-primary">{time}</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold">{client?.name}</p>
                          <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[9px] font-medium ${cfg.className}`}>
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {vehicle?.brand} {vehicle?.model} · {vehicle?.licensePlate}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {serviceTypeLabels[appt.serviceType]} · {mechanic?.name}
                        </p>
                        <p className="text-xs font-medium mt-1">{formatCurrency(appt.estimatedCost)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ) : (
        /* ========== LIST VIEW ========== */
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente, vehículo o matrícula..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "todos")}>
              <SelectTrigger className="w-[160px] h-9">
                <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="en_progreso">En progreso</SelectItem>
                <SelectItem value="completada">Completada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Appointments list */}
          <div className="space-y-3">
            {filtered.map((appt) => {
              const client = getClientById(appt.clientId)
              const vehicle = getVehicleById(appt.vehicleId)
              const mechanic = getUserById(appt.mechanicId)
              const cfg = statusConfig[appt.status]
              const date = new Date(appt.date)

              return (
                <Card
                  key={appt.id}
                  className="border-border/50 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setSelectedAppointment(appt)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`mt-1 h-2.5 w-2.5 rounded-full shrink-0 ${cfg.dotColor}`} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold">{client?.name}</p>
                            <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium ${cfg.className}`}>
                              {cfg.label}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {vehicle?.brand} {vehicle?.model} ({vehicle?.licensePlate}) · {serviceTypeLabels[appt.serviceType]}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {appt.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium">
                          {date.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                        <p className="text-xs font-medium mt-1">{formatCurrency(appt.estimatedCost)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            {filtered.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No se encontraron citas
              </div>
            )}
          </div>
        </>
      )}

      {/* Appointment Detail Dialog */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Detalle de cita
            </DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-5">
              {/* Status & type */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={statusConfig[selectedAppointment.status].className}>
                  {statusConfig[selectedAppointment.status].label}
                </Badge>
                <Badge variant="outline">{serviceTypeLabels[selectedAppointment.serviceType]}</Badge>
                {selectedAppointment.mileageAtService && (
                  <Badge variant="outline" className="bg-muted/50">
                    {new Intl.NumberFormat("es-ES").format(selectedAppointment.mileageAtService)} km
                  </Badge>
                )}
              </div>

              {/* Client, Vehicle, Date, Mechanic */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="font-medium">{selectedClient?.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedClient?.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Car className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="font-medium">{selectedVehicle?.brand} {selectedVehicle?.model}</p>
                    <p className="text-xs text-muted-foreground">{selectedVehicle?.licensePlate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="font-medium">
                      {new Date(selectedAppointment.date).toLocaleDateString("es-ES", {
                        day: "numeric", month: "long", year: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(selectedAppointment.date).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Wrench className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="font-medium">{selectedMechanic?.name}</p>
                    <p className="text-xs text-muted-foreground">Mecánico</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Descripción</p>
                <p className="text-sm">{selectedAppointment.description}</p>
              </div>

              {/* Work Report — for completed appointments */}
              {selectedAppointment.workItems && selectedAppointment.workItems.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ClipboardCheck className="h-3.5 w-3.5" />
                    Informe de trabajos realizados
                  </p>
                  <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Trabajo</th>
                          <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Piezas</th>
                          <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">Coste</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedAppointment.workItems.map((item, i) => (
                          <tr key={i} className="border-t border-border/30">
                            <td className="px-3 py-2 text-sm">{item.description}</td>
                            <td className="px-3 py-2 text-xs text-muted-foreground">{item.parts || "—"}</td>
                            <td className="px-3 py-2 text-sm text-right font-medium">{formatCurrency(item.cost)}</td>
                          </tr>
                        ))}
                        <tr className="border-t-2 border-border bg-muted/30">
                          <td colSpan={2} className="px-3 py-2 text-sm font-semibold">Total</td>
                          <td className="px-3 py-2 text-sm text-right font-bold text-primary">
                            {formatCurrency(selectedAppointment.workItems.reduce((s, w) => s + w.cost, 0))}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Mechanic notes */}
              {selectedAppointment.mechanicNotes && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Notas del mecánico</p>
                  <p className="text-sm bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                    {selectedAppointment.mechanicNotes}
                  </p>
                </div>
              )}

              {/* Photos section */}
              {selectedAppointment.workPhotos && selectedAppointment.workPhotos.length > 0 ? (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Camera className="h-3.5 w-3.5" />
                    Fotos del trabajo ({selectedAppointment.workPhotos.length})
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedAppointment.workPhotos.map((photo, i) => (
                      <div key={i} className="aspect-video rounded-lg bg-muted overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photo} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : selectedAppointment.status === "completada" && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                  <Camera className="h-4 w-4" />
                  Fotos pendientes de adjuntar (se subirán con Supabase Storage)
                </div>
              )}

              {/* Costs summary */}
              <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Coste estimado</span>
                  <span>{formatCurrency(selectedAppointment.estimatedCost)}</span>
                </div>
                {selectedAppointment.finalCost !== undefined && (
                  <div className="flex justify-between text-sm border-t pt-2">
                    <span className="font-semibold">Coste final</span>
                    <span className="font-bold text-primary">{formatCurrency(selectedAppointment.finalCost)}</span>
                  </div>
                )}
              </div>

              {/* Closure info */}
              {selectedAppointment.closedAt && (
                <div className="flex items-center gap-2 text-xs text-green-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Cerrada el {new Date(selectedAppointment.closedAt).toLocaleDateString("es-ES", {
                    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                </div>
              )}

              {selectedAppointment.notes && (
                <div>
                  <p className="text-xs text-muted-foreground">Notas generales</p>
                  <p className="text-sm mt-1 bg-muted/50 rounded-lg p-3">{selectedAppointment.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
