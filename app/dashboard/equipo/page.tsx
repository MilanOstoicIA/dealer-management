"use client"

import { useState } from "react"
import { UserCog, Mail, Phone, Shield, Wrench, ShoppingCart, ClipboardList, Percent, TrendingUp, Award } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useStore } from "@/lib/store"
import { useAuth } from "@/lib/auth"

const roleConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  admin: { label: "Administrador", color: "bg-primary/15 text-primary border-primary/20", icon: <Shield className="h-3.5 w-3.5" /> },
  vendedor: { label: "Vendedor", color: "bg-green-500/15 text-green-600 border-green-500/20", icon: <ShoppingCart className="h-3.5 w-3.5" /> },
  mecanico: { label: "Mecánico", color: "bg-orange-500/15 text-orange-600 border-orange-500/20", icon: <Wrench className="h-3.5 w-3.5" /> },
  recepcionista: { label: "Recepcionista", color: "bg-blue-500/15 text-blue-600 border-blue-500/20", icon: <ClipboardList className="h-3.5 w-3.5" /> },
  viewer: { label: "Visor", color: "bg-gray-500/15 text-gray-600 border-gray-500/20", icon: <Shield className="h-3.5 w-3.5" /> },
}

function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount)
}

export default function EquipoPage() {
  const { users, sales, appointments } = useStore()
  const { canEdit } = useAuth()
  const isAdmin = canEdit("equipo")
  const [commissionRates, setCommissionRates] = useState<Record<string, string>>(
    Object.fromEntries(users.filter((u) => u.role === "vendedor").map((u) => {
      const sellerSales = sales.filter((s) => s.sellerId === u.id && s.status === "completada")
      const avgRate = sellerSales.length > 0
        ? (sellerSales.reduce((sum, s) => sum + s.commissionRate, 0) / sellerSales.length).toFixed(1)
        : "3"
      return [u.id, avgRate]
    }))
  )

  // Find top seller
  const sellerRankings = users.filter((u) => u.role === "vendedor").map((u) => {
    const sellerSales = sales.filter((s) => s.sellerId === u.id && s.status === "completada")
    return { user: u, revenue: sellerSales.reduce((sum, s) => sum + s.salePrice, 0) }
  }).sort((a, b) => b.revenue - a.revenue)
  const topSellerId = sellerRankings.length > 0 ? sellerRankings[0].user.id : ""

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Equipo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {users.length} miembros del equipo
          </p>
        </div>
      </div>

      {/* Team stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Object.entries(roleConfig).map(([role, cfg]) => {
          const count = users.filter((u) => u.role === role).length
          return (
            <Card key={role} className="border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${cfg.color.split(" ")[0]}`}>
                  {cfg.icon}
                </div>
                <div>
                  <p className="text-lg font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground">{cfg.label}{count !== 1 ? "s" : ""}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Team members */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {users.map((user) => {
          const cfg = roleConfig[user.role]
          const userSales = sales.filter((s) => s.sellerId === user.id && s.status === "completada")
          const userAppointments = appointments.filter((a) => a.mechanicId === user.id)
          const totalCommission = userSales.reduce((sum, s) => sum + s.commission, 0)
          const totalRevenue = userSales.reduce((sum, s) => sum + s.salePrice, 0)

          return (
            <Card key={user.id} className="border-border/50">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-base font-semibold">{user.name}</p>
                      <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium ${cfg.color}`}>
                        {cfg.icon}
                        {cfg.label}
                      </span>
                    </div>

                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        {user.email}
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          {user.phone}
                        </div>
                      )}
                    </div>

                    {/* Stats based on role */}
                    {user.role === "vendedor" && (
                      <div className="mt-3 space-y-3">
                        <div className="grid grid-cols-3 gap-3 rounded-lg bg-muted/50 p-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Ventas</p>
                            <p className="text-sm font-bold">{userSales.length}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Ingresos</p>
                            <p className="text-sm font-bold">{formatCurrency(totalRevenue)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Comisiones</p>
                            <p className="text-sm font-bold text-green-600">{formatCurrency(totalCommission)}</p>
                          </div>
                        </div>
                        {/* Commission rate - only editable by admin */}
                        <div className="flex items-center justify-between rounded-lg border border-green-500/20 bg-green-500/5 p-3">
                          <div className="flex items-center gap-2">
                            <Percent className="h-4 w-4 text-green-600" />
                            <div>
                              <p className="text-xs font-medium">Comisión asignada</p>
                              {topSellerId === user.id && (
                                <Badge variant="secondary" className="text-[9px] bg-yellow-500/10 text-yellow-600 mt-0.5">
                                  <Award className="h-2.5 w-2.5 mr-0.5" /> Top vendedor
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {isAdmin ? (
                              <Input
                                type="number"
                                step="0.5"
                                min="0"
                                max="20"
                                value={commissionRates[user.id] || "3"}
                                onChange={(e) => setCommissionRates({ ...commissionRates, [user.id]: e.target.value })}
                                className="w-16 h-8 text-center text-sm font-bold"
                              />
                            ) : (
                              <span className="text-sm font-bold">{commissionRates[user.id] || "3"}</span>
                            )}
                            <span className="text-sm text-muted-foreground font-medium">%</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {user.role === "mecanico" && (
                      <div className="mt-3 grid grid-cols-3 gap-3 rounded-lg bg-muted/50 p-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Citas total</p>
                          <p className="text-sm font-bold">{userAppointments.length}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Completadas</p>
                          <p className="text-sm font-bold">{userAppointments.filter((a) => a.status === "completada").length}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Pendientes</p>
                          <p className="text-sm font-bold text-yellow-600">{userAppointments.filter((a) => a.status === "pendiente").length}</p>
                        </div>
                      </div>
                    )}

                    <p className="mt-2 text-xs text-muted-foreground">
                      Desde {new Date(user.createdAt).toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
