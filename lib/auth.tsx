"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import type { User, UserRole } from "@/types"
import { users } from "@/lib/data"

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => string | null
  logout: () => void
  hasAccess: (roles: UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

// Mock passwords — all use "1234" for simplicity in demo
const MOCK_PASSWORDS: Record<string, string> = {
  "carlos.martinez@dealerhub.es": "admin123",
  "laura.sanchez@dealerhub.es": "1234",
  "alejandro.perez@dealerhub.es": "1234",
  "maria.gonzalez@dealerhub.es": "1234",
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
  ],
  vendedor: [
    "/dashboard",
    "/dashboard/vehiculos",
    "/dashboard/clientes",
    "/dashboard/ventas",
    "/dashboard/foro",
  ],
  mecanico: [
    "/dashboard",
    "/dashboard/citas",
    "/dashboard/vehiculos",
  ],
  recepcionista: [
    "/dashboard",
    "/dashboard/clientes",
    "/dashboard/citas",
    "/dashboard/vehiculos",
    "/dashboard/foro",
  ],
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  vendedor: "Vendedor",
  mecanico: "Mecánico",
  recepcionista: "Recepcionista",
}

export function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role]
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loaded, setLoaded] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

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

  function login(email: string, password: string): string | null {
    const expectedPassword = MOCK_PASSWORDS[email]
    if (!expectedPassword || expectedPassword !== password) {
      return "Correo o contraseña incorrectos"
    }
    const foundUser = users.find((u) => u.email === email)
    if (!foundUser) return "Usuario no encontrado"
    setUser(foundUser)
    localStorage.setItem("dealerhub_user", JSON.stringify(foundUser))
    return null
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

  return (
    <AuthContext.Provider value={{ user, login, logout, hasAccess }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
