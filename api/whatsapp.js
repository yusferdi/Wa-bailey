import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion } from "@whiskeysockets/baileys"
import { createClient } from "@supabase/supabase-js"

// Supabase client
const supabase = createClient(
  "https://ijmvdmbaedokofzumxht.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqbXZkbWJhZWRva29menVteGh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NzI4ODUsImV4cCI6MjA2NTE0ODg4NX0.TTYFdMNG86xPIyEaRYjUE1Gq72epd_9-c2Y9vxaO5sU"
)

export default async function handler(req, res) {
  const { action, message, number } = req.query

  // Ambil session dari Supabase
  const { data } = await supabase
    .from("sessions_wa")
    .select("data")
    .eq("id", "default")
    .single()

  let creds = data ? data.data : null
  const { version } = await fetchLatestBaileysVersion()

  // Custom storage pakai Supabase
  const auth = {
    state: {
      creds,
      keys: {}
    },
    saveCreds: async (newCreds) => {
      await supabase
        .from("sessions_wa")
        .upsert({ id: "default", data: newCreds })
    }
  }

  const sock = makeWASocket({
    version,
    auth: auth.state,
    printQRInTerminal: false
  })

  sock.ev.on("creds.update", auth.saveCreds)

  // Kalau QR muncul, kirim ke frontend
  sock.ev.on("connection.update", (update) => {
    if (update.qr) {
      res.json({ qr: update.qr }) // bisa di-render di frontend
    }
  })

  if (action === "send" && number && message) {
    await sock.sendMessage(number + "@s.whatsapp.net", { text: message })
    return res.json({ success: true })
  }

  return res.json({ status: "running" })
}

/*
NEXT_PUBLIC_SUPABASE_URL=https://ijmvdmbaedokofzumxht.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqbXZkbWJhZWRva29menVteGh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NzI4ODUsImV4cCI6MjA2NTE0ODg4NX0.TTYFdMNG86xPIyEaRYjUE1Gq72epd_9-c2Y9vxaO5sU
