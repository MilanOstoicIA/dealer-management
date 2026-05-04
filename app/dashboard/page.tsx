'use client'

import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import { useStore } from '@/lib/store'
import { useAuth } from '@/lib/auth'
import type { DashboardData } from '@/components/dashboard/dashboard-grid'

// Avoid SSR to prevent react-grid-layout hydration mismatch
const DashboardGrid = dynamic(
  () => import('@/components/dashboard/dashboard-grid').then(m => m.DashboardGrid),
  { ssr: false },
)

export default function DashboardPage() {
  const {
    vehicles, sales, appointments, clients, forumPosts, trackings,
    users, expenses, getClientById, getVehicleById, getUserById,
  } = useStore()
  const { canEditDashboard } = useAuth()

  const data = useMemo<DashboardData>(() => {
    const now = new Date()
    const currentMonth = now.toISOString().slice(0, 7)

    // ── Stat values ──────────────────────────────────────────────────────────
    const completedMonthly = sales.filter(s => s.saleDate.startsWith(currentMonth) && s.status === 'completada')

    const availableVehicles  = vehicles.filter(v => v.status === 'disponible').length
    const totalVehicles      = vehicles.length
    const vehiclesSold       = vehicles.filter(v => v.status === 'vendido').length
    const totalClients       = clients.length
    const pendingAppointments = appointments.filter(a => a.status === 'pendiente' || a.status === 'en_progreso').length
    const monthlySalesRevenue = completedMonthly.reduce((s, v) => s + v.salePrice, 0)
    const monthlyCommissions  = completedMonthly.reduce((s, v) => s + v.commission, 0)
    const vehiclesInWorkshop  = vehicles.filter(v => v.status === 'en_taller').length
    const vehiclesReserved    = vehicles.filter(v => v.status === 'reservado').length
    const soldThisMonth       = completedMonthly.length

    // ── Upcoming appointments ────────────────────────────────────────────────
    const upcomingAppointments = appointments
      .filter(a => a.status === 'pendiente' || a.status === 'en_progreso')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 10)
      .map(a => ({
        id: a.id,
        clientName: getClientById(a.clientId)?.name ?? 'Desconocido',
        vehicleBrand: getVehicleById(a.vehicleId)?.brand ?? '',
        vehicleModel: getVehicleById(a.vehicleId)?.model ?? '',
        date: a.date,
        serviceType: a.serviceType,
        status: a.status,
      }))

    // ── Recent sales ─────────────────────────────────────────────────────────
    const recentSales = [...sales]
      .sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime())
      .slice(0, 8)
      .map(s => ({
        id: s.id,
        vehicleBrand: getVehicleById(s.vehicleId)?.brand ?? '',
        vehicleModel: getVehicleById(s.vehicleId)?.model ?? '',
        clientName: getClientById(s.clientId)?.name ?? '',
        sellerName: getUserById(s.sellerId)?.name ?? '',
        salePrice: s.salePrice,
        status: s.status,
        saleDate: s.saleDate,
      }))

    // ── Forum leads ──────────────────────────────────────────────────────────
    const forumLeads = [...forumPosts]
      .filter(p => p.status === 'nuevo' || p.status === 'contactado')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8)
      .map(p => ({
        id: p.id,
        authorName: p.authorName,
        vehicleBrand: p.vehicleBrand,
        vehicleModel: p.vehicleModel,
        askingPrice: p.askingPrice,
        status: p.status,
        createdAt: p.createdAt,
      }))

    // ── Urgent trackings ─────────────────────────────────────────────────────
    const urgentTrackings = trackings
      .filter(t => (t.priority === 'urgente' || t.priority === 'alta') && t.status !== 'completado' && t.status !== 'cancelado')
      .sort((a, b) => {
        const order = { urgente: 0, alta: 1, media: 2, baja: 3 }
        return (order[a.priority as keyof typeof order] ?? 4) - (order[b.priority as keyof typeof order] ?? 4)
      })
      .slice(0, 8)
      .map(t => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        category: t.category,
        dueDate: t.dueDate,
        status: t.status,
      }))

    // ── Monthly revenue (last 6 months) ──────────────────────────────────────
    const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const m = d.toISOString().slice(0, 7)
      const label = d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
      const ingresos = sales
        .filter(s => s.status === 'completada' && s.saleDate.startsWith(m))
        .reduce((sum, s) => sum + s.salePrice, 0)
      const gastos = expenses
        .filter(e => e.date.startsWith(m))
        .reduce((sum, e) => sum + e.amount, 0)
      return { month: label, ingresos, gastos }
    }).reverse()

    // ── Vehicles by status ────────────────────────────────────────────────────
    const vehiclesByStatus = [
      { name: 'Disponible', value: vehicles.filter(v => v.status === 'disponible').length, color: '#22c55e' },
      { name: 'Reservado',  value: vehicles.filter(v => v.status === 'reservado').length,  color: '#f59e0b' },
      { name: 'Vendido',    value: vehicles.filter(v => v.status === 'vendido').length,    color: '#3b82f6' },
      { name: 'En taller',  value: vehicles.filter(v => v.status === 'en_taller').length,  color: '#ef4444' },
    ].filter(s => s.value > 0)

    // ── Sales by seller ───────────────────────────────────────────────────────
    const salesBySeller = users
      .filter(u => u.role === 'vendedor')
      .map(u => {
        const sellerSales = sales.filter(s => s.sellerId === u.id && s.status === 'completada')
        return {
          name: u.name.split(' ')[0],
          ventas: sellerSales.length,
          ingresos: sellerSales.reduce((sum, s) => sum + s.salePrice, 0),
        }
      })
      .filter(s => s.ventas > 0)
      .sort((a, b) => b.ventas - a.ventas)

    return {
      availableVehicles,
      totalVehicles,
      vehiclesSold,
      totalClients,
      pendingAppointments,
      monthlySalesRevenue,
      monthlyCommissions,
      vehiclesInWorkshop,
      vehiclesReserved,
      soldThisMonth,
      upcomingAppointments,
      recentSales,
      forumLeads,
      urgentTrackings,
      monthlyRevenue,
      vehiclesByStatus,
      salesBySeller,
    }
  }, [vehicles, sales, appointments, clients, forumPosts, trackings, users, expenses, getClientById, getVehicleById, getUserById])

  return <DashboardGrid data={data} isAdmin={canEditDashboard()} />
}
