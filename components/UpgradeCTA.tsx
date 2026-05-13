export default function UpgradeCTA() {
  return (
    <section className="my-8 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-900/20 to-orange-900/20 p-6 text-center">
      <div className="mb-3 inline-block rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-400">
        PRO
      </div>
      <h3 className="mb-2 text-lg font-bold">Unlock everything — one-time $9</h3>
      <ul className="mb-4 space-y-1 text-sm text-gray-300">
        <li>No ads · Unlimited access · Priority support</li>
      </ul>
      <a
        href="https://buy.stripe.com/placeholder"
        target="_blank"
        rel="noopener"
        className="inline-block rounded-xl bg-amber-500 px-8 py-3 font-bold text-black hover:bg-amber-400 transition-colors"
      >
        Get Pro — $9 one-time
      </a>
      <p className="mt-2 text-xs text-gray-500">Secure payment via Stripe · 30-day refund</p>
    </section>
  );
}
