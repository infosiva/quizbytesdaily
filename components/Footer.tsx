import Link from "next/link";

interface FooterLink {
  label: string;
  href: string;
}

interface FooterProps {
  siteName: string;
  tagline?: string;
  icon?: string;
  /** Extra nav links alongside the always-present compliance links */
  extraLinks?: FooterLink[];
  className?: string;
}

/**
 * Canonical dark glass footer for all Siva projects.
 * Always includes: Privacy Policy, Terms, About, Contact.
 * Source of truth: shared-ui/src/layout/Footer.tsx
 * Usage: <Footer siteName="Kwizzo" icon="🎮" tagline="Quiz your family" />
 */
export default function Footer({
  siteName,
  tagline,
  icon,
  extraLinks = [],
  className = "",
}: FooterProps) {
  const year = new Date().getFullYear();

  const complianceLinks: FooterLink[] = [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  const allLinks = [...complianceLinks, ...extraLinks];

  return (
    <footer className={`w-full border-t mt-auto ${className}`} style={{ borderColor: '#e2e8f0', background: 'var(--background, #FAF9F6)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Brand + links row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            {(icon || siteName) && (
              <div className="flex items-center gap-2 mb-1.5">
                {icon && <span className="text-xl">{icon}</span>}
                <span className="font-bold text-sm" style={{ color: '#0f172a' }}>{siteName}</span>
              </div>
            )}
            {tagline && (
              <p className="text-xs max-w-xs" style={{ color: '#64748b' }}>{tagline}</p>
            )}
          </div>

          <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-4 text-xs" style={{ color: '#64748b' }}>
            {allLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:underline transition-colors" style={{ color: '#64748b' }}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs" style={{ borderColor: '#e2e8f0', color: '#94a3b8' }}>
          <span>© {year} {siteName}. All rights reserved.</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Built with AI
          </span>
        </div>
      </div>
    </footer>
  );
}
