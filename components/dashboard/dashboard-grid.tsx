'use client'

// react-grid-layout CSS — must be imported in client component
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

import React, { useState, useEffect, useMemo } from 'react'
import { ReactGridLayout, useContainerWidth, verticalCompactor } from 'react-grid-layout'
import type { Layout, LayoutItem } from 'react-grid-layout'
import Link from 'next/link'
import {
  Car, Users, CalendarDays, Euro, TrendingUp, Wrench,
  Lock, CheckSquare, ArrowRight, GripVertical, X,
  PencilLine, Plus, RotateCcw, Trash2,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  type WidgetConfig, type WidgetType, type DashboardLayout,
  WIDGET_CATALOG, loadLayout, saveLayout, getDefaultLayout, resetLayout,
} from '@/lib/dashboard-layout'

// (no WidthProvider needed in v2 — useContainerWidth handles width measurement)

// ─── Data types (passed from parent) ─────────────────────────────────────────

export interface DashboardData {
  availableVehicles: number
  totalVehicles: number
  vehiclesSold: number
  totalClients: number
  pendingAppointments: number
  monthlySalesRevenue: number
  monthlyCommissions: number
  vehiclesInWorkshop: number
  vehiclesReserved: number
  soldThisMonth: number
  upcomingAppointments: {
    id: string
    clientName: string
    vehicleBrand: string
    vehicleModel: string
    date: string
    serviceType: string
    status: string
  }[]
  recentSales: {
    id: string
    vehicleBrand: string
    vehicleModel: string
    clientName: string
    sellerName: string
    salePrice: number
    status: string
    saleDate: string
  }[]
  forumLeads: {
    id: string
    authorName: string
    vehicleBrand: string
    vehicleModel: string
    askingPrice: number
    status: string
    createdAt: string
  }[]
  urgentTrackings: {
    id: string
    title: string
    priority: string
    category: string
    dueDate?: string
    status: string
  }[]
  monthlyRevenue: { month: string; ingresos: number; gastos: number }[]
  vehiclesByStatus: { name: string; value: number; color: string }[]
  salesBySeller: { name: string; ventas: number; ingresos: number }[]
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

// ─── Stat widget ──────────────────────────────────────────────────────────────

const STAT_CONFIG: Record<WidgetType, {
  label: string
  icon: React.ReactNode
  link: string
  solidBg: string        // clase Tailwind de fondo sólido
  getValue: (d: DashboardData) => string | number
  getSubtext?: (d: DashboardData) => string
} | undefined> = {
  stat_vehicles:     { label: 'Vehículos disponibles', icon: <Car className="h-6 w-6 text-white" />,         link: '/dashboard/vehiculos', solidBg: 'bg-blue-500',    getValue: d => d.availableVehicles,                   getSubtext: d => `${d.totalVehicles} en total · ${d.vehiclesSold} vendidos` },
  stat_clients:      { label: 'Clientes totales',      icon: <Users className="h-6 w-6 text-white" />,       link: '/dashboard/clientes',  solidBg: 'bg-violet-500',  getValue: d => d.totalClients,                        getSubtext: () => 'Clientes registrados' },
  stat_appointments: { label: 'Citas pendientes',      icon: <CalendarDays className="h-6 w-6 text-white" />,link: '/dashboard/citas',     solidBg: 'bg-amber-500',   getValue: d => d.pendingAppointments,                 getSubtext: d => `${d.vehiclesInWorkshop} en taller ahora` },
  stat_revenue:      { label: 'Ingresos del mes',      icon: <Euro className="h-6 w-6 text-white" />,        link: '/dashboard/ventas',    solidBg: 'bg-emerald-500', getValue: d => formatCurrency(d.monthlySalesRevenue),  getSubtext: d => `${formatCurrency(d.monthlyCommissions)} en comisiones` },
  stat_commissions:  { label: 'Comisiones del mes',    icon: <TrendingUp className="h-6 w-6 text-white" />,  link: '/dashboard/ventas',    solidBg: 'bg-green-500',   getValue: d => formatCurrency(d.monthlyCommissions),  getSubtext: () => 'Comisiones del equipo' },
  stat_in_workshop:  { label: 'En taller',             icon: <Wrench className="h-6 w-6 text-white" />,      link: '/dashboard/citas',     solidBg: 'bg-orange-500',  getValue: d => d.vehiclesInWorkshop,                  getSubtext: () => 'Vehículos en reparación' },
  stat_reserved:     { label: 'Reservados',            icon: <Lock className="h-6 w-6 text-white" />,        link: '/dashboard/vehiculos', solidBg: 'bg-indigo-500',  getValue: d => d.vehiclesReserved,                    getSubtext: () => 'Con señal o apartados' },
  stat_sold_month:   { label: 'Vendidos este mes',     icon: <CheckSquare className="h-6 w-6 text-white" />, link: '/dashboard/ventas',    solidBg: 'bg-teal-500',    getValue: d => d.soldThisMonth,                       getSubtext: () => 'Ventas completadas' },
  list_appointments: undefined, list_recent_sales: undefined, list_forum: undefined, list_trackings: undefined,
  chart_monthly_revenue: undefined, chart_vehicles_status: undefined, chart_sales_by_seller: undefined,
}

function StatWidget({ type, data, editMode }: { type: WidgetType; data: DashboardData; editMode: boolean }) {
  const cfg = STAT_CONFIG[type]
  if (!cfg) return null
  const value = cfg.getValue(data)
  const subtext = cfg.getSubtext?.(data)

  const content = (
    <div className={cn('h-full flex flex-col justify-between p-5 rounded-xl overflow-hidden relative', cfg.solidBg)}>
      {/* Decoración fondo */}
      <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10 pointer-events-none" />
      <div className="absolute -right-1 -bottom-6 h-28 w-28 rounded-full bg-white/5 pointer-events-none" />

      {/* Fila superior: icono */}
      <div className="flex items-start justify-between gap-2 relative z-10">
        <p className="text-white/80 text-xs font-semibold uppercase tracking-widest leading-snug pr-2">{cfg.label}</p>
        <div className="shrink-0 flex h-11 w-11 items-center justify-center rounded-xl bg-white/20">
          {cfg.icon}
        </div>
      </div>

      {/* Número principal */}
      <div className="relative z-10 mt-3">
        <p className="text-4xl font-extrabold text-white leading-none tracking-tight">{value}</p>
        {subtext && <p className="text-white/65 text-xs mt-1.5 leading-tight">{subtext}</p>}
      </div>
    </div>
  )

  if (editMode) return <div className="h-full">{content}</div>
  return (
    <Link href={cfg.link} className="h-full block group">
      <div className={cn('h-full flex flex-col justify-between p-5 rounded-xl overflow-hidden relative transition-all duration-200 group-hover:brightness-110 group-hover:shadow-xl', cfg.solidBg)}>
        <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -right-1 -bottom-6 h-28 w-28 rounded-full bg-white/5 pointer-events-none" />
        <div className="flex items-start justify-between gap-2 relative z-10">
          <p className="text-white/80 text-xs font-semibold uppercase tracking-widest leading-snug pr-2">{cfg.label}</p>
          <div className="shrink-0 flex h-11 w-11 items-center justify-center rounded-xl bg-white/20">
            {cfg.icon}
          </div>
        </div>
        <div className="relative z-10 mt-3">
          <p className="text-4xl font-extrabold text-white leading-none tracking-tight">{value}</p>
          {subtext && <p className="text-white/65 text-xs mt-1.5 leading-tight">{subtext}</p>}
        </div>
      </div>
    </Link>
  )
}

// ─── Service / status helpers ─────────────────────────────────────────────────

const SERVICE_LABELS: Record<string, string> = {
  revision_general: 'Revisión', cambio_aceite: 'Aceite', frenos: 'Frenos',
  neumaticos: 'Neumáticos', aire_acondicionado: 'A/C', carroceria: 'Carrocería',
  diagnostico: 'Diagnóstico', otro: 'Otro',
}

const APPT_STATUS: Record<string, { label: string; cls: string }> = {
  pendiente:    { label: 'Pendiente',   cls: 'bg-yellow-500/15 text-yellow-700 border-yellow-500/25' },
  en_progreso:  { label: 'En progreso', cls: 'bg-blue-500/15 text-blue-700 border-blue-500/25' },
  completada:   { label: 'Completada',  cls: 'bg-green-500/15 text-green-700 border-green-500/25' },
  cancelada:    { label: 'Cancelada',   cls: 'bg-destructive/15 text-destructive border-destructive/25' },
}

const SALE_STATUS: Record<string, { label: string; cls: string }> = {
  en_proceso:  { label: 'En proceso', cls: 'bg-yellow-500/15 text-yellow-700 border-yellow-500/25' },
  completada:  { label: 'Completada', cls: 'bg-green-500/15 text-green-700 border-green-500/25' },
  cancelada:   { label: 'Cancelada',  cls: 'bg-destructive/15 text-destructive border-destructive/25' },
}

const FORUM_STATUS: Record<string, { label: string; cls: string }> = {
  nuevo:      { label: 'Nuevo',      cls: 'bg-blue-500/15 text-blue-700 border-blue-500/25' },
  contactado: { label: 'Contactado', cls: 'bg-yellow-500/15 text-yellow-700 border-yellow-500/25' },
  comprado:   { label: 'Comprado',   cls: 'bg-green-500/15 text-green-700 border-green-500/25' },
  descartado: { label: 'Descartado', cls: 'bg-muted text-muted-foreground border-border' },
}

const PRIORITY_CLS: Record<string, string> = {
  urgente: 'bg-red-500/15 text-red-700 border-red-500/25',
  alta:    'bg-orange-500/15 text-orange-700 border-orange-500/25',
  media:   'bg-yellow-500/15 text-yellow-700 border-yellow-500/25',
  baja:    'bg-muted text-muted-foreground border-border',
}

// ─── List widget ──────────────────────────────────────────────────────────────

function ListWidget({ type, data, editMode }: { type: WidgetType; data: DashboardData; editMode: boolean }) {
  if (type === 'list_appointments') {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
          <h3 className="text-sm font-semibold">Próximas citas</h3>
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20 text-xs">
            {data.upcomingAppointments.length} pendientes
          </Badge>
        </div>
        <div className="flex-1 overflow-auto divide-y divide-border/50 min-h-0">
          {data.upcomingAppointments.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">Sin citas pendientes</p>
          )}
          {data.upcomingAppointments.map(a => {
            const st = APPT_STATUS[a.status]
            return (
              <div key={a.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{a.clientName}</p>
                  <p className="text-xs text-muted-foreground truncate">{a.vehicleBrand} {a.vehicleModel} · {SERVICE_LABELS[a.serviceType] ?? a.serviceType}</p>
                </div>
                <div className="ml-3 flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs font-medium">{formatDate(a.date)} · {formatTime(a.date)}</span>
                  <span className={cn('inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium', st?.cls)}>{st?.label}</span>
                </div>
              </div>
            )
          })}
        </div>
        {!editMode && (
          <div className="border-t border-border/50 shrink-0">
            <Link href="/dashboard/citas" className="flex items-center justify-center gap-1 py-2.5 text-xs text-primary hover:bg-muted/30 font-medium">
              Ver todas las citas <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </div>
    )
  }

  if (type === 'list_recent_sales') {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
          <h3 className="text-sm font-semibold">Últimas ventas</h3>
          <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20 text-xs">
            {data.recentSales.filter(s => s.status === 'completada').length} completadas
          </Badge>
        </div>
        <div className="flex-1 overflow-auto divide-y divide-border/50 min-h-0">
          {data.recentSales.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">Sin ventas recientes</p>
          )}
          {data.recentSales.map(s => {
            const st = SALE_STATUS[s.status]
            return (
              <div key={s.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{s.vehicleBrand} {s.vehicleModel}</p>
                  <p className="text-xs text-muted-foreground truncate">{s.clientName} · {s.sellerName}</p>
                </div>
                <div className="ml-3 flex flex-col items-end gap-1 shrink-0">
                  <span className="text-sm font-semibold">{formatCurrency(s.salePrice)}</span>
                  <span className={cn('inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium', st?.cls)}>{st?.label}</span>
                </div>
              </div>
            )
          })}
        </div>
        {!editMode && (
          <div className="border-t border-border/50 shrink-0">
            <Link href="/dashboard/ventas" className="flex items-center justify-center gap-1 py-2.5 text-xs text-primary hover:bg-muted/30 font-medium">
              Ver todas las ventas <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </div>
    )
  }

  if (type === 'list_forum') {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
          <h3 className="text-sm font-semibold">Leads del foro</h3>
          <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-500/20 text-xs">
            {data.forumLeads.filter(l => l.status === 'nuevo').length} nuevos
          </Badge>
        </div>
        <div className="flex-1 overflow-auto divide-y divide-border/50 min-h-0">
          {data.forumLeads.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">Sin leads recientes</p>
          )}
          {data.forumLeads.map(l => {
            const st = FORUM_STATUS[l.status]
            return (
              <div key={l.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{l.vehicleBrand} {l.vehicleModel}</p>
                  <p className="text-xs text-muted-foreground truncate">{l.authorName} · {formatDate(l.createdAt)}</p>
                </div>
                <div className="ml-3 flex flex-col items-end gap-1 shrink-0">
                  <span className="text-sm font-semibold">{formatCurrency(l.askingPrice)}</span>
                  <span className={cn('inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium', st?.cls)}>{st?.label}</span>
                </div>
              </div>
            )
          })}
        </div>
        {!editMode && (
          <div className="border-t border-border/50 shrink-0">
            <Link href="/dashboard/foro" className="flex items-center justify-center gap-1 py-2.5 text-xs text-primary hover:bg-muted/30 font-medium">
              Ver todos los leads <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </div>
    )
  }

  if (type === 'list_trackings') {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
          <h3 className="text-sm font-semibold">Seguimientos urgentes</h3>
          <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-500/20 text-xs">
            {data.urgentTrackings.length} activos
          </Badge>
        </div>
        <div className="flex-1 overflow-auto divide-y divide-border/50 min-h-0">
          {data.urgentTrackings.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">Sin seguimientos urgentes</p>
          )}
          {data.urgentTrackings.map(t => (
            <div key={t.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{t.title}</p>
                <p className="text-xs text-muted-foreground truncate capitalize">{t.category.replace('_', ' ')}{t.dueDate && ` · ${formatDate(t.dueDate)}`}</p>
              </div>
              <div className="ml-3 shrink-0">
                <span className={cn('inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium capitalize', PRIORITY_CLS[t.priority])}>{t.priority}</span>
              </div>
            </div>
          ))}
        </div>
        {!editMode && (
          <div className="border-t border-border/50 shrink-0">
            <Link href="/dashboard/seguimientos" className="flex items-center justify-center gap-1 py-2.5 text-xs text-primary hover:bg-muted/30 font-medium">
              Ver todos los seguimientos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </div>
    )
  }

  return null
}

// ─── Chart widgets ────────────────────────────────────────────────────────────

function ChartBarWidget({ type, data }: { type: WidgetType; data: DashboardData }) {
  if (type === 'chart_monthly_revenue') {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between shrink-0">
          <div>
            <p className="text-sm font-bold">Ingresos vs Gastos</p>
            <p className="text-xs text-muted-foreground">Últimos 6 meses</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" />Ingresos</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-400 inline-block" />Gastos</span>
          </div>
        </div>
        <div className="flex-1 min-h-0 px-2 pb-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.monthlyRevenue} margin={{ top: 5, right: 10, left: 0, bottom: 5 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} width={38} />
              <RechartTooltip
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any, name: any) => [formatCurrency(Number(value ?? 0)), name === 'ingresos' ? 'Ingresos' : 'Gastos']}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
              />
              <Bar dataKey="ingresos" fill="#10b981" radius={[4, 4, 0, 0]} name="ingresos" maxBarSize={28} />
              <Bar dataKey="gastos"   fill="#f87171" radius={[4, 4, 0, 0]} name="gastos"   maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    )
  }

  if (type === 'chart_sales_by_seller') {
    const total = data.salesBySeller.reduce((s, v) => s + v.ventas, 0)
    return (
      <div className="h-full flex flex-col">
        <div className="px-5 pt-4 pb-3 shrink-0">
          <p className="text-sm font-bold">Top Vendedores</p>
          <p className="text-xs text-muted-foreground">{total} ventas completadas</p>
        </div>
        <div className="flex-1 overflow-auto divide-y divide-border/50 min-h-0">
          {data.salesBySeller.length === 0 && (
            <p className="px-5 py-6 text-center text-sm text-muted-foreground">Sin ventas completadas</p>
          )}
          {data.salesBySeller.map((s, i) => (
            <div key={s.name} className="flex items-center gap-4 px-5 py-3">
              {/* Posición */}
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-slate-300 text-slate-700' : i === 2 ? 'bg-orange-400 text-white' : 'bg-muted text-muted-foreground'
              )}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{s.name}</p>
                <div className="mt-1 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: total > 0 ? `${(s.ventas / data.salesBySeller[0].ventas) * 100}%` : '0%' }} />
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold">{s.ventas} <span className="text-xs font-normal text-muted-foreground">ventas</span></p>
                <p className="text-xs text-muted-foreground">{formatCurrency(s.ingresos)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return null
}

const PIE_COLORS = ['#22c55e', '#f59e0b', '#3b82f6', '#ef4444']

function ChartPieWidget({ data }: { data: DashboardData }) {
  const total = data.vehiclesByStatus.reduce((s, v) => s + v.value, 0)
  return (
    <div className="h-full flex flex-col">
      <div className="px-5 pt-4 pb-2 shrink-0">
        <p className="text-sm font-bold">Estado del stock</p>
        <p className="text-xs text-muted-foreground">{total} vehículos en total</p>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.vehiclesByStatus}
              cx="50%"
              cy="45%"
              innerRadius="38%"
              outerRadius="62%"
              paddingAngle={3}
              dataKey="value"
            >
              {data.vehiclesByStatus.map((entry, i) => (
                <Cell key={entry.name} fill={entry.color ?? PIE_COLORS[i % PIE_COLORS.length]} strokeWidth={0} />
              ))}
            </Pie>
            <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
            <RechartTooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
              formatter={(v) => [`${v} vehículos`, '']}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─── Widget content router ────────────────────────────────────────────────────

function WidgetContent({ config, data, editMode }: { config: WidgetConfig; data: DashboardData; editMode: boolean }) {
  const { type } = config
  if (type.startsWith('stat_')) return <StatWidget type={type} data={data} editMode={editMode} />
  if (type.startsWith('list_')) return <ListWidget type={type} data={data} editMode={editMode} />
  if (type === 'chart_monthly_revenue' || type === 'chart_sales_by_seller') return <ChartBarWidget type={type} data={data} />
  if (type === 'chart_vehicles_status') return <ChartPieWidget data={data} />
  return <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Widget desconocido</div>
}

// ─── Widget picker dialog ─────────────────────────────────────────────────────

function WidgetPickerDialog({
  existingTypes,
  onAdd,
  onClose,
}: {
  existingTypes: WidgetType[]
  onAdd: (type: WidgetType) => void
  onClose: () => void
}) {
  const categories = ['stat', 'list', 'chart'] as const
  const catLabels = { stat: 'KPIs y estadísticas', list: 'Listas', chart: 'Gráficos' }

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Añadir widget</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 mt-1">
          {categories.map(cat => {
            const items = WIDGET_CATALOG.filter(w => w.category === cat)
            return (
              <div key={cat}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">{catLabels[cat]}</p>
                <div className="grid grid-cols-2 gap-2">
                  {items.map(w => {
                    const alreadyAdded = existingTypes.includes(w.type)
                    return (
                      <button
                        key={w.type}
                        type="button"
                        disabled={alreadyAdded}
                        onClick={() => onAdd(w.type)}
                        className={cn(
                          'flex items-start gap-2.5 p-3 rounded-lg border text-left transition-colors text-sm',
                          alreadyAdded
                            ? 'border-border/50 bg-muted/30 opacity-50 cursor-not-allowed'
                            : 'border-border hover:border-primary/40 hover:bg-accent/30 cursor-pointer',
                        )}
                      >
                        <span className="text-lg shrink-0">{w.emoji}</span>
                        <div className="min-w-0">
                          <p className="font-medium leading-tight truncate">{w.label}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{w.description}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Dashboard grid (main export) ────────────────────────────────────────────

interface DashboardGridProps {
  data: DashboardData
  isAdmin: boolean
}

export function DashboardGrid({ data, isAdmin }: DashboardGridProps) {
  const [editMode, setEditMode]         = useState(false)
  const [widgets, setWidgets]           = useState<WidgetConfig[]>([])
  const [savedWidgets, setSavedWidgets] = useState<WidgetConfig[]>([])
  const [showPicker, setShowPicker]     = useState(false)

  // Width measurement for react-grid-layout v2
  const { containerRef, width, mounted } = useContainerWidth()

  // Load from localStorage on mount
  useEffect(() => {
    const layout = loadLayout()
    setWidgets(layout.widgets)
    setSavedWidgets(layout.widgets)
  }, [])

  // Convert our config to react-grid-layout v2 Layout format
  const glLayout: Layout = useMemo(
    () => widgets.map(w => ({ i: w.i, x: w.x, y: w.y, w: w.w, h: w.h })),
    [widgets],
  )

  function handleLayoutChange(newLayout: Layout) {
    setWidgets(prev =>
      prev.map(w => {
        const item = newLayout.find((l: LayoutItem) => l.i === w.i)
        if (!item) return w
        return { ...w, x: item.x, y: item.y, w: item.w, h: item.h }
      }),
    )
  }

  function saveChanges() {
    saveLayout({ widgets })
    setSavedWidgets(widgets)
    setEditMode(false)
  }

  function discardChanges() {
    setWidgets(savedWidgets)
    setEditMode(false)
  }

  function removeWidget(id: string) {
    setWidgets(prev => prev.filter(w => w.i !== id))
  }

  function addWidget(type: WidgetType) {
    const catalog = WIDGET_CATALOG.find(c => c.type === type)!
    const newWidget: WidgetConfig = {
      i: `dw-${Date.now()}`,
      type,
      x: 0,
      y: Infinity, // react-grid-layout places at bottom when y is large
      w: catalog.defaultW,
      h: catalog.defaultH,
    }
    setWidgets(prev => [...prev, newWidget])
    setShowPicker(false)
  }

  function handleResetLayout() {
    const def = getDefaultLayout()
    setWidgets(def.widgets)
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-6">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Resumen del concesionario</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2 flex-wrap">
            {editMode ? (
              <>
                <Button size="sm" variant="outline" onClick={() => setShowPicker(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Añadir widget
                </Button>
                <Button size="sm" variant="outline" onClick={handleResetLayout} title="Restablecer layout por defecto">
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="outline" onClick={discardChanges}>
                  Descartar
                </Button>
                <Button size="sm" onClick={saveChanges}>
                  Guardar cambios
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setEditMode(true)}>
                <PencilLine className="h-3.5 w-3.5 mr-1.5" />
                Editar dashboard
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Edit mode banner */}
      {editMode && (
        <div className="mb-4 rounded-lg border border-primary/25 bg-primary/5 px-4 py-2.5 flex items-center gap-2.5">
          <GripVertical className="h-4 w-4 text-primary shrink-0" />
          <p className="text-sm text-primary font-medium">
            Modo edición — arrastra para mover, resize desde la esquina inferior derecha. Los cambios no se guardan hasta hacer clic en &ldquo;Guardar cambios&rdquo;.
          </p>
        </div>
      )}

      {/* Grid */}
      {widgets.length > 0 && (
        <div ref={containerRef}>
        <ReactGridLayout
          width={mounted ? width : 1200}
          layout={glLayout}
          gridConfig={{ cols: 12, rowHeight: 110, margin: [12, 12] as [number, number], containerPadding: [0, 0] as [number, number] }}
          dragConfig={{ enabled: editMode, handle: '.drag-handle' }}
          resizeConfig={{ enabled: editMode, handles: ['se'] }}
          compactor={verticalCompactor}
          onLayoutChange={handleLayoutChange}
          autoSize
        >
          {widgets.map(w => (
            <div key={w.i}>
              <div
                className={cn(
                  'h-full rounded-xl border bg-card overflow-hidden relative transition-shadow',
                  editMode
                    ? 'border-primary/30 shadow-md shadow-primary/5 ring-1 ring-primary/10'
                    : 'border-border/60 hover:shadow-sm hover:shadow-black/5',
                )}
              >
                {/* Edit mode overlay */}
                {editMode && (
                  <>
                    {/* Full-card drag handle */}
                    <div className="drag-handle absolute inset-0 z-10 cursor-grab active:cursor-grabbing" />
                    {/* Drag icon */}
                    <div className="absolute top-2 left-2 z-20 pointer-events-none">
                      <GripVertical className="h-4 w-4 text-muted-foreground/60" />
                    </div>
                    {/* Delete button */}
                    <button
                      onMouseDown={e => e.stopPropagation()}
                      onClick={() => removeWidget(w.i)}
                      className="absolute top-1.5 right-1.5 z-20 h-6 w-6 rounded-full bg-destructive/90 text-white flex items-center justify-center hover:bg-destructive transition-colors"
                      title="Eliminar widget"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {/* Widget type label */}
                    <div className="absolute bottom-1.5 left-2 z-20 pointer-events-none">
                      <span className="text-[10px] text-muted-foreground/50 font-medium">
                        {WIDGET_CATALOG.find(c => c.type === w.type)?.label}
                      </span>
                    </div>
                  </>
                )}

                {/* Content (pointer-events-none in edit mode so drag works) */}
                <div className={cn('h-full overflow-hidden', editMode && 'pointer-events-none')}>
                  <WidgetContent config={w} data={data} editMode={editMode} />
                </div>
              </div>
            </div>
          ))}
        </ReactGridLayout>
        </div>
      )}

      {/* Empty state */}
      {widgets.length === 0 && editMode && (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border rounded-xl text-center">
          <Trash2 className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground mb-4">Dashboard vacío. Añade widgets para empezar.</p>
          <Button size="sm" onClick={() => setShowPicker(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Añadir widget
          </Button>
        </div>
      )}

      {/* Widget picker */}
      {showPicker && (
        <WidgetPickerDialog
          existingTypes={widgets.map(w => w.type)}
          onAdd={addWidget}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}
