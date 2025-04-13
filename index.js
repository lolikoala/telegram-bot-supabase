require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const { createClient } = require("@supabase/supabase-js");

// Configuración
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Comandos simples: nota: ..., recuérdame ...
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.toLowerCase();

  if (!text) return;

  // Buscar al usuario por telegram_id
  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("telegram_id", chatId.toString())
    .single();

  // Si no está registrado, enviar aviso
  if (!user) {
    await bot.sendMessage(chatId, "Tu cuenta aún no ha sido vinculada. Espera aprobación del administrador.");
    return;
  }

  // Si es nota
  if (text.startsWith("nota:")) {
    const content = text.replace("nota:", "").trim();
    await supabase.from("notes").insert({ user_id: user.id, content });
    await bot.sendMessage(chatId, "✅ Nota guardada.");
    return;
  }

  // Si es recordatorio (por ahora solo guarda como texto, sin parsear fecha real)
  if (text.startsWith("recuérdame") || text.startsWith("recuerdame")) {
    await supabase.from("reminders").insert({
      user_id: user.id,
      message: text,
      remind_at: new Date(new Date().getTime() + 60000).toISOString() // +1 min para test
    });
    await bot.sendMessage(chatId, "⏰ Recordatorio guardado (hora simulada +1 min).");
    return;
  }

 await bot.sendMessage(chatId, "Hola! Puedes escribir:\\n• nota: comprar leche\\n• recuérdame mañana a las 9...");
});
