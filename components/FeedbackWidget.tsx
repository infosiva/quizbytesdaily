'use client'
import { useState } from 'react'

export default function FeedbackWidget({ siteName = 'this site' }: { siteName?: string }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  const submit = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: text, site: siteName })
      })
      setSent(true)
    } catch { setSent(true) }
    setSending(false)
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{ position:'fixed', bottom:88, right:24, zIndex:9997, background:'rgba(0,0,0,0.06)', border:'1px solid rgba(0,0,0,0.12)', borderRadius:20, padding:'5px 12px', fontSize:12, fontWeight:600, color:'#64748b', cursor:'pointer', backdropFilter:'blur(8px)' }}>
      Feedback
    </button>
  )

  return (
    <div style={{ position:'fixed', bottom:88, right:90, zIndex:9997, width:280, background:'#fff', borderRadius:12, boxShadow:'0 4px 24px rgba(0,0,0,0.14)', padding:16, display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontWeight:700, fontSize:14, color:'#0f172a' }}>Send feedback</span>
        <button onClick={() => setOpen(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#64748b', fontSize:18, lineHeight:1 }}>x</button>
      </div>
      {sent ? (
        <p style={{ fontSize:13, color:'#059669', margin:0 }}>Thanks! Feedback received</p>
      ) : (
        <>
          <textarea value={text} onChange={e=>setText(e.target.value)} placeholder={`What do you think of ${siteName}?`} rows={3} style={{ border:'1px solid #e2e8f0', borderRadius:8, padding:'8px 10px', fontSize:13, resize:'none', outline:'none', fontFamily:'inherit' }} />
          <button onClick={submit} disabled={sending || !text.trim()} style={{ background:'#2563eb', color:'#fff', border:'none', borderRadius:8, padding:'8px 0', fontSize:13, fontWeight:600, cursor:'pointer', opacity: sending || !text.trim() ? 0.5 : 1 }}>
            {sending ? 'Sending...' : 'Send'}
          </button>
        </>
      )}
    </div>
  )
}
