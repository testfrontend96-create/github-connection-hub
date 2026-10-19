# Biohacking Hub — React

A faithful React + Vite + TypeScript port of the Biohackers World Biohacking Hub.
Content lives in `src/data/*.json`; the design system is the original `src/hub.css`,
reused verbatim. The knowledge-graph resolution (symmetric edges, inbound blog/
podcast references, topic & problem rollups) is ported to `src/lib/data.ts`.

## Run
```bash
npm install
npm run dev      # http://localhost:5190
npm run build    # outputs dist/
npm run preview  # serve the production build
```

## Structure
- `src/lib/data.ts` — data + knowledge graph (ported from build.py)
- `src/components/` — TopNav, Footer, PageHead, Player (site-wide podcast dock),
  shared cards/icons, platform logos
- `src/pages/` — Home, Topic, KnowledgeBase, Entity, Blog, Article, Podcast,
  Episode, Biohackers, Profile, Social, FAQ, Problem, Reports/How-To/About/Search
- `src/hub.css` — the original stylesheet, unchanged

## Deploy
It's a static SPA. `npm run build`, then publish `dist/` to Netlify, Cloudflare
Pages, Vercel or GitHub Pages. `public/_redirects` and `vercel.json` provide the
SPA fallback so deep links (e.g. /biohackers/andrew-huberman) resolve.
