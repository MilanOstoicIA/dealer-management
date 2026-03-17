"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import type { User, UserRole } from "@/types"
import { useStore } from "@/lib/store"
import { dbVerifyPassword } from "@/lib/supabase-service"

// Sections that can be edited
export type EditableSection = "vehiculos" | "clientes" | "citas" | "ventas" | "equipo"

// Which roles can create/edit/delete in each section
const EDIT_PERMISSIONS: Record<EditableSection, UserRole[]> = {
  vehiculos: ["admin", "vendedor", "mecanico"],
  clientes: ["admin", "vendedor", "recepcionista", "mecanico"],
  citas: ["admin", "mecanico", "recepcionista", "vendedor"],
  ventas: ["admin", "vendedor"],
  equipo: ["admin"],
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<string | null>
  logout: () => void
  hasAccess: (roles: UserRole[]) => boolean
  isViewer: boolean
  canEdit: (section: EditableSection) => boolean
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
    "/dashboard/foro",
    "/dashboard/configuracion",
  ],
  vendedor: [
    "/dashboard",
    "/dashboard/vehiculos",
    "/dashboard/clientes",
    "/dashboard/citas",
    "/dashboard/ventas",
    "/dashboard/foro",
  ],
  mecanico: [
    "/dashboard",
    "/dashboard/vehiculos",
    "/dashboard/clientes",
    "/dashboard/citas",
  ],
  recepcionista: [
    "/dashboard",
    "/dashboard/clientes",
    "/dashboard/citas",
    "/dashboard/vehiculos",
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

  // Route protection
  useEffect(() => {
    if (!loaded) return
    const isDashboard = pathname.startsWith("/dashboard")
    if (isDashboard && !user) {
      router.replace("/")
      return
    }
    if (user && isDashboard) {
      const allowed = ROLE_ACCESS[user.role]
      if (!allowed.includes(pathname)) {
        router.replace("/dashboard")
      }
    }
  }, [loaded, user, pathname, router])

  async function login(email: string, password: string): Promise<string | null> {
    // Try Supabase first
    const dbUser = await dbVerifyPassword(email, password)
    if (dbUser) {
      setUser(dbUser)
      localStorage.setItem("dealerhub_user", JSON.stringify(dbUser))
      return null
    }
    // Fallback to local mock passwords (for offline dev)
    const expectedPassword = MOCK_PASSWORDS[email]
    if (expectedPassword && expectedPassword === password) {
      const foundUser = store.users.find((u) => u.email === email)
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
    if (isViewer) return false
    return EDIT_PERMISSIONS[section].includes(user.role)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, hasAccess, isViewer, canEdit }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
