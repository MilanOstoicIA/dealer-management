"use client"

import { StoreProvider } from "@/lib/store"
import { AuthProvider } from "@/lib/auth"
import { I18nProvider } from "@/lib/i18n"
import { Toaster } from "sonner"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <I18nProvider>
        <AuthProvider>{children}</AuthProvider>
      </I18nProvider>
      <Toaster position="top-right" richColors closeButton />
    </StoreProvider>
  )
}
