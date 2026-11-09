// Content edits made in the admin panel, loaded once before the site renders.
// Built-in JSON stays the base; rows here add, replace, hide or delete items.
import { supabase } from '../integrations/supabase/client'

export type ContentRow = {
  kind: string
  slug: string
  data: Record<string, any>
  visible: boolean
  deleted: boolean
  sort: number | null
  updated_at?: string
}
export type HomeFeature = { slot: string; mode: 'latest' | 'popular' | 'pinned'; item_kind: string | null; item_slug: string | null }

type Remote = {
  rows: ContentRow[]
  features: HomeFeature[]
  settings: Record<string, any>
  popular: Record<string, string[]>
}

const EMPTY: Remote = { rows: [], features: [], settings: {}, popular: {} }
let remote: Remote = EMPTY

const withTimeout = <T,>(p: PromiseLike<T>, ms: number): Promise<T | null> =>
  Promise.race([Promise.resolve(p), new Promise<null>((r) => setTimeout(() => r(null), ms))])

/** Fetches all admin edits; resolves within ~3s even when offline (falls back to built-in content). */
export async function loadRemote(): Promise<void> {
  try {
    const all: ContentRow[] = []
    const page = async (from: number) => supabase.from('content_items').select('kind,slug,data,visible,deleted,sort,updated_at').range(from, from + 999)
    const [first, feats, sets, popA, popE] = await Promise.all([
      withTimeout(page(0), 3000),
      withTimeout(supabase.from('home_features').select('slot,mode,item_kind,item_slug'), 3000),
      withTimeout(supabase.from('site_settings').select('key,value'), 3000),
      withTimeout(supabase.rpc('popular_items', { _kind: 'article', _limit: 10 }), 3000),
      withTimeout(supabase.rpc('popular_items', { _kind: 'episode', _limit: 10 }), 3000),
    ])
    if (first?.data) {
      all.push(...(first.data as ContentRow[]))
      let from = 1000
      while (all.length === from) {
        const next = await withTimeout(page(from), 3000)
        if (!next?.data?.length) break
        all.push(...(next.data as ContentRow[]))
        from += 1000
      }
    }
    remote = {
      rows: all,
      features: (feats?.data as HomeFeature[]) ?? [],
      settings: Object.fromEntries(((sets?.data as any[]) ?? []).map((s) => [s.key, s.value])),
      popular: {
        article: ((popA?.data as any[]) ?? []).map((r) => r.slug),
        episode: ((popE?.data as any[]) ?? []).map((r) => r.slug),
      },
    }
  } catch {
    remote = EMPTY
  }
}

export const remoteRows = (kind: string) => remote.rows.filter((r) => r.kind === kind)
export const homeFeature = (slot: string) => remote.features.find((f) => f.slot === slot)
export const siteSetting = <T = any,>(key: string): T | undefined => remote.settings[key]
export const popular = (kind: 'article' | 'episode') => remote.popular[kind] ?? []

/** Records one page view for "most popular" (fire-and-forget). */
export function trackView(kind: 'article' | 'episode' | 'kb' | 'biohacker', slug: string) {
  if (typeof window === 'undefined' || !slug) return
  const key = `hv:${kind}:${slug}`
  if (sessionStorage.getItem(key)) return
  sessionStorage.setItem(key, '1')
  supabase.from('page_views').insert({ kind, slug }).then(() => {})
}

/** Saves a public form entry (Update list, newsletter) for the admin Inbox. */
export async function submitEntry(kind: 'biohacker' | 'newsletter', data: Record<string, any>) {
  const { error } = await supabase.from('submissions').insert({ kind, data })
  if (error) throw new Error(error.message)
}
