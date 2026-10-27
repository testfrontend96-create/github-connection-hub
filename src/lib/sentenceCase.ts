// Sentence case for titles: first word (and the first word after ":", "?", "!",
// "|", "." or a dash) capitalised; everything else lower case unless it is an
// acronym, contains a digit, or is a known proper noun (people, places, brands).
const PROPER = new Set([
  'Dr.', 'Botox', 'Patrick', 'Porter', 'Nathan', 'S', 'Bryan', 'Mike', 'C-Roc',
  'Lea', 'Llovio', 'Alison', 'Fiori', 'Arabica', 'Cunegin', 'Natalia', 'Naila', 'I', 'Miami',
  'Europe', 'America', 'USA', 'Instagram', 'YouTube', 'Facebook', 'Reddit', 'Spotify', 'Apple',
])
const BREAK = /[:?!|.—–]$/

export function sentenceCase(title: string): string {
  if (!title) return title
  const parts = title.split(/(\s+)/)
  let start = true
  return parts.map((tok) => {
    if (/^\s+$/.test(tok) || !tok) return tok
    const m = tok.match(/^([^\p{L}\d]*)(.*?)([^\p{L}\d.]*)$/u)!
    const [, pre, core, post] = m
    let out = core
    const bare = core.replace(/[.'’]+$/, '')
    const keep = PROPER.has(core) || PROPER.has(bare) || /\d/.test(core) || (bare.length > 1 && bare === bare.toUpperCase() && /\p{L}/u.test(bare))
    if (!keep && core) out = core.toLowerCase()
    if (start && out) out = out[0].toUpperCase() + out.slice(1)
    if (core || pre.match(/\p{L}/u)) start = false
    if (BREAK.test(tok) || /^[|—–]$/.test(tok)) start = true
    return pre + out + post
  }).join('')
}
