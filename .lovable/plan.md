## Scope
Finish pending items from the previous pass, add branded scrollbars for forms/modals, fix the sidebar so it stays fixed while page content scrolls, simplify the "Nouveau document" modal in the knowledge base, and simplify the candidate table actions.

## 1. Sidebar scroll fix
In `src/components/app-shell.tsx`:
- Change the outer wrapper from `min-h-screen flex` to `h-screen flex overflow-hidden`.
- `<aside>` stays as-is (flex column) — it will now stay fixed while only `<main>` scrolls.
- Header remains sticky inside the main column.

## 2. Custom scrollbar design
In `src/styles.css`:
- Add a `.scroll-fancy` utility (webkit + Firefox): 8px thin thumb, rounded, transparent track, gold-tinted thumb using `--gold`, brighter on hover.
- Apply `.scroll-fancy` to:
  - Main app scroll area, notifications popover, global search popover.
  - Dialog/Sheet scroll containers in every form (Articles, Recrutement, Enquêtes, Head-hunting, Utilisateurs, FAQ).
- Wrap long form modals with `max-h-[85vh] overflow-y-auto scroll-fancy`.

## 3. Base de connaissance — simplify "Nouveau document"
In `src/routes/_app.faq.tsx`:
- The "Nouveau document" modal keeps ONLY the drag-and-drop import zone + progress bar.
- Remove all other fields (title, category, tags, description, etc.). File name and metadata are inferred from the uploaded file.

## 4. Recrutement — Candidats table actions
In `src/routes/_app.recrutement.tsx` (and headhunting details table if applicable):
- Remove all row action buttons (edit, delete, contact, etc.) from the candidates table.
- Keep only a single "Voir détails" action (icon or row-click) that opens the candidate detail sheet.

## 5. Pending features from previous pass

### 5a. Articles AI — 3-step wizard (New / Edit brouillon)
Refactor the article dialog in `src/routes/_app.articles.tsx` into a stepper:
- Step 1 — Idée: thématique, angle, mots-clés, ton, audience.
- Step 2 — Contenu: titre, extrait, contenu (RichEditor), tags, image de couverture.
- Step 3 — Publication: statut (Brouillon/Planifié/Publié), date+heure (only Planifié/Publié), canal, auteur, récap.
- Progress bar, Précédent/Suivant/Enregistrer, per-step validation; Brouillon savable at any step.

### 5b. Recrutement — Nouvelle mission: AI scoring criteria block
In `src/routes/_app.recrutement.tsx` new/edit mission form:
- "Critères de scoring IA" section with rows: label + poids (slider 0–100) + type (Compétence / Expérience / Formation / Soft skill / Localisation).
- Add/remove rows, live total-weight indicator (target 100).
- Persist to `mission.scoringCriteria` in `src/lib/mock-data.ts`.

### 5c. Enquêtes — response-type detection + per-question analytics
In `src/routes/_app.enquetes.tsx`:
- Builder: auto-suggest response type (choix unique/multiple, échelle, texte, note) from question keywords; user can override.
- Results: per-question analytics card — bar chart for choix, histogram for échelle/note, top-terms list for texte. Use existing Recharts.

## 6. Verification
Playwright checks: scrolling dashboard keeps sidebar fixed; scrollbars styled in modals; FAQ modal shows only drop zone; candidate table has only "Voir détails"; article wizard 3 steps render; scoring block appears in new mission; per-question chart in survey results.

## Files touched
- `src/components/app-shell.tsx`
- `src/styles.css`
- `src/routes/_app.faq.tsx`
- `src/routes/_app.recrutement.tsx`
- `src/routes/_app.articles.tsx`
- `src/routes/_app.enquetes.tsx`
- `src/lib/mock-data.ts`
