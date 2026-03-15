export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Shield shape */}
      <path
        d="M20 2L4 10V20C4 30 12 37 20 39C28 37 36 30 36 20V10L20 2Z"
        fill="currentColor"
        opacity="0.15"
      />
      <path
        d="M20 2L4 10V20C4 30 12 37 20 39C28 37 36 30 36 20V10L20 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Speedometer / steering wheel */}
      <circle cx="20" cy="19" r="8" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="20" cy="19" r="2.5" fill="currentColor" />
      {/* Speed lines */}
      <line x1="20" y1="11" x2="20" y2="13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="14.34" y1="13.34" x2="16.11" y2="15.11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="25.66" y1="13.34" x2="23.89" y2="15.11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="19" x2="14.5" y2="19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="25.5" y1="19" x2="28" y2="19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {/* DH text */}
      <text
        x="20"
        y="32"
        textAnchor="middle"
        fontSize="6"
        fontWeight="bold"
        fill="currentColor"
        fontFamily="system-ui, sans-serif"
      >
        DH
      </text>
    </svg>
  )
}
