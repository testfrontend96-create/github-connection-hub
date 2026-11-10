import { useEffect, useState } from 'react'

// Admin "see an example" overlay: draws red frames over the parts of a real article that a form section controls.
const MAP: Record<string, [string, string][]> = {
  basics: [['.art-hero-title h1', 'Title'], ['.art-meta > div:nth-child(3)', 'Publish date'], ['.art-meta > div:nth-child(4)', 'Reading time']],
  cover: [['.art-hero-img', 'Cover image'], ['.art-intro', 'Opening paragraph']],
  body: [['@body', 'Article body']],
  tags: [['.art-meta > div:nth-child(2)', 'Hub topic'], ['.mentions', 'Linked terms']],
  writer: [['.art-meta-author', 'Writer photo, name and role']],
  highlights: [['.art-highlights', 'Highlights'], ['.art-faq', 'Article FAQ']],
}
const SKIP = ['art-intro', 'art-news', 'art-highlights', 'mentions', 'art-faq']

type Box = { top: number; left: number; width: number; height: number; label: string }

function union(els: Element[]) {
  const rs = els.map((e) => e.getBoundingClientRect()).filter((r) => r.width && r.height)
  if (!rs.length) return null
  const t = Math.min(...rs.map((r) => r.top)), l = Math.min(...rs.map((r) => r.left))
  return { top: t + scrollY, left: l + scrollX, width: Math.max(...rs.map((r) => r.right)) - l, height: Math.max(...rs.map((r) => r.bottom)) - t }
}

export default function ExampleHighlight({ example }: { example: string | null }) {
  const [boxes, setBoxes] = useState<Box[]>([])
  useEffect(() => {
    const spec = example && MAP[example]
    if (!spec) return
    let first = true
    const measure = () => {
      const out: Box[] = []
      for (const [sel, label] of spec) {
        const els = sel === '@body'
          ? Array.from(document.querySelectorAll('.art-body .prose > *')).filter((e) => !SKIP.some((c) => e.classList.contains(c)))
          : Array.from(document.querySelectorAll(sel))
        const u = union(els)
        if (u) out.push({ ...u, label })
      }
      setBoxes(out)
      if (first && out.length) { first = false; scrollTo({ top: Math.max(0, out[0].top - 140) }) }
    }
    const t = setTimeout(measure, 300)
    const ro = new ResizeObserver(measure); ro.observe(document.body)
    return () => { clearTimeout(t); ro.disconnect() }
  }, [example])
  if (!boxes.length) return null
  return <>{boxes.map((b, i) => (
    <div key={i} aria-hidden="true" style={{ position: 'absolute', top: b.top - 8, left: b.left - 8, width: b.width + 16, height: b.height + 16, border: '2px solid #E5484D', borderRadius: 14, pointerEvents: 'none', zIndex: 60, boxShadow: '0 0 0 4px rgba(229,72,77,.12)' }}>
      <span style={{ position: 'absolute', top: -13, left: 12, background: '#E5484D', color: '#fff', font: '600 12px/1 system-ui, sans-serif', padding: '6px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>{b.label}</span>
    </div>
  ))}</>
}
