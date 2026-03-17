"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Shield, ShoppingCart, Wrench, ClipboardList } from "lucide-react"
import { Logo } from "@/components/app/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth"

const DEMO_ACCOUNTS = [
  { email: "carlos.martinez@dealerhub.es", password: "admin123", role: "Admin", icon: Shield, color: "text-primary" },
  { email: "laura.sanchez@dealerhub.es", password: "1234", role: "Vendedor", icon: ShoppingCart, color: "text-green-600" },
  { email: "alejandro.perez@dealerhub.es", password: "1234", role: "Mecánico", icon: Wrench, color: "text-orange-600" },
  { email: "maria.gonzalez@dealerhub.es", password: "1234", role: "Recepcionista", icon: ClipboardList, color: "text-blue-600" },
]

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const err = await login(email, password)
    if (err) {
      setError(err)
      setLoading(false)
    } else {
      router.push("/dashboard")
    }
  }

  async function quickLogin(demoEmail: string, demoPassword: string) {
    setEmail(demoEmail)
    setPassword(demoPassword)
    setError("")
    setLoading(true)
    const err = await login(demoEmail, demoPassword)
    if (err) {
      setError(err)
      setLoading(false)
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25 text-primary-foreground">
            <Logo className="h-10 w-10" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">DealerHub</h1>
            <p className="text-sm text-muted-foreground">Sistema de gestión para concesionarios</p>
          </div>
        </div>

        <Card className="border-border/50 shadow-2xl shadow-black/20">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Iniciar sesión</CardTitle>
            <CardDescription>Ingresa tus credenciales para acceder al panel</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="correo@dealerhub.es"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive border border-destructive/20">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full h-10 font-semibold" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Accediendo...
                  </span>
                ) : (
                  "Iniciar sesión"
                )}
              </Button>
            </form>

            {/* Quick login buttons */}
            <div className="mt-5">
              <p className="text-xs font-medium text-muted-foreground mb-3">Acceso rápido (demo):</p>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((acc) => {
                  const Icon = acc.icon
                  return (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => quickLogin(acc.email, acc.password)}
                      disabled={loading}
                      className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5 text-left transition-colors hover:bg-muted/60 disabled:opacity-50"
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${acc.color}`} />
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{acc.role}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{acc.email.split("@")[0]}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
