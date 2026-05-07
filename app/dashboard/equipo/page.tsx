'use client'

import { useState } from 'react'
import {
  UserCog, Mail, Phone, Shield, Wrench, ShoppingCart, ClipboardList,
  Percent, Award, Plus, Pencil, Trash2, Check, KeyRound,
  LayoutDashboard, Database, UserPlus,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useStore } from '@/lib/store'
import { useAuth } from '@/lib/auth'
import type { CustomRole, RolePermissions, UserRole } from '@/types'
import { toast } from 'sonner'
import { dbCreateUserWithPassword, dbUpdateUserPassword } from '@/lib/supabase-service'

// ─── Role config ──────────────────────────────────────────────────────────────

const roleConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  admin:        { label: 'Administrador', color: 'bg-primary/15 text-primary border-primary/20',         icon: <Shield className="h-3.5 w-3.5" /> },
  vendedor:     { label: 'Vendedor',      color: 'bg-green-500/15 text-green-600 border-green-500/20',   icon: <ShoppingCart className="h-3.5 w-3.5" /> },
  mecanico:     { label: 'Mecánico',      color: 'bg-orange-500/15 text-orange-600 border-orange-500/20',icon: <Wrench className="h-3.5 w-3.5" /> },
  recepcionista:{ label: 'Recepcionista', color: 'bg-blue-500/15 text-blue-600 border-blue-500/20',      icon: <ClipboardList className="h-3.5 w-3.5" /> },
  viewer:       { label: 'Visor',         color: 'bg-gray-500/15 text-gray-600 border-gray-500/20',      icon: <Shield className="h-3.5 w-3.5" /> },
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount)
}

// ─── Role permissions matrix config ──────────────────────────────────────────

const PERMISSION_MODULES: { key: string; label: string; hasEdit: boolean }[] = [
  { key: 'vehiculos',    label: 'Vehículos',     hasEdit: true  },
  { key: 'clientes',     label: 'Clientes',      hasEdit: true  },
  { key: 'citas',        label: 'Citas',         hasEdit: true  },
  { key: 'ventas',       label: 'Ventas',        hasEdit: true  },
  { key: 'facturacion',  label: 'Facturación',   hasEdit: true  },
  { key: 'contabilidad', label: 'Contabilidad',  hasEdit: true  },
  { key: 'equipo',       label: 'Equipo',        hasEdit: true  },
  { key: 'foro',         label: 'Foro',          hasEdit: false },
  { key: 'proveedores',  label: 'Proveedores',   hasEdit: true  },
  { key: 'seguimientos', label: 'Seguimientos',  hasEdit: true  },
  { key: 'publicacion',  label: 'Publicación',   hasEdit: false },
  { key: 'configuracion',label: 'Configuración', hasEdit: false },
  { key: 'whatsapp',     label: 'WhatsApp',      hasEdit: false },
]

const EMPTY_PERMISSIONS: RolePermissions = {
  view_vehiculos: false, view_clientes: false, view_citas: false, view_ventas: false,
  view_facturacion: false, view_contabilidad: false, view_equipo: false, view_foro: false,
  view_proveedores: false, view_seguimientos: false, view_publicacion: false, view_configuracion: false,
  view_whatsapp: false,
  edit_vehiculos: false, edit_clientes: false, edit_citas: false, edit_ventas: false,
  edit_facturacion: false, edit_contabilidad: false, edit_equipo: false, edit_proveedores: false,
  edit_seguimientos: false,
  dashboard_editor: false, export_data: false,
}

const ROLE_COLORS = [
  '#3b82f6', '#22c55e', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#ec4899', '#64748b',
]

// ─── Create user dialog ───────────────────────────────────────────────────────

interface UserDialogProps {
  onSave: (user: import('@/types').User) => void
  onClose: () => void
}

function UserDialog({ onSave, onClose }: UserDialogProps) {
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [role, setRole]       = useState<UserRole>('vendedor')
  const [phone, setPhone]     = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    if (!name.trim() || !email.trim() || !password) {
      toast.error('Rellena todos los campos obligatorios')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Email no válido')
      return
    }
    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (password !== confirm) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    setLoading(true)
    try {
      const user = await dbCreateUserWithPassword(
        { name: name.trim(), email: email.trim(), role, phone: phone.trim() || undefined },
        password
      )
      onSave(user)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al crear el usuario'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo usuario</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-1">
          <div className="space-y-1.5">
            <Label>Nombre completo *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: María García" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Email *</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@empresa.es" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Contraseña *</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mín. 6 caracteres" />
            </div>
            <div className="space-y-1.5">
              <Label>Confirmar *</Label>
              <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repetir contraseña" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Rol *</Label>
            <Select value={role} onValueChange={v => setRole(v as UserRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="vendedor">Vendedor</SelectItem>
                <SelectItem value="mecanico">Mecánico</SelectItem>
                <SelectItem value="recepcionista">Recepcionista</SelectItem>
                <SelectItem value="viewer">Visor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Teléfono (opcional)</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+34 600 000 000" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Creando...' : 'Crear usuario'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Change password dialog ────────────────────────────────────────────────────

function PwDialog({ userId, userName, onClose }: { userId: string; userName: string; onClose: () => void }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSave() {
    if (password.length < 6) { toast.error('La contraseña debe tener al menos 6 caracteres'); return }
    if (password !== confirm)  { toast.error('Las contraseñas no coinciden'); return }
    setLoading(true)
    try {
      await dbUpdateUserPassword(userId, password)
      toast.success('Contraseña actualizada')
      onClose()
    } catch {
      toast.error('Error al actualizar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Cambiar contraseña — {userName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-1">
          <div className="space-y-1.5">
            <Label>Nueva contraseña *</Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mín. 6 caracteres" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Confirmar contraseña *</Label>
            <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repetir contraseña" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Guardando...' : 'Cambiar contraseña'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Role editor dialog ───────────────────────────────────────────────────────

interface RoleDialogProps {
  role?: CustomRole     // undefined = create new
  onSave: (data: Omit<CustomRole, 'id' | 'createdAt'>) => void
  onClose: () => void
}

function RoleDialog({ role, onSave, onClose }: RoleDialogProps) {
  const [name, setName]         = useState(role?.name ?? '')
  const [desc, setDesc]         = useState(role?.description ?? '')
  const [color, setColor]       = useState(role?.color ?? '#3b82f6')
  const [perms, setPerms]       = useState<RolePermissions>(role?.permissions ?? { ...EMPTY_PERMISSIONS })

  function togglePerm(key: keyof RolePermissions) {
    setPerms(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // If view is unchecked, also uncheck edit
  function toggleView(module: string) {
    const viewKey = `view_${module}` as keyof RolePermissions
    const editKey = `edit_${module}` as keyof RolePermissions
    const isCurrentlyChecked = perms[viewKey]
    setPerms(prev => ({
      ...prev,
      [viewKey]: !isCurrentlyChecked,
      ...(isCurrentlyChecked && editKey in prev ? { [editKey]: false } : {}),
    }))
  }

  function handleSave() {
    if (!name.trim()) { toast.error('Escribe el nombre del rol'); return }
    onSave({ name: name.trim(), description: desc.trim() || undefined, color, permissions: perms })
  }

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{role ? 'Editar rol' : 'Crear rol personalizado'}</DialogTitle>
        </DialogHeader>

        {/* Name + description + color */}
        <div className="grid grid-cols-2 gap-4 mt-1">
          <div className="space-y-1.5">
            <Label>Nombre del rol *</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Recepcionista norte"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label>Descripción (opcional)</Label>
            <Input
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Breve descripción..."
            />
          </div>
        </div>

        {/* Color picker */}
        <div className="space-y-2">
          <Label>Color del rol</Label>
          <div className="flex gap-2 flex-wrap">
            {ROLE_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="relative w-8 h-8 rounded-full border-2 transition-all hover:scale-110"
                style={{
                  backgroundColor: c,
                  borderColor: color === c ? 'white' : 'transparent',
                  outline: color === c ? `2px solid ${c}` : 'none',
                  outlineOffset: 2,
                }}
              >
                {color === c && <Check className="h-3 w-3 text-white absolute inset-0 m-auto drop-shadow" />}
              </button>
            ))}
          </div>
        </div>

        {/* Permissions matrix */}
        <div className="space-y-2">
          <Label>Permisos de módulos</Label>
          <div className="rounded-lg border border-border overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[1fr_80px_80px] bg-muted/50 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <span>Módulo</span>
              <span className="text-center">Ver</span>
              <span className="text-center">Editar</span>
            </div>
            {/* Rows */}
            {PERMISSION_MODULES.map((mod, i) => {
              const viewKey = `view_${mod.key}` as keyof RolePermissions
              const editKey = `edit_${mod.key}` as keyof RolePermissions
              const canView = perms[viewKey] as boolean
              const canEditPerm = mod.hasEdit ? (perms[editKey] as boolean) : false

              return (
                <div
                  key={mod.key}
                  className={`grid grid-cols-[1fr_80px_80px] px-4 py-2.5 items-center border-t border-border/50 ${i % 2 === 0 ? '' : 'bg-muted/20'}`}
                >
                  <span className="text-sm font-medium">{mod.label}</span>
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => toggleView(mod.key)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${canView ? 'bg-primary border-primary' : 'border-border hover:border-primary/50'}`}
                    >
                      {canView && <Check className="h-3 w-3 text-primary-foreground" />}
                    </button>
                  </div>
                  <div className="flex justify-center">
                    {mod.hasEdit ? (
                      <button
                        type="button"
                        disabled={!canView}
                        onClick={() => togglePerm(editKey)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors disabled:opacity-30 ${canEditPerm ? 'bg-primary border-primary' : 'border-border hover:border-primary/50 disabled:hover:border-border'}`}
                      >
                        {canEditPerm && <Check className="h-3 w-3 text-primary-foreground" />}
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground/50">—</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Special permissions */}
        <div className="space-y-2">
          <Label>Permisos especiales</Label>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => togglePerm('dashboard_editor')}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-colors ${perms.dashboard_editor ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${perms.dashboard_editor ? 'bg-primary border-primary' : 'border-border'}`}>
                {perms.dashboard_editor && <Check className="h-3 w-3 text-primary-foreground" />}
              </div>
              <LayoutDashboard className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium">Puede editar el dashboard</p>
                <p className="text-xs text-muted-foreground">Permite activar el modo edición del dashboard personalizable</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => togglePerm('export_data')}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-colors ${perms.export_data ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${perms.export_data ? 'bg-primary border-primary' : 'border-border'}`}>
                {perms.export_data && <Check className="h-3 w-3 text-primary-foreground" />}
              </div>
              <Database className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium">Puede exportar datos</p>
                <p className="text-xs text-muted-foreground">Permite exportar informes y listados en CSV/PDF</p>
              </div>
            </button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>
            {role ? 'Guardar cambios' : 'Crear rol'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EquipoPage() {
  const { users, sales, appointments, customRoles, addCustomRole, updateCustomRole, deleteCustomRole, updateUser, addUserDirect } = useStore()
  const { canEdit } = useAuth()
  const isAdmin = canEdit('equipo')

  const [userDialog, setUserDialog] = useState(false)
  const [pwDialog, setPwDialog]     = useState<{ userId: string; userName: string } | null>(null)

  const [commissionRates, setCommissionRates] = useState<Record<string, string>>(
    Object.fromEntries(users.filter(u => u.role === 'vendedor').map(u => {
      const sellerSales = sales.filter(s => s.sellerId === u.id && s.status === 'completada')
      const avgRate = sellerSales.length > 0
        ? (sellerSales.reduce((sum, s) => sum + s.commissionRate, 0) / sellerSales.length).toFixed(1)
        : '3'
      return [u.id, avgRate]
    }))
  )

  const [roleDialog, setRoleDialog] = useState<{ mode: 'create' | 'edit'; role?: CustomRole } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<CustomRole | null>(null)

  // Find top seller
  const sellerRankings = users.filter(u => u.role === 'vendedor').map(u => {
    const sellerSales = sales.filter(s => s.sellerId === u.id && s.status === 'completada')
    return { user: u, revenue: sellerSales.reduce((sum, s) => sum + s.salePrice, 0) }
  }).sort((a, b) => b.revenue - a.revenue)
  const topSellerId = sellerRankings[0]?.user.id ?? ''

  function handleSaveRole(data: Omit<CustomRole, 'id' | 'createdAt'>) {
    if (roleDialog?.mode === 'edit' && roleDialog.role) {
      updateCustomRole(roleDialog.role.id, data)
      toast.success('Rol actualizado')
    } else {
      addCustomRole(data)
      toast.success('Rol creado')
    }
    setRoleDialog(null)
  }

  function handleDeleteRole(role: CustomRole) {
    const usersWithRole = users.filter(u => u.customRoleId === role.id)
    if (usersWithRole.length > 0) {
      // Remove the custom role from all affected users
      usersWithRole.forEach(u => updateUser(u.id, { customRoleId: undefined }))
    }
    deleteCustomRole(role.id)
    toast.success('Rol eliminado')
    setDeleteConfirm(null)
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Equipo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {users.length} miembros · {customRoles.length} rol{customRoles.length !== 1 ? 'es' : ''} personalizado{customRoles.length !== 1 ? 's' : ''}
          </p>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={() => setUserDialog(true)}>
            <UserPlus className="h-3.5 w-3.5 mr-1.5" />
            Nuevo usuario
          </Button>
        )}
      </div>

      <Tabs defaultValue="equipo">
        <TabsList>
          <TabsTrigger value="equipo">Equipo</TabsTrigger>
          {isAdmin && <TabsTrigger value="roles">Roles personalizados</TabsTrigger>}
        </TabsList>

        {/* ── Tab: Equipo ── */}
        <TabsContent value="equipo">
          <div className="mt-4 space-y-6">
            {/* Team stats */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Object.entries(roleConfig).map(([role, cfg]) => {
                const count = users.filter(u => u.role === role).length
                return (
                  <Card key={role} className="border-border/50">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${cfg.color.split(' ')[0]}`}>
                        {cfg.icon}
                      </div>
                      <div>
                        <p className="text-lg font-bold">{count}</p>
                        <p className="text-xs text-muted-foreground">{cfg.label}{count !== 1 ? 's' : ''}</p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Team members */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {users.map(user => {
                const cfg = roleConfig[user.role]
                const userSales = sales.filter(s => s.sellerId === user.id && s.status === 'completada')
                const userAppointments = appointments.filter(a => a.mechanicId === user.id)
                const totalCommission = userSales.reduce((sum, s) => sum + s.commission, 0)
                const totalRevenue = userSales.reduce((sum, s) => sum + s.salePrice, 0)
                const customRole = user.customRoleId ? customRoles.find(r => r.id === user.customRoleId) : undefined

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
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                onClick={() => setPwDialog({ userId: user.id, userName: user.name })}
                                title="Cambiar contraseña"
                              >
                                <KeyRound className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {customRole ? (
                              <span
                                className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium"
                                style={{ backgroundColor: `${customRole.color}20`, color: customRole.color, borderColor: `${customRole.color}40` }}
                              >
                                {customRole.name}
                              </span>
                            ) : (
                              <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium ${cfg.color}`}>
                                {cfg.icon}
                                {cfg.label}
                              </span>
                            )}
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
                          {user.role === 'vendedor' && (
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
                                      value={commissionRates[user.id] || '3'}
                                      onChange={e => setCommissionRates({ ...commissionRates, [user.id]: e.target.value })}
                                      className="w-16 h-8 text-center text-sm font-bold"
                                    />
                                  ) : (
                                    <span className="text-sm font-bold">{commissionRates[user.id] || '3'}</span>
                                  )}
                                  <span className="text-sm text-muted-foreground font-medium">%</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {user.role === 'mecanico' && (
                            <div className="mt-3 grid grid-cols-3 gap-3 rounded-lg bg-muted/50 p-3">
                              <div>
                                <p className="text-xs text-muted-foreground">Citas total</p>
                                <p className="text-sm font-bold">{userAppointments.length}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Completadas</p>
                                <p className="text-sm font-bold">{userAppointments.filter(a => a.status === 'completada').length}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Pendientes</p>
                                <p className="text-sm font-bold text-yellow-600">{userAppointments.filter(a => a.status === 'pendiente').length}</p>
                              </div>
                            </div>
                          )}

                          <p className="mt-2 text-xs text-muted-foreground">
                            Desde {new Date(user.createdAt).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </TabsContent>

        {/* ── Tab: Roles personalizados ── */}
        {isAdmin && (
          <TabsContent value="roles">
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Los roles personalizados permiten definir permisos exactos para cada miembro del equipo.
                </p>
                <Button size="sm" onClick={() => setRoleDialog({ mode: 'create' })}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Crear rol
                </Button>
              </div>

              {customRoles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-border rounded-xl text-center">
                  <UserCog className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm font-medium mb-1">Sin roles personalizados</p>
                  <p className="text-xs text-muted-foreground mb-4">Crea roles con permisos específicos para asignar a miembros del equipo.</p>
                  <Button size="sm" onClick={() => setRoleDialog({ mode: 'create' })}>
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Crear primer rol
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {customRoles.map(role => {
                    const usersWithRole = users.filter(u => u.customRoleId === role.id)
                    const permCount = Object.values(role.permissions).filter(Boolean).length

                    return (
                      <Card key={role.id} className="border-border/50">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            {/* Color dot */}
                            <div className="w-3 h-3 rounded-full mt-1 shrink-0" style={{ backgroundColor: role.color }} />

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="font-semibold text-sm">{role.name}</p>
                                  {role.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{role.description}</p>
                                  )}
                                </div>
                                <div className="flex gap-1 shrink-0">
                                  <Button variant="ghost" size="icon-sm" onClick={() => setRoleDialog({ mode: 'edit', role })}>
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => setDeleteConfirm(role)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <Badge variant="outline" className="text-[10px]">
                                  {usersWithRole.length} usuario{usersWithRole.length !== 1 ? 's' : ''}
                                </Badge>
                                <Badge variant="outline" className="text-[10px]">
                                  {permCount} permiso{permCount !== 1 ? 's' : ''}
                                </Badge>
                                {role.permissions.dashboard_editor && (
                                  <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                                    <LayoutDashboard className="h-2.5 w-2.5 mr-1" />
                                    Editor
                                  </Badge>
                                )}
                              </div>

                              {usersWithRole.length > 0 && (
                                <div className="flex gap-1 mt-2 flex-wrap">
                                  {usersWithRole.map(u => (
                                    <span key={u.id} className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                                      {u.name.split(' ')[0]}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Create user dialog */}
      {userDialog && (
        <UserDialog
          onSave={user => {
            addUserDirect(user)
            toast.success(`Usuario ${user.name} creado correctamente`)
            setUserDialog(false)
          }}
          onClose={() => setUserDialog(false)}
        />
      )}

      {/* Change password dialog */}
      {pwDialog && (
        <PwDialog
          userId={pwDialog.userId}
          userName={pwDialog.userName}
          onClose={() => setPwDialog(null)}
        />
      )}

      {/* Role editor dialog */}
      {roleDialog && (
        <RoleDialog
          role={roleDialog.role}
          onSave={handleSaveRole}
          onClose={() => setRoleDialog(null)}
        />
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <Dialog open onOpenChange={open => !open && setDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Eliminar rol &ldquo;{deleteConfirm.name}&rdquo;?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              {users.filter(u => u.customRoleId === deleteConfirm.id).length > 0
                ? `Este rol está asignado a ${users.filter(u => u.customRoleId === deleteConfirm.id).length} usuario(s). Se eliminará el rol personalizado y volverán a su rol base.`
                : 'Esta acción no se puede deshacer.'}
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
              <Button variant="destructive" onClick={() => handleDeleteRole(deleteConfirm)}>Eliminar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
