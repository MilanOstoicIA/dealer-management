import { supabase } from "./supabase"
import type {
  Vehicle, Client, Sale, Appointment, Expense, User, ForumPost,
  VehicleServiceRecord, ClientVehicleInfo, WorkItem, Tracking,
  Supplier, TrackingHistoryEntry, Invoice,
} from "@/types"

// ─── Helpers: snake_case <-> camelCase mappers ─────────────────────────────

function vehicleFromRow(r: Record<string, unknown>): Vehicle {
  return {
    id: r.id as string,
    brand: r.brand as string,
    model: r.model as string,
    year: r.year as number,
    color: (r.color as string) || "",
    licensePlate: (r.license_plate as string) || "",
    vin: (r.vin as string) || "",
    mileage: r.mileage as number,
    purchasePrice: Number(r.purchase_price),
    price: Number(r.price),
    fuelType: r.fuel_type as Vehicle["fuelType"],
    transmission: r.transmission as Vehicle["transmission"],
    status: r.status as Vehicle["status"],
    description: (r.description as string) || undefined,
    images: (r.images as string[]) || [],
    createdAt: r.created_at as string,
  }
}

function vehicleToRow(v: Partial<Vehicle>): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if (v.brand !== undefined) row.brand = v.brand
  if (v.model !== undefined) row.model = v.model
  if (v.year !== undefined) row.year = v.year
  if (v.color !== undefined) row.color = v.color
  if (v.licensePlate !== undefined) row.license_plate = v.licensePlate
  if (v.vin !== undefined) row.vin = v.vin
  if (v.mileage !== undefined) row.mileage = v.mileage
  if (v.purchasePrice !== undefined) row.purchase_price = v.purchasePrice
  if (v.price !== undefined) row.price = v.price
  if (v.fuelType !== undefined) row.fuel_type = v.fuelType
  if (v.transmission !== undefined) row.transmission = v.transmission
  if (v.status !== undefined) row.status = v.status
  if (v.description !== undefined) row.description = v.description
  if (v.images !== undefined) row.images = v.images
  if (v.createdAt !== undefined) row.created_at = v.createdAt
  return row
}

function clientFromRow(r: Record<string, unknown>): Client {
  return {
    id: r.id as string,
    name: r.name as string,
    email: (r.email as string) || "",
    phone: r.phone as string,
    dni: (r.dni as string) || "",
    address: (r.address as string) || "",
    city: (r.city as string) || "",
    postalCode: (r.postal_code as string) || "",
    notes: (r.notes as string) || undefined,
    createdAt: r.created_at as string,
  }
}

function clientToRow(c: Partial<Client>): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if (c.name !== undefined) row.name = c.name
  if (c.email !== undefined) row.email = c.email
  if (c.phone !== undefined) row.phone = c.phone
  if (c.dni !== undefined) row.dni = c.dni
  if (c.address !== undefined) row.address = c.address
  if (c.city !== undefined) row.city = c.city
  if (c.postalCode !== undefined) row.postal_code = c.postalCode
  if (c.notes !== undefined) row.notes = c.notes
  if (c.createdAt !== undefined) row.created_at = c.createdAt
  return row
}

function userFromRow(r: Record<string, unknown>): User {
  return {
    id: r.id as string,
    name: r.name as string,
    email: r.email as string,
    role: r.role as User["role"],
    avatarUrl: (r.avatar_url as string) || undefined,
    phone: (r.phone as string) || undefined,
    createdAt: r.created_at as string,
  }
}

function saleFromRow(r: Record<string, unknown>): Sale {
  return {
    id: r.id as string,
    vehicleId: r.vehicle_id as string,
    clientId: r.client_id as string,
    sellerId: r.seller_id as string,
    saleDate: r.sale_date as string,
    salePrice: Number(r.sale_price),
    paymentMethod: r.payment_method as Sale["paymentMethod"],
    status: r.status as Sale["status"],
    taxRegime: (r.tax_regime as Sale["taxRegime"]) || "rebu",
    commissionRate: Number(r.commission_rate),
    commission: Number(r.commission),
    discount: r.discount ? Number(r.discount) : undefined,
    tradeInVehicleId: (r.trade_in_vehicle_id as string) || undefined,
    tradeInValue: r.trade_in_value ? Number(r.trade_in_value) : undefined,
    financingDetails: (r.financing_details as string) || undefined,
    notes: (r.notes as string) || undefined,
  }
}

function saleToRow(s: Partial<Sale>): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if (s.vehicleId !== undefined) row.vehicle_id = s.vehicleId
  if (s.clientId !== undefined) row.client_id = s.clientId
  if (s.sellerId !== undefined) row.seller_id = s.sellerId
  if (s.saleDate !== undefined) row.sale_date = s.saleDate
  if (s.salePrice !== undefined) row.sale_price = s.salePrice
  if (s.paymentMethod !== undefined) row.payment_method = s.paymentMethod
  if (s.status !== undefined) row.status = s.status
  if (s.commissionRate !== undefined) row.commission_rate = s.commissionRate
  if (s.commission !== undefined) row.commission = s.commission
  if (s.discount !== undefined) row.discount = s.discount
  if (s.tradeInVehicleId !== undefined) row.trade_in_vehicle_id = s.tradeInVehicleId
  if (s.tradeInValue !== undefined) row.trade_in_value = s.tradeInValue
  if (s.taxRegime !== undefined) row.tax_regime = s.taxRegime
  if (s.financingDetails !== undefined) row.financing_details = s.financingDetails
  if (s.notes !== undefined) row.notes = s.notes
  return row
}

// ─── Invoice mappers ─────────────────────────────────────────────────────────

function invoiceFromRow(r: Record<string, unknown>): Invoice {
  return {
    id: r.id as string,
    invoiceNumber: r.invoice_number as string,
    saleId: r.sale_id as string,
    clientId: r.client_id as string,
    clientName: r.client_name as string,
    clientDni: (r.client_dni as string) || "",
    concept: r.concept as string,
    taxRegime: (r.tax_regime as Invoice["taxRegime"]) || "rebu",
    subtotal: Number(r.subtotal),
    ivaRate: r.iva_rate != null ? Number(r.iva_rate) : null,
    ivaAmount: Number(r.iva_amount),
    total: Number(r.total),
    purchasePrice: r.purchase_price != null ? Number(r.purchase_price) : null,
    status: (r.status as Invoice["status"]) || "emitida",
    issuedDate: r.issued_date as string,
    notes: (r.notes as string) || undefined,
    createdAt: r.created_at as string,
  }
}

function invoiceToRow(inv: Partial<Invoice>): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if (inv.id !== undefined) row.id = inv.id
  if (inv.invoiceNumber !== undefined) row.invoice_number = inv.invoiceNumber
  if (inv.saleId !== undefined) row.sale_id = inv.saleId
  if (inv.clientId !== undefined) row.client_id = inv.clientId
  if (inv.clientName !== undefined) row.client_name = inv.clientName
  if (inv.clientDni !== undefined) row.client_dni = inv.clientDni
  if (inv.concept !== undefined) row.concept = inv.concept
  if (inv.taxRegime !== undefined) row.tax_regime = inv.taxRegime
  if (inv.subtotal !== undefined) row.subtotal = inv.subtotal
  if (inv.ivaRate !== undefined) row.iva_rate = inv.ivaRate
  if (inv.ivaAmount !== undefined) row.iva_amount = inv.ivaAmount
  if (inv.total !== undefined) row.total = inv.total
  if (inv.purchasePrice !== undefined) row.purchase_price = inv.purchasePrice
  if (inv.status !== undefined) row.status = inv.status
  if (inv.issuedDate !== undefined) row.issued_date = inv.issuedDate
  if (inv.notes !== undefined) row.notes = inv.notes
  return row
}

function appointmentFromRow(r: Record<string, unknown>): Appointment {
  return {
    id: r.id as string,
    clientId: r.client_id as string,
    vehicleId: r.vehicle_id as string,
    mechanicId: r.mechanic_id as string,
    date: r.date as string,
    serviceType: r.service_type as Appointment["serviceType"],
    status: r.status as Appointment["status"],
    description: (r.description as string) || "",
    estimatedCost: Number(r.estimated_cost),
    finalCost: r.final_cost ? Number(r.final_cost) : undefined,
    notes: (r.notes as string) || undefined,
    workItems: (r.work_items as WorkItem[]) || [],
    workPhotos: (r.work_photos as string[]) || [],
    mileageAtService: r.mileage_at_service as number | undefined,
    closedAt: (r.closed_at as string) || undefined,
    mechanicNotes: (r.mechanic_notes as string) || undefined,
  }
}

function appointmentToRow(a: Partial<Appointment>): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if (a.clientId !== undefined) row.client_id = a.clientId
  if (a.vehicleId !== undefined) row.vehicle_id = a.vehicleId
  if (a.mechanicId !== undefined) row.mechanic_id = a.mechanicId
  if (a.date !== undefined) row.date = a.date
  if (a.serviceType !== undefined) row.service_type = a.serviceType
  if (a.status !== undefined) row.status = a.status
  if (a.description !== undefined) row.description = a.description
  if (a.estimatedCost !== undefined) row.estimated_cost = a.estimatedCost
  if (a.finalCost !== undefined) row.final_cost = a.finalCost
  if (a.notes !== undefined) row.notes = a.notes
  if (a.workItems !== undefined) row.work_items = a.workItems
  if (a.workPhotos !== undefined) row.work_photos = a.workPhotos
  if (a.mileageAtService !== undefined) row.mileage_at_service = a.mileageAtService
  if (a.closedAt !== undefined) row.closed_at = a.closedAt
  if (a.mechanicNotes !== undefined) row.mechanic_notes = a.mechanicNotes
  return row
}

function expenseFromRow(r: Record<string, unknown>): Expense {
  return {
    id: r.id as string,
    category: r.category as Expense["category"],
    description: r.description as string,
    amount: Number(r.amount),
    date: r.date as string,
    vehicleId: (r.vehicle_id as string) || undefined,
    notes: (r.notes as string) || undefined,
  }
}

function forumPostFromRow(r: Record<string, unknown>): ForumPost {
  return {
    id: r.id as string,
    authorName: r.author_name as string,
    authorPhone: r.author_phone as string,
    authorEmail: (r.author_email as string) || undefined,
    vehicleBrand: r.vehicle_brand as string,
    vehicleModel: r.vehicle_model as string,
    vehicleYear: r.vehicle_year as number,
    vehicleMileage: r.vehicle_mileage as number,
    askingPrice: Number(r.asking_price),
    description: (r.description as string) || "",
    images: (r.images as string[]) || [],
    status: r.status as ForumPost["status"],
    notes: (r.notes as string) || undefined,
    createdAt: r.created_at as string,
  }
}

function serviceRecordFromRow(r: Record<string, unknown>): VehicleServiceRecord {
  return {
    id: r.id as string,
    vehicleId: r.vehicle_id as string,
    appointmentId: r.appointment_id as string,
    mechanicId: r.mechanic_id as string,
    date: r.date as string,
    serviceType: r.service_type as VehicleServiceRecord["serviceType"],
    mileage: r.mileage as number,
    workItems: (r.work_items as WorkItem[]) || [],
    photos: (r.photos as string[]) || [],
    notes: (r.notes as string) || undefined,
  }
}

function clientVehicleInfoFromRow(r: Record<string, unknown>): ClientVehicleInfo {
  return {
    vehicleId: r.vehicle_id as string,
    lastServiceDate: (r.last_service_date as string) || undefined,
    lastMileage: r.last_mileage as number | undefined,
    nextOilChangeKm: r.next_oil_change_km as number | undefined,
    nextTireChangeKm: r.next_tire_change_km as number | undefined,
    nextRevisionDate: (r.next_revision_date as string) || undefined,
    notes: (r.notes as string) || undefined,
  }
}

function supplierFromRow(r: Record<string, unknown>): Supplier {
  return {
    id: r.id as string,
    name: r.name as string,
    category: r.category as Supplier["category"],
    email: (r.email as string) || undefined,
    phone: (r.phone as string) || undefined,
    whatsapp: (r.whatsapp as string) || undefined,
    website: (r.website as string) || undefined,
    contactPerson: (r.contact_person as string) || undefined,
    address: (r.address as string) || undefined,
    notes: (r.notes as string) || undefined,
    active: r.active as boolean,
    createdAt: r.created_at as string,
  }
}

function trackingHistoryFromRow(r: Record<string, unknown>): TrackingHistoryEntry {
  return {
    id: r.id as string,
    trackingId: r.tracking_id as string,
    oldStatus: (r.old_status as string) || undefined,
    newStatus: r.new_status as string,
    changedBy: (r.changed_by as string) || undefined,
    note: (r.note as string) || undefined,
    createdAt: r.created_at as string,
  }
}

// ─── Fetch all data ────────────────────────────────────────────────────────

export interface SupabaseState {
  vehicles: Vehicle[]
  clients: Client[]
  sales: Sale[]
  appointments: Appointment[]
  expenses: Expense[]
  users: User[]
  forumPosts: ForumPost[]
  serviceRecords: VehicleServiceRecord[]
  clientVehicleInfo: ClientVehicleInfo[]
  trackings: Tracking[]
  suppliers: Supplier[]
  invoices: Invoice[]
}

export async function fetchAllData(): Promise<SupabaseState> {
  const [
    { data: usersData },
    { data: vehiclesData },
    { data: clientsData },
    { data: salesData },
    { data: appointmentsData },
    { data: expensesData },
    { data: forumPostsData },
    { data: serviceRecordsData },
    { data: clientVehicleInfoData },
    { data: trackingsData },
    { data: suppliersData },
    { data: invoicesData },
  ] = await Promise.all([
    supabase.from("users").select("*"),
    supabase.from("vehicles").select("*"),
    supabase.from("clients").select("*"),
    supabase.from("sales").select("*"),
    supabase.from("appointments").select("*"),
    supabase.from("expenses").select("*"),
    supabase.from("forum_posts").select("*"),
    supabase.from("service_records").select("*"),
    supabase.from("client_vehicle_info").select("*"),
    supabase.from("trackings").select("*"),
    supabase.from("suppliers").select("*"),
    supabase.from("invoices").select("*").order("issued_date", { ascending: false }),
  ])

  return {
    users: (usersData || []).map(userFromRow),
    vehicles: (vehiclesData || []).map(vehicleFromRow),
    clients: (clientsData || []).map(clientFromRow),
    sales: (salesData || []).map(saleFromRow),
    appointments: (appointmentsData || []).map(appointmentFromRow),
    expenses: (expensesData || []).map(expenseFromRow),
    forumPosts: (forumPostsData || []).map(forumPostFromRow),
    serviceRecords: (serviceRecordsData || []).map(serviceRecordFromRow),
    clientVehicleInfo: (clientVehicleInfoData || []).map(clientVehicleInfoFromRow),
    trackings: (trackingsData || []).map(trackingFromRow),
    suppliers: (suppliersData || []).map(supplierFromRow),
    invoices: (invoicesData || []).map(invoiceFromRow),
  }
}

// ─── CRUD operations ──────────────────────────────────────────────────────

// Vehicles
export async function dbAddVehicle(v: Omit<Vehicle, "id" | "createdAt">) {
  const { data, error } = await supabase.from("vehicles").insert(vehicleToRow(v)).select().single()
  if (error) throw error
  return vehicleFromRow(data)
}

export async function dbUpdateVehicle(id: string, updates: Partial<Vehicle>) {
  const { error } = await supabase.from("vehicles").update(vehicleToRow(updates)).eq("id", id)
  if (error) throw error
}

export async function dbDeleteVehicle(id: string) {
  const { error } = await supabase.from("vehicles").delete().eq("id", id)
  if (error) throw error
}

// Clients
export async function dbAddClient(c: Omit<Client, "id" | "createdAt">) {
  const { data, error } = await supabase.from("clients").insert(clientToRow(c)).select().single()
  if (error) throw error
  return clientFromRow(data)
}

export async function dbUpdateClient(id: string, updates: Partial<Client>) {
  const { error } = await supabase.from("clients").update(clientToRow(updates)).eq("id", id)
  if (error) throw error
}

export async function dbDeleteClient(id: string) {
  const { error } = await supabase.from("clients").delete().eq("id", id)
  if (error) throw error
}

// Sales
export async function dbAddSale(s: Sale) {
  const { data, error } = await supabase.from("sales").insert(saleToRow(s)).select().single()
  if (error) throw error
  return saleFromRow(data)
}

export async function dbUpdateSale(id: string, updates: Partial<Sale>) {
  const { error } = await supabase.from("sales").update(saleToRow(updates)).eq("id", id)
  if (error) throw error
}

// Appointments
export async function dbAddAppointment(a: Appointment) {
  const { data, error } = await supabase.from("appointments").insert(appointmentToRow(a)).select().single()
  if (error) throw error
  return appointmentFromRow(data)
}

export async function dbUpdateAppointment(id: string, updates: Partial<Appointment>) {
  const { error } = await supabase.from("appointments").update(appointmentToRow(updates)).eq("id", id)
  if (error) throw error
}

// Expenses
export async function dbAddExpense(e: Expense) {
  const row: Record<string, unknown> = {
    id: e.id, category: e.category, description: e.description,
    amount: e.amount, date: e.date, vehicle_id: e.vehicleId || null, notes: e.notes || null,
  }
  const { error } = await supabase.from("expenses").insert(row)
  if (error) throw error
}

export async function dbDeleteExpense(id: string) {
  const { error } = await supabase.from("expenses").delete().eq("id", id)
  if (error) throw error
}

// Service records
export async function dbAddServiceRecord(sr: VehicleServiceRecord) {
  const row: Record<string, unknown> = {
    id: sr.id, vehicle_id: sr.vehicleId, appointment_id: sr.appointmentId,
    mechanic_id: sr.mechanicId, date: sr.date, service_type: sr.serviceType,
    mileage: sr.mileage, work_items: sr.workItems, photos: sr.photos, notes: sr.notes || null,
  }
  const { error } = await supabase.from("service_records").insert(row)
  if (error) throw error
}

// Client vehicle info
export async function dbSetClientVehicleInfo(cvi: ClientVehicleInfo) {
  const row: Record<string, unknown> = {
    vehicle_id: cvi.vehicleId, last_service_date: cvi.lastServiceDate || null,
    last_mileage: cvi.lastMileage || null, next_oil_change_km: cvi.nextOilChangeKm || null,
    next_tire_change_km: cvi.nextTireChangeKm || null, next_revision_date: cvi.nextRevisionDate || null,
    notes: cvi.notes || null,
  }
  const { error } = await supabase.from("client_vehicle_info").upsert(row, { onConflict: "vehicle_id" })
  if (error) throw error
}

// Users
export async function dbAddUser(u: User) {
  const row: Record<string, unknown> = {
    id: u.id, name: u.name, email: u.email, role: u.role,
    avatar_url: u.avatarUrl || null, phone: u.phone || null,
    password_hash: "1234", created_at: u.createdAt,
  }
  const { error } = await supabase.from("users").insert(row)
  if (error) throw error
}

export async function dbUpdateUser(id: string, updates: Partial<User>) {
  const row: Record<string, unknown> = {}
  if (updates.name !== undefined) row.name = updates.name
  if (updates.email !== undefined) row.email = updates.email
  if (updates.role !== undefined) row.role = updates.role
  if (updates.phone !== undefined) row.phone = updates.phone
  if (updates.avatarUrl !== undefined) row.avatar_url = updates.avatarUrl
  const { error } = await supabase.from("users").update(row).eq("id", id)
  if (error) throw error
}

// Forum
export async function dbAddForumPost(p: ForumPost) {
  const row: Record<string, unknown> = {
    id: p.id, author_name: p.authorName, author_phone: p.authorPhone,
    author_email: p.authorEmail || null, vehicle_brand: p.vehicleBrand,
    vehicle_model: p.vehicleModel, vehicle_year: p.vehicleYear,
    vehicle_mileage: p.vehicleMileage, asking_price: p.askingPrice,
    description: p.description, images: p.images, status: p.status,
    notes: p.notes || null, created_at: p.createdAt,
  }
  const { error } = await supabase.from("forum_posts").insert(row)
  if (error) throw error
}

export async function dbUpdateForumPost(id: string, updates: Partial<ForumPost>) {
  const row: Record<string, unknown> = {}
  if (updates.status !== undefined) row.status = updates.status
  if (updates.notes !== undefined) row.notes = updates.notes
  if (updates.images !== undefined) row.images = updates.images
  const { error } = await supabase.from("forum_posts").update(row).eq("id", id)
  if (error) throw error
}

// Trackings
function trackingFromRow(r: Record<string, unknown>): Tracking {
  return {
    id: r.id as string,
    category: r.category as Tracking["category"],
    title: r.title as string,
    description: (r.description as string) || undefined,
    status: r.status as Tracking["status"],
    priority: r.priority as Tracking["priority"],
    vehicleId: (r.vehicle_id as string) || undefined,
    clientId: (r.client_id as string) || undefined,
    saleId: (r.sale_id as string) || undefined,
    assignedTo: (r.assigned_to as string) || undefined,
    dueDate: (r.due_date as string) || undefined,
    completedAt: (r.completed_at as string) || undefined,
    notes: (r.notes as string) || undefined,
    supplierId: (r.supplier_id as string) || undefined,
    trackingNumber: (r.tracking_number as string) || undefined,
    estimatedDelivery: (r.estimated_delivery as string) || undefined,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  }
}

export async function dbAddTracking(t: Tracking) {
  const row: Record<string, unknown> = {
    id: t.id, category: t.category, title: t.title,
    description: t.description || null, status: t.status, priority: t.priority,
    vehicle_id: t.vehicleId || null, client_id: t.clientId || null,
    sale_id: t.saleId || null, assigned_to: t.assignedTo || null,
    due_date: t.dueDate || null, completed_at: t.completedAt || null,
    notes: t.notes || null, supplier_id: t.supplierId || null,
    tracking_number: t.trackingNumber || null, estimated_delivery: t.estimatedDelivery || null,
    created_at: t.createdAt, updated_at: t.updatedAt,
  }
  const { error } = await supabase.from("trackings").insert(row)
  if (error) throw error
}

export async function dbUpdateTracking(id: string, updates: Partial<Tracking>) {
  const row: Record<string, unknown> = {}
  if (updates.category !== undefined) row.category = updates.category
  if (updates.title !== undefined) row.title = updates.title
  if (updates.description !== undefined) row.description = updates.description
  if (updates.status !== undefined) row.status = updates.status
  if (updates.priority !== undefined) row.priority = updates.priority
  if (updates.vehicleId !== undefined) row.vehicle_id = updates.vehicleId
  if (updates.clientId !== undefined) row.client_id = updates.clientId
  if (updates.saleId !== undefined) row.sale_id = updates.saleId
  if (updates.assignedTo !== undefined) row.assigned_to = updates.assignedTo
  if (updates.dueDate !== undefined) row.due_date = updates.dueDate
  if (updates.completedAt !== undefined) row.completed_at = updates.completedAt
  if (updates.notes !== undefined) row.notes = updates.notes
  if (updates.supplierId !== undefined) row.supplier_id = updates.supplierId
  if (updates.trackingNumber !== undefined) row.tracking_number = updates.trackingNumber
  if (updates.estimatedDelivery !== undefined) row.estimated_delivery = updates.estimatedDelivery
  if (updates.updatedAt !== undefined) row.updated_at = updates.updatedAt
  const { error } = await supabase.from("trackings").update(row).eq("id", id)
  if (error) throw error
}

export async function dbDeleteTracking(id: string) {
  const { error } = await supabase.from("trackings").delete().eq("id", id)
  if (error) throw error
}

// Suppliers
export async function dbAddSupplier(s: Supplier) {
  const row: Record<string, unknown> = {
    id: s.id, name: s.name, category: s.category,
    email: s.email || null, phone: s.phone || null,
    whatsapp: s.whatsapp || null, website: s.website || null,
    contact_person: s.contactPerson || null, address: s.address || null,
    notes: s.notes || null, active: s.active, created_at: s.createdAt,
  }
  const { error } = await supabase.from("suppliers").insert(row)
  if (error) throw error
}

export async function dbUpdateSupplier(id: string, updates: Partial<Supplier>) {
  const row: Record<string, unknown> = {}
  if (updates.name !== undefined) row.name = updates.name
  if (updates.category !== undefined) row.category = updates.category
  if (updates.email !== undefined) row.email = updates.email
  if (updates.phone !== undefined) row.phone = updates.phone
  if (updates.whatsapp !== undefined) row.whatsapp = updates.whatsapp
  if (updates.website !== undefined) row.website = updates.website
  if (updates.contactPerson !== undefined) row.contact_person = updates.contactPerson
  if (updates.address !== undefined) row.address = updates.address
  if (updates.notes !== undefined) row.notes = updates.notes
  if (updates.active !== undefined) row.active = updates.active
  const { error } = await supabase.from("suppliers").update(row).eq("id", id)
  if (error) throw error
}

export async function dbDeleteSupplier(id: string) {
  const { error } = await supabase.from("suppliers").delete().eq("id", id)
  if (error) throw error
}

// Tracking history
export async function dbAddTrackingHistory(entry: TrackingHistoryEntry) {
  const row: Record<string, unknown> = {
    id: entry.id, tracking_id: entry.trackingId,
    old_status: entry.oldStatus || null, new_status: entry.newStatus,
    changed_by: entry.changedBy || null, note: entry.note || null,
    created_at: entry.createdAt,
  }
  const { error } = await supabase.from("tracking_history").insert(row)
  if (error) throw error
}

export async function dbFetchTrackingHistory(trackingId: string): Promise<TrackingHistoryEntry[]> {
  const { data, error } = await supabase
    .from("tracking_history")
    .select("*")
    .eq("tracking_id", trackingId)
    .order("created_at", { ascending: true })
  if (error) throw error
  return (data || []).map(trackingHistoryFromRow)
}

// Invoices
export async function dbAddInvoice(inv: Invoice) {
  const { data, error } = await supabase.from("invoices").insert(invoiceToRow(inv)).select().single()
  if (error) throw error
  return invoiceFromRow(data)
}

export async function dbUpdateInvoice(id: string, updates: Partial<Invoice>) {
  const { error } = await supabase.from("invoices").update(invoiceToRow(updates)).eq("id", id)
  if (error) throw error
}

export async function dbGetNextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `FAC-${year}-`
  const { data } = await supabase
    .from("invoices")
    .select("invoice_number")
    .like("invoice_number", `${prefix}%`)
    .order("invoice_number", { ascending: false })
    .limit(1)

  if (data && data.length > 0) {
    const lastNum = parseInt((data[0].invoice_number as string).replace(prefix, ""), 10)
    return `${prefix}${String(lastNum + 1).padStart(4, "0")}`
  }
  return `${prefix}0001`
}

// ─── Auth: verify password ─────────────────────────────────────────────────

export async function dbVerifyPassword(email: string, password: string): Promise<User | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .eq("password_hash", password)
    .single()
  if (error || !data) return null
  return userFromRow(data)
}

// ─── Storage: upload vehicle photo ──────────────────────────────────────────

export async function uploadVehiclePhoto(vehicleId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg"
  const fileName = `${vehicleId}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`

  const { error } = await supabase.storage
    .from("vehicle-photos")
    .upload(fileName, file, { cacheControl: "3600", upsert: false })

  if (error) throw error

  const { data: urlData } = supabase.storage
    .from("vehicle-photos")
    .getPublicUrl(fileName)

  return urlData.publicUrl
}

export async function deleteVehiclePhoto(url: string): Promise<void> {
  // Extract path from full URL
  const match = url.match(/vehicle-photos\/(.+)$/)
  if (!match) return
  const { error } = await supabase.storage.from("vehicle-photos").remove([match[1]])
  if (error) throw error
}
