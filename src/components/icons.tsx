// Inline SVG icons, ported 1:1 from build.py so hub.css sizes them unchanged.
export const IconArrow = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 8h10M9 4l4 4-4 4" />
  </svg>
)
export const IconLink = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M8.5 11.5a3.5 3.5 0 0 0 5 0l2.5-2.5a3.5 3.5 0 0 0-5-5L10 5" />
    <path d="M11.5 8.5a3.5 3.5 0 0 0-5 0L4 11a3.5 3.5 0 0 0 5 5l1-1" />
  </svg>
)
export const IconSearch = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
    <circle cx="9" cy="9" r="6" /><path d="M13.5 13.5 17 17" />
  </svg>
)
export const IconClose = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
    <path d="M5.5 5.5l9 9M14.5 5.5l-9 9" />
  </svg>
)
export const IconChevron = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5.5 8l4.5 4.5L14.5 8" />
  </svg>
)
export const TnArrow = () => (
  <svg className="tn-arrow" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.1667" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2.92 7H11.08" /><path d="M7 2.92L11.08 7L7 11.08" />
  </svg>
)
// the two play/pause glyphs (CSS toggles which shows)
export const PlayIcons = () => (
  <>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" fill="currentColor" /></svg>
    <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4.2" height="14" rx="1.2" fill="currentColor" /><rect x="13.8" y="5" width="4.2" height="14" rx="1.2" fill="currentColor" /></svg>
  </>
)
