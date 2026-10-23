# Project conventions

- Keep shared Hub navigation in `src/components/chrome.tsx` with navigation-specific tokens and styles in `src/overrides.css`, so all pages share one header without altering page content.
- Use `PRODUCT_NAV` for the main brand navigation and `SUB_CHANNELS` for the Hub navigation, with separate desktop rows and grouped mobile menus to keep destinations consistent.
- Keep the desktop Hub row’s scroll-collapse and expandable current-page control in the shared header so every Hub page behaves consistently.
- Import transferred media through this project's own asset pointers; source-project pointers do not resolve here.
- Keep How To entries in the Knowledge Base directory and centralize guide URLs in the browsing helpers; legacy links redirect there to preserve access.
- Share search controls and content filtering helpers across browsing pages so combined filters and search behave consistently.
- Render section "see more" links with the shared `MoreLink` control (`src/components/controls.tsx`, styled once as `.section-cta`) so every section on a page carries the same call-to-action.