'use client'
import { useEffect, useRef, useState } from 'react'

interface AdUnitProps {
  size?: 'banner' | 'rectangle'
  className?: string
  /** 'affiliate' = rotating affiliate banners (earns now, no approval needed)
   *  'adsterra'  = Adsterra iframe unit (needs real key set below)
   *  'auto'      = affiliate first, placeholder if Adsterra not configured */
  mode?: 'affiliate' | 'adsterra' | 'auto'
}

// ── Adsterra zone keys — replace with real keys from adsterra.com dashboard ──
// Until real keys are set, component falls back to affiliate banners automatically
const ADSTERRA_KEY_BANNER = process.env.NEXT_PUBLIC_ADSTERRA_BANNER_KEY || ''
const ADSTERRA_KEY_RECT   = process.env.NEXT_PUBLIC_ADSTERRA_RECT_KEY   || ''

// ── Affiliate banners — earn commission immediately, no approval needed ────────
// Hostinger: $60–$150 per hosting sale (60% commission)
// Namecheap: 35% on domains/hosting
// Coursera:  45% on course purchases
// Amazon:    up to 10% on anything
const AFFILIATE_BANNERS = [
  {
    label: 'Hostinger',
    bg: 'from-[#673DE6]/20 to-[#4B2DB5]/10',
    border: 'border-[#673DE6]/30',
    icon: '🚀',
    headline: 'Web Hosting from $1.99/mo',
    sub: 'Blazing fast • Free domain • 99.9% uptime',
    cta: 'Get Started →',
    ctaColor: 'bg-[#673DE6]',
    url: 'https://www.hostinger.com/web-hosting?REFERRALCODE=1SIVA54',
  },
  {
    label: 'Namecheap',
    bg: 'from-[#DE3C21]/20 to-[#E8630A]/10',
    border: 'border-[#DE3C21]/30',
    icon: '🌐',
    headline: 'Domains from $0.99',
    sub: 'Free WhoisGuard • Easy DNS • SSL included',
    cta: 'Find Your Domain →',
    ctaColor: 'bg-[#DE3C21]',
    url: 'https://www.namecheap.com/?aff=137589',
  },
  {
    label: 'Coursera',
    bg: 'from-[#0056D2]/20 to-[#003594]/10',
    border: 'border-[#0056D2]/30',
    icon: '🎓',
    headline: 'Learn from Top Universities',
    sub: 'AI • Data Science • Business — Free trials available',
    cta: 'Explore Courses →',
    ctaColor: 'bg-[#0056D2]',
    url: 'https://www.coursera.org/?utm_source=quizbytesdaily&utm_medium=referral',
  },
  {
    label: 'Amazon',
    bg: 'from-[#FF9900]/20 to-[#E47911]/10',
    border: 'border-[#FF9900]/30',
    icon: '📦',
    headline: 'Amazon Prime — 30 Days Free',
    sub: 'Movies • Music • Fast delivery • Unlimited reading',
    cta: 'Start Free Trial →',
    ctaColor: 'bg-[#FF9900] text-black',
    url: 'https://www.amazon.com/prime?tag=quizbytesdaily-20',
  },
]

function AffiliateBanner({ size }: { size: 'banner' | 'rectangle' }) {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % AFFILIATE_BANNERS.length), 8000)
    return () => clearInterval(t)
  }, [])

  const b = AFFILIATE_BANNERS[idx]

  if (size === 'banner') {
    return (
      <a
        href={b.url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className={`flex items-center gap-4 w-full px-5 py-3 rounded-xl bg-gradient-to-r ${b.bg} border ${b.border} hover:opacity-90 transition-opacity`}
        style={{ minHeight: 60 }}
      >
        <span className="text-2xl">{b.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-white font-semibold text-sm truncate">{b.headline}</div>
          <div className="text-white/50 text-xs truncate">{b.sub}</div>
        </div>
        <span className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg text-white ${b.ctaColor}`}>{b.cta}</span>
      </a>
    )
  }

  return (
    <a
      href={b.url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={`flex flex-col gap-2 w-full px-5 py-4 rounded-xl bg-gradient-to-br ${b.bg} border ${b.border} hover:opacity-90 transition-opacity`}
      style={{ minHeight: 180 }}
    >
      <span className="text-3xl">{b.icon}</span>
      <div className="text-white font-bold text-base">{b.headline}</div>
      <div className="text-white/50 text-sm">{b.sub}</div>
      <span className={`mt-auto self-start text-xs font-bold px-3 py-1.5 rounded-lg text-white ${b.ctaColor}`}>{b.cta}</span>
    </a>
  )
}

export default function AdUnit({ size = 'rectangle', className = '', mode = 'auto' }: AdUnitProps) {
  const adKey   = size === 'banner' ? ADSTERRA_KEY_BANNER : ADSTERRA_KEY_RECT
  const width   = size === 'banner' ? 728 : 300
  const height  = size === 'banner' ? 90  : 250
  const ref     = useRef<HTMLDivElement>(null)
  const loaded  = useRef(false)

  const useAdsterra = (mode === 'adsterra' || mode === 'auto') && !!adKey

  useEffect(() => {
    if (!useAdsterra || loaded.current || !ref.current) return
    loaded.current = true
    const s = document.createElement('script')
    s.type = 'text/javascript'
    s.setAttribute('data-cfasync', 'false')
    s.text = `(function(){var o={key:'${adKey}',format:'iframe',height:${height},width:${width},params:{}};var s=document.createElement('script');s.type='text/javascript';s.setAttribute('data-cfasync','false');s.src='//epnzryrk.com/act/files/tag.min.js';document.currentScript.parentNode.appendChild(s);window.atOptions=o;})();`
    ref.current.appendChild(s)
  }, [adKey, height, width, useAdsterra])

  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      <div className="text-[9px] text-white/10 text-center mb-0.5 uppercase tracking-widest">Sponsored</div>
      {useAdsterra
        ? <div ref={ref} style={{ width, maxWidth: '100%', minHeight: height }} />
        : <AffiliateBanner size={size} />
      }
    </div>
  )
}
