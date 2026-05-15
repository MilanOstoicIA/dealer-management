// ─── Roles de usuario ────────────────────────────────────────────────────────

export type UserRole = "admin" | "vendedor" | "mecanico" | "recepcionista" | "viewer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  customRoleId?: string;   // si está definido, usa permisos del CustomRole
  avatarUrl?: string;
  phone?: string;
  createdAt: string;
}

// ─── Roles personalizados ─────────────────────────────────────────────────────

export interface RolePermissions {
  // Vista de módulos
  view_vehiculos: boolean;
  view_clientes: boolean;
  view_citas: boolean;
  view_ventas: boolean;
  view_facturacion: boolean;
  view_contabilidad: boolean;
  view_equipo: boolean;
  view_foro: boolean;
  view_proveedores: boolean;
  view_seguimientos: boolean;
  view_publicacion: boolean;
  view_configuracion: boolean;
  view_whatsapp: boolean;
  view_productos: boolean;
  // Edición
  edit_vehiculos: boolean;
  edit_clientes: boolean;
  edit_citas: boolean;
  edit_ventas: boolean;
  edit_facturacion: boolean;
  edit_contabilidad: boolean;
  edit_equipo: boolean;
  edit_proveedores: boolean;
  edit_seguimientos: boolean;
  edit_productos: boolean;
  // Especiales
  dashboard_editor: boolean;
  export_data: boolean;
}

export interface CustomRole {
  id: string;
  name: string;
  description?: string;
  color: string;         // hex color (ej: "#3b82f6")
  permissions: RolePermissions;
  createdAt: string;
}

export const DEFAULT_PERMISSIONS: RolePermissions = {
  view_vehiculos: false, view_clientes: false, view_citas: false, view_ventas: false,
  view_facturacion: false, view_contabilidad: false, view_equipo: false, view_foro: false,
  view_proveedores: false, view_seguimientos: false, view_publicacion: false, view_configuracion: false,
  view_whatsapp: false, view_productos: false,
  edit_vehiculos: false, edit_clientes: false, edit_citas: false, edit_ventas: false,
  edit_facturacion: false, edit_contabilidad: false, edit_equipo: false, edit_proveedores: false,
  edit_seguimientos: false, edit_productos: false,
  dashboard_editor: false, export_data: false,
};

// ─── Vehículos ────────────────────────────────────────────────────────────────

export type VehicleStatus = "disponible" | "reservado" | "vendido" | "en_taller";
export type FuelType = "gasolina" | "diesel" | "híbrido" | "eléctrico";
export type TransmissionType = "manual" | "automático";

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  vin: string;
  mileage: number;         // km
  purchasePrice: number;   // EUR — lo que pagamos nosotros
  price: number;           // EUR — precio de venta al público
  fuelType: FuelType;
  transmission: TransmissionType;
  status: VehicleStatus;
  description?: string;
  images: string[];        // URLs de galería de fotos
  createdAt: string;
}

// ─── Gastos ──────────────────────────────────────────────────────────────────

export type ExpenseCategory =
  | "compra_vehiculo"
  | "reparacion"
  | "pieza"
  | "nomina"
  | "alquiler"
  | "publicidad"
  | "seguro"
  | "impuesto"
  | "otro";

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;          // EUR
  date: string;
  vehicleId?: string;      // si el gasto es de un vehículo concreto
  notes?: string;
}

// ─── Foro compra-venta ──────────────────────────────────────────────────────

export type ForumPostStatus = "nuevo" | "contactado" | "comprado" | "descartado";

export interface ForumPost {
  id: string;
  authorName: string;
  authorPhone: string;
  authorEmail?: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number;
  vehicleMileage: number;
  askingPrice: number;
  description: string;
  images: string[];
  status: ForumPostStatus;
  createdAt: string;
  notes?: string;
}

// ─── Clientes ─────────────────────────────────────────────────────────────────

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  dni: string;
  address: string;
  city: string;
  postalCode: string;
  notes?: string;
  createdAt: string;
}

// ─── Citas de taller ─────────────────────────────────────────────────────────

export type AppointmentStatus = "pendiente" | "en_progreso" | "completada" | "cancelada";
export type ServiceType =
  | "revision_general"
  | "cambio_aceite"
  | "frenos"
  | "neumaticos"
  | "aire_acondicionado"
  | "carroceria"
  | "diagnostico"
  | "otro";

export interface WorkItem {
  description: string;     // Qué se hizo (ej: "Cambio pastillas de freno delanteras")
  parts?: string;          // Piezas usadas (ej: "Pastillas Brembo P06076")
  cost: number;            // EUR
}

export interface Appointment {
  id: string;
  clientId: string;
  vehicleId: string;
  mechanicId: string;
  date: string;            // ISO date string
  serviceType: ServiceType;
  status: AppointmentStatus;
  description: string;
  estimatedCost: number;   // EUR
  finalCost?: number;      // EUR
  notes?: string;
  // --- Campos de cierre (mecánico rellena al completar) ---
  workItems?: WorkItem[];          // Lista de trabajos realizados
  workPhotos?: string[];           // Fotos del trabajo (obligatorio para cerrar)
  mileageAtService?: number;       // Km del coche al entrar al taller
  closedAt?: string;               // Fecha/hora de cierre
  mechanicNotes?: string;          // Notas del mecánico sobre el estado del vehículo
}

// ─── Seguimiento de vehículo (ficha de mantenimiento) ──────────────────────

export interface VehicleServiceRecord {
  id: string;
  vehicleId: string;
  appointmentId: string;
  mechanicId: string;
  date: string;
  serviceType: ServiceType;
  mileage: number;          // km al momento del servicio
  workItems: WorkItem[];
  photos: string[];
  notes?: string;
}

// ─── Ficha de cliente con seguimiento ──────────────────────────────────────

export interface ClientVehicleInfo {
  vehicleId: string;
  lastServiceDate?: string;
  lastMileage?: number;
  nextOilChangeKm?: number;       // próximo cambio de aceite
  nextTireChangeKm?: number;      // próximo cambio de neumáticos
  nextRevisionDate?: string;      // próxima revisión ITV/general
  notes?: string;
}

// ─── Ventas ───────────────────────────────────────────────────────────────────

export type PaymentMethod = "contado" | "financiación" | "leasing";
export type SaleStatus = "en_proceso" | "completada" | "cancelada";
export type TaxRegime = "iva_general" | "rebu";

export interface Sale {
  id: string;
  vehicleId: string;
  clientId: string;
  sellerId: string;
  saleDate: string;        // ISO date string
  salePrice: number;       // EUR
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  taxRegime: TaxRegime;    // régimen fiscal (REBU por defecto para usados)
  commissionRate: number;  // porcentaje (ej: 3 = 3%)
  commission: number;      // EUR (calculado)
  discount?: number;       // EUR descuento aplicado
  tradeInVehicleId?: string; // vehículo entregado como parte de pago
  tradeInValue?: number;   // EUR valor del vehículo de intercambio
  financingDetails?: string; // detalles de financiación
  notes?: string;
}

// ─── Facturas ─────────────────────────────────────────────────────────────────

export type InvoiceStatus = "emitida" | "pagada" | "pendiente" | "anulada";
export type VeriFactuStatus = "pending" | "hashed" | "sent" | "accepted" | "rejected";

export interface Invoice {
  id: string;
  invoiceNumber: string;   // ej: "FAC-2026-0001"
  saleId: string;
  clientId: string;
  clientName: string;
  clientDni: string;
  concept: string;         // descripción del vehículo vendido
  taxRegime: TaxRegime;
  subtotal: number;        // base imponible
  ivaRate: number | null;  // 21 para IVA General, null para REBU
  ivaAmount: number;       // cuota IVA (en REBU es el IVA implícito del margen)
  total: number;           // importe total
  purchasePrice: number | null; // precio de compra (para cálculo REBU)
  status: InvoiceStatus;
  issuedDate: string;      // ISO date
  notes?: string;
  // VeriFactu fields
  hash?: string;            // SHA-256 hash of this invoice
  previousHash?: string;    // hash of the previous invoice in the chain
  verifactuStatus?: VeriFactuStatus; // status of VeriFactu submission
  createdAt: string;
}

// ─── Vistas enriquecidas (con relaciones resueltas) ───────────────────────────

export interface AppointmentWithRelations extends Appointment {
  client: Client;
  vehicle: Vehicle;
  mechanic: User;
}

export interface SaleWithRelations extends Sale {
  vehicle: Vehicle;
  client: Client;
  seller: User;
}

// ─── Seguimientos (tracking) ─────────────────────────────────────────────────

export type TrackingCategory =
  | "pedido_piezas"
  | "documentacion"
  | "matriculacion"
  | "transferencia"
  | "itv"
  | "seguro"
  | "financiacion"
  | "otro";

export type TrackingStatus = "pendiente" | "en_progreso" | "completado" | "cancelado";
export type TrackingPriority = "baja" | "media" | "alta" | "urgente";

export interface Tracking {
  id: string;
  category: TrackingCategory;
  title: string;
  description?: string;
  status: TrackingStatus;
  priority: TrackingPriority;
  vehicleId?: string;
  clientId?: string;
  saleId?: string;
  assignedTo?: string;       // userId
  dueDate?: string;          // ISO date
  completedAt?: string;
  notes?: string;
  supplierId?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Proveedores (suppliers) ─────────────────────────────────────────────────

export type SupplierCategory =
  | "recambios"
  | "gestoria"
  | "trafico"
  | "seguro"
  | "financiera"
  | "transporte"
  | "otro";

export interface Supplier {
  id: string;
  name: string;
  category: SupplierCategory;
  email?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  contactPerson?: string;
  address?: string;
  notes?: string;
  active: boolean;
  createdAt: string;
}

// ─── Historial de seguimientos ──────────────────────────────────────────────

export interface TrackingHistoryEntry {
  id: string;
  trackingId: string;
  oldStatus?: string;
  newStatus: string;
  changedBy?: string;
  note?: string;
  createdAt: string;
}

// ─── Dashboard stats ──────────────────────────────────────────────────────────

export interface DashboardStats {
  totalVehicles: number;
  availableVehicles: number;
  vehiclesSold: number;
  totalClients: number;
  pendingAppointments: number;
  monthlySalesRevenue: number;
  monthlyCommissions: number;
}

// ─── WhatsApp Business ────────────────────────────────────────────────────────

export interface WhatsAppContact {
  id: string;
  phone: string;            // E.164 format, ej: "34612345678"
  name: string;
  clientId?: string;        // vinculado a cliente si coincide phone
  lastMessage?: string;
  lastMessageAt?: string;   // ISO date
  unreadCount: number;
  createdAt: string;
}

export interface WhatsAppMessage {
  id: string;
  contactId: string;
  direction: "in" | "out";
  body: string;
  mediaUrl?: string;
  sentAt: string;           // ISO date
  status: "sent" | "delivered" | "read" | "failed";
}

// ─── Catálogo de productos y servicios ───────────────────────────────────────

export type ProductCategory = "servicio" | "pieza" | "consumible";
export type ProductUnit = "unidad" | "hora" | "servicio" | "litro" | "kg" | "metro";

export interface Product {
  id: string;
  name: string;
  description?: string;
  category: ProductCategory;
  price: number;        // EUR — precio de venta
  cost: number;         // EUR — coste para el taller
  unit: ProductUnit;
  taxRate: number;      // % IVA (21 por defecto)
  sku?: string;
  stock?: number | null;     // null = sin control de stock (servicios)
  minStock?: number | null;  // aviso de stock mínimo
  active: boolean;
  createdAt: string;
}
