import { WhatsAppClient } from '@/components/dashboard/whatsapp-client'
import { createClient } from '@supabase/supabase-js'

// Server-side data fetch for initial client list (for auto-linking)
async function getClients(): Promise<{ id: string; name: string; phone: string }[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const { data } = await supabase
    .from('clients')
    .select('id, name, phone')
    .order('name')
  return (data ?? []) as { id: string; name: string; phone: string }[]
}

export default async function WhatsAppPage() {
  const clients = await getClients()

  return <WhatsAppClient clients={clients} />
}
