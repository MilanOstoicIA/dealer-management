// ─── Roles de usuario ────────────────────────────────────────────────────────

export type UserRole = "admin" | "vendedor" | "mecanico" | "recepcionista";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  createdAt: string;
}

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

export interface Sale {
  id: string;
  vehicleId: string;
  clientId: string;
  sellerId: string;
  saleDate: string;        // ISO date string
  salePrice: number;       // EUR
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  commissionRate: number;  // porcentaje (ej: 3 = 3%)
  commission: number;      // EUR (calculado)
  discount?: number;       // EUR descuento aplicado
  tradeInVehicleId?: string; // vehículo entregado como parte de pago
  tradeInValue?: number;   // EUR valor del vehículo de intercambio
  financingDetails?: string; // detalles de financiación
  notes?: string;
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
