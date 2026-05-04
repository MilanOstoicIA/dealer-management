-- ─── WhatsApp tables ──────────────────────────────────────────────────────────
-- Run this in Supabase SQL editor: https://app.supabase.com/project/bfdgqhdurmctutqmvtpr/sql/new

CREATE TABLE IF NOT EXISTS whatsapp_contacts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone           text UNIQUE NOT NULL,
  name            text NOT NULL DEFAULT '',
  client_id       uuid REFERENCES clients(id) ON DELETE SET NULL,
  last_message    text,
  last_message_at timestamptz,
  unread_count    int NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id  uuid NOT NULL REFERENCES whatsapp_contacts(id) ON DELETE CASCADE,
  direction   text NOT NULL CHECK (direction IN ('in', 'out')),
  body        text NOT NULL DEFAULT '',
  media_url   text,
  sent_at     timestamptz NOT NULL DEFAULT now(),
  status      text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed'))
);

CREATE INDEX IF NOT EXISTS whatsapp_messages_contact_id_idx
  ON whatsapp_messages (contact_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS whatsapp_contacts_last_message_at_idx
  ON whatsapp_contacts (last_message_at DESC NULLS LAST);

-- Enable Realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_contacts;
ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_messages;
