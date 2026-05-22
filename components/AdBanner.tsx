'use client';
import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window { adsbygoogle: unknown[] }
}

// Only loads ad after user scrolls past hero (IntersectionObserver) + 2s min delay.
// This prevents inappropriate/irrelevant ads on the landing screen.
export default function AdBanner() {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timer = setTimeout(() => setShow(true), 500);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -20% 0px' }
    );
    if (ref.current) observer.observe(ref.current);
    return () => { observer.disconnect(); clearTimeout(timer); };
  }, []);

  useEffect(() => {
    if (!show) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, [show]);

  return (
    <div ref={ref} className="flex justify-center my-4" style={{ minHeight: show ? 90 : 0 }}>
      {show && (
        <ins
          className="adsbygoogle"
          style={{ display: 'block', width: '100%', maxWidth: '728px', minHeight: 0 }}
          data-ad-client="ca-pub-4237294630161176"
          data-ad-slot="1234567890"
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      )}
    </div>
  );
}
