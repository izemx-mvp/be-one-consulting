# Phase 2 — UI Enhancements & New Features

Large scope. Grouped into 7 workstreams. All mock data, no backend changes.

## 1. Theme — Light Mode Redesign + default
**Files:** `src/styles.css`, `src/lib/theme.tsx`
- Flip default from `dark` to `light` on first visit; keep localStorage persistence + toggle.
- Rework `:root` (light) tokens:
  - Warmer neutrals (soft rose-tinted grays), colored surfaces per section, richer accents.
  - Add `--surface-1/2/3`, `--gradient-hero`, `--gradient-card`, `--shadow-elegant`, `--shadow-glow`.
  - Elevated card treatment (subtle border + layered shadow), glass utility already exists — extend.
- Add hover-lift, colored stat-card variants, badge tone tokens (success/warn/info/gold).
- Update `app-bg` for light: soft gold/pink radial washes on off-white base.

## 2. Module Renames
**Files:** `src/components/app-shell.tsx`, `src/routes/_app.faq.tsx`, `src/routes/_app.articles.tsx`, any breadcrumb/title strings.
- Base de connaissance → **Service Client AI**
- Articles AI → **Community Manager AI**
- Keep route paths (`/faq`, `/articles`) to avoid churn — only labels/titles change.

## 3. Recruitment — CV section in Candidate Details
**Files:** `src/routes/_app.recrutement.tsx`, `src/lib/mock-data.ts`
- Extend candidate mock with `cv?: {name, uploadedAt, type, url}`.
- New `<CvSection>` in candidate detail sheet: filename, date, type chip, Download + Preview buttons (opens dialog with iframe for PDF / img). Empty state with upload dropzone.

## 4. Enquêtes — AI Analysis card
**Files:** `src/routes/_app.enquetes.tsx`
- Add `<AiAnalysisCard>` to results detail sheet with sections: Tendances, Points positifs, Points négatifs, Sujets fréquents, Recommandations, Actions suggérées, Sentiment global, Indicateurs de risque.
- Deterministic seeded content per enquete.id; sentiment gauge; risk chips.

## 5. Community Manager AI — full workflow rewrite
**Files:** `src/routes/_app.articles.tsx` (rename page), new `src/components/cm-post-wizard.tsx`, `src/components/cm-article-wizard.tsx`, `src/lib/mock-data.ts` (add posts store).
- Entry step: choose **Post** or **Article**.
- **Article path** — 2 steps:
  1. Inputs (description, keywords, langue, ton, longueur, cover) → Générer.
  2. Preview editable (titre, contenu RichEditor, image, tags, SEO). Actions: Publier / Planifier / Brouillon.
- **Post path** — 3 steps:
  1. Idea, AI prompt, image desc, video desc, refs, keywords, langue, ton → Générer.
  2. Media editor: caption, hashtags, drag-and-drop reorder (dnd-kit already or use HTML5 DnD), add/remove media.
  3. Platforms (LinkedIn/Facebook/Instagram/YouTube) multi-select; per-platform independent AI settings panel (accordion).

## 6. Publishing — split Publish vs Schedule
- Two distinct buttons everywhere (articles + posts).
- Schedule opens `<ScheduleDialog>` with date, time, timezone select → status becomes `Planifié`.

## 7. CM Calendar upgrade
**Files:** new `src/components/publication-calendar.tsx`, integrate into CM page.
- Month grid with event chips; each shows platform icon (lucide: Linkedin, Facebook, Instagram, Youtube, Globe for articles).
- Click → detail dialog: title, platform, image, date, caption/article, tags, statut, auteur, AI params used.

## 8. New Module — Assistant AI
**Files:** new `src/routes/_app.assistant.tsx`, sidebar entry, `src/lib/mock-data.ts` (meetings/reminders/config stores).
- Tabs: **Dashboard**, **Calendrier**, **Configuration**.
- Dashboard: upcoming meetings list, today, missed, next reminders, mini-calendar overview, smart insight widgets (conflicts, duplicates, overdue).
- Calendrier: month view, create/edit/delete events, event detail sheet (title, desc, participants, date, time, meeting link, notes, attachments, reminder status).
- Configuration: langue rappel, timings (multi-select chips), meeting provider (Meet/Zoom/Teams), notifications (me / all), WhatsApp delivery toggle, auto-detect from email/WhatsApp toggles.
- Smart features mocked: conflict badge on overlapping meetings, "Suggérer un meilleur créneau" button, duplicate detector, importance-based reminder suggestions, meeting summary preview.

## Technical notes
- Sidebar: add Assistant AI entry with `Bot`/`Sparkles` icon; keep permissions structure (add `assistant` module key, default read=true).
- Route file: `src/routes/_app.assistant.tsx` — must create BEFORE using `<Link to="/assistant">`; routeTree regenerates automatically.
- Drag-and-drop: use native HTML5 DnD to avoid new deps.
- All stores follow existing `mock-data.ts` pattern (subscribe/get/all/add/update/remove).
- Every new interactive element wired to real state updates + toasts.

## Out of scope
- No real backend, no real WhatsApp/email integration (mocked toggles + toast confirmations).
- No route path renames (labels only) to keep bookmarks stable.

Approve to proceed; I'll implement in this order: theme → renames → recruit CV → survey AI → CM workflows → calendar → Assistant AI module.
