# Biohacking Hub admin panel

A private `/admin` page where your team can add, edit, hide and delete everything on the Hub — and choose what the homepage hero features — without asking me.

## Who gets in (same rules as Sales)
- Sign in with Google.
- Any verified `@biohackers.world` account is an admin automatically.
- Admins can add other emails, or revoke access; a revoked email stays blocked even if it's a company address.
- `mykyta.b@biohackers.world` is the protected owner and can't be removed; you can't remove yourself.
- Everyone else sees "Administrators only" with a "Request admin access" button; requests show up in the panel to approve or decline.

## Look and layout (copied from Sales)
- Dark panel with the soft blue/violet glow, rounded glass header card with your photo, email and sign-out.
- Top switcher: **Admin panel / Split view / Live site** (split shows the panel next to the live Hub so you see changes immediately).
- Pill tabs along the top, a list per tab with search, a "Visible" toggle and delete on every row, and the same rounded dark pop-up forms for adding/editing.
- Every image field has drag-and-drop upload with a preview.

## Tabs
1. **Homepage** — the hero section (see below), plus order/visibility of homepage sections.
2. **Blog** — title, slug, cover image, writer (pick from writers list or add new), date, reading time (auto-calculated, can override), Hub topic, category chips, intro paragraph, full article body (paragraphs, headings, images, quotes, "How to start" tips, Highlights, where Events/Academy promos go), related FAQs, links.
3. **Podcast** — title, episode number, guest(s) and host, date, length, thumbnail, audio link, Apple/Spotify/YouTube links, description, takeaways, topic chips, linked Knowledge Base items.
4. **Knowledge Base** — molecules, biomarkers, protocols, concepts and How To guides: name, type, summary, body, steps (How To), duration, related items, topic chips, indicator value.
5. **Top Biohackers** — name, photo + photo credit, role, organisations, website and socials, Focus chips, About, Professional, related episodes; drag to reorder.
6. **Topics & problems** — the 7 topic pages and 6 problem pages: title, intro, "Where to start, in order" steps, concepts, linked articles/episodes.
7. **FAQ** — question, answer, tags, related article.
8. **Events & Academy** — the promo cards inside articles: city, date, colour, image, link.
9. **Social Media** — accounts and posts on the Social Media page.
10. **Inbox** — "Update list" submissions from the Top Biohackers page (add/change/remove suggestions) and newsletter sign-ups, with a "done" mark. These forms finally get saved.
11. **Admins** — who has access, add/revoke emails, access requests, and a change history with undo.

## Homepage hero — what gets featured
The hero has three spots: **Lead story**, **Blog card**, **Podcast card**. For each spot you choose a mode:
- **Latest** — newest blog post / newest episode (default, today's behaviour).
- **Most popular** — most-viewed in the last 30 days (the site starts counting page views once this ships, so it fills up over time).
- **Pinned** — one item you pick.

**Star button:** every row in the Blog and Podcast lists (all 168 articles, all 24 episodes) has a star. Clicking it pins that item to the hero; the star is filled for whatever is currently featured, and only one item per spot can be starred. The Homepage tab shows a live preview of the three cards and which mode each is in.

Also editable there: the "Start here" tile text, the All Topics chips order, and the homepage FAQ picks.

## Rollout
- All existing content (168 articles, 24 episodes, Knowledge Base, biohackers, FAQs, topics, events) is copied in once, so the site looks exactly the same on day one.
- Public pages read from the new content store, falling back to today's built-in content if it can't load — no blank pages.
- Built in stages so you can review: (1) access + panel shell + Homepage hero/stars + Blog + Podcast, (2) Knowledge Base, Top Biohackers, FAQ, (3) Topics, Events, Social, Inbox, history.

## Technical details
- Enable Lovable Cloud. Tables: `articles`, `article_blocks` (jsonb body), `episodes`, `kb_entries`, `howtos`, `biohackers`, `topics`, `problems`, `faqs`, `events`, `social_posts`, `authors`, `home_features` (slot, mode, pinned_id), `page_views`, `submissions`, `admin_emails`, `admin_requests`, `activity_log`, `user_roles` + `has_role()`; profiles for name/avatar only.
- RLS: public read where `visible = true`; writes only via `has_role(auth.uid(),'admin')`. Admin grant via trigger on verified sign-in (company domain or enabled `admin_emails`), disabled override wins — same as Sales.
- Storage bucket `hub-media` (public read, admin write) for uploaded images; browser converts to WebP before upload.
- Seed via a one-off import of `src/data/*.json`; `src/lib/data.ts` becomes a React Query loader with the JSON as fallback.
- React + Vite here (Sales is TanStack Start), so Sales server functions become RLS-protected queries plus small Cloud functions where needed (admin access changes, view counting).
- Admin UI lives under `src/admin/`, isolated from Hub styles; `/admin` is `noindex`.
