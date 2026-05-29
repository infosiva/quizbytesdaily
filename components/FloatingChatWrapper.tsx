'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function FloatingChatWrapper() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<{ role: 'user' | 'bot'; text: string }[]>([
    { role: 'bot', text: "Pick a topic — Python, AI/ML, System Design, or Algorithms. I'll quiz you right now." },
  ])
  const [input, setInput] = useState('')

  async function send() {
    if (!input.trim()) return
    const userMsg = input
    setMsgs(m => [...m, { role: 'user', text: userMsg }])
    setInput('')
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: userMsg }] }),
      })
      const data = await res.json()
      setMsgs(m => [...m, { role: 'bot', text: data.text || 'Happy to help!' }])
    } catch {
      setMsgs(m => [...m, { role: 'bot', text: 'Try again in a moment!' }])
    }
  }

  return (
    <>
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
        style={{ position: 'fixed', bottom: 24, right: 24, width: 52, height: 52, borderRadius: '50%',
          background: 'linear-gradient(135deg,#f59e0b,#d97706)', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(245,158,11,0.3)', zIndex: 1000, fontSize: 20 }}
      >
        {open ? '✕' : '🎯'}
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            style={{ position: 'fixed', bottom: 88, right: 24, width: 320, height: 420,
              background: 'rgba(8,8,20,0.97)', border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: 16, display: 'flex', flexDirection: 'column', zIndex: 1000,
              overflow: 'hidden', backdropFilter: 'blur(20px)' }}
          >
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(245,158,11,0.3)', fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>
              QuizBytes AI
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {msgs.map((m, i) => (
                <div key={i} style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  background: m.role === 'user' ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.06)',
                  padding: '8px 12px', borderRadius: 10, fontSize: 12, color: 'rgba(248,250,252,0.9)', maxWidth: '85%',
                }}>{m.text}</div>
              ))}
            </div>
            <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(245,158,11,0.3)', display: 'flex', gap: 8 }}>
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder='Ask me any trivia question!'
                style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(245,158,11,0.3)',
                  borderRadius: 8, padding: '6px 10px', fontSize: 12, color: '#f8fafc', outline: 'none' }} />
              <button onClick={send}
                style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: '#fff', cursor: 'pointer' }}>→</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
