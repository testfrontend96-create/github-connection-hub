# Project conventions

- Keep shared Hub navigation in `src/components/chrome.tsx` with navigation-specific tokens and styles in `src/overrides.css`, so all pages share one header without altering page content.
- Use `PRODUCT_NAV` for the main brand navigation and `SUB_CHANNELS` for the Hub navigation, with separate desktop rows and grouped mobile menus to keep destinations consistent.
- Keep the desktop Hub row’s scroll-collapse and expandable current-page control in the shared header so every Hub page behaves consistently.
- Import transferred media through this project's own asset pointers; source-project pointers do not resolve here.
- Keep How To entries in the Knowledge Base directory and centralize guide URLs in the browsing helpers; legacy links redirect there to preserve access.
- Share the `SearchField` control (`src/components/controls.tsx`) and content filtering helpers across browsing pages so combined filters and search behave consistently.
- Render section "see more" links with the shared `MoreLink` control (`src/components/controls.tsx`, styled once as `.section-cta`) so every section on a page carries the same call-to-action.
- Let top heading bands run up behind the fixed header (band pulled up with compensating top padding) and keep the bar's fill transparent only while the band still covers it, so the band's glow is never clipped but the links stay legible over light content.
- Scope a single page's band or section spacing with `#main:has(<marker only that page has>)` selectors rather than editing the shared `.page-head--compact` / `.section` rules, so one page's layout target never moves the other Hub pages.
- Keep every Hub page's heading band at the shared compact band's padding and text sizes; when a page must fit in one screen, trim section and grid spacing instead of the band, so headings stay identical across the Hub.
- Use shared compact `PageHead` on linked detail pages as well as directories, retaining their own breadcrumbs, metadata and imagery as children so typography, band spacing and effects stay consistent.
- Where a flattened brand mark renders wrong, swap in that platform's canonical single-path logo rather than hand-editing the flattened geometry; keep the per-platform watermark bleed in one shared rule and override only the marks whose artwork shape needs it.
- Apply the Unified Design System type scale, spacing rhythm and corner radii as one layer at the end of `src/overrides.css`, keeping the Hub colour palette, so typography and shapes change in one place.
- Resolve episode thumbnail images from project-owned asset pointers in the episode data so all feed, listing, and detail views use the same verified artwork.
- Keep editorial grid thumbnail proportions shared across content formats and sized by the lead/small grid tracks, so mixed-content rows align without clipping podcast artwork.
- Define shared content-glass tokens and surface rules in `src/overrides.css`, with light-page adaptations and photo tiles excluded, so glass styling stays consistent without obscuring artwork.
- Scope Knowledge Base summary-card styling to `.knowledge-stats` in `src/overrides.css`; its plus controls reuse the directory type filter so the Sales-inspired cards retain meaningful actions.
