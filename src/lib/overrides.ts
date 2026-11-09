// Merges admin edits over the built-in JSON lists. Pure, so the admin panel
// can show exactly what the site will render.
import type { ContentRow } from './remote'

export const keyOf = (s: string) =>
  (s || '').toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 120)

export type Merged<T> = T & { _slug: string; _origin: 'built-in' | 'edited' | 'new'; _visible: boolean; _deleted: boolean }

/**
 * base items keyed by `keyFn`; each row with the same key replaces fields
 * (row.data spread over the base), new keys append, deleted/hidden drop out
 * unless `includeHidden`.
 */
export function mergeRows<T extends Record<string, any>>(
  base: T[],
  rows: ContentRow[],
  keyFn: (x: T) => string,
  includeHidden = false,
): Merged<T>[] {
  const byKey = new Map(rows.map((r) => [r.slug, r]))
  const out: Merged<T>[] = []
  const seen = new Set<string>()
  for (const b of base) {
    const k = keyFn(b)
    seen.add(k)
    const r = byKey.get(k)
    const item = { ...b, ...(r?.data ?? {}), _slug: k, _origin: r ? 'edited' : 'built-in', _visible: r ? r.visible : true, _deleted: r ? r.deleted : false } as Merged<T>
    out.push(item)
  }
  for (const r of rows) {
    if (seen.has(r.slug)) continue
    out.push({ ...(r.data as T), _slug: r.slug, _origin: 'new', _visible: r.visible, _deleted: r.deleted } as Merged<T>)
  }
  return includeHidden ? out.filter((x) => !x._deleted) : out.filter((x) => x._visible && !x._deleted)
}

/** Drops the bookkeeping fields before handing items to the site. */
export const strip = <T extends Record<string, any>>(x: T) => {
  const { _slug, _origin, _visible, _deleted, ...rest } = x as any
  return rest as T
}
