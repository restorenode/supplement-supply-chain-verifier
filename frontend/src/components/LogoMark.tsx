/** Brand mark: a sealed ring around a capsule. Colors come from theme variables, so it works in light and dark. */
export default function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false" style={{ flex: "none", overflow: "visible" }}>
      <circle cx="16" cy="16" r="14.5" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="11.5" fill="none" stroke="var(--ink3)" strokeWidth="1" strokeDasharray="1.2 2.1" />
      <g transform="rotate(-45 16 16)">
        <path
          d="M16 12.4H12.6A3.6 3.6 0 0 0 12.6 19.6H16Z"
          fill="var(--acc)"
          stroke="var(--acc)"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path d="M16 12.4H19.4A3.6 3.6 0 0 1 19.4 19.6H16Z" fill="none" stroke="var(--ink)" strokeWidth="1.4" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
