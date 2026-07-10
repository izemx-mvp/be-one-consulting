# Platform Upgrade — Enterprise SaaS Polish

Scope is large. I'll extend the existing architecture (TanStack Router routes, `mock-data.ts` stores, shadcn components) — no rewrites. Delivered in one pass, module by module.

## 1. User Management & Permissions (new module)

- New route `_app.utilisateurs.tsx` + sidebar entry "Gestion des utilisateurs" (icon: `UserCog`).
- New stores in `mock-data.ts`: `usersStore`, `PermissionMap` per user.
- `User` type: `{ id, nom, email, role: "Administrator" | "Collaborator", actif, avatar?, permissions: Record<Module, {c,r,u,d}> }`.
- Admin table: create / edit / delete / activate-deactivate / reset password (mock toast) / role change.
- Collaborator edit drawer: per-module CRUD checkbox matrix (Qualification AI, Recrutement AI, Enquêtes AI, Articles AI, Base de connaissance, Utilisateurs). Dashboard always allowed, not in matrix.
- `PermissionsProvider` (React context) reading the "current user" (demo admin by default; switchable via a user-menu "Voir en tant que…" submenu for demo purposes).
- `usePermission(module, action)` hook. Applied to:
  - Sidebar (hide modules with no `r`).
  - Route guards in each `_app.*` route (`beforeLoad` redirect to /dashboard if no read).
  - Action buttons (New / Edit / Delete) hidden or disabled per `c/u/d`.

## 2. Recrutement — Mission form + candidate details

- Refactor mission creation (in `head-hunting.tsx`) into sectioned form:
  1. Brief · 2. Profil · 3. **Critères d'évaluation IA** · 4. Package · 5. Planning.
- New `EvaluationCriterion { id, nom, description, poids, requis }` array on `HuntingMission`. Preset criteria + "+ Ajouter un critère personnalisé". Weight slider, sum indicator, required toggle.
- Extend `Candidat` with: linkedin, portfolio, github, certifications[], experiences[], education[], languages[], skills[], salaire, preavis, dispo, adresse, workType, notes.
- Candidate detail sheet: collapsible cards (Coordonnées / Parcours / Compétences / Attentes / Notes). Scores computed from mission criteria weights.

## 3. Articles AI — 3-step wizard + status actions

- Replace edit dialog with `<ArticleWizard>` (Steps: Génération IA → Aperçu & Édition → Publication).
- Step 1: image (optional), description, mots-clés, langue, longueur, ton (select). "Générer" fills content with mock IA text + skeleton animation.
- Step 2: full edit (titre, contenu via `RichEditor`, tags, cover, SEO title/desc) + live preview panel.
- Step 3: Publish now / Schedule (date+time) / Save draft.
- Row actions by status:
  - Brouillon: Éditer, Publier, Planifier (inline date popover — no full edit), Supprimer.
  - Planifié: Éditer, Modifier date, Publier maintenant, Annuler planification.
  - Publié: Voir, Dupliquer, Supprimer. Edit disabled.
- Calendar click → open full article detail sheet (cover, titre, statut, date planifiée, auteur, contenu, tags, SEO) — same as Articles module.

## 4. Base de connaissance

- "Nouveau document" opens directly the Import modal (Drag & drop, browse, per-file progress bar, validation of type/size, multi-file). Remove the always-visible import panel below the list.

## 5. Enquêtes — analytics + question types

- `Question` gains `type: "yesno"|"numeric"|"rating5"|"rating10"|"percent"|"currency"|"text"|"date"|"single"|"multi"` and options.
- Builder: type selector per question with "IA a suggéré: X" hint (auto-detect from wording keywords: "combien"→numeric, "note"→rating, "êtes-vous"→yesno…). User can override.
- Detail page: replace raw answer list with analytics grid:
  - yesno/single/multi → Pie + %.
  - rating/numeric/percent/currency → Bar + moyenne + distribution.
  - text → sample answers list + count.
  - Global KPIs: réponses, taux, moyenne satisfaction.

## 6. Global UI / Branding

- **Dark mode default**: `ThemeProvider` reads `localStorage("theme")` in `useEffect` (SSR-safe), defaults to `"dark"` on first visit, persists on toggle.
- **Favicon**: use existing Be One logo — write `public/favicon.png` (copy from LOGO_URL asset) + apple-touch-icon `<link>` in `__root.tsx`. Delete `public/favicon.ico`.
- Polish pass on: tables (sticky header, zebra hover), cards (consistent shadow), sidebar (active glow already in place — extend to submenus), modals (unified padding/header), buttons, empty states (icon + copy + CTA), skeletons, tooltips.
- Global unsaved-changes guard hook `useUnsavedGuard(dirty)` wired into all edit forms.
- Form primitives upgraded: searchable `<Combobox>`, multi-select chip input, better date picker (already shadcn), toggle switches, textarea autosize, inline field errors via zod + react-hook-form where forms are non-trivial.

## Technical Notes

- No backend changes — everything persists via existing `createStore` in `mock-data.ts` (localStorage).
- Route guards: add `beforeLoad` in each `_app.*` route reading permissions from a module-level `permissionsStore`.
- Zod added for form validation (already viable via existing deps or `bun add zod react-hook-form @hookform/resolvers`).
- Keep purple/magenta brand tokens and gold accent unchanged.

## Files touched (high-level)

- New: `src/routes/_app.utilisateurs.tsx`, `src/lib/permissions.tsx`, `src/components/article-wizard.tsx`, `src/components/analytics-question.tsx`, `src/components/import-documents-dialog.tsx`, `src/hooks/use-unsaved-guard.ts`, `public/favicon.png`.
- Edited: `src/lib/mock-data.ts` (users, permissions, extended Candidat/Mission/Question/Article), `src/lib/theme.tsx` (dark default + persist), `src/components/app-shell.tsx` (permission-aware nav, user switch), `src/routes/__root.tsx` (favicon + apple icon), `src/routes/_app.articles.tsx` (wizard + status actions + calendar detail), `src/routes/_app.enquetes.tsx` (analytics + types), `src/routes/_app.faq.tsx` (import modal), `src/components/head-hunting.tsx` (sectioned form + AI criteria + candidate cards), `src/routes/_app.recrutement.tsx` (permission gates), plus small polish to `data-table.tsx` and `status-badge.tsx`.

## Out of scope

- Real auth / backend — remains front-end mock.
- Mobile phone layouts (desktop + tablet as requested).

Reply "go" and I'll implement in one pass.
