// ── Telegram Bot API helpers ───────────────────────────────────────────────────

function base() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");
  return `https://api.telegram.org/bot${token}`;
}

function chatId() {
  const id = process.env.TELEGRAM_CHAT_ID;
  if (!id) throw new Error("TELEGRAM_CHAT_ID is not set");
  return id;
}

async function apiCall(method: string, body: object): Promise<TelegramApiResult> {
  const res = await fetch(`${base()}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json() as TelegramApiResult;
  if (!json.ok) throw new Error(`Telegram ${method} error: ${JSON.stringify(json)}`);
  return json;
}

interface TelegramApiResult {
  ok: boolean;
  result?: { message_id: number };
  description?: string;
}

export interface InlineButton {
  text: string;
  callback_data: string;
}

// ── Send a message to the configured chat ─────────────────────────────────────
export async function sendMessage(
  text: string,
  keyboard?: InlineButton[][]
): Promise<number> {
  const body: Record<string, unknown> = {
    chat_id: chatId(),
    text,
    parse_mode: "HTML",
  };
  if (keyboard?.length) {
    body.reply_markup = { inline_keyboard: keyboard };
  }
  const result = await apiCall("sendMessage", body);
  return result.result?.message_id ?? 0;
}

// ── Edit an existing message ───────────────────────────────────────────────────
export async function editMessage(messageId: number, text: string): Promise<void> {
  await apiCall("editMessageText", {
    chat_id: chatId(),
    message_id: messageId,
    text,
    parse_mode: "HTML",
  });
}

// ── Edit message with updated keyboard ────────────────────────────────────────
export async function editMessageWithKeyboard(
  messageId: number,
  text: string,
  keyboard?: InlineButton[][]
): Promise<void> {
  const body: Record<string, unknown> = {
    chat_id: chatId(),
    message_id: messageId,
    text,
    parse_mode: "HTML",
  };
  if (keyboard?.length) {
    body.reply_markup = { inline_keyboard: keyboard };
  }
  await apiCall("editMessageText", body);
}

// ── Answer a callback query (clears the spinner) ──────────────────────────────
export async function answerCallback(queryId: string, text?: string): Promise<void> {
  await apiCall("answerCallbackQuery", {
    callback_query_id: queryId,
    text,
  });
}

// ── Types for incoming updates ────────────────────────────────────────────────
export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    chat: { id: number };
    from?: { id: number; username?: string };
    text?: string;
  };
  callback_query?: {
    id: string;
    from: { id: number };
    message: {
      message_id: number;
      chat: { id: number };
    };
    data?: string;
  };
}
