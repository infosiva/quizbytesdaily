import { NextRequest, NextResponse } from 'next/server'
import { AI_LIMITER } from '@/lib/rateLimit'

type Msg = { role: string; content: string }
const FALLBACK = "Play today's quiz above or ask me a trivia question!"

// Free chain: Groq -> Gemini -> Cerebras. Each tier is skipped when its key is unset; failures fall through.
async function openaiStyle(url: string, key: string, model: string, messages: Msg[]) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages, max_tokens: 500 }),
    signal: AbortSignal.timeout(15000),
  })
  if (!r.ok) throw new Error(`${r.status}`)
  return (await r.json()).choices?.[0]?.message?.content as string | undefined
}

async function gemini(key: string, messages: Msg[]) {
  const sys = messages.find((m) => m.role === 'system')?.content ?? ''
  const contents = messages.filter((m) => m.role !== 'system').map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }))
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: sys }] }, contents, generationConfig: { maxOutputTokens: 500 } }),
    signal: AbortSignal.timeout(15000),
  })
  if (!r.ok) throw new Error(`${r.status}`)
  return (await r.json()).candidates?.[0]?.content?.parts?.[0]?.text as string | undefined
}

export async function POST(req: NextRequest) {
  const limited = AI_LIMITER.check(req); if (limited) return limited
  try {
    const { messages = [], system } = await req.json()
    const sys = system ?? 'You are QuizBytes AI, a trivia and quiz expert. Help users learn facts, understand quiz topics, discover interesting trivia, and improve their general knowledge. Be engaging and educational. If asked anything outside quizzes and learning, reply: "I\'m trained for QuizBytesDaily. For that, try Google or ChatGPT!"'
    const msgs: Msg[] = [{ role: 'system', content: sys }, ...messages]
    const tiers: Array<() => Promise<string | undefined>> = []
    if (process.env.GROQ_API_KEY) tiers.push(() => openaiStyle('https://api.groq.com/openai/v1/chat/completions', process.env.GROQ_API_KEY!, 'llama-3.3-70b-versatile', msgs))
    if (process.env.GEMINI_API_KEY) tiers.push(() => gemini(process.env.GEMINI_API_KEY!, msgs))
    if (process.env.CEREBRAS_API_KEY) tiers.push(() => openaiStyle('https://api.cerebras.ai/v1/chat/completions', process.env.CEREBRAS_API_KEY!, 'llama-3.3-70b', msgs))
    for (const t of tiers) {
      try { const text = await t(); if (text) return NextResponse.json({ text }) } catch (e) { console.error(JSON.stringify({ level: 'warn', kind: 'chat-tier-failed', message: String(e) })) }
    }
    return NextResponse.json({ text: FALLBACK })
  } catch (e) {
    console.error(JSON.stringify({ level: 'error', kind: 'chat', message: String(e) }))
    return NextResponse.json({ text: FALLBACK })
  }
}
