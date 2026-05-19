import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

let _groq: Groq | null = null
function groq() { if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY! }); return _groq }

export async function POST(req: NextRequest) {
  try {
    const { messages, system } = await req.json()
    const sysPrompt = system ?? 'You are QuizBytes AI — a trivia and quiz expert. Help users learn facts, understand quiz topics, discover interesting trivia, and improve their general knowledge. Be engaging and educational.'
    const res = await groq().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: sysPrompt }, ...messages],
      max_tokens: 400,
    })
    return NextResponse.json({ text: res.choices[0]?.message?.content ?? 'Ask me any trivia question!' })
  } catch {
    return NextResponse.json({ text: 'Play today\'s quiz above or ask me a trivia question!' }, { status: 200 })
  }
}
