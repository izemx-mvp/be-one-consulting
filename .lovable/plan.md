## Goal

Three fixes to Community Manager AI so articles, posts and calendar behave consistently:

1. **Calendar clicks open the real detail sheet** for both articles and posts.
2. **Publié items** get a slimmed footer: read-only details + a single **Supprimer** button. No Publier/Planifier/Modifier/Révision.
3. **Media in mock data** stops using external Unsplash URLs and uses **bundled imported assets** in `src/assets/`.

---

## 1. Fix "calendar click → nothing opens"

**Root cause.** The article and post detail `Sheet`s live inside `GridTab` and `PostsTab`. Radix Tabs unmounts inactive tab content, so while the user is on the **Calendrier** tab, neither sheet exists in the DOM. `setDetailArticle(a)` / `setDetailPost(p)` are called, but nothing renders.

**Fix.** Extract the two sheets into standalone components and mount them at `Page` level, next to the `<Tabs>`, so they render regardless of the active tab.

- New `ArticleDetailSheet` and `PostDetailSheet` components inside `src/routes/_app.articles.tsx`.
- Move all the associated dialogs that the sheets trigger (reject modal, delete confirm, schedule dialog) to `Page` level too so their state is not tied to a tab.
- `GridTab` and `PostsTab` keep opening the sheets via the same `setDetailArticle` / `setDetailPost` setters they already receive.

Result: clicking any article or post — from Articles grid, Posts grid, **or** any calendar view — opens the exact same rich sheet with the same buttons.

---

## 2. Publié footer = "détails + Supprimer" only

Update both detail sheets:

- `Brouillon` → Publier · Planifier · Révision · Modifier · Supprimer *(unchanged)*
- `Planifié` → Publier maintenant · Replanifier · Retour brouillon · Modifier · Supprimer *(unchanged)*
- `Publié` → **Supprimer** only (nothing else in the footer)

Also drop the inline `Publier` / `Planifier` / `Modifier` buttons from the **card** action rows when `statut === "Publié"`; the card keeps only the `Supprimer` icon button. Same rule for both article and post cards.

Calendar already filters to Publié + Planifié, so this stays consistent.

---

## 3. Replace external image URLs with bundled assets

Currently `src/lib/mock-data.ts` uses Unsplash URLs in two arrays:

- `ARTICLE_IMAGES` (12 URLs) — used as article covers and idea covers
- `POST_IMAGES` (4 URLs) — used as post media

**Plan.** Generate a smaller, curated library, upload each as a Lovable Asset (CDN-hosted, no binary in repo), and import the `.asset.json` pointers.

- Generate **6 article cover images** (professional consulting / RH / Maroc themes) → `src/assets/article-cover-1.jpg` … `-6.jpg`.
- Generate **4 post images** (team, event, leadership, webinar) → `src/assets/post-1.jpg` … `-4.jpg`.
- For each, run `lovable-assets create --file … > …asset.json`, delete the source binary, keep only the pointer JSON.
- In `mock-data.ts`, import the pointers and rebuild `ARTICLE_IMAGES` / `POST_IMAGES` as `[img1.url, img2.url, …]`.

The `PostMedia` type keeps `kind: "image" | "video"`; no mock post currently uses `video`, so no video asset is generated. If a video is needed later, it can be added the same way.

---

## Files touched

- `src/routes/_app.articles.tsx` — extract `ArticleDetailSheet` + `PostDetailSheet`, lift to `Page`, update footer/card action rules for Publié.
- `src/lib/mock-data.ts` — swap `ARTICLE_IMAGES` and `POST_IMAGES` to imported asset pointers.
- `src/assets/*.asset.json` (new, ~10 files) — pointer JSON for generated covers/post images.

No schema, routing, or auth changes.  
  
make sure also that post have images 