"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import type { User, UserRole, CustomRole, RolePermissions } from "@/types"
import { useStore } from "@/lib/store"
import { dbVerifyPassword } from "@/lib/supabase-service"

// Sections that can be edited
export type EditableSection = "vehiculos" | "clientes" | "citas" | "ventas" | "equipo" | "seguimientos" | "proveedores"

// Which roles can create/edit/delete in each section
const EDIT_PERMISSIONS: Record<EditableSection, UserRole[]> = {
  vehiculos: ["admin", "vendedor", "mecanico"],
  clientes: ["admin", "vendedor", "recepcionista", "mecanico"],
  citas: ["admin", "mecanico", "recepcionista", "vendedor"],
  ventas: ["admin", "vendedor"],
  equipo: ["admin"],
  seguimientos: ["admin", "vendedor", "mecanico", "recepcionista"],
  proveedores: ["admin", "vendedor"],
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<string | null>
  logout: () => void
  hasAccess: (roles: UserRole[]) => boolean
  isViewer: boolean
  canEdit: (section: EditableSection) => boolean
  canEditDashboard: () => boolean
  getEffectiveRoutes: () => string[]
}

const AuthContext = createContext<AuthContextType | null>(null)

// Mock passwords — all use "1234" for simplicity in demo
const MOCK_PASSWORDS: Record<string, string> = {
  "carlos.martinez@dealerhub.es": "admin123",
  "laura.sanchez@dealerhub.es": "1234",
  "alejandro.perez@dealerhub.es": "1234",
  "maria.gonzalez@dealerhub.es": "1234",
  "viewer@dealerhub.es": "viewer",
}

// Routes accessible by each role
export const ROLE_ACCESS: Record<UserRole, string[]> = {
  admin: [
    "/dashboard",
    "/dashboard/vehiculos",
    "/dashboard/clientes",
    "/dashboard/citas",
    "/dashboard/ventas",
    "/dashboard/contabilidad",
    "/dashboard/facturacion",
    "/dashboard/equipo",
    "/dashboard/seguimientos",
    "/dashboard/proveedores",
    "/dashboard/whatsapp",
    "/dashboard/publicacion",
    "/dashboard/foro",
    "/dashboard/configuracion",
  ],
  vendedor: [
    "/dashboard",
    "/dashboard/vehiculos",
    "/dashboard/clientes",
    "/dashboard/citas",
    "/dashboard/ventas",
    "/dashboard/seguimientos",
    "/dashboard/proveedores",
    "/dashboard/whatsapp",
    "/dashboard/foro",
  ],
  mecanico: [
    "/dashboard",
    "/dashboard/vehiculos",
    "/dashboard/clientes",
    "/dashboard/citas",
    "/dashboard/seguimientos",
    "/dashboard/proveedores",
  ],
  recepcionista: [
    "/dashboard",
    "/dashboard/clientes",
    "/dashboard/citas",
    "/dashboard/vehiculos",
    "/dashboard/seguimientos",
    "/dashboard/proveedores",
    "/dashboard/whatsapp",
    "/dashboard/foro",
  ],
  viewer: [
    "/dashboard",
    "/dashboard/vehiculos",
    "/dashboard/clientes",
    "/dashboard/citas",
    "/dashboard/ventas",
    "/dashboard/contabilidad",
    "/dashboard/facturacion",
    "/dashboard/equipo",
    "/dashboard/seguimientos",
    "/dashboard/proveedores",
    "/dashboard/foro",
  ],
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  vendedor: "Vendedor",
  mecanico: "Mecánico",
  recepcionista: "Recepcionista",
  viewer: "Visor (solo lectura)",
}

export function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role]
}

// Map custom role permissions to accessible routes
function permissionsToRoutes(p: RolePermissions): string[] {
  const routes = ["/dashboard"] // always accessible
  if (p.view_vehiculos)    routes.push("/dashboard/vehiculos")
  if (p.view_clientes)     routes.push("/dashboard/clientes")
  if (p.view_citas)        routes.push("/dashboard/citas")
  if (p.view_ventas)       routes.push("/dashboard/ventas")
  if (p.view_facturacion)  routes.push("/dashboard/facturacion")
  if (p.view_contabilidad) routes.push("/dashboard/contabilidad")
  if (p.view_equipo)       routes.push("/dashboard/equipo")
  if (p.view_foro)         routes.push("/dashboard/foro")
  if (p.view_proveedores)  routes.push("/dashboard/proveedores")
  if (p.view_seguimientos) routes.push("/dashboard/seguimientos")
  if (p.view_publicacion)  routes.push("/dashboard/publicacion")
  if (p.view_configuracion)routes.push("/dashboard/configuracion")
  if (p.view_whatsapp)     routes.push("/dashboard/whatsapp")
  return routes
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loaded, setLoaded] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const store = useStore()

  // Load user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("dealerhub_user")
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.removeItem("dealerhub_user")
      }
    }
    setLoaded(true)
  }, [])

  // Effective routes for the current user
  function getEffectiveRoutes(): string[] {
    if (!user) return []
    if (user.customRoleId) {
      const customRole = store.customRoles.find((r: CustomRole) => r.id === user.customRoleId)
      if (customRole) return permissionsToRoutes(customRole.permissions)
    }
    return ROLE_ACCESS[user.role] ?? []
  }

  // Route protection
  useEffect(() => {
    if (!loaded) return
    const isDashboard = pathname.startsWith("/dashboard")
    if (isDashboard && !user) {
      router.replace("/")
      return
    }
    if (user && isDashboard) {
      const allowed = getEffectiveRoutes()
      if (!allowed.includes(pathname)) {
        router.replace("/dashboard")
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, user, pathname, router, store.customRoles])

  async function login(email: string, password: string): Promise<string | null> {
    // 1. Try Supabase password_hash match
    const dbUser = await dbVerifyPassword(email, password)
    if (dbUser) {
      setUser(dbUser)
      localStorage.setItem("dealerhub_user", JSON.stringify(dbUser))
      return null
    }

    // 2. Mock password check (demo / offline mode)
    const expectedPassword = MOCK_PASSWORDS[email]
    if (expectedPassword && expectedPassword === password) {
      // Try store first (already loaded)
      let foundUser = store.users.find((u) => u.email === email)

      // If store hasn't populated yet, fetch directly from Supabase
      if (!foundUser) {
        const { dbGetUserByEmail } = await import("@/lib/supabase-service")
        foundUser = (await dbGetUserByEmail(email)) ?? undefined
      }

      if (foundUser) {
        setUser(foundUser)
        localStorage.setItem("dealerhub_user", JSON.stringify(foundUser))
        return null
      }
    }

    return "Correo o contraseña incorrectos"
  }

  function logout() {
    setUser(null)
    localStorage.removeItem("dealerhub_user")
    router.push("/")
  }

  function hasAccess(roles: UserRole[]): boolean {
    if (!user) return false
    return roles.includes(user.role)
  }

  // Don't render children until we've checked localStorage
  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const isViewer = user?.role === "viewer"

  function canEdit(section: EditableSection): boolean {
    if (!user) return false
    // Custom role overrides fixed role
    if (user.customRoleId) {
      const customRole = store.customRoles.find((r: CustomRole) => r.id === user.customRoleId)
      if (customRole) {
        const key = `edit_${section}` as keyof RolePermissions
        return (customRole.permissions[key] as boolean) ?? false
      }
    }
    if (isViewer) return false
    return EDIT_PERMISSIONS[section].includes(user.role)
  }

  function canEditDashboard(): boolean {
    if (!user) return false
    if (user.role === "admin") return true
    if (user.customRoleId) {
      const customRole = store.customRoles.find((r: CustomRole) => r.id === user.customRoleId)
      return customRole?.permissions.dashboard_editor ?? false
    }
    return false
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, hasAccess, isViewer, canEdit, canEditDashboard, getEffectiveRoutes }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
