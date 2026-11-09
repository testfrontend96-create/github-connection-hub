// One shared hover tooltip for every icon-only admin button (reads data-tip, falls back to aria-label).
import { useEffect, useState } from 'react'

const SEL = '.adm [data-tip], .adm .adm-icon-btn[aria-label], .adm .adm-block-plus[aria-label]'

export function Tooltips() {
  const [tip, setTip] = useState<{ text: string; x: number; y: number; below: boolean } | null>(null)
  useEffect(() => {
    let timer: number | undefined
    const show = (e: Event) => {
      const el = (e.target as Element)?.closest?.(SEL) as HTMLElement | null
      if (!el) return
      const text = el.dataset.tip || el.getAttribute('aria-label') || ''
      if (!text) return
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        const r = el.getBoundingClientRect()
        const below = r.top < 48
        setTip({ text, x: r.left + r.width / 2, y: below ? r.bottom + 8 : r.top - 8, below })
      }, 250)
    }
    const hide = (e: Event) => {
      const el = (e.target as Element)?.closest?.(SEL)
      if (el && (e as MouseEvent).relatedTarget && el.contains((e as MouseEvent).relatedTarget as Node)) return
      window.clearTimeout(timer); setTip(null)
    }
    const clear = () => { window.clearTimeout(timer); setTip(null) }
    document.addEventListener('mouseover', show); document.addEventListener('mouseout', hide)
    document.addEventListener('focusin', show); document.addEventListener('focusout', clear)
    window.addEventListener('scroll', clear, true); document.addEventListener('mousedown', clear)
    return () => {
      document.removeEventListener('mouseover', show); document.removeEventListener('mouseout', hide)
      document.removeEventListener('focusin', show); document.removeEventListener('focusout', clear)
      window.removeEventListener('scroll', clear, true); document.removeEventListener('mousedown', clear)
    }
  }, [])
  if (!tip) return null
  return <div className="adm-tip" role="tooltip" style={{ left: tip.x, top: tip.y, transform: `translate(-50%, ${tip.below ? '0' : '-100%'})` }}>{tip.text}</div>
}
