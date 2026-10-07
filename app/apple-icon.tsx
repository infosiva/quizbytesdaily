import { ImageResponse } from 'next/og'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'
export default function AppleIcon() {
  return new ImageResponse(
    (<div style={{ width: 180, height: 180, background: '#14091c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="110" height="110" viewBox="0 0 32 32" fill="none" stroke="#d946ef" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="9" width="18" height="14" rx="3"/><path d="M12 15h.01M16 15h.01M20 15h.01M12 19h8"/></svg>
    </div>), size)
}
