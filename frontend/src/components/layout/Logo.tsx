export function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
        <rect width="32" height="32" rx="8" fill="#17263f" />
        <path
          d="M5 18h5l3-8 5 14 3-9 2 3h4"
          fill="none"
          stroke="#5b97ff"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-[17px] font-semibold tracking-tight text-white">UpTrack</span>
    </div>
  )
}
