// Small line icons for the admin panel (Lucide-style, 16px).
const s = (d: React.ReactNode, fill = 'none') => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
)
export const I = {
  x: s(<path d="M18 6 6 18M6 6l12 12" />),
  plus: s(<path d="M12 5v14M5 12h14" />),
  check: s(<path d="m5 12 5 5L20 7" />),
  up: s(<path d="m18 15-6-6-6 6" />),
  down: s(<path d="m6 9 6 6 6-6" />),
  trash: s(<><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></>),
  pencil: s(<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />),
  image: s(<><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></>),
  star: s(<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1Z" />),
  starFill: s(<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1Z" />, 'currentColor'),
  eye: s(<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>),
  eyeOff: s(<><path d="M9.9 4.2A10 10 0 0 1 12 4c6.5 0 10 8 10 8a17 17 0 0 1-3.2 4.2M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6" /><path d="m2 2 20 20" /></>),
  ext: s(<><path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></>),
  panel: s(<><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></>),
  split: s(<><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M12 3v18" /></>),
  monitor: s(<><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></>),
  swap: s(<path d="M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4" />),
  logout: s(<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />),
  undo: s(<path d="M3 7v6h6M21 17a9 9 0 0 0-15-6.7L3 13" />),
  refresh: s(<path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5" />),
  shield: s(<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />),
  inbox: s(<><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6Z" /></>),
  restore: s(<path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" />),
  history: s(<><path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" /><path d="M12 7v5l3 2" /></>),
  download: s(<path d="M12 3v12M7 10l5 5 5-5M5 21h14" />),
}
