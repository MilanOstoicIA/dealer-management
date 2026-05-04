import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Service-role client for webhook (no auth context)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

// ─── Normalize phone to digits-only (E.164 without +) ───────────────────────

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, '')
}

// ─── Auto-link contact to client by phone ───────────────────────────────────

async function tryLinkClient(contactId: string, phone: string) {
  // Attempt exact match on clients.phone (strips non-digit chars at lookup)
  const { data: clients } = await supabaseAdmin
    .from('clients')
    .select('id, phone')
    .ilike('phone', `%${phone.slice(-9)}`) // last 9 digits (Spain number)
    .limit(1)

  if (clients && clients.length > 0) {
    await supabaseAdmin
      .from('whatsapp_contacts')
      .update({ client_id: clients[0].id })
      .eq('id', contactId)
  }
}

// ─── Upsert contact and insert message ──────────────────────────────────────

async function handleIncomingMessage(phone: string, name: string, body: string, mediaUrl?: string) {
  // Upsert contact
  const { data: contact, error: contactErr } = await supabaseAdmin
    .from('whatsapp_contacts')
    .upsert(
      { phone, name: name || phone },
      { onConflict: 'phone', ignoreDuplicates: false }
    )
    .select()
    .single()

  if (contactErr || !contact) {
    console.error('[WA webhook] contact upsert error:', contactErr)
    return
  }

  const contactId: string = contact.id as string

  // Insert message
  const { error: msgErr } = await supabaseAdmin
    .from('whatsapp_messages')
    .insert({
      contact_id: contactId,
      direction: 'in',
      body: body || '',
      media_url: mediaUrl ?? null,
      status: 'delivered',
    })

  if (msgErr) console.error('[WA webhook] message insert error:', msgErr)

  // Update contact last_message + increment unread
  const currentUnread = (contact.unread_count as number) ?? 0
  await supabaseAdmin
    .from('whatsapp_contacts')
    .update({
      last_message: (body || '[media]').slice(0, 120),
      last_message_at: new Date().toISOString(),
      unread_count: currentUnread + 1,
    })
    .eq('id', contactId)

  // Try to link to a client record
  if (!contact.client_id) {
    await tryLinkClient(contactId, phone)
  }
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let payload: Record<string, unknown>
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  // Evolution API v2 payload shape:
  // { event: "messages.upsert", data: { key: { remoteJid, fromMe }, pushName, message: { conversation } } }
  const event = payload.event as string | undefined
  const data = payload.data as Record<string, unknown> | undefined

  // Handle different Evolution API event formats
  if (event === 'messages.upsert' && data) {
    const key = data.key as Record<string, unknown> | undefined
    if (!key) return NextResponse.json({ ok: true })

    const remoteJid = key.remoteJid as string | undefined
    const fromMe = key.fromMe as boolean | undefined

    if (!remoteJid || fromMe) {
      // Ignore outbound or system messages
      return NextResponse.json({ ok: true })
    }

    // Extract phone from JID (format: "34612345678@s.whatsapp.net")
    const phone = normalizePhone(remoteJid.split('@')[0])
    const pushName = (data.pushName as string) || ''

    // Extract text from various message types
    const message = data.message as Record<string, unknown> | undefined
    const body =
      (message?.conversation as string) ||
      (message?.extendedTextMessage as Record<string, unknown>)?.text as string ||
      (message?.imageMessage as Record<string, unknown>)?.caption as string ||
      ''
    const mediaUrl = (message?.imageMessage as Record<string, unknown>)?.url as string | undefined

    await handleIncomingMessage(phone, pushName, body, mediaUrl)
  }

  // Also handle the simpler flat format some Evolution versions send
  if (payload.messageType === 'conversation' || payload.messageType === 'extendedTextMessage') {
    const phone = normalizePhone((payload.remoteJid as string)?.split('@')[0] ?? '')
    const body = (payload.body as string) || ''
    const name = (payload.pushName as string) || ''
    if (phone && !(payload.fromMe as boolean)) {
      await handleIncomingMessage(phone, name, body)
    }
  }

  return NextResponse.json({ ok: true })
}

// Allow GET for webhook verification (Evolution API ping)
export async function GET() {
  return NextResponse.json({ status: 'WhatsApp webhook active' })
}
