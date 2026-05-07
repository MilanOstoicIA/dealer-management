'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Send, Phone, User, MessageSquare, RefreshCw, Settings2,
  ExternalLink, Wifi, WifiOff, Search, X, ChevronLeft,
  CheckCheck, Check, AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import {
  dbGetWhatsAppContacts, dbGetWhatsAppMessages,
  dbInsertWhatsAppMessage, dbMarkWhatsAppContactRead,
  dbGetSetting, dbSetSetting,
} from '@/lib/supabase-service'
import type { WhatsAppContact, WhatsAppMessage } from '@/types'
import { toast } from 'sonner'

// ─── Evolution API helper ─────────────────────────────────────────────────────

async function evolutionSendMessage(instanceUrl: string, apiKey: string, phone: string, text: string) {
  const baseUrl = instanceUrl.replace(/\/$/, '')
  const res = await fetch(`${baseUrl}/message/sendText/dealerhub`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: apiKey,
    },
    body: JSON.stringify({
      number: phone,
      text,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Evolution API error: ${res.status} ${err}`)
  }
  return res.json()
}

// ─── Format helpers ───────────────────────────────────────────────────────────

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

function formatMsgTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase() || '?'
}

// ─── Status icon ──────────────────────────────────────────────────────────────

function MsgStatusIcon({ status }: { status: WhatsAppMessage['status'] }) {
  if (status === 'failed') return <AlertCircle className="h-3 w-3 text-destructive" />
  if (status === 'read') return <CheckCheck className="h-3 w-3 text-blue-400" />
  if (status === 'delivered') return <CheckCheck className="h-3 w-3 text-muted-foreground/60" />
  return <Check className="h-3 w-3 text-muted-foreground/60" />
}

// ─── Setup Dialog ─────────────────────────────────────────────────────────────

interface SetupDialogProps {
  onSave: (url: string, key: string) => void
  onClose: () => void
  initialUrl?: string
  initialKey?: string
}

function SetupDialog({ onSave, onClose, initialUrl = '', initialKey = '' }: SetupDialogProps) {
  const [url, setUrl] = useState(initialUrl)
  const [key, setKey] = useState(initialKey)

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Configurar Evolution API</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-1">
          <p className="text-sm text-muted-foreground">
            Necesitas una instancia de Evolution API corriendo en tu servidor. Configura la URL y la clave de API para conectar WhatsApp.
          </p>

          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pasos de configuración</p>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal pl-4">
              <li>Despliega Evolution API v2 en tu VPS (Docker recomendado)</li>
              <li>Crea una instancia llamada <code className="bg-muted px-1 rounded">dealerhub</code></li>
              <li>Escanea el QR code con tu número de WhatsApp Business</li>
              <li>Configura el webhook: <code className="bg-muted px-1 rounded text-[10px]">{typeof window !== 'undefined' ? window.location.origin : ''}/api/whatsapp/webhook</code></li>
            </ol>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>URL del servidor Evolution API</Label>
              <Input
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://mi-evolution-api.com"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">URL base del servidor (sin barra final)</p>
            </div>
            <div className="space-y-1.5">
              <Label>API Key</Label>
              <Input
                value={key}
                onChange={e => setKey(e.target.value)}
                type="password"
                placeholder="tu-api-key-secreta"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => { if (url.trim()) onSave(url.trim(), key.trim()) }}>
            Guardar configuración
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Contact list item ────────────────────────────────────────────────────────

function ContactItem({
  contact,
  isSelected,
  onClick,
}: {
  contact: WhatsAppContact
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50',
        isSelected && 'bg-muted/70',
      )}
    >
      <div className="relative shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-green-500/15 text-green-700 text-sm font-semibold">
            {getInitials(contact.name)}
          </AvatarFallback>
        </Avatar>
        {contact.unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-[9px] font-bold text-white">
            {contact.unreadCount > 9 ? '9+' : contact.unreadCount}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <p className={cn('text-sm truncate', contact.unreadCount > 0 ? 'font-semibold' : 'font-medium')}>
            {contact.name}
          </p>
          {contact.lastMessageAt && (
            <span className="text-[10px] text-muted-foreground shrink-0">
              {formatTime(contact.lastMessageAt)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-1">
          <p className={cn('text-xs truncate', contact.unreadCount > 0 ? 'text-foreground' : 'text-muted-foreground')}>
            {contact.lastMessage || contact.phone}
          </p>
          {contact.clientId && (
            <span className="shrink-0 inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium bg-blue-500/10 text-blue-600">
              Cliente
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: WhatsAppMessage }) {
  const isOut = msg.direction === 'out'
  return (
    <div className={cn('flex', isOut ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[70%] rounded-2xl px-3.5 py-2 text-sm shadow-sm',
          isOut
            ? 'bg-green-500 text-white rounded-br-sm'
            : 'bg-card border border-border/60 rounded-bl-sm',
        )}
      >
        {msg.mediaUrl && (
          <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" className="block mb-1">
            <div className="text-xs underline opacity-80">📎 Adjunto</div>
          </a>
        )}
        <p className="leading-snug break-words">{msg.body}</p>
        <div className={cn('flex items-center gap-1 mt-1 justify-end', isOut ? 'text-green-100' : 'text-muted-foreground/60')}>
          <span className="text-[10px]">{formatMsgTime(msg.sentAt)}</span>
          {isOut && <MsgStatusIcon status={msg.status} />}
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface WhatsAppClientProps {
  clients: { id: string; name: string; phone: string }[]
}

export function WhatsAppClient({ clients }: WhatsAppClientProps) {
  const router = useRouter()

  // Evolution API config (stored in Supabase settings)
  const [evolutionUrl, setEvolutionUrl] = useState('')
  const [evolutionKey, setEvolutionKey] = useState('')
  const [showSetup, setShowSetup] = useState(false)
  const [connected, setConnected] = useState(false)

  // Contacts & messages
  const [contacts, setContacts] = useState<WhatsAppContact[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [search, setSearch] = useState('')
  const [msgText, setMsgText] = useState('')
  const [sending, setSending] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load config from Supabase settings
  useEffect(() => {
    Promise.all([
      dbGetSetting('evolution_url'),
      dbGetSetting('evolution_key'),
    ]).then(([url, key]) => {
      const u = url ?? ''
      const k = key ?? ''
      setEvolutionUrl(u)
      setEvolutionKey(k)
      setConnected(!!u)
    })
  }, [])

  // Load contacts
  const loadContacts = useCallback(async () => {
    try {
      const data = await dbGetWhatsAppContacts()
      setContacts(data)
    } catch (err) {
      console.error('Error loading WA contacts:', err)
    }
  }, [])

  useEffect(() => {
    loadContacts()
  }, [loadContacts])

  // Load messages when contact selected
  useEffect(() => {
    if (!selectedId) return
    setLoadingMsgs(true)
    dbGetWhatsAppMessages(selectedId)
      .then(msgs => {
        setMessages(msgs)
        setLoadingMsgs(false)
      })
      .catch(() => setLoadingMsgs(false))

    // Mark as read
    dbMarkWhatsAppContactRead(selectedId).then(() => {
      setContacts(prev => prev.map(c => c.id === selectedId ? { ...c, unreadCount: 0 } : c))
    })
  }, [selectedId])

  // Scroll to bottom when messages load
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Supabase Realtime subscriptions
  useEffect(() => {
    const msgChannel = supabase
      .channel('wa-messages-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'whatsapp_messages' }, payload => {
        const row = payload.new as Record<string, unknown>
        const newMsg: WhatsAppMessage = {
          id: row.id as string,
          contactId: row.contact_id as string,
          direction: row.direction as WhatsAppMessage['direction'],
          body: row.body as string || '',
          mediaUrl: row.media_url as string | undefined,
          sentAt: row.sent_at as string,
          status: row.status as WhatsAppMessage['status'],
        }
        // Append to open conversation
        if (newMsg.contactId === selectedId) {
          setMessages(prev => [...prev, newMsg])
          // Mark read immediately
          dbMarkWhatsAppContactRead(newMsg.contactId)
        }
      })
      .subscribe()

    const contactChannel = supabase
      .channel('wa-contacts-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_contacts' }, () => {
        loadContacts()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(msgChannel)
      supabase.removeChannel(contactChannel)
    }
  }, [selectedId, loadContacts])

  // Selected contact data
  const selectedContact = contacts.find(c => c.id === selectedId)
  const linkedClient = selectedContact?.clientId
    ? clients.find(c => c.id === selectedContact.clientId)
    : null

  // Filtered contacts
  const filteredContacts = contacts.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  )

  async function handleSaveConfig(url: string, key: string) {
    await Promise.all([
      dbSetSetting('evolution_url', url),
      dbSetSetting('evolution_key', key),
    ])
    setEvolutionUrl(url)
    setEvolutionKey(key)
    setConnected(!!url)
    setShowSetup(false)
    toast.success('Configuración guardada')
  }

  function handleSelectContact(id: string) {
    setSelectedId(id)
    setMobileView('chat')
    setMsgText('')
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  async function handleRefresh() {
    setRefreshing(true)
    await loadContacts()
    if (selectedId) {
      const msgs = await dbGetWhatsAppMessages(selectedId)
      setMessages(msgs)
    }
    setRefreshing(false)
  }

  async function handleSend() {
    if (!msgText.trim() || !selectedContact || !evolutionUrl) return
    setSending(true)
    const text = msgText.trim()
    setMsgText('')

    try {
      // Optimistic insert
      const optimisticMsg: WhatsAppMessage = {
        id: `tmp-${Date.now()}`,
        contactId: selectedContact.id,
        direction: 'out',
        body: text,
        sentAt: new Date().toISOString(),
        status: 'sent',
      }
      setMessages(prev => [...prev, optimisticMsg])

      // Send via Evolution API
      await evolutionSendMessage(evolutionUrl, evolutionKey, selectedContact.phone, text)

      // Persist to Supabase
      const saved = await dbInsertWhatsAppMessage(selectedContact.id, 'out', text)
      setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? saved : m))

      // Update contacts list last_message
      setContacts(prev => prev.map(c =>
        c.id === selectedContact.id
          ? { ...c, lastMessage: text, lastMessageAt: new Date().toISOString() }
          : c
      ))
    } catch (err) {
      toast.error('Error al enviar el mensaje. Verifica la configuración de Evolution API.')
      console.error(err)
      // Remove optimistic message
      setMessages(prev => prev.filter(m => !m.id.startsWith('tmp-')))
      setMsgText(text) // Restore text
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)] overflow-hidden">
      {/* ── Contact list ── */}
      <div className={cn(
        'flex flex-col border-r border-border/60 bg-card',
        'w-full md:w-80 lg:w-96 shrink-0',
        mobileView === 'chat' ? 'hidden md:flex' : 'flex',
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
              <MessageSquare className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold">WhatsApp</p>
              <div className="flex items-center gap-1">
                {connected ? (
                  <><Wifi className="h-2.5 w-2.5 text-green-500" /><span className="text-[10px] text-green-600">Conectado</span></>
                ) : (
                  <><WifiOff className="h-2.5 w-2.5 text-muted-foreground" /><span className="text-[10px] text-muted-foreground">Sin configurar</span></>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" onClick={handleRefresh} disabled={refreshing} title="Actualizar">
              <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => setShowSetup(true)} title="Configurar API">
              <Settings2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-border/40 shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar contactos..."
              className="pl-8 h-8 text-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Contact list */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/30">
          {!connected && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <WifiOff className="h-8 w-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium mb-1">WhatsApp no configurado</p>
              <p className="text-xs text-muted-foreground mb-4">
                Conecta tu Evolution API para empezar a recibir y enviar mensajes de WhatsApp.
              </p>
              <Button size="sm" onClick={() => setShowSetup(true)}>
                <Settings2 className="h-3.5 w-3.5 mr-1.5" />
                Configurar ahora
              </Button>
            </div>
          )}
          {connected && filteredContacts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium mb-1">Sin conversaciones</p>
              <p className="text-xs text-muted-foreground">
                Los mensajes entrantes de WhatsApp aparecerán aquí automáticamente.
              </p>
            </div>
          )}
          {filteredContacts.map(contact => (
            <ContactItem
              key={contact.id}
              contact={contact}
              isSelected={contact.id === selectedId}
              onClick={() => handleSelectContact(contact.id)}
            />
          ))}
        </div>
      </div>

      {/* ── Chat panel ── */}
      <div className={cn(
        'flex flex-col flex-1 min-w-0',
        mobileView === 'list' ? 'hidden md:flex' : 'flex',
      )}>
        {!selectedContact ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10 mb-4">
              <MessageSquare className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-base font-semibold mb-1">Selecciona una conversación</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Elige un contacto de la lista para ver el hilo de mensajes y responder desde aquí.
            </p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60 shrink-0 bg-card">
              {/* Mobile back button */}
              <Button
                variant="ghost"
                size="icon-sm"
                className="md:hidden"
                onClick={() => setMobileView('list')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-green-500/15 text-green-700 text-sm font-semibold">
                  {getInitials(selectedContact.name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{selectedContact.name}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    +{selectedContact.phone}
                  </p>
                  {linkedClient && (
                    <Link
                      href={`/dashboard/clientes?id=${linkedClient.id}`}
                      className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600 hover:text-blue-700"
                    >
                      <User className="h-2.5 w-2.5" />
                      {linkedClient.name}
                      <ExternalLink className="h-2.5 w-2.5" />
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-muted/20">
              {loadingMsgs && (
                <div className="flex justify-center py-8">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
                </div>
              )}
              {!loadingMsgs && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <MessageSquare className="h-6 w-6 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">Sin mensajes aún</p>
                </div>
              )}
              {messages.map(msg => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="flex items-end gap-2 px-4 py-3 border-t border-border/60 shrink-0 bg-card">
              {!evolutionUrl && (
                <p className="text-xs text-muted-foreground flex-1 text-center">
                  Configura Evolution API para enviar mensajes
                </p>
              )}
              {evolutionUrl && (
                <>
                  <Input
                    ref={inputRef}
                    value={msgText}
                    onChange={e => setMsgText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 resize-none min-h-[40px]"
                    disabled={sending}
                  />
                  <Button
                    size="sm"
                    onClick={handleSend}
                    disabled={!msgText.trim() || sending}
                    className="bg-green-500 hover:bg-green-600 text-white shrink-0"
                  >
                    {sending ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Setup dialog */}
      {showSetup && (
        <SetupDialog
          onSave={handleSaveConfig}
          onClose={() => setShowSetup(false)}
          initialUrl={evolutionUrl}
          initialKey={evolutionKey}
        />
      )}
    </div>
  )
}
