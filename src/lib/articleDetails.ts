// Full built-in article bodies keyed by slug (block lists from biohackers.world).
const DETAILS = import.meta.glob('../data/article-details/*.json', { eager: true, import: 'default' }) as Record<string, any>
export const builtInDetail = (slug: string): any => DETAILS[`../data/article-details/${slug}.json`]
