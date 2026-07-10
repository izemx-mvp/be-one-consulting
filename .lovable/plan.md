## Objectif

Transformer le backoffice Be One Consulting existant en un produit SaaS **premium-feel** (Linear / Attio / HubSpot) — front-end only, mock data en mémoire, en français, avec 6 modules ultra-détaillés, dark mode, drawers, kanban drag & drop, calendrier, éditeur riche, animations et toasts.

## Fondations design & shell

1. **Palette & thèmes** (`src/styles.css`)
   - Light : off-white `#F8FAFC`, texte navy `#0F172A`, accent or `#D4AF37`, sidebar navy profond.
   - Dark : fond `#0B1220`, surfaces `#111827`, accent or lumineux, glow subtil sur états actifs.
   - Radius `xl/2xl`, ombres douces, hairline borders `border/50`, glass (`backdrop-blur`) sur topbar/modals.
   - Ajout keyframes : `count-up` (via composant), `fade-slide-in`, `pulse-soft`, `shimmer` (skeletons).

2. **Provider thème** : `src/lib/theme.tsx` (context + toggle, applique classe `dark` sur `<html>`, persistance en mémoire de session).

3. **Shell refondu** (`src/components/app-shell.tsx`)
   - Sidebar collapsible (icon-only), indicateur actif = barre or + glow, logo Be One.
   - Topbar glass : search global (mock — filtre candidats/demandes/articles, dropdown résultats groupés), cloche notifications (badge + dropdown), toggle thème, avatar « Fatima Zahra Abbadi » avec menu (Profil / Paramètres / Déconnexion).
   - Breadcrumbs auto (dérivés du pathname).
   - Toaster global `sonner` déjà présent — utilisé partout.

4. **Skeletons & transitions**
   - Composant `<PageSkeleton>` + hook `useSimulatedLoading(delay)` (300–600 ms) déclenché au changement de route et à chaque filtre/search change.
   - `<CountUp value>` pour KPIs.
   - `animate-fade-in`, `hover-scale`, `story-link` déjà dispo — appliqués sur cartes/boutons.

5. **Composants réutilisables enrichis**
   - `<DataTable>` : ajout tri cliquable par colonne, sélecteur « Lignes par page » (10/25/50), filter-chips supprimables au-dessus, highlight des matches de recherche, empty state custom (icône + message), skeleton rows pendant chargement, menu 3-points d'actions par ligne.
   - `<DetailDrawer>` : slide-in droite, largeur `max-w-2xl`, header sticky, footer d'actions.
   - `<ConfirmDialog>` pour toute suppression.
   - `<StatusBadge>` étendu avec toutes les nouvelles valeurs.
   - `<FilterBar>` : multi-select, date-range, chips actifs.
   - `<RichTextEditor>` : léger (gras/italique/listes/H2) via `contentEditable` + `document.execCommand` — pas de dépendance lourde.

## Login (`src/routes/login.tsx`)

- Split-screen, panneau gauche navy avec gradient mesh (SVG/CSS), logo + tagline, motif abstrait subtil.
- Formulaire droite pré-rempli `admin@beone-consulting.com` / `Demo1234!`.
- Bouton « Se connecter » avec spinner 800 ms puis redirect `/dashboard`.
- Lien visuel « Mot de passe oublié ? ».
- Fade + slide-up à l'entrée.

## Dashboard (`_app.dashboard.tsx`)

- 6 KPI cards animées (CountUp + petit trend `+12% ce mois` avec flèche colorée) : Demandes reçues, Candidats en cours, Enquêtes actives, Articles à valider, RDV cette semaine, Taux de réponse enquêtes.
- Charts (recharts, animation on mount) :
  - Bar : demandes par mois (6 derniers mois).
  - Area : évolution candidatures.
  - Donut : répartition demandes par type.
- Feed « Activité récente » timeline avec bordure gauche accent, icônes par type, timestamps relatifs.
- Widget « Tâches à valider » : liste rapide d'articles/candidats en attente + boutons quick-action.

## Modules — mise à niveau (mock data 15–30 items chacun, noms marocains, entreprises réalistes)

### 1. Demandes Clients (`_app.demandes.tsx`)
- Colonnes : Contact, Entreprise, Type (badge coloré), Canal (Site / WhatsApp / Email), Date, Statut, Priorité (indicateur couleur).
- FilterBar : multi-select Type, Statut, Canal, date-range picker. Chips actifs.
- Recherche debounced + highlight.
- Tri cliquable sur toutes colonnes.
- Drawer détails : infos contact, mock chat log de qualification, réponses données (budget, délai, poste), sélecteur statut, notes internes, bouton « Rediriger vers Recrutement » (visible si Type=Recrutement) → toast + statut passe à « Redirigé » + entrée créée dans candidats store.
- Modal Ajouter / Éditer. Menu 3-points par ligne (Voir / Modifier / Statut / Supprimer avec confirm).
- 25+ demandes mock.

### 2. Recrutement (`_app.recrutement.tsx`)
- Toggle vues **Table** ⇄ **Kanban** (drag & drop natif HTML5 entre colonnes Nouveau → Présélectionné → Entretien → Offre → Recruté → Rejeté, animation fluide via `transition-transform`).
- Table : avatar (initiales sur fond dégradé), Nom, Poste, Source (icône LinkedIn/FB/IG), Score (barre progress colorée), Expérience, Statut, Date.
- Filtres : Poste, Source, Statut, Score (slider double-range), Expérience.
- Drawer candidat détaillé : photo, coordonnées, CV mock, tags compétences, sous-scores (Adéquation / Expérience / Soft skills — barres), timeline étapes, boutons Programmer entretien (crée un RDV), Message, Rejeter (motif), Étape suivante.
- Bouton « Lancer une campagne de sourcing » → modal (plateforme, poste, critères) → toast « Campagne lancée ».
- CRUD complet. 30+ candidats.

### 3. Enquêtes & Études (`_app.enquetes.tsx`)
- Table : Nom, Client, Type, Destinataires, Réponses (mini progress %), Date lancement, Date clôture, Statut.
- Filtres Type / Statut / Client / date-range.
- Drawer détails : taux de réponse en grand (animé), bar chart réponses par question, pie satisfaction, table destinataires paginée (Envoyé/Ouvert/Répondu/Relancé/Non répondu), bouton « Relancer les non-répondants » (toast + update statuts en direct), timeline relances.
- CRUD création multi-étapes (1. Infos, 2. Import base mock, 3. Questionnaire type).
- 15+ enquêtes clients marocains (Attijariwafa, OCP, Cosumar, Inwi, Marjane…).

### 4. Rendez-vous & Rappels (`_app.rendezvous.tsx`)
- Toggle **Calendrier** ⇄ **Liste**.
- Calendrier mensuel custom (grille 7×n, navigation mois précédent/suivant), blocs colorés par type, hover aperçu, clic → drawer.
- Liste : Nom, Type, Date/heure, Canal (WhatsApp), Délai rappel, Statut rappel (Programmé/Envoyé ✓/Non envoyé/Confirmé).
- Filtres Type / Statut / date-range / consultant.
- Drawer : infos, timeline rappels envoyés, bouton « Envoyer un rappel maintenant » (toast + statut live), toggle rappels auto.
- CRUD avec datetime picker + délai rappel (15min/30min/1h/1j).
- 20+ RDV.

### 5. Articles & Blog (`_app.articles.tsx`)
- Grid de cartes (image miniature — placeholder dégradé + initiale de thématique), titre, thématique (badge), statut (gris/orange pulsant/vert), auteur (IA sparkle / Manuel), date.
- Filtres Statut + Thématiques (tag-cloud cliquable) + Auteur.
- Recherche titre/mot-clé.
- Détail plein panneau : éditeur riche (gras/italique/listes/H2/lien), thématique, image de couverture. Si « En attente » : boutons **Approuver & Publier** (vert, mini burst confetti — canvas simple) et **Rejeter / Demander révision** (modal commentaire).
- Bandeau haut : « Prochaine génération automatique dans 3 jours ».
- CRUD complet, 15+ articles avec thématiques RH/business réalistes.
- Pagination grid 9/page.

### 6. Service Client — Base de connaissance (`_app.faq.tsx`)
- Layout 2 colonnes : catégories à gauche (Recrutement, Conseil & Stratégie, Formation, Facturation, Général, Missions & Méthodologie) avec compteur + icône, catégorie active surlignée.
- Droite : Q/R en accordéon animé.
- Recherche globale avec highlight + compteur de résultats.
- Actions hover : Modifier / Supprimer / Dupliquer.
- Badge « Utilisée X fois ce mois ».
- Modal ajout/édition (Question, Réponse riche, Catégorie, Tags, Actif/Inactif).
- Pagination si > 10 par catégorie.
- 20+ Q/R réalistes.

## Notes techniques

- Aucune dépendance nouvelle nécessaire : `recharts`, `sonner`, `lucide-react`, `date-fns`, radix/shadcn déjà présents. Drag & drop en HTML5 natif (`draggable` + `onDragStart/onDragOver/onDrop`).
- Store mock étendu : `notificationsStore`, activité récente, nouveaux champs par entité, seed 15–30 items chacun. Tout reste in-memory (persistance session via module singleton — pas de localStorage).
- Recherche globale topbar : agrège demandes+candidats+articles+FAQ, résultats groupés.
- Skeletons via `useSimulatedLoading` sur chaque page.
- Confettis : petit util canvas 60 particules, 800 ms.
- Éditeur riche : composant local `~150 lignes`, `contentEditable`, toolbar 5 boutons.
- Calendrier : composant local (pas de lib), utilise `date-fns` déjà installé.
- Respect strict des tokens design (`bg-primary`, `bg-[color:var(--gold)]`, etc.), zéro `text-white`/`bg-black` hardcodé.
- Toast `sonner` sur chaque C/U/D et action métier.
- Toutes tables : tri, filter-chips, page-size selector, highlight recherche, empty state.

## Livrables

- Refonte : `styles.css`, `app-shell.tsx`, `data-table.tsx`, `status-badge.tsx`, `login.tsx`, `_app.dashboard.tsx`, tous les modules.
- Nouveaux : `theme.tsx`, `count-up.tsx`, `detail-drawer.tsx`, `filter-bar.tsx`, `rich-editor.tsx`, `confirm-dialog.tsx`, `page-skeleton.tsx`, `confetti.ts`, `calendar-view.tsx`, `kanban.tsx`, `global-search.tsx`, `notifications.tsx`.
- Mock data étendue (`mock-data.ts`) : 25 demandes, 30 candidats, 15 enquêtes + destinataires, 20 RDV, 15 articles, 20 FAQ, activité, notifications.
