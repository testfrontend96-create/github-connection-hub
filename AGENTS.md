# Project conventions

- Keep shared Hub navigation in `src/components/chrome.tsx` with navigation-specific tokens and styles in `src/overrides.css`, so all pages share one header without altering page content.
- Use `PRODUCT_NAV` for the main brand navigation and `SUB_CHANNELS` for the Hub navigation, with separate desktop rows and grouped mobile menus to keep destinations consistent.
- Import transferred media through this project's own asset pointers; source-project pointers do not resolve here.