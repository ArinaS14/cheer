const phonePattern = /^(\+7|8)\s?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/;

function normalizePhone(value = "") {
  const digits = String(value).replace(/\D/g, "");
  if (digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8"))) {
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
  }
  return String(value).trim();
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    response.status(500).json({ ok: false, error: "Telegram env vars are not configured" });
    return;
  }

  const name = String(request.body?.name || "").trim();
  const phone = normalizePhone(request.body?.phone);

  if (name.length < 2 || !phonePattern.test(phone)) {
    response.status(400).json({ ok: false, error: "Invalid name or phone" });
    return;
  }

  const text = [
    "Новая заявка с сайта Goldy Land",
    `Имя: ${name}`,
    `Телефон: ${phone}`
  ].join("\n");

  const telegramResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text
    })
  });

  if (!telegramResponse.ok) {
    const details = await telegramResponse.text();
    response.status(502).json({ ok: false, error: "Telegram request failed", details });
    return;
  }

  response.status(200).json({ ok: true });
}
