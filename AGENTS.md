# Project conventions

- Keep shared Hub navigation in `src/components/chrome.tsx` with navigation-specific tokens and styles in `src/overrides.css`, so all pages share one header without altering page content.
- Use the existing Hub page list from `SUB_CHANNELS` for both desktop and mobile navigation to keep destinations consistent.
- Import transferred media through this project's own asset pointers; source-project pointers do not resolve here.