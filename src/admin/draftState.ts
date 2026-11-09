export type DraftChange = {
  table: 'content_items' | 'home_features' | 'site_settings'
  key: string
  kind?: string
  operation: 'upsert' | 'delete'
  value?: any
}
export const changeKey = (c: DraftChange) => `${c.table}:${c.kind || ''}:${c.key}`
export function stageChange(changes: DraftChange[], change: DraftChange): DraftChange[] {
  return [...changes.filter(c => changeKey(c) !== changeKey(change)), change]
}
export function overlayRows<T extends Record<string, any>>(rows: T[], changes: DraftChange[], table: DraftChange['table'], kind?: string): T[] {
  let out = [...rows]
  for (const c of changes.filter(c => c.table === table && (!kind || c.kind === kind))) {
    const key = table === 'home_features' ? 'slot' : table === 'site_settings' ? 'key' : 'slug'
    out = out.filter(r => r[key] !== c.key)
    if (c.operation !== 'delete') out.push((table === 'site_settings' ? { key: c.key, value: c.value } : c.value) as T)
  }
  return out
}