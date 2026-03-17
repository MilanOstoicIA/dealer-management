"use client"

import { useState } from "react"
import { Sidebar, MobileHeader } from "@/components/app/sidebar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen flex-col md:flex-row overflow-hidden">
      {/* Mobile header - visible only on small screens */}
      <MobileHeader onOpenMenu={() => setMobileOpen(true)} />

      {/* Sidebar - desktop: fixed aside, mobile: sheet drawer */}
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
