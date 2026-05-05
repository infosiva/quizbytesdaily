'use client'
import { useEffect, useRef } from 'react'

interface AdUnitProps {
  size?: 'banner' | 'rectangle'
  className?: string
}

// ── Adsterra keys for quizbytes.dev (approved 2026-05-04) ───────────────────
const ADSTERRA_KEY_RECT   = '1753338cf4100ee950b4ab7fa495580a'  // 300×250
const ADSTERRA_KEY_BANNER = 'a43616513958134eaae287099c00b50c'  // 728×90


// Social Bar — sticky bottom bar, injected once into body
export function SocialBar() {
  const loaded = useRef(false)
  useEffect(() => {
    if (loaded.current) return
    loaded.current = true
    const s = document.createElement('script')
    s.async = true
    s.setAttribute('data-cfasync', 'false')
    s.src = '//pl29337037.profitablecpmratenetwork.com/47/d0/82/47d082af8dd8cdfba26e03857d3b001c.js'
    document.body.appendChild(s)
  }, [])
  return null
}

export default function AdUnit({ size = 'rectangle', className = '' }: AdUnitProps) {
  const adKey  = size === 'banner' ? ADSTERRA_KEY_BANNER : ADSTERRA_KEY_RECT
  const width  = size === 'banner' ? 728 : 300
  const height = size === 'banner' ? 90  : 250
  const ref    = useRef<HTMLDivElement>(null)
  const loaded = useRef(false)

  useEffect(() => {
    if (loaded.current || !ref.current) return
    loaded.current = true
    const s = document.createElement('script')
    s.type = 'text/javascript'
    s.setAttribute('data-cfasync', 'false')
    s.text = `(function(){var o={key:'${adKey}',format:'iframe',height:${height},width:${width},params:{}};var d=document.createElement('script');d.type='text/javascript';d.setAttribute('data-cfasync','false');d.src='//www.highperformanceformat.com/${adKey}/invoke.js';var c=document.currentScript||document.scripts[document.scripts.length-1];c.parentNode.insertBefore(d,c.nextSibling);window.atOptions=o;})();`
    ref.current.appendChild(s)
  }, [adKey, height, width])

  return (
    <div className={className} style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.1)', textAlign: 'center', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sponsored</div>
      <div ref={ref} style={{ width, maxWidth: '100%', minHeight: height }} />
    </div>
  )
}
