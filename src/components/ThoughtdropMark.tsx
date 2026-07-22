export function ThoughtdropMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <path
        d="M7.4 8.7 16 12.5A12.8 12.8 0 0 1 24 9.7c3 0 5.7.9 8 2.8l8.6-3.8-3.8 9.7a15.8 15.8 0 0 1 2.5 8.8C39.3 36.4 33.2 42 24 42S8.7 36.4 8.7 27.2c0-3.4.8-6.3 2.5-8.8L7.4 8.7Z"
        fill="var(--color-amber)"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M16 12.5 19.2 17M32 12.5 28.8 17" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
      <circle cx="18.4" cy="23" r="6.1" fill="var(--color-bg-modal)" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="29.6" cy="23" r="6.1" fill="var(--color-bg-modal)" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="19.1" cy="23.4" r="2.05" fill="currentColor" />
      <circle cx="28.9" cy="23.4" r="2.05" fill="currentColor" />
      <path d="m24 25.4-2.3 2.2 2.3 1.8 2.3-1.8-2.3-2.2Z" fill="currentColor" stroke="currentColor" strokeWidth=".5" strokeLinejoin="round" />
      <path d="M10.8 29.2c2.1 1.2 3.8 2.9 5 5.1M37.2 29.2a14.2 14.2 0 0 0-5 5.1" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" />
      <path d="M17.2 31.2h14.9l-1.2 10.2H18.4l-1.2-10.2Z" fill="var(--color-bg-modal)" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M20.7 34.4h7.9M20.9 37h6.2" stroke="var(--color-amber-ink)" strokeWidth="1.15" strokeLinecap="round" />
    </svg>
  );
}
