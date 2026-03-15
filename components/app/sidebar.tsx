"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Car,
  Users,
  CalendarDays,
  ShoppingCart,
  LogOut,
  ChevronRight,
  BarChart3,
  Receipt,
  UserCog,
  MessageSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Logo } from "@/components/app/logo"
import { useAuth, ROLE_ACCESS, getRoleLabel } from "@/lib/auth"

const allNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, section: "principal" },
  { href: "/dashboard/vehiculos", label: "Vehículos", icon: Car, section: "principal" },
  { href: "/dashboard/clientes", label: "Clientes", icon: Users, section: "principal" },
  { href: "/dashboard/citas", label: "Citas / Taller", icon: CalendarDays, section: "principal" },
  { href: "/dashboard/ventas", label: "Ventas", icon: ShoppingCart, section: "principal" },
  { href: "/dashboard/contabilidad", label: "Contabilidad", icon: BarChart3, section: "admin" },
  { href: "/dashboard/facturacion", label: "Facturación", icon: Receipt, section: "admin" },
  { href: "/dashboard/equipo", label: "Equipo", icon: UserCog, section: "admin" },
  { href: "/dashboard/foro", label: "Foro Compra-Venta", icon: MessageSquare, section: "admin" },
]

function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
}

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  if (!user) return null

  const allowedRoutes = ROLE_ACCESS[user.role]
  const visibleItems = allNavItems.filter((item) => allowedRoutes.includes(item.href))
  const principalItems = visibleItems.filter((item) => item.section === "principal")
  const adminItems = visibleItems.filter((item) => item.section === "admin")

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
          <Logo className="h-7 w-7" />
        </div>
        <div>
          <p className="text-sm font-bold tracking-wide text-sidebar-foreground">DealerHub</p>
          <p className="text-[11px] text-sidebar-foreground/50">Gestión de concesionario</p>
        </div>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {principalItems.length > 0 && (
          <div className="space-y-1">
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
              Principal
            </p>
            {principalItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-sidebar-primary/30"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </span>
                  {isActive && <ChevronRight className="h-3.5 w-3.5 opacity-70" />}
                </Link>
              )
            })}
          </div>
        )}

        {adminItems.length > 0 && (
          <div className="space-y-1">
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
              Administración
            </p>
            {adminItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-sidebar-primary/30"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </span>
                  {isActive && <ChevronRight className="h-3.5 w-3.5 opacity-70" />}
                </Link>
              )
            })}
          </div>
        )}
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* User section */}
      <div className="p-4">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-sidebar-primary/30 text-sidebar-primary-foreground text-xs font-bold">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-sidebar-foreground">{user.name}</p>
            <p className="truncate text-xs text-sidebar-foreground/50">{getRoleLabel(user.role)}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/50 transition-colors hover:bg-red-500/15 hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
