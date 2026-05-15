'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Package, Plus, Search, Edit2, Trash2, Tag, Wrench, Droplets,
  AlertTriangle, CheckCircle2, XCircle, ChevronDown, BarChart3,
  Euro, TrendingUp, Archive,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { dbGetProducts, dbAddProduct, dbUpdateProduct, dbDeleteProduct } from '@/lib/supabase-service'
import type { Product, ProductCategory } from '@/types'
import { useAuth } from '@/lib/auth'
import { toast } from 'sonner'

// ─── Constantes ───────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<ProductCategory, {
  label: string; icon: React.ElementType; color: string; bg: string
}> = {
  servicio:   { label: 'Servicios',   icon: Wrench,   color: 'text-blue-600',   bg: 'bg-blue-500/10' },
  pieza:      { label: 'Piezas',      icon: Package,  color: 'text-purple-600', bg: 'bg-purple-500/10' },
  consumible: { label: 'Consumibles', icon: Droplets, color: 'text-amber-600',  bg: 'bg-amber-500/10' },
}

const UNITS = [
  { value: 'unidad',   label: 'Unidad' },
  { value: 'servicio', label: 'Servicio' },
  { value: 'hora',     label: 'Hora' },
  { value: 'litro',    label: 'Litro' },
  { value: 'kg',       label: 'Kg' },
  { value: 'metro',    label: 'Metro' },
]

function fmt(n: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n)
}

// ─── Formulario ───────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: '', description: '', category: 'servicio' as ProductCategory,
  price: '', cost: '', unit: 'servicio', taxRate: '21',
  sku: '', stock: '', minStock: '', active: true,
}

function ProductForm({
  initial, onSave, onClose,
}: {
  initial?: Product
  onSave: (data: Omit<Product, 'id' | 'createdAt'>) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState(() => initial ? {
    name: initial.name,
    description: initial.description ?? '',
    category: initial.category,
    price: String(initial.price),
    cost: String(initial.cost),
    unit: initial.unit,
    taxRate: String(initial.taxRate),
    sku: initial.sku ?? '',
    stock: initial.stock != null ? String(initial.stock) : '',
    minStock: initial.minStock != null ? String(initial.minStock) : '',
    active: initial.active,
  } : EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const isService = form.category === 'servicio'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('El nombre es obligatorio'); return }
    if (!form.price || isNaN(Number(form.price))) { toast.error('Precio inválido'); return }
    setSaving(true)
    try {
      await onSave({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        category: form.category,
        price: Number(form.price),
        cost: Number(form.cost) || 0,
        unit: form.unit as Product['unit'],
        taxRate: Number(form.taxRate) || 21,
        sku: form.sku.trim() || undefined,
        stock: !isService && form.stock !== '' ? Number(form.stock) : null,
        minStock: !isService && form.minStock !== '' ? Number(form.minStock) : null,
        active: form.active,
      })
    } finally {
      setSaving(false)
    }
  }

  const margin = form.price && form.cost
    ? ((Number(form.price) - Number(form.cost)) / Number(form.price) * 100).toFixed(0)
    : null

  return (
    <Dialog open onOpenChange={o => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? 'Editar producto' : 'Nuevo producto / servicio'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-1">
          {/* Categoría */}
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(CATEGORY_CONFIG) as [ProductCategory, typeof CATEGORY_CONFIG[ProductCategory]][]).map(([key, cfg]) => {
              const Icon = cfg.icon
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, category: key, unit: key === 'servicio' ? 'servicio' : 'unidad' }))}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-xs font-medium transition-all',
                    form.category === key
                      ? `border-current ${cfg.color} ${cfg.bg}`
                      : 'border-border text-muted-foreground hover:border-border/80'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {cfg.label}
                </button>
              )
            })}
          </div>

          {/* Nombre y SKU */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Nombre <span className="text-destructive">*</span></Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Cambio de aceite y filtro" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>Referencia</Label>
              <Input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="SRV-001" />
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <Label>Descripción</Label>
            <Textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Descripción del servicio o producto..."
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Precio, coste, unidad, IVA */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Precio de venta (€) <span className="text-destructive">*</span></Label>
              <Input
                type="number" min="0" step="0.01"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Coste (€)</Label>
              <Input
                type="number" min="0" step="0.01"
                value={form.cost}
                onChange={e => setForm(f => ({ ...f, cost: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Unidad</Label>
              <Select value={form.unit} onValueChange={v => setForm(f => ({ ...f, unit: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UNITS.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>IVA (%)</Label>
              <Select value={form.taxRate} onValueChange={v => setForm(f => ({ ...f, taxRate: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0% (exento)</SelectItem>
                  <SelectItem value="4">4% (superreducido)</SelectItem>
                  <SelectItem value="10">10% (reducido)</SelectItem>
                  <SelectItem value="21">21% (general)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Margen calculado */}
          {margin !== null && (
            <div className={cn(
              'rounded-lg px-3 py-2 text-sm flex items-center gap-2',
              Number(margin) >= 40 ? 'bg-green-500/10 text-green-700' :
              Number(margin) >= 20 ? 'bg-amber-500/10 text-amber-700' :
              'bg-red-500/10 text-red-700'
            )}>
              <TrendingUp className="h-3.5 w-3.5 shrink-0" />
              Margen: <strong>{margin}%</strong>
              {' '}— Beneficio: <strong>{fmt(Number(form.price) - Number(form.cost))}</strong>
            </div>
          )}

          {/* Stock (solo para piezas y consumibles) */}
          {!isService && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Stock actual</Label>
                <Input
                  type="number" min="0"
                  value={form.stock}
                  onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Stock mínimo (alerta)</Label>
                <Input
                  type="number" min="0"
                  value={form.minStock}
                  onChange={e => setForm(f => ({ ...f, minStock: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>
          )}

          {/* Activo */}
          <div className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5">
            <Switch checked={form.active} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} />
            <div>
              <p className="text-sm font-medium">Producto activo</p>
              <p className="text-xs text-muted-foreground">Los inactivos no aparecen al crear citas</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando…' : initial ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Tarjeta de producto ──────────────────────────────────────────────────────

function ProductCard({ product, canEdit, onEdit, onDelete }: {
  product: Product
  canEdit: boolean
  onEdit: (p: Product) => void
  onDelete: (p: Product) => void
}) {
  const cfg = CATEGORY_CONFIG[product.category]
  const Icon = cfg.icon
  const margin = product.price > 0 ? ((product.price - product.cost) / product.price * 100) : 0
  const lowStock = product.stock != null && product.minStock != null && product.stock <= product.minStock

  return (
    <Card className={cn(
      'group relative transition-shadow hover:shadow-md',
      !product.active && 'opacity-60'
    )}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', cfg.bg)}>
              <Icon className={cn('h-4 w-4', cfg.color)} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{product.name}</p>
              {product.sku && <p className="text-[10px] text-muted-foreground font-mono">{product.sku}</p>}
            </div>
          </div>
          {!product.active && (
            <Badge variant="outline" className="text-[10px] shrink-0">Inactivo</Badge>
          )}
        </div>

        {/* Descripción */}
        {product.description && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
        )}

        {/* Precio y margen */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="rounded-md bg-muted/50 px-2.5 py-1.5">
            <p className="text-[10px] text-muted-foreground">Precio venta</p>
            <p className="text-sm font-bold">{fmt(product.price)}</p>
            <p className="text-[10px] text-muted-foreground">/ {product.unit}</p>
          </div>
          <div className="rounded-md bg-muted/50 px-2.5 py-1.5">
            <p className="text-[10px] text-muted-foreground">Margen</p>
            <p className={cn('text-sm font-bold',
              margin >= 40 ? 'text-green-600' : margin >= 20 ? 'text-amber-600' : 'text-red-600'
            )}>
              {margin.toFixed(0)}%
            </p>
            <p className="text-[10px] text-muted-foreground">{fmt(product.price - product.cost)} benef.</p>
          </div>
        </div>

        {/* Stock */}
        {product.stock != null && (
          <div className={cn(
            'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs mb-3',
            lowStock ? 'bg-red-500/10 text-red-700' : 'bg-muted/50 text-muted-foreground'
          )}>
            {lowStock
              ? <><AlertTriangle className="h-3 w-3" /> Stock bajo: <strong>{product.stock}</strong> uds.</>
              : <><Archive className="h-3 w-3" /> Stock: <strong>{product.stock}</strong> uds.</>
            }
          </div>
        )}

        {/* IVA badge */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-[10px]">IVA {product.taxRate}%</Badge>

          {canEdit && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="icon-sm" variant="ghost" onClick={() => onEdit(product)}>
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon-sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => onDelete(product)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function ProductosPage() {
  const { canEdit } = useAuth()
  const canEditProducts = canEdit('productos') || canEdit('vehiculos') // admin y vendedor

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | 'todos'>('todos')
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | undefined>()
  const [deleteProduct, setDeleteProduct] = useState<Product | undefined>()

  async function loadProducts() {
    setLoading(true)
    try {
      const data = await dbGetProducts()
      setProducts(data)
    } catch {
      toast.error('Error al cargar productos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadProducts() }, [])

  const filtered = useMemo(() => products.filter(p => {
    if (categoryFilter !== 'todos' && p.category !== categoryFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q)
    }
    return true
  }), [products, categoryFilter, search])

  // Stats
  const stats = useMemo(() => ({
    total: products.length,
    active: products.filter(p => p.active).length,
    lowStock: products.filter(p => p.stock != null && p.minStock != null && p.stock <= p.minStock).length,
    avgMargin: products.length > 0
      ? products.reduce((acc, p) => acc + (p.price > 0 ? (p.price - p.cost) / p.price * 100 : 0), 0) / products.length
      : 0,
  }), [products])

  async function handleSave(data: Omit<Product, 'id' | 'createdAt'>) {
    try {
      if (editProduct) {
        await dbUpdateProduct(editProduct.id, data)
        toast.success('Producto actualizado')
      } else {
        await dbAddProduct(data)
        toast.success('Producto creado')
      }
      await loadProducts()
      setShowForm(false)
      setEditProduct(undefined)
    } catch {
      toast.error('Error al guardar')
    }
  }

  async function handleDelete() {
    if (!deleteProduct) return
    try {
      await dbDeleteProduct(deleteProduct.id)
      toast.success('Producto eliminado')
      await loadProducts()
    } catch {
      toast.error('Error al eliminar')
    } finally {
      setDeleteProduct(undefined)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Catálogo de productos y servicios
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Servicios del taller, piezas y consumibles con precios y márgenes
          </p>
        </div>
        {canEditProducts && (
          <Button onClick={() => { setEditProduct(undefined); setShowForm(true) }}>
            <Plus className="h-4 w-4 mr-1.5" />
            Nuevo producto
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total catálogo', value: stats.total, icon: Package, color: 'text-blue-600', bg: 'bg-blue-500/10' },
          { label: 'Activos', value: stats.active, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-500/10' },
          { label: 'Stock bajo', value: stats.lowStock, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-500/10' },
          { label: 'Margen medio', value: `${stats.avgMargin.toFixed(0)}%`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-500/10' },
        ].map(s => {
          const Icon = s.icon
          return (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg shrink-0', s.bg)}>
                  <Icon className={cn('h-4 w-4', s.color)} />
                </div>
                <div>
                  <p className="text-xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, descripción o referencia..."
            className="pl-9"
          />
        </div>
        <Tabs value={categoryFilter} onValueChange={v => setCategoryFilter(v as typeof categoryFilter)}>
          <TabsList>
            <TabsTrigger value="todos">Todos ({products.length})</TabsTrigger>
            {(Object.entries(CATEGORY_CONFIG) as [ProductCategory, typeof CATEGORY_CONFIG[ProductCategory]][]).map(([key, cfg]) => {
              const count = products.filter(p => p.category === key).length
              return (
                <TabsTrigger key={key} value={key}>
                  {cfg.label} ({count})
                </TabsTrigger>
              )
            })}
          </TabsList>
        </Tabs>
      </div>

      {/* Grid de productos */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 space-y-3">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium mb-1">
            {search ? 'Sin resultados' : 'Sin productos aún'}
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            {search ? `No hay productos que coincidan con "${search}"` : 'Añade servicios, piezas y consumibles al catálogo'}
          </p>
          {canEditProducts && !search && (
            <Button size="sm" onClick={() => { setEditProduct(undefined); setShowForm(true) }}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Añadir primero
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(p => (
            <ProductCard
              key={p.id}
              product={p}
              canEdit={canEditProducts}
              onEdit={p => { setEditProduct(p); setShowForm(true) }}
              onDelete={setDeleteProduct}
            />
          ))}
        </div>
      )}

      {/* Dialog formulario */}
      {showForm && (
        <ProductForm
          initial={editProduct}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditProduct(undefined) }}
        />
      )}

      {/* Confirmar eliminación */}
      <AlertDialog open={!!deleteProduct} onOpenChange={o => !o && setDeleteProduct(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar <strong>{deleteProduct?.name}</strong>. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
