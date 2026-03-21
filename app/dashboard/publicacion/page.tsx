"use client"

import { useState } from "react"
import { Globe, Download, ExternalLink, Car, Copy, Check } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useStore } from "@/lib/store"
import {
  generateAutoScout24XML,
  generateCochesNetXML,
  generateWallapopCSV,
  downloadFile,
} from "@/lib/feed-generators"

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount)
}

interface Portal {
  id: string
  name: string
  description: string
  logo: string
  color: string
  feedType: "XML" | "CSV"
  feedUrl: string
  generate: () => string
  filename: string
  mimeType: string
}

export default function PublicacionPage() {
  const { vehicles } = useStore()
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const availableVehicles = vehicles.filter((v) => v.status === "disponible")
  const totalValue = availableVehicles.reduce((sum, v) => sum + v.price, 0)

  const portals: Portal[] = [
    {
      id: "autoscout24",
      name: "AutoScout24",
      description: "El mayor portal de coches usados de Europa. Feed XML automático.",
      logo: "AS24",
      color: "bg-orange-500/15 text-orange-600 border-orange-500/20",
      feedType: "XML",
      feedUrl: "/api/feeds/autoscout24",
      generate: () => generateAutoScout24XML(availableVehicles),
      filename: `autoscout24-feed-${new Date().toISOString().split("T")[0]}.xml`,
      mimeType: "application/xml",
    },
    {
      id: "cochesnet",
      name: "Coches.net",
      description: "Portal referencia en compraventa de vehículos en España. Feed XML.",
      logo: "C.N",
      color: "bg-blue-500/15 text-blue-600 border-blue-500/20",
      feedType: "XML",
      feedUrl: "/api/feeds/cochesnet",
      generate: () => generateCochesNetXML(availableVehicles),
      filename: `cochesnet-feed-${new Date().toISOString().split("T")[0]}.xml`,
      mimeType: "application/xml",
    },
    {
      id: "wallapop",
      name: "Wallapop",
      description: "Marketplace generalista con sección de motor muy activa. CSV bulk upload.",
      logo: "WP",
      color: "bg-teal-500/15 text-teal-600 border-teal-500/20",
      feedType: "CSV",
      feedUrl: "/api/feeds/wallapop",
      generate: () => generateWallapopCSV(availableVehicles),
      filename: `wallapop-vehicles-${new Date().toISOString().split("T")[0]}.csv`,
      mimeType: "text/csv",
    },
  ]

  function handleDownload(portal: Portal) {
    const content = portal.generate()
    downloadFile(content, portal.filename, portal.mimeType)
  }

  function handleCopyUrl(portal: Portal) {
    const url = `${window.location.origin}${portal.feedUrl}`
    navigator.clipboard.writeText(url)
    setCopiedId(portal.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Publicación en portales</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Genera feeds XML/CSV para publicar tus vehículos en portales de venta
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
              <Car className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold">{availableVehicles.length}</p>
              <p className="text-xs text-muted-foreground">Vehículos disponibles</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/15">
              <Globe className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-bold">{portals.length}</p>
              <p className="text-xs text-muted-foreground">Portales disponibles</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/15">
              <Download className="h-4 w-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-lg font-bold">{formatCurrency(totalValue)}</p>
              <p className="text-xs text-muted-foreground">Valor stock publicable</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Portal cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {portals.map((portal) => (
          <Card key={portal.id} className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg font-bold text-sm border ${portal.color}`}>
                    {portal.logo}
                  </div>
                  <div>
                    <CardTitle className="text-base">{portal.name}</CardTitle>
                    <Badge variant="outline" className="text-[10px] mt-0.5">{portal.feedType}</Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">{portal.description}</p>

              {/* Feed URL */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">URL del feed (para importación automática):</p>
                <div className="flex gap-1.5">
                  <Input
                    readOnly
                    value={`${typeof window !== "undefined" ? window.location.origin : ""}/api/feeds/${portal.id === "cochesnet" ? "cochesnet" : portal.id}`}
                    className="text-xs font-mono h-8"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => handleCopyUrl(portal)}
                  >
                    {copiedId === portal.id ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={() => handleDownload(portal)}
                  disabled={availableVehicles.length === 0}
                >
                  <Download className="h-3.5 w-3.5" />
                  Descargar {portal.feedType}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => window.open(portal.feedUrl, "_blank")}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Ver
                </Button>
              </div>

              <p className="text-[10px] text-muted-foreground">
                {availableVehicles.length} vehículos incluidos en el feed
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Vehicles that will be published */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Car className="h-4 w-4" /> Vehículos en los feeds ({availableVehicles.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {availableVehicles.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No hay vehículos disponibles para publicar. Los vehículos con estado &quot;Disponible&quot; aparecerán aquí.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {availableVehicles.map((v) => (
                <div key={v.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Car className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{v.brand} {v.model}</p>
                    <p className="text-xs text-muted-foreground">{v.year} · {v.mileage.toLocaleString("es-ES")} km</p>
                  </div>
                  <p className="text-sm font-semibold shrink-0">{formatCurrency(v.price)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
