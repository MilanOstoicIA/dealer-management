"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

export type Locale = "es" | "en"

const translations: Record<Locale, Record<string, string>> = {
  es: {
    // Nav
    "nav.principal": "Principal",
    "nav.admin": "Administración",
    "nav.dashboard": "Dashboard",
    "nav.vehicles": "Vehículos",
    "nav.clients": "Clientes",
    "nav.appointments": "Citas / Taller",
    "nav.sales": "Ventas",
    "nav.accounting": "Contabilidad",
    "nav.invoicing": "Facturación",
    "nav.team": "Equipo",
    "nav.forum": "Foro Compra-Venta",
    "nav.settings": "Configuración",
    "nav.tracking": "Seguimientos",
    "nav.suppliers": "Proveedores",
    "nav.logout": "Cerrar sesión",
    // Roles
    "role.admin": "Administrador",
    "role.vendedor": "Vendedor",
    "role.mecanico": "Mecánico",
    "role.recepcionista": "Recepcionista",
    "role.viewer": "Visor",
    // Dashboard
    "dashboard.title": "Dashboard",
    "dashboard.subtitle": "Resumen general del concesionario",
    "dashboard.totalVehicles": "Vehículos totales",
    "dashboard.clients": "Clientes",
    "dashboard.pendingAppointments": "Citas pendientes",
    "dashboard.monthlySales": "Ventas del mes",
    "dashboard.available": "disponibles",
    "dashboard.sold": "vendidos",
    "dashboard.registered": "Clientes registrados",
    "dashboard.inWorkshop": "vehículos en taller",
    "dashboard.commissions": "en comisiones",
    "dashboard.upcomingAppointments": "Próximas citas",
    "dashboard.pending": "pendientes",
    "dashboard.recentSales": "Últimas ventas",
    "dashboard.completed": "completadas",
    "dashboard.inShop": "En taller",
    "dashboard.salesInProgress": "Ventas en proceso",
    "dashboard.reserved": "Reservados",
    "dashboard.noPending": "No hay citas pendientes",
    // Vehicles
    "vehicles.title": "Vehículos",
    "vehicles.available": "disponibles",
    // Clients
    "clients.title": "Clientes",
    "clients.registered": "clientes registrados",
    "clients.searchPlaceholder": "Buscar por nombre, email, teléfono o DNI...",
    // Sales
    "sales.title": "Ventas",
    // Appointments
    "appointments.title": "Citas / Taller",
    // Accounting
    "accounting.title": "Contabilidad",
    "accounting.subtitle": "Resumen financiero del concesionario",
    // Invoicing
    "invoicing.title": "Facturación",
    "invoicing.subtitle": "Gestión de facturas del concesionario",
    // Team
    "team.title": "Equipo",
    "team.members": "miembros del equipo",
    // Forum
    "forum.title": "Foro Compra-Venta",
    "forum.subtitle": "Personas que quieren vender sus coches. Contacta, compra, repara y vende.",
    // Settings
    "settings.title": "Configuración",
    "settings.subtitle": "Ajustes del negocio y preferencias",
    "settings.save": "Guardar cambios",
    "settings.saved": "Guardado",
    "settings.businessData": "Datos del negocio",
    "settings.financialConfig": "Configuración financiera",
    "settings.sellerCommissions": "Comisiones por vendedor",
    "settings.externalCalendar": "Calendario externo",
    "settings.appearance": "Apariencia",
    "settings.notifications": "Notificaciones",
    "settings.language": "Idioma",
    "settings.loadDemo": "Cargar datos de ejemplo",
    "settings.clearAll": "Borrar todos los datos",
    "settings.clearConfirm": "¿Estás seguro? Se borrarán todos los datos.",
    "settings.demoLoaded": "Datos de ejemplo cargados",
    "settings.dataCleared": "Datos borrados",
    // Common
    "common.search": "Buscar",
    "common.save": "Guardar",
    "common.cancel": "Cancelar",
    "common.delete": "Eliminar",
    "common.edit": "Editar",
    "common.add": "Añadir",
    "common.close": "Cerrar",
    "common.status": "Estado",
    "common.date": "Fecha",
    "common.amount": "Importe",
    "common.noData": "No hay datos",
    // Statuses
    "status.available": "Disponible",
    "status.reserved": "Reservado",
    "status.sold": "Vendido",
    "status.inWorkshop": "En taller",
    "status.pending": "Pendiente",
    "status.inProgress": "En progreso",
    "status.completed": "Completada",
    "status.cancelled": "Cancelada",
    "status.inProcess": "En proceso",
    // Login
    "login.title": "Iniciar sesión",
    "login.email": "Correo electrónico",
    "login.password": "Contraseña",
    "login.submit": "Entrar",
    "login.subtitle": "Sistema de gestión de concesionario",
    // Viewer
    "viewer.readOnly": "Solo lectura",
    "viewer.noEdit": "No tienes permisos para editar",
    // Settings page details
    "settings.businessName": "Nombre del negocio",
    "settings.businessSubtitle": "Subtítulo",
    "settings.cif": "CIF / NIF",
    "settings.phone": "Teléfono",
    "settings.email": "Email",
    "settings.address": "Dirección",
    "settings.web": "Web",
    "settings.iva": "IVA (%)",
    "settings.defaultCommission": "Comisión por defecto (%)",
    "settings.completedSales": "ventas completadas",
    "settings.supabaseNote": "Se conectará con Supabase para aplicar automáticamente al crear ventas.",
    "settings.calendarDesc": "Vincula un calendario de Google para sincronizar las citas del taller.",
    "settings.calendarUrl": "URL del calendario (iCal/Google)",
    "settings.openGoogleCalendar": "Abrir Google Calendar",
    "settings.supabaseActivation": "Se activará con Supabase",
    "settings.primaryColor": "Color principal",
    "settings.sidebarTheme": "Tema del sidebar",
    "settings.logo": "Logo",
    "settings.uploadLogo": "Subir logo",
    "settings.requiresSupabase": "Requiere Supabase Storage",
    "settings.darkCurrent": "Oscuro (actual)",
    "settings.light": "Claro",
    "settings.dataManagement": "Gestión de datos",
    "settings.dataManagementDesc": "Carga datos de ejemplo para probar la aplicación o borra todos los datos para empezar de cero.",
    "settings.dataLoaded": "Datos cargados:",
    "settings.users": "usuarios",
    "settings.salesCount": "ventas",
    "settings.restrictedAccess": "Acceso restringido",
    "settings.restrictedDesc": "Solo el administrador puede acceder a la configuración.",
    "settings.comingSoon": "Próximamente",
    // Notification items
    "notif.saleEmail": "Email al cerrar una venta",
    "notif.saleEmailDesc": "Recibe un email cuando se complete una venta",
    "notif.lowStock": "Alerta de stock bajo",
    "notif.lowStockDesc": "Notifica cuando haya menos de 5 vehículos disponibles",
    "notif.appointmentReminder": "Recordatorio de citas",
    "notif.appointmentReminderDesc": "Email al cliente 24h antes de su cita",
    "notif.weeklyReport": "Informe semanal",
    "notif.weeklyReportDesc": "Resumen financiero cada lunes por email",
    // Colors
    "color.blue": "Azul",
    "color.green": "Verde",
    "color.purple": "Morado",
    "color.red": "Rojo",
    "color.orange": "Naranja",
  },
  en: {
    // Nav
    "nav.principal": "Main",
    "nav.admin": "Administration",
    "nav.dashboard": "Dashboard",
    "nav.vehicles": "Vehicles",
    "nav.clients": "Clients",
    "nav.appointments": "Appointments / Workshop",
    "nav.sales": "Sales",
    "nav.accounting": "Accounting",
    "nav.invoicing": "Invoicing",
    "nav.team": "Team",
    "nav.forum": "Buy-Sell Forum",
    "nav.settings": "Settings",
    "nav.tracking": "Tracking",
    "nav.suppliers": "Suppliers",
    "nav.logout": "Log out",
    // Roles
    "role.admin": "Administrator",
    "role.vendedor": "Salesperson",
    "role.mecanico": "Mechanic",
    "role.recepcionista": "Receptionist",
    "role.viewer": "Viewer",
    // Dashboard
    "dashboard.title": "Dashboard",
    "dashboard.subtitle": "Dealership overview",
    "dashboard.totalVehicles": "Total vehicles",
    "dashboard.clients": "Clients",
    "dashboard.pendingAppointments": "Pending appointments",
    "dashboard.monthlySales": "Monthly sales",
    "dashboard.available": "available",
    "dashboard.sold": "sold",
    "dashboard.registered": "Registered clients",
    "dashboard.inWorkshop": "vehicles in workshop",
    "dashboard.commissions": "in commissions",
    "dashboard.upcomingAppointments": "Upcoming appointments",
    "dashboard.pending": "pending",
    "dashboard.recentSales": "Recent sales",
    "dashboard.completed": "completed",
    "dashboard.inShop": "In workshop",
    "dashboard.salesInProgress": "Sales in progress",
    "dashboard.reserved": "Reserved",
    "dashboard.noPending": "No pending appointments",
    // Vehicles
    "vehicles.title": "Vehicles",
    "vehicles.available": "available",
    // Clients
    "clients.title": "Clients",
    "clients.registered": "registered clients",
    "clients.searchPlaceholder": "Search by name, email, phone or ID...",
    // Sales
    "sales.title": "Sales",
    // Appointments
    "appointments.title": "Appointments / Workshop",
    // Accounting
    "accounting.title": "Accounting",
    "accounting.subtitle": "Dealership financial overview",
    // Invoicing
    "invoicing.title": "Invoicing",
    "invoicing.subtitle": "Dealership invoice management",
    // Team
    "team.title": "Team",
    "team.members": "team members",
    // Forum
    "forum.title": "Buy-Sell Forum",
    "forum.subtitle": "People selling their cars. Contact, buy, repair and sell.",
    // Settings
    "settings.title": "Settings",
    "settings.subtitle": "Business settings and preferences",
    "settings.save": "Save changes",
    "settings.saved": "Saved",
    "settings.businessData": "Business info",
    "settings.financialConfig": "Financial settings",
    "settings.sellerCommissions": "Seller commissions",
    "settings.externalCalendar": "External calendar",
    "settings.appearance": "Appearance",
    "settings.notifications": "Notifications",
    "settings.language": "Language",
    "settings.loadDemo": "Load demo data",
    "settings.clearAll": "Clear all data",
    "settings.clearConfirm": "Are you sure? All data will be deleted.",
    "settings.demoLoaded": "Demo data loaded",
    "settings.dataCleared": "Data cleared",
    // Common
    "common.search": "Search",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.add": "Add",
    "common.close": "Close",
    "common.status": "Status",
    "common.date": "Date",
    "common.amount": "Amount",
    "common.noData": "No data",
    // Statuses
    "status.available": "Available",
    "status.reserved": "Reserved",
    "status.sold": "Sold",
    "status.inWorkshop": "In workshop",
    "status.pending": "Pending",
    "status.inProgress": "In progress",
    "status.completed": "Completed",
    "status.cancelled": "Cancelled",
    "status.inProcess": "In process",
    // Login
    "login.title": "Sign in",
    "login.email": "Email",
    "login.password": "Password",
    "login.submit": "Sign in",
    "login.subtitle": "Dealership management system",
    // Viewer
    "viewer.readOnly": "Read only",
    "viewer.noEdit": "You don't have permission to edit",
    // Settings page details
    "settings.businessName": "Business name",
    "settings.businessSubtitle": "Subtitle",
    "settings.cif": "Tax ID",
    "settings.phone": "Phone",
    "settings.email": "Email",
    "settings.address": "Address",
    "settings.web": "Website",
    "settings.iva": "VAT (%)",
    "settings.defaultCommission": "Default commission (%)",
    "settings.completedSales": "completed sales",
    "settings.supabaseNote": "Will connect with Supabase to apply automatically when creating sales.",
    "settings.calendarDesc": "Link a Google Calendar to sync workshop appointments.",
    "settings.calendarUrl": "Calendar URL (iCal/Google)",
    "settings.openGoogleCalendar": "Open Google Calendar",
    "settings.supabaseActivation": "Will activate with Supabase",
    "settings.primaryColor": "Primary color",
    "settings.sidebarTheme": "Sidebar theme",
    "settings.logo": "Logo",
    "settings.uploadLogo": "Upload logo",
    "settings.requiresSupabase": "Requires Supabase Storage",
    "settings.darkCurrent": "Dark (current)",
    "settings.light": "Light",
    "settings.dataManagement": "Data management",
    "settings.dataManagementDesc": "Load demo data to test the app or clear all data to start fresh.",
    "settings.dataLoaded": "Data loaded:",
    "settings.users": "users",
    "settings.salesCount": "sales",
    "settings.restrictedAccess": "Restricted access",
    "settings.restrictedDesc": "Only the administrator can access settings.",
    "settings.comingSoon": "Coming soon",
    // Notification items
    "notif.saleEmail": "Email on sale completion",
    "notif.saleEmailDesc": "Receive an email when a sale is completed",
    "notif.lowStock": "Low stock alert",
    "notif.lowStockDesc": "Notify when fewer than 5 vehicles are available",
    "notif.appointmentReminder": "Appointment reminder",
    "notif.appointmentReminderDesc": "Email the client 24h before their appointment",
    "notif.weeklyReport": "Weekly report",
    "notif.weeklyReportDesc": "Financial summary every Monday by email",
    // Colors
    "color.blue": "Blue",
    "color.green": "Green",
    "color.purple": "Purple",
    "color.red": "Red",
    "color.orange": "Orange",
  },
}

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextType | null>(null)

const LOCALE_KEY = "dealerhub_locale"

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("es")

  useEffect(() => {
    const stored = localStorage.getItem(LOCALE_KEY) as Locale | null
    if (stored && (stored === "es" || stored === "en")) {
      setLocaleState(stored)
    }
  }, [])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    localStorage.setItem(LOCALE_KEY, l)
  }, [])

  const t = useCallback((key: string): string => {
    return translations[locale][key] || key
  }, [locale])

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n(): I18nContextType {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useI18n must be used within I18nProvider")
  return ctx
}
