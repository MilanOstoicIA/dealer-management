"use client"

import { createContext, useContext, useReducer, useEffect, useState, useCallback, type ReactNode } from "react"
import type {
  Vehicle, Client, Sale, Appointment, Expense, User, ForumPost,
  VehicleServiceRecord, ClientVehicleInfo, Tracking,
  Supplier, TrackingHistoryEntry, Invoice,
} from "@/types"
import {
  fetchAllData,
  dbAddVehicle, dbUpdateVehicle, dbDeleteVehicle,
  dbAddClient, dbUpdateClient, dbDeleteClient,
  dbAddSale, dbUpdateSale,
  dbAddAppointment, dbUpdateAppointment,
  dbAddExpense, dbDeleteExpense,
  dbAddUser, dbUpdateUser,
  dbAddForumPost, dbUpdateForumPost,
  dbAddServiceRecord, dbSetClientVehicleInfo,
  dbAddTracking, dbUpdateTracking, dbDeleteTracking,
  dbAddSupplier, dbUpdateSupplier, dbDeleteSupplier,
  dbAddTrackingHistory, dbFetchTrackingHistory,
  dbAddInvoice, dbUpdateInvoice, dbGetNextInvoiceNumber,
} from "@/lib/supabase-service"
import { calculateInvoiceTax } from "@/lib/tax-utils"

// ─── ID generator ────────────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

// ─── State ───────────────────────────────────────────────────────────────────

interface StoreState {
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

const emptyState: StoreState = {
  vehicles: [],
  clients: [],
  sales: [],
  appointments: [],
  expenses: [],
  users: [],
  forumPosts: [],
  serviceRecords: [],
  clientVehicleInfo: [],
  trackings: [],
  suppliers: [],
  invoices: [],
}

// ─── Actions ─────────────────────────────────────────────────────────────────

type Action =
  | { type: "SET_STATE"; payload: StoreState }
  | { type: "ADD_VEHICLE"; payload: Vehicle }
  | { type: "UPDATE_VEHICLE"; id: string; updates: Partial<Vehicle> }
  | { type: "DELETE_VEHICLE"; id: string }
  | { type: "ADD_CLIENT"; payload: Client }
  | { type: "UPDATE_CLIENT"; id: string; updates: Partial<Client> }
  | { type: "DELETE_CLIENT"; id: string }
  | { type: "ADD_SALE"; payload: Sale }
  | { type: "UPDATE_SALE"; id: string; updates: Partial<Sale> }
  | { type: "COMPLETE_SALE"; id: string }
  | { type: "CANCEL_SALE"; id: string }
  | { type: "ADD_APPOINTMENT"; payload: Appointment }
  | { type: "UPDATE_APPOINTMENT"; id: string; updates: Partial<Appointment> }
  | { type: "CLOSE_APPOINTMENT"; id: string; updates: Partial<Appointment> }
  | { type: "ADD_EXPENSE"; payload: Expense }
  | { type: "DELETE_EXPENSE"; id: string }
  | { type: "ADD_USER"; payload: User }
  | { type: "UPDATE_USER"; id: string; updates: Partial<User> }
  | { type: "ADD_FORUM_POST"; payload: ForumPost }
  | { type: "UPDATE_FORUM_POST"; id: string; updates: Partial<ForumPost> }
  | { type: "ADD_SERVICE_RECORD"; payload: VehicleServiceRecord }
  | { type: "SET_CLIENT_VEHICLE_INFO"; payload: ClientVehicleInfo }
  | { type: "ADD_TRACKING"; payload: Tracking }
  | { type: "UPDATE_TRACKING"; id: string; updates: Partial<Tracking> }
  | { type: "DELETE_TRACKING"; id: string }
  | { type: "ADD_SUPPLIER"; payload: Supplier }
  | { type: "UPDATE_SUPPLIER"; id: string; updates: Partial<Supplier> }
  | { type: "DELETE_SUPPLIER"; id: string }
  | { type: "ADD_INVOICE"; payload: Invoice }
  | { type: "UPDATE_INVOICE"; id: string; updates: Partial<Invoice> }

// ─── Reducer ─────────────────────────────────────────────────────────────────

function reducer(state: StoreState, action: Action): StoreState {
  switch (action.type) {
    case "SET_STATE":
      return action.payload

    // ── Vehicles ──
    case "ADD_VEHICLE":
      return { ...state, vehicles: [...state.vehicles, action.payload] }
    case "UPDATE_VEHICLE":
      return { ...state, vehicles: state.vehicles.map((v) => v.id === action.id ? { ...v, ...action.updates } : v) }
    case "DELETE_VEHICLE":
      return { ...state, vehicles: state.vehicles.filter((v) => v.id !== action.id) }

    // ── Clients ──
    case "ADD_CLIENT":
      return { ...state, clients: [...state.clients, action.payload] }
    case "UPDATE_CLIENT":
      return { ...state, clients: state.clients.map((c) => c.id === action.id ? { ...c, ...action.updates } : c) }
    case "DELETE_CLIENT":
      return { ...state, clients: state.clients.filter((c) => c.id !== action.id) }

    // ── Sales (with vehicle sync) ──
    case "ADD_SALE":
      return {
        ...state,
        sales: [...state.sales, action.payload],
        vehicles: state.vehicles.map((v) =>
          v.id === action.payload.vehicleId ? { ...v, status: "reservado" as const } : v
        ),
      }
    case "UPDATE_SALE":
      return { ...state, sales: state.sales.map((s) => s.id === action.id ? { ...s, ...action.updates } : s) }
    case "COMPLETE_SALE": {
      const sale = state.sales.find((s) => s.id === action.id)
      if (!sale) return state
      return {
        ...state,
        sales: state.sales.map((s) => s.id === action.id ? { ...s, status: "completada" as const } : s),
        vehicles: state.vehicles.map((v) => v.id === sale.vehicleId ? { ...v, status: "vendido" as const } : v),
      }
    }
    case "CANCEL_SALE": {
      const sale = state.sales.find((s) => s.id === action.id)
      if (!sale) return state
      return {
        ...state,
        sales: state.sales.map((s) => s.id === action.id ? { ...s, status: "cancelada" as const } : s),
        vehicles: state.vehicles.map((v) => v.id === sale.vehicleId ? { ...v, status: "disponible" as const } : v),
      }
    }

    // ── Appointments (with service record + expense sync) ──
    case "ADD_APPOINTMENT":
      return { ...state, appointments: [...state.appointments, action.payload] }
    case "UPDATE_APPOINTMENT":
      return { ...state, appointments: state.appointments.map((a) => a.id === action.id ? { ...a, ...action.updates } : a) }
    case "CLOSE_APPOINTMENT": {
      const appt = state.appointments.find((a) => a.id === action.id)
      if (!appt) return state
      const closed = { ...appt, ...action.updates, status: "completada" as const, closedAt: new Date().toISOString() }
      const record: VehicleServiceRecord = {
        id: generateId(),
        vehicleId: closed.vehicleId,
        appointmentId: closed.id,
        mechanicId: closed.mechanicId,
        date: new Date().toISOString().split("T")[0],
        serviceType: closed.serviceType,
        mileage: closed.mileageAtService || 0,
        workItems: closed.workItems || [],
        photos: closed.workPhotos || [],
        notes: closed.mechanicNotes,
      }
      const workCost = (closed.workItems || []).reduce((sum, w) => sum + w.cost, 0)
      const expense: Expense | null = workCost > 0 ? {
        id: generateId(),
        category: "reparacion",
        description: `Cita: ${closed.description.slice(0, 60)}`,
        amount: workCost,
        date: new Date().toISOString().split("T")[0],
        vehicleId: closed.vehicleId,
      } : null
      return {
        ...state,
        appointments: state.appointments.map((a) => a.id === action.id ? closed : a),
        serviceRecords: [...state.serviceRecords, record],
        expenses: expense ? [...state.expenses, expense] : state.expenses,
      }
    }

    // ── Expenses ──
    case "ADD_EXPENSE":
      return { ...state, expenses: [...state.expenses, action.payload] }
    case "DELETE_EXPENSE":
      return { ...state, expenses: state.expenses.filter((e) => e.id !== action.id) }

    // ── Users ──
    case "ADD_USER":
      return { ...state, users: [...state.users, action.payload] }
    case "UPDATE_USER":
      return { ...state, users: state.users.map((u) => u.id === action.id ? { ...u, ...action.updates } : u) }

    // ── Forum ──
    case "ADD_FORUM_POST":
      return { ...state, forumPosts: [...state.forumPosts, action.payload] }
    case "UPDATE_FORUM_POST":
      return { ...state, forumPosts: state.forumPosts.map((p) => p.id === action.id ? { ...p, ...action.updates } : p) }

    // ── Service records ──
    case "ADD_SERVICE_RECORD":
      return { ...state, serviceRecords: [...state.serviceRecords, action.payload] }

    // ── Client vehicle info ──
    case "SET_CLIENT_VEHICLE_INFO": {
      const idx = state.clientVehicleInfo.findIndex((cvi) => cvi.vehicleId === action.payload.vehicleId)
      if (idx >= 0) {
        const updated = [...state.clientVehicleInfo]
        updated[idx] = action.payload
        return { ...state, clientVehicleInfo: updated }
      }
      return { ...state, clientVehicleInfo: [...state.clientVehicleInfo, action.payload] }
    }

    // ── Trackings ──
    case "ADD_TRACKING":
      return { ...state, trackings: [...state.trackings, action.payload] }
    case "UPDATE_TRACKING":
      return { ...state, trackings: state.trackings.map((t) => t.id === action.id ? { ...t, ...action.updates } : t) }
    case "DELETE_TRACKING":
      return { ...state, trackings: state.trackings.filter((t) => t.id !== action.id) }

    // ── Suppliers ──
    case "ADD_SUPPLIER":
      return { ...state, suppliers: [...state.suppliers, action.payload] }
    case "UPDATE_SUPPLIER":
      return { ...state, suppliers: state.suppliers.map((s) => s.id === action.id ? { ...s, ...action.updates } : s) }
    case "DELETE_SUPPLIER":
      return { ...state, suppliers: state.suppliers.filter((s) => s.id !== action.id) }

    // ── Invoices ──
    case "ADD_INVOICE":
      return { ...state, invoices: [action.payload, ...state.invoices] }
    case "UPDATE_INVOICE":
      return { ...state, invoices: state.invoices.map((inv) => inv.id === action.id ? { ...inv, ...action.updates } : inv) }

    default:
      return state
  }
}

// ─── Context type ────────────────────────────────────────────────────────────

interface StoreContextType extends StoreState {
  addVehicle: (v: Omit<Vehicle, "id" | "createdAt">) => void
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void
  deleteVehicle: (id: string) => void
  addClient: (c: Omit<Client, "id" | "createdAt">) => void
  updateClient: (id: string, updates: Partial<Client>) => void
  deleteClient: (id: string) => void
  createSale: (s: Omit<Sale, "id" | "commission">) => void
  updateSale: (id: string, updates: Partial<Sale>) => void
  completeSale: (id: string) => void
  cancelSale: (id: string) => void
  addAppointment: (a: Omit<Appointment, "id">) => void
  updateAppointment: (id: string, updates: Partial<Appointment>) => void
  closeAppointment: (id: string, updates: Partial<Appointment>) => void
  addExpense: (e: Omit<Expense, "id">) => void
  deleteExpense: (id: string) => void
  addUser: (u: Omit<User, "id" | "createdAt">) => void
  updateUser: (id: string, updates: Partial<User>) => void
  addForumPost: (p: Omit<ForumPost, "id" | "createdAt">) => void
  updateForumPost: (id: string, updates: Partial<ForumPost>) => void
  addTracking: (t: Omit<Tracking, "id" | "createdAt" | "updatedAt">) => void
  updateTracking: (id: string, updates: Partial<Tracking>) => void
  deleteTracking: (id: string) => void
  addSupplier: (s: Omit<Supplier, "id" | "createdAt">) => void
  updateSupplier: (id: string, updates: Partial<Supplier>) => void
  deleteSupplier: (id: string) => void
  addInvoice: (inv: Invoice) => void
  updateInvoice: (id: string, updates: Partial<Invoice>) => void
  getSupplierById: (id: string) => Supplier | undefined
  fetchTrackingHistory: (trackingId: string) => Promise<TrackingHistoryEntry[]>
  getUserById: (id: string) => User | undefined
  getVehicleById: (id: string) => Vehicle | undefined
  getClientById: (id: string) => Client | undefined
  getServiceRecordsByVehicle: (vehicleId: string) => VehicleServiceRecord[]
  getClientVehicleInfoFn: (vehicleId: string) => ClientVehicleInfo | undefined
  getDashboardStats: () => { totalVehicles: number; availableVehicles: number; vehiclesSold: number; totalClients: number; pendingAppointments: number; monthlySalesRevenue: number; monthlyCommissions: number }
  loadDemoData: () => void
  clearAllData: () => void
  refreshFromDb: () => Promise<void>
  hasData: boolean
}

const StoreContext = createContext<StoreContextType | null>(null)

// ─── Provider ────────────────────────────────────────────────────────────────

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, emptyState)
  const [loaded, setLoaded] = useState(false)

  // Load from Supabase on mount
  const refreshFromDb = useCallback(async () => {
    try {
      const data = await fetchAllData()
      dispatch({ type: "SET_STATE", payload: data })
    } catch (err) {
      console.error("Error loading from Supabase:", err)
    }
  }, [])

  useEffect(() => {
    refreshFromDb().then(() => setLoaded(true))
  }, [refreshFromDb])

  // ── Helpers ──
  const getUserById = useCallback((id: string) => state.users.find((u) => u.id === id), [state.users])
  const getVehicleById = useCallback((id: string) => state.vehicles.find((v) => v.id === id), [state.vehicles])
  const getClientById = useCallback((id: string) => state.clients.find((c) => c.id === id), [state.clients])
  const getServiceRecordsByVehicle = useCallback(
    (vehicleId: string) => state.serviceRecords.filter((sr) => sr.vehicleId === vehicleId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [state.serviceRecords]
  )
  const getClientVehicleInfoFn = useCallback(
    (vehicleId: string) => state.clientVehicleInfo.find((cvi) => cvi.vehicleId === vehicleId),
    [state.clientVehicleInfo]
  )
  const getDashboardStats = useCallback(() => {
    const currentMonth = new Date().toISOString().slice(0, 7)
    const completedMonthly = state.sales.filter((s) => s.saleDate.startsWith(currentMonth) && s.status === "completada")
    return {
      totalVehicles: state.vehicles.length,
      availableVehicles: state.vehicles.filter((v) => v.status === "disponible").length,
      vehiclesSold: state.vehicles.filter((v) => v.status === "vendido").length,
      totalClients: state.clients.length,
      pendingAppointments: state.appointments.filter((a) => a.status === "pendiente" || a.status === "en_progreso").length,
      monthlySalesRevenue: completedMonthly.reduce((sum, s) => sum + s.salePrice, 0),
      monthlyCommissions: completedMonthly.reduce((sum, s) => sum + s.commission, 0),
    }
  }, [state.vehicles, state.clients, state.appointments, state.sales])

  // ── Vehicle actions (optimistic + Supabase) ──
  const addVehicle = useCallback((v: Omit<Vehicle, "id" | "createdAt">) => {
    const newVehicle = { ...v, id: generateId(), createdAt: new Date().toISOString().split("T")[0] } as Vehicle
    dispatch({ type: "ADD_VEHICLE", payload: newVehicle })
    dbAddVehicle(v).then((saved) => {
      // Replace temp with DB version
      dispatch({ type: "DELETE_VEHICLE", id: newVehicle.id })
      dispatch({ type: "ADD_VEHICLE", payload: saved })
    }).catch((err) => console.error("DB addVehicle error:", err))
  }, [])

  const updateVehicle = useCallback((id: string, updates: Partial<Vehicle>) => {
    dispatch({ type: "UPDATE_VEHICLE", id, updates })
    dbUpdateVehicle(id, updates).catch((err) => console.error("DB updateVehicle error:", err))
  }, [])

  const deleteVehicle = useCallback((id: string) => {
    dispatch({ type: "DELETE_VEHICLE", id })
    dbDeleteVehicle(id).catch((err) => console.error("DB deleteVehicle error:", err))
  }, [])

  // ── Client actions ──
  const addClient = useCallback((c: Omit<Client, "id" | "createdAt">) => {
    const newClient = { ...c, id: generateId(), createdAt: new Date().toISOString().split("T")[0] } as Client
    dispatch({ type: "ADD_CLIENT", payload: newClient })
    dbAddClient(c).then((saved) => {
      dispatch({ type: "DELETE_CLIENT", id: newClient.id })
      dispatch({ type: "ADD_CLIENT", payload: saved })
    }).catch((err) => console.error("DB addClient error:", err))
  }, [])

  const updateClient = useCallback((id: string, updates: Partial<Client>) => {
    dispatch({ type: "UPDATE_CLIENT", id, updates })
    dbUpdateClient(id, updates).catch((err) => console.error("DB updateClient error:", err))
  }, [])

  const deleteClient = useCallback((id: string) => {
    dispatch({ type: "DELETE_CLIENT", id })
    dbDeleteClient(id).catch((err) => console.error("DB deleteClient error:", err))
  }, [])

  // ── Sale actions ──
  const createSale = useCallback((s: Omit<Sale, "id" | "commission">) => {
    const commission = s.salePrice * (s.commissionRate / 100)
    const newSale = { ...s, id: generateId(), commission } as Sale
    dispatch({ type: "ADD_SALE", payload: newSale })
    // Also update vehicle status in DB
    dbAddSale(newSale).catch((err) => console.error("DB addSale error:", err))
    dbUpdateVehicle(s.vehicleId, { status: "reservado" }).catch((err) => console.error("DB updateVehicle error:", err))
  }, [])

  const updateSale = useCallback((id: string, updates: Partial<Sale>) => {
    dispatch({ type: "UPDATE_SALE", id, updates })
    dbUpdateSale(id, updates).catch((err) => console.error("DB updateSale error:", err))
  }, [])

  const completeSale = useCallback((id: string) => {
    const sale = state.sales.find((s) => s.id === id)
    dispatch({ type: "COMPLETE_SALE", id })
    dbUpdateSale(id, { status: "completada" }).catch((err) => console.error("DB completeSale error:", err))
    if (sale) {
      dbUpdateVehicle(sale.vehicleId, { status: "vendido" }).catch((err) => console.error("DB updateVehicle error:", err))
      // Auto-generate invoice
      const vehicle = state.vehicles.find((v) => v.id === sale.vehicleId)
      const client = state.clients.find((c) => c.id === sale.clientId)
      if (vehicle && client) {
        const taxResult = calculateInvoiceTax({
          salePrice: sale.salePrice,
          purchasePrice: vehicle.purchasePrice,
          taxRegime: sale.taxRegime || "rebu",
        })
        dbGetNextInvoiceNumber().then((invoiceNumber) => {
          const invoice: Invoice = {
            id: generateId(),
            invoiceNumber,
            saleId: sale.id,
            clientId: client.id,
            clientName: client.name,
            clientDni: client.dni || "",
            concept: `${vehicle.brand} ${vehicle.model} ${vehicle.year} — ${vehicle.licensePlate}`,
            taxRegime: sale.taxRegime || "rebu",
            subtotal: taxResult.regime === "iva_general" ? taxResult.subtotal : sale.salePrice,
            ivaRate: taxResult.regime === "iva_general" ? taxResult.ivaRate : null,
            ivaAmount: taxResult.ivaAmount,
            total: taxResult.regime === "iva_general" ? taxResult.total : taxResult.salePrice,
            purchasePrice: vehicle.purchasePrice,
            status: "emitida",
            issuedDate: new Date().toISOString().split("T")[0],
            createdAt: new Date().toISOString(),
          }
          dispatch({ type: "ADD_INVOICE", payload: invoice })
          dbAddInvoice(invoice).catch((err) => console.error("DB addInvoice error:", err))
        }).catch((err) => console.error("DB getNextInvoiceNumber error:", err))
      }
    }
  }, [state.sales, state.vehicles, state.clients])

  const cancelSale = useCallback((id: string) => {
    const sale = state.sales.find((s) => s.id === id)
    dispatch({ type: "CANCEL_SALE", id })
    dbUpdateSale(id, { status: "cancelada" }).catch((err) => console.error("DB cancelSale error:", err))
    if (sale) {
      dbUpdateVehicle(sale.vehicleId, { status: "disponible" }).catch((err) => console.error("DB updateVehicle error:", err))
    }
  }, [state.sales])

  // ── Appointment actions ──
  const addAppointment = useCallback((a: Omit<Appointment, "id">) => {
    const newAppt = { ...a, id: generateId() } as Appointment
    dispatch({ type: "ADD_APPOINTMENT", payload: newAppt })
    dbAddAppointment(newAppt).catch((err) => console.error("DB addAppointment error:", err))
  }, [])

  const updateAppointment = useCallback((id: string, updates: Partial<Appointment>) => {
    dispatch({ type: "UPDATE_APPOINTMENT", id, updates })
    dbUpdateAppointment(id, updates).catch((err) => console.error("DB updateAppointment error:", err))
  }, [])

  const closeAppointment = useCallback((id: string, updates: Partial<Appointment>) => {
    dispatch({ type: "CLOSE_APPOINTMENT", id, updates })
    // Sync to DB: update appointment, add service record, add expense
    const appt = state.appointments.find((a) => a.id === id)
    if (appt) {
      const closed = { ...appt, ...updates, status: "completada" as const, closedAt: new Date().toISOString() }
      dbUpdateAppointment(id, closed).catch((err) => console.error("DB closeAppointment error:", err))
      const record: VehicleServiceRecord = {
        id: generateId(), vehicleId: closed.vehicleId, appointmentId: closed.id,
        mechanicId: closed.mechanicId, date: new Date().toISOString().split("T")[0],
        serviceType: closed.serviceType, mileage: closed.mileageAtService || 0,
        workItems: closed.workItems || [], photos: closed.workPhotos || [],
        notes: closed.mechanicNotes,
      }
      dbAddServiceRecord(record).catch((err) => console.error("DB addServiceRecord error:", err))
      const workCost = (closed.workItems || []).reduce((sum, w) => sum + w.cost, 0)
      if (workCost > 0) {
        const expense: Expense = {
          id: generateId(), category: "reparacion",
          description: `Cita: ${closed.description.slice(0, 60)}`,
          amount: workCost, date: new Date().toISOString().split("T")[0],
          vehicleId: closed.vehicleId,
        }
        dbAddExpense(expense).catch((err) => console.error("DB addExpense error:", err))
      }
    }
  }, [state.appointments])

  // ── Expense actions ──
  const addExpense = useCallback((e: Omit<Expense, "id">) => {
    const newExpense = { ...e, id: generateId() } as Expense
    dispatch({ type: "ADD_EXPENSE", payload: newExpense })
    dbAddExpense(newExpense).catch((err) => console.error("DB addExpense error:", err))
  }, [])

  const deleteExpense = useCallback((id: string) => {
    dispatch({ type: "DELETE_EXPENSE", id })
    dbDeleteExpense(id).catch((err) => console.error("DB deleteExpense error:", err))
  }, [])

  // ── User actions ──
  const addUser = useCallback((u: Omit<User, "id" | "createdAt">) => {
    const newUser = { ...u, id: generateId(), createdAt: new Date().toISOString().split("T")[0] } as User
    dispatch({ type: "ADD_USER", payload: newUser })
    dbAddUser(newUser).catch((err) => console.error("DB addUser error:", err))
  }, [])

  const updateUser = useCallback((id: string, updates: Partial<User>) => {
    dispatch({ type: "UPDATE_USER", id, updates })
    dbUpdateUser(id, updates).catch((err) => console.error("DB updateUser error:", err))
  }, [])

  // ── Forum actions ──
  const addForumPost = useCallback((p: Omit<ForumPost, "id" | "createdAt">) => {
    const newPost = { ...p, id: generateId(), createdAt: new Date().toISOString().split("T")[0] } as ForumPost
    dispatch({ type: "ADD_FORUM_POST", payload: newPost })
    dbAddForumPost(newPost).catch((err) => console.error("DB addForumPost error:", err))
  }, [])

  const updateForumPost = useCallback((id: string, updates: Partial<ForumPost>) => {
    dispatch({ type: "UPDATE_FORUM_POST", id, updates })
    dbUpdateForumPost(id, updates).catch((err) => console.error("DB updateForumPost error:", err))
  }, [])

  // ── Tracking actions ──
  const addTracking = useCallback((t: Omit<Tracking, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString()
    const newTracking = { ...t, id: generateId(), createdAt: now, updatedAt: now } as Tracking
    dispatch({ type: "ADD_TRACKING", payload: newTracking })
    dbAddTracking(newTracking).catch((err) => console.error("DB addTracking error:", err))
  }, [])

  const updateTracking = useCallback((id: string, updates: Partial<Tracking>) => {
    const updatedFields = { ...updates, updatedAt: new Date().toISOString() }
    // Record history when status changes
    if (updates.status) {
      const oldTracking = state.trackings.find((t) => t.id === id)
      if (oldTracking && oldTracking.status !== updates.status) {
        const historyEntry: TrackingHistoryEntry = {
          id: generateId(),
          trackingId: id,
          oldStatus: oldTracking.status,
          newStatus: updates.status,
          createdAt: new Date().toISOString(),
        }
        dbAddTrackingHistory(historyEntry).catch((err) => console.error("DB addTrackingHistory error:", err))
      }
    }
    dispatch({ type: "UPDATE_TRACKING", id, updates: updatedFields })
    dbUpdateTracking(id, updatedFields).catch((err) => console.error("DB updateTracking error:", err))
  }, [state.trackings])

  const deleteTracking = useCallback((id: string) => {
    dispatch({ type: "DELETE_TRACKING", id })
    dbDeleteTracking(id).catch((err) => console.error("DB deleteTracking error:", err))
  }, [])

  // ── Supplier actions ──
  const addSupplier = useCallback((s: Omit<Supplier, "id" | "createdAt">) => {
    const newSupplier = { ...s, id: generateId(), createdAt: new Date().toISOString() } as Supplier
    dispatch({ type: "ADD_SUPPLIER", payload: newSupplier })
    dbAddSupplier(newSupplier).catch((err) => console.error("DB addSupplier error:", err))
  }, [])

  const updateSupplier = useCallback((id: string, updates: Partial<Supplier>) => {
    dispatch({ type: "UPDATE_SUPPLIER", id, updates })
    dbUpdateSupplier(id, updates).catch((err) => console.error("DB updateSupplier error:", err))
  }, [])

  const deleteSupplier = useCallback((id: string) => {
    dispatch({ type: "DELETE_SUPPLIER", id })
    dbDeleteSupplier(id).catch((err) => console.error("DB deleteSupplier error:", err))
  }, [])

  // ── Invoice actions ──
  const addInvoice = useCallback((inv: Invoice) => {
    dispatch({ type: "ADD_INVOICE", payload: inv })
    dbAddInvoice(inv).catch((err) => console.error("DB addInvoice error:", err))
  }, [])

  const updateInvoice = useCallback((id: string, updates: Partial<Invoice>) => {
    dispatch({ type: "UPDATE_INVOICE", id, updates })
    dbUpdateInvoice(id, updates).catch((err) => console.error("DB updateInvoice error:", err))
  }, [])

  const getSupplierById = useCallback((id: string) => state.suppliers.find((s) => s.id === id), [state.suppliers])

  const fetchTrackingHistoryFn = useCallback(async (trackingId: string) => {
    try {
      return await dbFetchTrackingHistory(trackingId)
    } catch (err) {
      console.error("DB fetchTrackingHistory error:", err)
      return []
    }
  }, [])

  // ── Data management ──
  const loadDemoData = useCallback(() => {
    // Reload from DB (data is already seeded)
    refreshFromDb()
  }, [refreshFromDb])

  const clearAllData = useCallback(() => {
    dispatch({ type: "SET_STATE", payload: emptyState })
  }, [])

  const value: StoreContextType = {
    ...state,
    addVehicle, updateVehicle, deleteVehicle,
    addClient, updateClient, deleteClient,
    createSale, updateSale, completeSale, cancelSale,
    addAppointment, updateAppointment, closeAppointment,
    addExpense, deleteExpense,
    addUser, updateUser,
    addForumPost, updateForumPost,
    addTracking, updateTracking, deleteTracking,
    addSupplier, updateSupplier, deleteSupplier, getSupplierById,
    addInvoice, updateInvoice,
    fetchTrackingHistory: fetchTrackingHistoryFn,
    getUserById, getVehicleById, getClientById,
    getServiceRecordsByVehicle, getClientVehicleInfoFn, getDashboardStats,
    loadDemoData, clearAllData, refreshFromDb,
    hasData: state.vehicles.length > 0 || state.clients.length > 0,
  }

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useStore(): StoreContextType {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used within StoreProvider")
  return ctx
}
