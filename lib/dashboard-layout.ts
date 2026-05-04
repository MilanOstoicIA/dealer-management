// ─── Widget types ─────────────────────────────────────────────────────────────

export type WidgetType =
  | 'stat_vehicles'
  | 'stat_clients'
  | 'stat_appointments'
  | 'stat_revenue'
  | 'stat_commissions'
  | 'stat_in_workshop'
  | 'stat_reserved'
  | 'stat_sold_month'
  | 'list_appointments'
  | 'list_recent_sales'
  | 'list_forum'
  | 'list_trackings'
  | 'chart_monthly_revenue'
  | 'chart_vehicles_status'
  | 'chart_sales_by_seller'

export interface WidgetConfig {
  i: string       // unique ID
  type: WidgetType
  x: number       // 0–11 (12-column grid)
  y: number
  w: number       // 3=1col, 6=2col, 9=3col, 12=4col
  h: number       // rowHeight=110px per unit
}

export interface DashboardLayout {
  widgets: WidgetConfig[]
}

// ─── Widget catalog ───────────────────────────────────────────────────────────

export const WIDGET_CATALOG: {
  type: WidgetType
  label: string
  emoji: string
  description: string
  defaultW: number
  defaultH: number
  category: 'stat' | 'list' | 'chart'
}[] = [
  { type: 'stat_vehicles',        label: 'Vehículos disponibles',    emoji: '🚗', description: 'Stock disponible para venta',    defaultW: 3, defaultH: 2, category: 'stat'  },
  { type: 'stat_clients',         label: 'Clientes totales',         emoji: '👥', description: 'Total de clientes registrados',  defaultW: 3, defaultH: 2, category: 'stat'  },
  { type: 'stat_appointments',    label: 'Citas pendientes',         emoji: '📅', description: 'Citas sin completar',            defaultW: 3, defaultH: 2, category: 'stat'  },
  { type: 'stat_revenue',         label: 'Ingresos del mes',         emoji: '💰', description: 'Ventas completadas este mes',    defaultW: 3, defaultH: 2, category: 'stat'  },
  { type: 'stat_commissions',     label: 'Comisiones del mes',       emoji: '📈', description: 'Comisiones acumuladas',          defaultW: 3, defaultH: 2, category: 'stat'  },
  { type: 'stat_in_workshop',     label: 'En taller ahora',          emoji: '🔧', description: 'Vehículos en reparación',        defaultW: 3, defaultH: 2, category: 'stat'  },
  { type: 'stat_reserved',        label: 'Reservados',               emoji: '🔒', description: 'Vehículos con señal',           defaultW: 3, defaultH: 2, category: 'stat'  },
  { type: 'stat_sold_month',      label: 'Vendidos este mes',        emoji: '✅', description: 'Unidades vendidas en el mes',   defaultW: 3, defaultH: 2, category: 'stat'  },
  { type: 'list_appointments',    label: 'Próximas citas',           emoji: '🗓️', description: 'Citas pendientes del taller',   defaultW: 6, defaultH: 4, category: 'list'  },
  { type: 'list_recent_sales',    label: 'Últimas ventas',           emoji: '🛒', description: 'Ventas más recientes',          defaultW: 6, defaultH: 4, category: 'list'  },
  { type: 'list_forum',           label: 'Leads del foro',           emoji: '💬', description: 'Anuncios nuevos sin gestionar', defaultW: 6, defaultH: 4, category: 'list'  },
  { type: 'list_trackings',       label: 'Seguimientos urgentes',    emoji: '⚠️', description: 'Seguimientos de alta prioridad',defaultW: 6, defaultH: 4, category: 'list'  },
  { type: 'chart_monthly_revenue',label: 'Ingresos últimos 6 meses', emoji: '📊', description: 'Gráfico de barras mensual',     defaultW: 8, defaultH: 4, category: 'chart' },
  { type: 'chart_vehicles_status',label: 'Estado del stock',         emoji: '🍩', description: 'Distribución por estado',       defaultW: 4, defaultH: 4, category: 'chart' },
  { type: 'chart_sales_by_seller',label: 'Ventas por vendedor',      emoji: '👤', description: 'Ranking de vendedores',         defaultW: 6, defaultH: 4, category: 'chart' },
]

// ─── Default layout ───────────────────────────────────────────────────────────

export function getDefaultLayout(): DashboardLayout {
  return {
    widgets: [
      { i: 'dw-1',  type: 'stat_vehicles',         x: 0,  y: 0,  w: 3,  h: 2 },
      { i: 'dw-2',  type: 'stat_clients',           x: 3,  y: 0,  w: 3,  h: 2 },
      { i: 'dw-3',  type: 'stat_appointments',      x: 6,  y: 0,  w: 3,  h: 2 },
      { i: 'dw-4',  type: 'stat_revenue',           x: 9,  y: 0,  w: 3,  h: 2 },
      { i: 'dw-5',  type: 'list_appointments',      x: 0,  y: 2,  w: 6,  h: 4 },
      { i: 'dw-6',  type: 'list_recent_sales',      x: 6,  y: 2,  w: 6,  h: 4 },
      { i: 'dw-7',  type: 'chart_monthly_revenue',  x: 0,  y: 6,  w: 8,  h: 4 },
      { i: 'dw-8',  type: 'chart_vehicles_status',  x: 8,  y: 6,  w: 4,  h: 4 },
    ],
  }
}

// ─── Persistence ──────────────────────────────────────────────────────────────

const LS_KEY = 'dealerhub_dashboard_layout'

export function loadLayout(): DashboardLayout {
  if (typeof window === 'undefined') return getDefaultLayout()
  try {
    const stored = localStorage.getItem(LS_KEY)
    if (stored) return JSON.parse(stored) as DashboardLayout
  } catch { /* ignore */ }
  return getDefaultLayout()
}

export function saveLayout(layout: DashboardLayout): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(layout))
  } catch { /* ignore */ }
}

export function resetLayout(): void {
  try {
    localStorage.removeItem(LS_KEY)
  } catch { /* ignore */ }
}
