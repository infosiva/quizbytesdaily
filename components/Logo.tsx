// Project logo: glyph + wordmark, key word in the hub-switchable accent.
export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 800, letterSpacing: '-0.02em' }}>
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="color-mix(in oklab, var(--accent) 14%, var(--bg))" />
        <g fill="none" stroke="var(--accent)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="9" width="18" height="14" rx="3"/><path d="M12 15h.01M16 15h.01M20 15h.01M12 19h8"/></g>
      </svg>
      <span>Quiz</span><span style={{ color: 'var(--accent)' }}>BytesDaily</span>
    </span>
  )
}
