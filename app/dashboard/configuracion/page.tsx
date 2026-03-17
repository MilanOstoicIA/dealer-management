"use client"

import { useState } from "react"
import {
  Settings,
  Building2,
  Phone,
  Mail,
  MapPin,
  Globe,
  Palette,
  Shield,
  Save,
  Calendar,
  ExternalLink,
  Percent,
  Users,
  Bell,
  Globe2,
  Database,
  Trash2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/lib/auth"
import { useStore } from "@/lib/store"
import { useI18n } from "@/lib/i18n"

export default function ConfiguracionPage() {
  const { user } = useAuth()
  const { users, sales, loadDemoData, clearAllData, hasData } = useStore()
  const { locale, setLocale, t } = useI18n()

  const [businessName, setBusinessName] = useState("DealerHub")
  const [businessSubtitle, setBusinessSubtitle] = useState("Gestión de concesionario")
  const [businessPhone, setBusinessPhone] = useState("912 345 678")
  const [businessEmail, setBusinessEmail] = useState("info@dealerhub.es")
  const [businessAddress, setBusinessAddress] = useState("Av. de la Constitución 45, 28001 Madrid")
  const [businessCif, setBusinessCif] = useState("B12345678")
  const [businessWeb, setBusinessWeb] = useState("www.dealerhub.es")
  const [ivaRate, setIvaRate] = useState("21")
  const [defaultCommission, setDefaultCommission] = useState("3")
  const [calendarUrl, setCalendarUrl] = useState("")
  const [saved, setSaved] = useState(false)

  // Compute sellers from store
  const sellers = users.filter((u) => u.role === "vendedor")
  const [sellerCommissions, setSellerCommissions] = useState<Record<string, string>>(
    Object.fromEntries(sellers.map((s) => {
      const sellerSales = sales.filter((sale) => sale.sellerId === s.id && sale.status === "completada")
      const avgRate = sellerSales.length > 0
        ? (sellerSales.reduce((sum, sale) => sum + sale.commissionRate, 0) / sellerSales.length).toFixed(1)
        : defaultCommission
      return [s.id, avgRate]
    }))
  )

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="p-6">
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-6 text-center">
            <Shield className="h-10 w-10 text-destructive mx-auto mb-3" />
            <p className="text-lg font-semibold">{t("settings.restrictedAccess")}</p>
            <p className="text-sm text-muted-foreground mt-1">{t("settings.restrictedDesc")}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("settings.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("settings.subtitle")}</p>
        </div>
        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          {saved ? t("settings.saved") : t("settings.save")}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Business Info */}
        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4" /> {t("settings.businessData")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground font-medium">{t("settings.businessName")}</label>
              <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium">{t("settings.businessSubtitle")}</label>
              <Input value={businessSubtitle} onChange={(e) => setBusinessSubtitle(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium">{t("settings.cif")}</label>
              <Input value={businessCif} onChange={(e) => setBusinessCif(e.target.value)} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium flex items-center gap-1"><Phone className="h-3 w-3" /> {t("settings.phone")}</label>
                <Input value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium flex items-center gap-1"><Mail className="h-3 w-3" /> {t("settings.email")}</label>
                <Input value={businessEmail} onChange={(e) => setBusinessEmail(e.target.value)} className="mt-1" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium flex items-center gap-1"><MapPin className="h-3 w-3" /> {t("settings.address")}</label>
              <Input value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium flex items-center gap-1"><Globe className="h-3 w-3" /> {t("settings.web")}</label>
              <Input value={businessWeb} onChange={(e) => setBusinessWeb(e.target.value)} className="mt-1" />
            </div>
          </CardContent>
        </Card>

        {/* Financial Settings */}
        <div className="space-y-6">
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Percent className="h-4 w-4" /> {t("settings.financialConfig")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground font-medium">{t("settings.iva")}</label>
                  <Input type="number" value={ivaRate} onChange={(e) => setIvaRate(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-medium">{t("settings.defaultCommission")}</label>
                  <Input type="number" value={defaultCommission} onChange={(e) => setDefaultCommission(e.target.value)} className="mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Commission per seller */}
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" /> {t("settings.sellerCommissions")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sellers.map((seller) => {
                const sellerSalesCount = sales.filter((s) => s.sellerId === seller.id && s.status === "completada").length
                return (
                  <div key={seller.id} className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{seller.name}</p>
                      <p className="text-xs text-muted-foreground">{sellerSalesCount} {t("settings.completedSales")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        max="20"
                        value={sellerCommissions[seller.id] || defaultCommission}
                        onChange={(e) => setSellerCommissions({ ...sellerCommissions, [seller.id]: e.target.value })}
                        className="w-20 h-8 text-center"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                )
              })}
              <p className="text-[10px] text-muted-foreground">
                {t("settings.supabaseNote")}
              </p>
            </CardContent>
          </Card>

          {/* Calendar Integration */}
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" /> {t("settings.externalCalendar")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                {t("settings.calendarDesc")}
              </p>
              <div>
                <label className="text-xs text-muted-foreground font-medium">{t("settings.calendarUrl")}</label>
                <Input
                  value={calendarUrl}
                  onChange={(e) => setCalendarUrl(e.target.value)}
                  placeholder="https://calendar.google.com/calendar/ical/..."
                  className="mt-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.open("https://calendar.google.com", "_blank")}>
                  <ExternalLink className="h-3.5 w-3.5" />
                  {t("settings.openGoogleCalendar")}
                </Button>
                <Badge variant="secondary" className="text-[10px]">
                  {t("settings.supabaseActivation")}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Appearance */}
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Palette className="h-4 w-4" /> {t("settings.appearance")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs text-muted-foreground font-medium">{t("settings.primaryColor")}</label>
              <Select defaultValue="blue">
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blue">{t("color.blue")}</SelectItem>
                  <SelectItem value="green">{t("color.green")}</SelectItem>
                  <SelectItem value="purple">{t("color.purple")}</SelectItem>
                  <SelectItem value="red">{t("color.red")}</SelectItem>
                  <SelectItem value="orange">{t("color.orange")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium">{t("settings.sidebarTheme")}</label>
              <Select defaultValue="dark">
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">{t("settings.darkCurrent")}</SelectItem>
                  <SelectItem value="light">{t("settings.light")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium">{t("settings.logo")}</label>
              <div className="mt-1 flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  {t("settings.uploadLogo")}
                </Button>
                <Badge variant="secondary" className="text-[10px]">{t("settings.requiresSupabase")}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language */}
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Globe2 className="h-4 w-4" /> {t("settings.language")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Button
              variant={locale === "es" ? "default" : "outline"}
              size="sm"
              onClick={() => setLocale("es")}
            >
              Español
            </Button>
            <Button
              variant={locale === "en" ? "default" : "outline"}
              size="sm"
              onClick={() => setLocale("en")}
            >
              English
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Database className="h-4 w-4" /> {t("settings.dataManagement")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {t("settings.dataManagementDesc")}
          </p>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { loadDemoData(); setSaved(true); setTimeout(() => setSaved(false), 2000) }}>
              <Database className="h-3.5 w-3.5" />
              {t("settings.loadDemo")}
            </Button>
            <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => { if (confirm(t("settings.clearConfirm"))) { clearAllData(); setSaved(true); setTimeout(() => setSaved(false), 2000) } }}>
              <Trash2 className="h-3.5 w-3.5" />
              {t("settings.clearAll")}
            </Button>
          </div>
          {hasData && (
            <p className="text-[10px] text-muted-foreground">
              {t("settings.dataLoaded")} {users.length} {t("settings.users")}, {sales.length} {t("settings.salesCount")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Bell className="h-4 w-4" /> {t("settings.notifications")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { label: t("notif.saleEmail"), desc: t("notif.saleEmailDesc") },
              { label: t("notif.lowStock"), desc: t("notif.lowStockDesc") },
              { label: t("notif.appointmentReminder"), desc: t("notif.appointmentReminderDesc") },
              { label: t("notif.weeklyReport"), desc: t("notif.weeklyReportDesc") },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Badge variant="secondary" className="text-[10px] shrink-0">{t("settings.comingSoon")}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
