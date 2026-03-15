"use client"

import { useState } from "react"
import { MessageSquare, Search, Phone, Mail, Car, Euro, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { forumPosts } from "@/lib/data"
import type { ForumPost, ForumPostStatus } from "@/types"

const statusConfig: Record<ForumPostStatus, { label: string; className: string }> = {
  nuevo: { label: "Nuevo", className: "bg-blue-500/15 text-blue-600 border-blue-500/20" },
  contactado: { label: "Contactado", className: "bg-yellow-500/15 text-yellow-600 border-yellow-500/20" },
  comprado: { label: "Comprado", className: "bg-green-500/15 text-green-600 border-green-500/20" },
  descartado: { label: "Descartado", className: "bg-destructive/15 text-destructive border-destructive/20" },
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount)
}

export default function ForoPage() {
  const [search, setSearch] = useState("")
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null)

  const filtered = forumPosts.filter(
    (p) =>
      p.authorName.toLowerCase().includes(search.toLowerCase()) ||
      p.vehicleBrand.toLowerCase().includes(search.toLowerCase()) ||
      p.vehicleModel.toLowerCase().includes(search.toLowerCase())
  )

  const newCount = forumPosts.filter((p) => p.status === "nuevo").length
  const contactedCount = forumPosts.filter((p) => p.status === "contactado").length
  const boughtCount = forumPosts.filter((p) => p.status === "comprado").length

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Foro Compra-Venta</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Personas que quieren vender sus coches. Contacta, compra, repara y vende.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15">
              <MessageSquare className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-bold">{newCount}</p>
              <p className="text-xs text-muted-foreground">Nuevos anuncios</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/15">
              <Phone className="h-4 w-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-lg font-bold">{contactedCount}</p>
              <p className="text-xs text-muted-foreground">Contactados</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/15">
              <Car className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-bold">{boughtCount}</p>
              <p className="text-xs text-muted-foreground">Comprados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por vendedor, marca o modelo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      {/* Posts */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filtered.map((post) => {
          const cfg = statusConfig[post.status]
          return (
            <Card
              key={post.id}
              className="border-border/50 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => setSelectedPost(post)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-base font-semibold">
                        {post.vehicleBrand} {post.vehicleModel}
                      </p>
                      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium ${cfg.className}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {post.vehicleYear} · {new Intl.NumberFormat("es-ES").format(post.vehicleMileage)} km
                    </p>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{post.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-primary">{formatCurrency(post.askingPrice)}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t pt-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{post.authorName}</span>
                    <span>·</span>
                    <span>{post.authorPhone}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(post.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {filtered.length === 0 && (
          <div className="col-span-2 py-12 text-center text-sm text-muted-foreground">
            No se encontraron anuncios
          </div>
        )}
      </div>

      {/* Post detail dialog */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedPost?.vehicleBrand} {selectedPost?.vehicleModel}
            </DialogTitle>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={statusConfig[selectedPost.status].className}>
                  {statusConfig[selectedPost.status].label}
                </Badge>
              </div>

              <div className="rounded-lg border p-4 space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Año</span>
                  <span className="text-sm font-medium">{selectedPost.vehicleYear}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Kilometraje</span>
                  <span className="text-sm font-medium">{new Intl.NumberFormat("es-ES").format(selectedPost.vehicleMileage)} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Precio pedido</span>
                  <span className="text-sm font-bold text-primary">{formatCurrency(selectedPost.askingPrice)}</span>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Descripción</p>
                <p className="text-sm">{selectedPost.description}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Contacto del vendedor</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{selectedPost.authorName}</span>
                    <span className="text-muted-foreground">·</span>
                    <span>{selectedPost.authorPhone}</span>
                  </div>
                  {selectedPost.authorEmail && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {selectedPost.authorEmail}
                    </div>
                  )}
                </div>
              </div>

              {selectedPost.notes && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Notas internas</p>
                  <p className="text-sm bg-muted/50 rounded-lg p-3">{selectedPost.notes}</p>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                Publicado el {new Date(selectedPost.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
