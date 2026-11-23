export function ArrowIcon({ direction = 'right' }: { direction?: 'right' | 'down' | 'left' }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" style={{ flexShrink: 0, transform: direction === 'down' ? 'rotate(90deg)' : direction === 'left' ? 'rotate(180deg)' : undefined }}>
      <path d="M4 12h15M13 5l7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
