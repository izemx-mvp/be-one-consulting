import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";


import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Check,
  X,
  Plus,
  Search,
  Sparkles,
  Pencil,
  Trash2,
  Clock,
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutGrid,
  CalendarDays,
  Wand2,
  ImageIcon,
  Settings2,
  Tag,
  AlertTriangle,
  Hash,
} from "lucide-react";
import {
  articlesStore,
  ARTICLE_IMAGES,
  editorialConfigStore,
  cmConfigStore,
  postIdeasStore,
  articleIdeasStore,
  uid,
  useStore,
  type Article,
  type CmPlatform,
  type CmPlatformConfig,
  type PostIdea,
  type ArticleIdea,
} from "@/lib/mock-data";
import { StatusBadge } from "@/components/status-badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PostWizard, type PostWizardPrefill } from "@/components/post-wizard";
import { ArticleWizard, type ArticleWizardPrefill } from "@/components/article-wizard";
import { ScheduleDialog } from "@/components/schedule-dialog";
import { postsStore, PLATFORM_META, type SocialPost, type SocialPlatform } from "@/lib/mock-data";
import { Linkedin, Facebook, Instagram, Youtube, Globe as GlobeIcon, Send, Lightbulb, RefreshCw, Bookmark, Copy } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { burstConfetti } from "@/lib/confetti";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/_app/articles")({
  head: () => ({ meta: [{ title: "Community Manager AI — Be One Consulting" }] }),
  component: Page,
});

const STATUTS: Article["statut"][] = ["Brouillon", "Planifié", "Publié"];
const PAGE_SIZE = 9;

function coverFor(a: Article, i: number) {
  return ARTICLE_IMAGES[(a.titre.length + i) % ARTICLE_IMAGES.length];
}

function useConfig() {
  const rows = useStore(editorialConfigStore);
  return rows[0];
}

function empty(cfg: { thematiques: string[] }): Article {
  return {
    id: "",
    titre: "",
    thematique: cfg.thematiques[0] ?? "Général",
    auteur: "Manuel",
    contenu: "<h2>Nouveau titre</h2><p>Rédigez votre article ici...</p>",
    extrait: "",
    statut: "Brouillon",
    date: new Date().toISOString().slice(0, 10),
    tags: [],
    heure: "09:00",
  };
}

function Page() {
  const [detailArticle, setDetailArticle] = useState<Article | null>(null);
  return (
    <AppShell
      title="Community Manager AI"
      subtitle="Agent Rédaction — création IA ou manuelle, validation, planification et publication"
    >
      <Tabs defaultValue="grid">
        <TabsList className="mb-4">
          <TabsTrigger value="grid"><LayoutGrid className="h-4 w-4 mr-2" /> Articles</TabsTrigger>
          <TabsTrigger value="posts"><Send className="h-4 w-4 mr-2" /> Posts sociaux</TabsTrigger>
          <TabsTrigger value="calendar"><CalendarDays className="h-4 w-4 mr-2" /> Calendrier</TabsTrigger>
          <TabsTrigger value="config"><Settings2 className="h-4 w-4 mr-2" /> Configuration IA</TabsTrigger>
        </TabsList>
        <TabsContent value="grid"><GridTab externalDetail={detailArticle} setExternalDetail={setDetailArticle} /></TabsContent>
        <TabsContent value="posts"><PostsTab /></TabsContent>
        <TabsContent value="calendar"><CalendarTab onArticleClick={setDetailArticle} /></TabsContent>
        <TabsContent value="config"><ConfigTab /></TabsContent>
      </Tabs>

    </AppShell>
  );
}

function TagChips({ tags }: { tags: string[] }) {
  if (!tags?.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {tags.map((t) => (
        <span
          key={t}
          className="text-[10px] inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[color:var(--gold)]/15 text-[color:var(--gold)] border border-[color:var(--gold)]/35 font-medium shadow-sm"
        >
          <Hash className="h-2.5 w-2.5" />
          {t}
        </span>
      ))}
    </div>
  );
}

// ---------------- GRID TAB ----------------
function GridTab({
  externalDetail,
  setExternalDetail,
}: {
  externalDetail: Article | null;
  setExternalDetail: (a: Article | null) => void;
}) {
  const cfg = useConfig();
  const rows = useStore(articlesStore);
  const [statut, setStatut] = useState("all");
  const [thematique, setThematique] = useState("all");
  const [auteur, setAuteur] = useState("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardEditing, setWizardEditing] = useState<Article | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState("");
  const [confirmDel, setConfirmDel] = useState<Article | null>(null);
  const [scheduleForArticle, setScheduleForArticle] = useState<Article | null>(null);

  const detail = externalDetail;
  const setDetail = setExternalDetail;

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    return rows.filter(
      (r) =>
        (statut === "all" || r.statut === statut) &&
        (thematique === "all" || r.thematique === thematique) &&
        (auteur === "all" || r.auteur === auteur) &&
        (!q ||
          r.titre.toLowerCase().includes(needle) ||
          r.thematique.toLowerCase().includes(needle) ||
          r.tags.some((t) => t.toLowerCase().includes(needle))),
    );
  }, [rows, q, statut, thematique, auteur]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const openNew = () => { setWizardEditing(null); setWizardOpen(true); };
  const openEdit = (a: Article) => { setWizardEditing(a); setWizardOpen(true); };


  // Lifecycle actions from the detail sheet.
  const approveToPlanified = (a: Article) => {
    articlesStore.update(a.id, { statut: "Planifié" });
    toast.success("Article approuvé et planifié", { description: a.titre });
    setDetail(null);
  };
  const publishNow = (a: Article) => {
    articlesStore.update(a.id, { statut: "Publié" });
    burstConfetti();
    toast.success("Article publié !", { description: a.titre });
    setDetail(null);
  };
  const unschedule = (a: Article) => {
    articlesStore.update(a.id, { statut: "Planifié" });
    toast.success("Article redéplanifié", { description: a.titre });
    setDetail(null);
  };
  const unpublish = (a: Article) => {
    articlesStore.update(a.id, { statut: "Brouillon" });
    toast.success("Article retiré en brouillon", { description: a.titre });
    setDetail(null);
  };
  const reject = (a: Article) => {
    articlesStore.update(a.id, { statut: "Brouillon" });
    toast.success("Article renvoyé en brouillon", {
      description: rejectComment || "Sans commentaire",
    });
    setRejectOpen(false);
    setRejectComment("");
    setDetail(null);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Rechercher un article, tag..."
            className="pl-9"
          />
        </div>
        <Select value={statut} onValueChange={setStatut}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            {STATUTS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={auteur} onValueChange={setAuteur}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Auteur" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous auteurs</SelectItem>
            <SelectItem value="IA">IA</SelectItem>
            <SelectItem value="Manuel">Manuel</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setThematique("all")}
            className={cn(
              "text-xs px-2.5 py-1 rounded-full border transition-colors",
              thematique === "all"
                ? "bg-primary text-primary-foreground border-primary"
                : "hover:bg-muted",
            )}
          >
            Toutes
          </button>
          {cfg.thematiques.map((t) => (
            <button
              key={t}
              onClick={() => setThematique(t)}
              className={cn(
                "text-xs px-2.5 py-1 rounded-full border transition-colors",
                thematique === t
                  ? "bg-primary text-primary-foreground border-primary"
                  : "hover:bg-muted",
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <Button onClick={openNew} className="ml-auto btn-premium hover:[&]:btn-premium-hover">
          <Plus className="h-4 w-4 mr-1" /> Nouvel article
        </Button>
      </div>
      {pageItems.length === 0 ? (
        <Card className="p-16 text-center text-muted-foreground">
          <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
          Aucun article ne correspond à vos filtres.
        </Card>
      ) : (
        <>
        <ArticleIdeasSection />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pageItems.map((a, i) => (
            <Card
              key={a.id}
              className="p-0 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all fade-up cursor-pointer"
              onClick={() => setDetail(a)}
            >
              <div className="h-40 bg-muted overflow-hidden relative">
                <img
                  src={coverFor(a, i)}
                  alt={a.titre}
                  className="w-full h-full object-cover transition-transform hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute top-2 left-2 flex gap-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur uppercase tracking-wide">
                    {a.thematique}
                  </span>
                  {a.auteur === "IA" && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[color:var(--gold)]/90 text-[color:var(--gold-foreground)] backdrop-blur inline-flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> IA
                    </span>
                  )}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold line-clamp-2 min-h-[44px]">{a.titre}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.extrait}</p>
                <TagChips tags={a.tags} />
                <div className="flex items-center justify-between mt-3">
                  <StatusBadge status={a.statut} dot={a.statut === "Brouillon"} />
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {a.date}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
        </>
      )}
      <div className="flex items-center justify-between text-sm mt-4">
        <span className="text-muted-foreground">
          {filtered.length} article{filtered.length > 1 ? "s" : ""} · Page {current} / {totalPages}
        </span>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={current === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <Button
              key={n}
              size="sm"
              variant={n === current ? "default" : "outline"}
              onClick={() => setPage(n)}
              className={cn("min-w-9", n === current && "bg-primary text-primary-foreground")}
            >
              {n}
            </Button>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={current === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ArticleWizard open={wizardOpen} onOpenChange={setWizardOpen} editing={wizardEditing} />


      <Sheet open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto">
          {detail && (
            <>
              <SheetHeader className="border-b pb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary uppercase">
                    {detail.thematique}
                  </span>
                  {detail.auteur === "IA" && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[color:var(--gold)]/20 text-[color:var(--gold)] inline-flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> IA
                    </span>
                  )}
                  <StatusBadge status={detail.statut} dot={detail.statut === "Brouillon"} />
                </div>
                <SheetTitle className="text-2xl mt-2">{detail.titre}</SheetTitle>
                <div className="text-xs text-muted-foreground">
                  Publication : {detail.date}
                  {detail.heure ? ` · ${detail.heure}` : ""}
                </div>
                <TagChips tags={detail.tags} />
              </SheetHeader>
              <div className="py-4">
                <img
                  src={coverFor(detail, 0)}
                  alt={detail.titre}
                  className="w-full h-56 object-cover rounded-lg"
                />
                <article
                  className="prose prose-sm dark:prose-invert max-w-none mt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-4 [&_ul]:list-disc [&_ul]:pl-5"
                  dangerouslySetInnerHTML={{ __html: detail.contenu }}
                />
              </div>
              <div className="sticky bottom-0 bg-background border-t -mx-6 px-6 py-3 flex flex-wrap gap-2">
                {detail.statut === "Brouillon" && (
                  <>
                    <Button onClick={() => publishNow(detail)} className="btn-premium hover:[&]:btn-premium-hover flex-1">
                      <Send className="h-4 w-4 mr-2" /> Publier
                    </Button>
                    <Button variant="outline" onClick={() => setScheduleForArticle(detail)} className="flex-1">
                      <Clock className="h-4 w-4 mr-2" /> Planifier
                    </Button>
                    <Button variant="outline" className="text-destructive border-destructive/30" onClick={() => setRejectOpen(true)}>
                      <X className="h-4 w-4 mr-2" /> Révision
                    </Button>
                  </>
                )}
                {detail.statut === "Planifié" && (
                  <>
                    <Button onClick={() => publishNow(detail)} className="btn-premium hover:[&]:btn-premium-hover flex-1">
                      <Send className="h-4 w-4 mr-2" /> Publier maintenant
                    </Button>
                    <Button variant="outline" onClick={() => setScheduleForArticle(detail)} className="flex-1">
                      <Clock className="h-4 w-4 mr-2" /> Replanifier
                    </Button>
                    <Button variant="outline" onClick={() => unpublish(detail)}>
                      Retour brouillon
                    </Button>
                  </>
                )}
                {detail.statut === "Publié" && (
                  <>
                    <Button variant="outline" onClick={() => unschedule(detail)} className="flex-1">
                      <Clock className="h-4 w-4 mr-2" /> Déplanifier
                    </Button>
                    <Button
                      variant="outline"
                      className="text-destructive border-destructive/30 flex-1"
                      onClick={() => unpublish(detail)}
                    >
                      <X className="h-4 w-4 mr-2" /> Retirer
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    openEdit(detail);
                    setDetail(null);
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" /> Modifier
                </Button>
                <Button
                  variant="outline"
                  className="text-destructive border-destructive/30"
                  onClick={() => {
                    setConfirmDel(detail);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Demander une révision</DialogTitle>
          </DialogHeader>
          <Label>Commentaire à destination de l'auteur</Label>
          <Textarea
            rows={4}
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
            placeholder="Ex: préciser les sources, revoir le titre..."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => detail && reject(detail)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Rejeter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmDel}
        onOpenChange={(v) => !v && setConfirmDel(null)}
        title="Supprimer cet article ?"
        destructive
        confirmLabel="Supprimer"
        onConfirm={() => {
          if (confirmDel) {
            articlesStore.remove(confirmDel.id);
            toast.success("Article supprimé");
            setDetail(null);
          }
          setConfirmDel(null);
        }}
      />

      <ScheduleDialog
        open={!!scheduleForArticle}
        onOpenChange={(v) => !v && setScheduleForArticle(null)}
        initialDate={scheduleForArticle?.date}
        initialTime={scheduleForArticle?.heure}
        onConfirm={({ date, time }) => {
          if (scheduleForArticle) {
            articlesStore.update(scheduleForArticle.id, { statut: "Planifié", date, heure: time });
            toast.success(`Article planifié pour le ${date} à ${time}`);
            setScheduleForArticle(null);
            setDetail(null);
          }
        }}
      />
    </div>
  );
}

// ---------------- CALENDAR TAB ----------------
const MONTHS_FR = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];
const DOW_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

type View = "year" | "month" | "week" | "day" | "agenda";

function toneFor(a: Article) {
  if (a.statut === "Publié")
    return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40";
  if (a.statut === "Brouillon")
    return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40";
  if (a.statut === "Planifié")
    return "bg-[color:var(--gold)]/15 text-[color:var(--gold)] border-[color:var(--gold)]/40";
  return "bg-muted text-muted-foreground border-border";
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function CalendarTab({ onArticleClick }: { onArticleClick: (a: Article) => void }) {
  const rows = useStore(articlesStore);
  const posts = useStore(postsStore);
  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState<Date>(new Date());
  const [postDetail, setPostDetail] = useState<SocialPost | null>(null);

  const byDay = useMemo(() => {
    const m = new Map<string, Article[]>();
    for (const a of rows) {
      if (!m.has(a.date)) m.set(a.date, []);
      m.get(a.date)!.push(a);
    }
    return m;
  }, [rows]);
  const postsByDay = useMemo(() => {
    const m = new Map<string, SocialPost[]>();
    for (const p of posts) {
      if (!m.has(p.date)) m.set(p.date, []);
      m.get(p.date)!.push(p);
    }
    return m;
  }, [posts]);


  const label = useMemo(() => {
    if (view === "year") return `${cursor.getFullYear()}`;
    if (view === "month") return `${MONTHS_FR[cursor.getMonth()]} ${cursor.getFullYear()}`;
    if (view === "week") {
      const s = startOfWeek(cursor);
      const e = new Date(s);
      e.setDate(s.getDate() + 6);
      return `Semaine du ${s.getDate()} ${MONTHS_FR[s.getMonth()].slice(0, 3)} – ${e.getDate()} ${MONTHS_FR[e.getMonth()].slice(0, 3)} ${e.getFullYear()}`;
    }
    if (view === "day")
      return `${DOW_FR[(cursor.getDay() + 6) % 7]} ${cursor.getDate()} ${MONTHS_FR[cursor.getMonth()]} ${cursor.getFullYear()}`;
    return "Agenda éditorial";
  }, [view, cursor]);

  const shift = (delta: number) => {
    const d = new Date(cursor);
    if (view === "year") d.setFullYear(d.getFullYear() + delta);
    else if (view === "month") d.setMonth(d.getMonth() + delta);
    else if (view === "week") d.setDate(d.getDate() + delta * 7);
    else if (view === "day") d.setDate(d.getDate() + delta);
    setCursor(d);
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 flex items-center gap-3 flex-wrap">
        <div>
          <div className="font-semibold text-sm">Calendrier éditorial & social</div>
          <div className="text-xs text-muted-foreground">
            Articles 🌐 et posts sociaux 📱 — cliquez un événement pour ouvrir ses détails.
          </div>

        </div>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <div className="inline-flex rounded-lg border p-0.5 bg-muted/40">
            {(["year", "month", "week", "day", "agenda"] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-md capitalize transition-colors",
                  view === v
                    ? "bg-background shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {v === "year"
                  ? "Année"
                  : v === "month"
                    ? "Mois"
                    : v === "week"
                      ? "Semaine"
                      : v === "day"
                        ? "Jour"
                        : "Agenda"}
              </button>
            ))}
          </div>
          {view !== "agenda" && (
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCursor(new Date())}
                className="h-8"
              >
                Aujourd'hui
              </Button>
              <Button size="icon" variant="ghost" onClick={() => shift(-1)} className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => shift(1)} className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <div className="w-full flex items-center justify-between border-t pt-3">
          <div className="text-lg font-semibold">{label}</div>
          <div className="flex gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Publié
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> En attente
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[color:var(--gold)]" /> Planifié
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-muted-foreground" /> Brouillon
            </span>
          </div>
        </div>
      </Card>

      {view === "year" && (
        <YearView
          year={cursor.getFullYear()}
          byDay={byDay}
          onMonth={(m) => {
            setCursor(new Date(cursor.getFullYear(), m, 1));
            setView("month");
          }}
        />
      )}
      {view === "month" && (
        <MonthView
          cursor={cursor}
          byDay={byDay}
          postsByDay={postsByDay}
          onArticleClick={onArticleClick}
          onPostClick={setPostDetail}
          onDay={(d) => { setCursor(d); setView("day"); }}
        />
      )}

      {view === "week" && (
        <WeekView cursor={cursor} byDay={byDay} onArticleClick={onArticleClick} />
      )}
      {view === "day" && <DayView cursor={cursor} byDay={byDay} onArticleClick={onArticleClick} />}
      {view === "agenda" && <AgendaView rows={rows} onArticleClick={onArticleClick} />}
      <CalendarPostDetail post={postDetail} onOpenChange={(v) => !v && setPostDetail(null)} />
    </div>
  );
}

function CalendarPostDetail({ post, onOpenChange }: { post: SocialPost | null; onOpenChange: (v: boolean) => void }) {
  return (
    <Sheet open={!!post} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto scroll-fancy">
        {post && (
          <>
            <SheetHeader className="border-b pb-4">
              <div className="flex flex-wrap gap-2 mb-2">
                {post.platforms.map((pl) => { const Icon = PLATFORM_ICONS[pl]; return <span key={pl} className={cn("text-[10px] px-2 py-0.5 rounded-full border inline-flex items-center gap-1", PLATFORM_META[pl].bg, PLATFORM_META[pl].color)}><Icon className="h-3 w-3" /> {pl}</span>; })}
                <StatusBadge status={post.statut} dot={post.statut === "Brouillon"} />
              </div>
              <SheetTitle>{post.titre}</SheetTitle>
              <div className="text-xs text-muted-foreground">Publication : {post.date}{post.heure ? ` · ${post.heure}` : ""}</div>
            </SheetHeader>
            <div className="py-4 space-y-4">
              {post.media.length > 0 && (
                <div className="grid grid-cols-2 gap-2">{post.media.map((m) => (
                  <div key={m.id} className="aspect-video rounded-lg overflow-hidden border bg-muted"><img src={m.url} alt={m.description ?? ""} className="w-full h-full object-cover" /></div>
                ))}</div>
              )}
              <section><h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Caption</h4><p className="text-sm whitespace-pre-line">{post.caption}</p></section>
              <section><h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Hashtags</h4><div className="flex flex-wrap gap-1">{post.hashtags.map((h) => <span key={h} className="text-[11px] px-2 py-0.5 rounded-full bg-[color:var(--gold)]/15 text-[color:var(--gold)] border border-[color:var(--gold)]/30">{h}</span>)}</div></section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}


function startOfWeek(d: Date) {
  const s = new Date(d);
  const dow = (s.getDay() + 6) % 7; // Mon=0
  s.setDate(s.getDate() - dow);
  s.setHours(0, 0, 0, 0);
  return s;
}

function YearView({
  year,
  byDay,
  onMonth,
}: {
  year: number;
  byDay: Map<string, Article[]>;
  onMonth: (m: number) => void;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {MONTHS_FR.map((name, m) => {
        const first = new Date(year, m, 1);
        const startDow = (first.getDay() + 6) % 7;
        const days = new Date(year, m + 1, 0).getDate();
        const cells: (number | null)[] = [];
        for (let i = 0; i < startDow; i++) cells.push(null);
        for (let d = 1; d <= days; d++) cells.push(d);
        const total = Array.from(byDay.entries())
          .filter(([k]) => k.startsWith(`${year}-${String(m + 1).padStart(2, "0")}`))
          .reduce((s, [, v]) => s + v.length, 0);
        return (
          <button
            key={m}
            onClick={() => onMonth(m)}
            className="text-left rounded-xl border bg-card p-3 hover:border-primary hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-sm">{name}</div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                {total}
              </span>
            </div>
            <div className="grid grid-cols-7 gap-0.5 text-[9px]">
              {DOW_FR.map((d) => (
                <div key={d} className="text-center text-muted-foreground">
                  {d[0]}
                </div>
              ))}
              {cells.map((d, i) => {
                if (d === null) return <div key={i} />;
                const key = `${year}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                const has = byDay.get(key);
                return (
                  <div
                    key={i}
                    className={cn(
                      "aspect-square rounded grid place-items-center",
                      has ? "bg-primary/20 text-primary font-semibold" : "text-muted-foreground",
                    )}
                  >
                    {d}
                  </div>
                );
              })}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function MonthView({
  cursor,
  byDay,
  postsByDay,
  onArticleClick,
  onPostClick,
  onDay,
}: {
  cursor: Date;
  byDay: Map<string, Article[]>;
  postsByDay?: Map<string, SocialPost[]>;
  onArticleClick: (a: Article) => void;
  onPostClick?: (p: SocialPost) => void;
  onDay: (d: Date) => void;
}) {
  const y = cursor.getFullYear();
  const m = cursor.getMonth();
  const first = new Date(y, m, 1);
  const startDow = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(y, m, d));
  while (cells.length % 7 !== 0) cells.push(null);
  const today = new Date();
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="grid grid-cols-7 border-b bg-muted/30 text-[11px] font-semibold text-muted-foreground">
        {DOW_FR.map((d) => (<div key={d} className="p-2 text-center">{d}</div>))}
      </div>
      <div className="grid grid-cols-7 auto-rows-[minmax(130px,1fr)]">
        {cells.map((d, i) => {
          const isToday = d && d.toDateString() === today.toDateString();
          const key = d ? dateKey(d) : "";
          const articles = key ? (byDay.get(key) ?? []) : [];
          const dayPosts = key ? (postsByDay?.get(key) ?? []) : [];
          const total = articles.length + dayPosts.length;
          const merged = [
            ...articles.map((a) => ({ kind: "article" as const, id: a.id, entity: a })),
            ...dayPosts.map((p) => ({ kind: "post" as const, id: p.id, entity: p })),
          ];
          return (
            <div key={i} className={cn("border-r border-b p-1.5 last:border-r-0", i % 7 === 6 && "border-r-0", !d && "bg-muted/20")}>
              {d && (
                <>
                  <button onClick={() => onDay(d)} className={cn("text-xs font-medium mb-1 h-6 w-6 grid place-items-center rounded-full hover:bg-muted", isToday && "bg-primary text-primary-foreground hover:bg-primary")}>{d.getDate()}</button>
                  <div className="space-y-1">
                    {merged.slice(0, 3).map((ev) => ev.kind === "article" ? (
                      <button key={"a-" + ev.id} onClick={() => onArticleClick(ev.entity)} className={cn("w-full text-left text-[10px] leading-tight px-1.5 py-1 rounded border truncate hover:brightness-95 transition flex items-center gap-1", toneFor(ev.entity))} title={ev.entity.titre}>
                        <GlobeIcon className="h-2.5 w-2.5 shrink-0 text-[color:var(--gold)]" />
                        {ev.entity.heure && <span className="opacity-70 tabular-nums text-[9px]">{ev.entity.heure}</span>}
                        <span className="truncate">{ev.entity.titre}</span>
                      </button>
                    ) : (
                      <button key={"p-" + ev.id} onClick={() => onPostClick?.(ev.entity)} className={cn("w-full text-left text-[10px] leading-tight px-1.5 py-1 rounded border truncate hover:brightness-95 transition flex items-center gap-1", postToneFor(ev.entity))} title={ev.entity.titre}>
                        <div className="flex -space-x-1 shrink-0">
                          {ev.entity.platforms.slice(0, 3).map((pl) => { const Icon = PLATFORM_ICONS[pl]; return <Icon key={pl} className={cn("h-2.5 w-2.5", PLATFORM_META[pl].color)} />; })}
                        </div>
                        {ev.entity.heure && <span className="opacity-70 tabular-nums text-[9px]">{ev.entity.heure}</span>}
                        <span className="truncate">{ev.entity.titre}</span>
                      </button>
                    ))}
                    {total > 3 && (<button onClick={() => onDay(d)} className="text-[10px] text-muted-foreground pl-1 hover:text-foreground">+{total - 3} autres</button>)}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function postToneFor(p: SocialPost) {
  if (p.statut === "Publié") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40";
  if (p.statut === "Brouillon") return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40";
  return "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/40";
}


function WeekView({
  cursor,
  byDay,
  onArticleClick,
}: {
  cursor: Date;
  byDay: Map<string, Article[]>;
  onArticleClick: (a: Article) => void;
}) {
  const start = startOfWeek(cursor);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
  const today = new Date();
  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
      {days.map((d) => {
        const evs = byDay.get(dateKey(d)) ?? [];
        const isToday = d.toDateString() === today.toDateString();
        return (
          <Card key={d.toISOString()} className="p-3 min-h-[280px]">
            <div
              className={cn(
                "text-xs font-semibold mb-2 pb-2 border-b flex items-center justify-between",
                isToday && "text-primary",
              )}
            >
              <span>{DOW_FR[(d.getDay() + 6) % 7]}</span>
              <span
                className={cn(
                  "h-6 w-6 rounded-full grid place-items-center",
                  isToday && "bg-primary text-primary-foreground",
                )}
              >
                {d.getDate()}
              </span>
            </div>
            <div className="space-y-1.5">
              {evs.length === 0 && (
                <div className="text-[10px] text-muted-foreground italic">Aucune publication</div>
              )}
              {evs.map((a) => (
                <button
                  key={a.id}
                  onClick={() => onArticleClick(a)}
                  className={cn(
                    "w-full text-left text-[11px] px-2 py-1.5 rounded border hover:brightness-95 transition",
                    toneFor(a),
                  )}
                >
                  {a.heure && <div className="text-[9px] opacity-70">{a.heure}</div>}
                  <div className="font-medium line-clamp-2">{a.titre}</div>
                </button>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function DayView({
  cursor,
  byDay,
  onArticleClick,
}: {
  cursor: Date;
  byDay: Map<string, Article[]>;
  onArticleClick: (a: Article) => void;
}) {
  const evs = (byDay.get(dateKey(cursor)) ?? [])
    .slice()
    .sort((a, b) => (a.heure ?? "").localeCompare(b.heure ?? ""));
  const hours = Array.from({ length: 12 }, (_, i) => 8 + i); // 8h → 19h
  const byHour = new Map<number, Article[]>();
  for (const a of evs) {
    const h = parseInt((a.heure ?? "09:00").slice(0, 2), 10);
    if (!byHour.has(h)) byHour.set(h, []);
    byHour.get(h)!.push(a);
  }
  return (
    <Card className="p-0 overflow-hidden">
      {evs.length === 0 && (
        <div className="p-16 text-center text-muted-foreground">
          <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-40" />
          Aucune publication ce jour.
        </div>
      )}
      {evs.length > 0 && (
        <div className="divide-y">
          {hours.map((h) => {
            const items = byHour.get(h) ?? [];
            return (
              <div key={h} className="grid grid-cols-[80px_1fr] min-h-[64px]">
                <div className="text-xs text-muted-foreground p-3 border-r bg-muted/20 font-mono">
                  {String(h).padStart(2, "0")}:00
                </div>
                <div className="p-2 space-y-1.5">
                  {items.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => onArticleClick(a)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg border hover:brightness-95 transition",
                        toneFor(a),
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono opacity-70">{a.heure}</span>
                        <span className="font-medium">{a.titre}</span>
                        <StatusBadge status={a.statut} />
                      </div>
                      <div className="text-[11px] opacity-80 mt-0.5">
                        {a.thematique} · {a.auteur}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function AgendaView({
  rows,
  onArticleClick,
}: {
  rows: Article[];
  onArticleClick: (a: Article) => void;
}) {
  const sorted = rows
    .slice()
    .sort((a, b) => (a.date + (a.heure ?? "")).localeCompare(b.date + (b.heure ?? "")));
  const groups = new Map<string, Article[]>();
  for (const a of sorted) {
    if (!groups.has(a.date)) groups.set(a.date, []);
    groups.get(a.date)!.push(a);
  }
  return (
    <div className="space-y-3">
      {[...groups.entries()].map(([date, items]) => (
        <Card key={date} className="p-4">
          <div className="text-sm font-semibold mb-2">{date}</div>
          <div className="space-y-1.5">
            {items.map((a) => (
              <button
                key={a.id}
                onClick={() => onArticleClick(a)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg border hover:brightness-95 transition flex items-center gap-3",
                  toneFor(a),
                )}
              >
                <span className="text-xs font-mono opacity-70 w-12">{a.heure ?? "—"}</span>
                <span className="flex-1 font-medium truncate">{a.titre}</span>
                <StatusBadge status={a.statut} />
              </button>
            ))}
          </div>
        </Card>
      ))}
      {groups.size === 0 && (
        <Card className="p-16 text-center text-muted-foreground">Aucun article planifié.</Card>
      )}
    </div>
  );
}

// ---------------- CONFIG TAB ----------------
const CM_PLATFORMS_ORDER: CmPlatform[] = ["Website", "Facebook", "Instagram", "LinkedIn", "YouTube"];
const CM_PLATFORM_ICON: Record<CmPlatform, typeof Linkedin> = { Website: GlobeIcon, Facebook, Instagram, LinkedIn: Linkedin, YouTube: Youtube };
const CM_PLATFORM_ACCENT: Record<CmPlatform, string> = {
  Website: "text-[color:var(--gold)] bg-[color:var(--gold)]/10 border-[color:var(--gold)]/30",
  Facebook: "text-blue-700 dark:text-blue-300 bg-blue-500/10 border-blue-500/30",
  Instagram: "text-pink-700 dark:text-pink-300 bg-pink-500/10 border-pink-500/30",
  LinkedIn: "text-sky-700 dark:text-sky-300 bg-sky-500/10 border-sky-500/30",
  YouTube: "text-red-700 dark:text-red-300 bg-red-500/10 border-red-500/30",
};

function ConfigTab() {
  const cfg = useConfig();
  const [newTheme, setNewTheme] = useState("");
  const [newAvoid, setNewAvoid] = useState("");
  const [activePlatform, setActivePlatform] = useState<CmPlatform>("Website");
  const cmCfgs = useStore(cmConfigStore);
  const current = cmCfgs.find((c) => c.platform === activePlatform);

  const addTheme = () => {
    if (!newTheme.trim() || cfg.thematiques.includes(newTheme.trim())) return;
    editorialConfigStore.update(cfg.id, { thematiques: [...cfg.thematiques, newTheme.trim()] });
    setNewTheme("");
    toast.success("Thématique ajoutée");
  };
  const removeTheme = (t: string) => editorialConfigStore.update(cfg.id, { thematiques: cfg.thematiques.filter((x) => x !== t) });
  const addAvoid = () => {
    if (!newAvoid.trim() || cfg.topicsAvoid.includes(newAvoid.trim())) return;
    editorialConfigStore.update(cfg.id, { topicsAvoid: [...cfg.topicsAvoid, newAvoid.trim()] });
    setNewAvoid("");
    toast.success("Sujet ajouté à la liste d'exclusion");
  };
  const removeAvoid = (t: string) => editorialConfigStore.update(cfg.id, { topicsAvoid: cfg.topicsAvoid.filter((x) => x !== t) });

  const updateSetting = (key: string, value: string | number | boolean) => {
    if (!current) return;
    cmConfigStore.update(current.id, { settings: { ...current.settings, [key]: value } });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-9 w-9 rounded-lg bg-primary/15 grid place-items-center"><Tag className="h-4 w-4 text-primary" /></div>
            <div><div className="font-semibold">Thématiques éditoriales</div><div className="text-xs text-muted-foreground">Utilisées pour classer et générer les articles.</div></div>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {cfg.thematiques.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">{t}<button onClick={() => removeTheme(t)} className="hover:text-destructive"><X className="h-3 w-3" /></button></span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={newTheme} onChange={(e) => setNewTheme(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTheme()} placeholder="Nouvelle thématique..." />
            <Button onClick={addTheme}><Plus className="h-4 w-4 mr-1" /> Ajouter</Button>
          </div>
        </Card>
        <Card className="p-5 border-destructive/20">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-9 w-9 rounded-lg bg-destructive/15 grid place-items-center"><AlertTriangle className="h-4 w-4 text-destructive" /></div>
            <div><div className="font-semibold">Sujets à éviter</div><div className="text-xs text-muted-foreground">L'agent n'abordera jamais ces thèmes.</div></div>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {cfg.topicsAvoid.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20">{t}<button onClick={() => removeAvoid(t)} className="hover:text-destructive/70"><X className="h-3 w-3" /></button></span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={newAvoid} onChange={(e) => setNewAvoid(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addAvoid()} placeholder="Sujet à exclure..." />
            <Button onClick={addAvoid} variant="outline"><Plus className="h-4 w-4 mr-1" /> Exclure</Button>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-9 w-9 rounded-lg bg-[color:var(--gold)]/20 grid place-items-center"><Wand2 className="h-4 w-4 text-[color:var(--gold)]" /></div>
          <div>
            <div className="font-semibold">Paramètres IA par plateforme</div>
            <div className="text-xs text-muted-foreground">Chaque plateforme dispose de sa propre configuration indépendante.</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-4 border-b pb-3">
          {CM_PLATFORMS_ORDER.map((p) => {
            const Icon = CM_PLATFORM_ICON[p];
            const on = activePlatform === p;
            return (
              <button key={p} onClick={() => setActivePlatform(p)} className={cn("text-xs px-3 py-1.5 rounded-full border inline-flex items-center gap-1.5 transition-all", on ? cn(CM_PLATFORM_ACCENT[p], "font-semibold ring-2 ring-offset-1 ring-current/30") : "hover:bg-muted")}>
                <Icon className="h-3.5 w-3.5" /> {p === "Website" ? "Website (Articles)" : p}
              </button>
            );
          })}
        </div>
        {current && <PlatformConfigForm platform={activePlatform} settings={current.settings} onChange={updateSetting} />}
        <div className="mt-4 flex justify-end">
          <Button onClick={() => toast.success(`Configuration ${activePlatform} enregistrée`)} className="btn-premium hover:[&]:btn-premium-hover">Enregistrer</Button>
        </div>
      </Card>
    </div>
  );
}

type PlatformSettings = Record<string, string | number | boolean>;
function PlatformConfigForm({ platform, settings, onChange }: { platform: CmPlatform; settings: PlatformSettings; onChange: (k: string, v: string | number | boolean) => void }) {
  if (platform === "Website") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <SelectField label="Langue par défaut" value={settings.langue as string} onChange={(v) => onChange("langue", v)} options={["Français", "English", "العربية", "Español"]} />
        <SelectField label="Ton d'écriture" value={settings.ton as string} onChange={(v) => onChange("ton", v)} options={["Professionnel", "Pédagogique", "Inspirationnel", "Analytique", "Expert"]} />
        <SelectField label="Longueur d'article" value={settings.longueur as string} onChange={(v) => onChange("longueur", v)} options={["Court (400-600 mots)", "Moyen (700-1200)", "Long (1500+)"]} />
        <SelectField label="Niveau d'optimisation SEO" value={settings.seoLevel as string} onChange={(v) => onChange("seoLevel", v)} options={["Basique", "Standard", "Élevé", "Maximal"]} />
        <SliderField label="Densité de mots-clés (%)" value={settings.keywordDensity as number} min={1} max={5} step={0.5} onChange={(v) => onChange("keywordDensity", v)} />
        <InputField label="Audience cible" value={settings.audience as string} onChange={(v) => onChange("audience", v)} />
        <SelectField label="Style d'écriture" value={settings.style as string} onChange={(v) => onChange("style", v)} options={["Éditorial", "Journalistique", "Storytelling", "Technique"]} />
        <InputField label="Style de call-to-action" value={settings.cta as string} onChange={(v) => onChange("cta", v)} />
        <SelectField label="Auteur par défaut" value={settings.auteur as string} onChange={(v) => onChange("auteur", v)} options={["IA", "Manuel"]} />
        <InputField label="Catégorie par défaut" value={settings.categorie as string} onChange={(v) => onChange("categorie", v)} />
        <SliderField label="Créativité IA" value={settings.creativite as number} min={0} max={100} step={5} onChange={(v) => onChange("creativite", v)} />
        <SwitchField label="Inclure une conclusion" value={settings.includeConclusion as boolean} onChange={(v) => onChange("includeConclusion", v)} />
        <SwitchField label="Inclure une section FAQ" value={settings.includeFaq as boolean} onChange={(v) => onChange("includeFaq", v)} />
        <SwitchField label="Générer titre SEO" value={settings.generateSeoTitle as boolean} onChange={(v) => onChange("generateSeoTitle", v)} />
        <SwitchField label="Générer meta description" value={settings.generateSeoDescription as boolean} onChange={(v) => onChange("generateSeoDescription", v)} />
        <SwitchField label="Générer les tags automatiquement" value={settings.generateTags as boolean} onChange={(v) => onChange("generateTags", v)} />
        <SwitchField label="Générer l'image de couverture" value={settings.generateCover as boolean} onChange={(v) => onChange("generateCover", v)} />
      </div>
    );
  }
  if (platform === "Facebook") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <SliderField label="Longueur caption (car.)" value={settings.captionLength as number} min={50} max={500} step={10} onChange={(v) => onChange("captionLength", v)} />
        <SelectField label="Utilisation des émojis" value={settings.emojiUsage as string} onChange={(v) => onChange("emojiUsage", v)} options={["Aucun", "Faible", "Moyenne", "Élevée"]} />
        <SliderField label="Nombre de hashtags" value={settings.hashtagCount as number} min={0} max={15} step={1} onChange={(v) => onChange("hashtagCount", v)} />
        <SelectField label="Style de CTA" value={settings.ctaStyle as string} onChange={(v) => onChange("ctaStyle", v)} options={["Interrogatif", "Impératif", "Invitation", "Aucun"]} />
        <SelectField label="Ton conversationnel" value={settings.tone as string} onChange={(v) => onChange("tone", v)} options={["Conversationnel", "Informatif", "Professionnel", "Humoristique"]} />
        <SelectField label="Niveau de storytelling" value={settings.storytellingLevel as string} onChange={(v) => onChange("storytellingLevel", v)} options={["Faible", "Moyen", "Élevé"]} />
      </div>
    );
  }
  if (platform === "Instagram") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <SliderField label="Longueur caption (car.)" value={settings.captionLength as number} min={50} max={300} step={10} onChange={(v) => onChange("captionLength", v)} />
        <SliderField label="Nombre de hashtags" value={settings.hashtagCount as number} min={0} max={30} step={1} onChange={(v) => onChange("hashtagCount", v)} />
        <SelectField label="Densité émojis" value={settings.emojiDensity as string} onChange={(v) => onChange("emojiDensity", v)} options={["Faible", "Moyenne", "Élevée"]} />
        <SelectField label="Ton" value={settings.tone as string} onChange={(v) => onChange("tone", v)} options={["Chaleureux", "Inspirationnel", "Professionnel", "Fun"]} />
        <InputField label="CTA" value={settings.cta as string} onChange={(v) => onChange("cta", v)} />
        <SwitchField label="Image-first (visuel prioritaire)" value={settings.imageFirst as boolean} onChange={(v) => onChange("imageFirst", v)} />
      </div>
    );
  }
  if (platform === "LinkedIn") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <SelectField label="Ton professionnel" value={settings.tone as string} onChange={(v) => onChange("tone", v)} options={["Professionnel", "Expert", "Inspirationnel", "Analytique"]} />
        <SelectField label="Formatage des paragraphes" value={settings.paragraphs as string} onChange={(v) => onChange("paragraphs", v)} options={["Court (1-2 lignes)", "Moyen", "Long (storytelling)"]} />
        <InputField label="CTA" value={settings.cta as string} onChange={(v) => onChange("cta", v)} />
        <InputField label="Stratégie hashtags" value={settings.hashtagStrategy as string} onChange={(v) => onChange("hashtagStrategy", v)} />
        <InputField label="Type d'audience" value={settings.audience as string} onChange={(v) => onChange("audience", v)} />
      </div>
    );
  }
  // YouTube
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <SelectField label="Style du titre" value={settings.titleStyle as string} onChange={(v) => onChange("titleStyle", v)} options={["Accrocheur", "Descriptif", "Question", "Chiffré"]} />
      <SelectField label="Longueur de description" value={settings.descriptionLength as string} onChange={(v) => onChange("descriptionLength", v)} options={["Court", "Moyen", "Long"]} />
      <InputField label="Tags (virgules)" value={settings.tags as string} onChange={(v) => onChange("tags", v)} />
      <InputField label="Prompt miniature" value={settings.thumbnailPrompt as string} onChange={(v) => onChange("thumbnailPrompt", v)} />
      <SelectField label="Placement du CTA" value={settings.ctaPlacement as string} onChange={(v) => onChange("ctaPlacement", v)} options={["Début", "Milieu", "Fin", "Début & fin"]} />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return <div className="space-y-1"><Label className="text-xs">{label}</Label><Select value={value} onValueChange={onChange}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select></div>;
}
function InputField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <div className="space-y-1"><Label className="text-xs">{label}</Label><Input className="h-9" value={value ?? ""} onChange={(e) => onChange(e.target.value)} /></div>;
}
function SliderField({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return <div className="space-y-1"><Label className="text-xs flex items-center justify-between">{label}<span className="tabular-nums text-muted-foreground">{value}</span></Label><Slider min={min} max={max} step={step} value={[value ?? min]} onValueChange={(v) => onChange(v[0])} /></div>;
}
function SwitchField({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return <div className="flex items-center justify-between rounded-lg border p-3"><span className="text-xs font-medium">{label}</span><Switch checked={!!value} onCheckedChange={onChange} /></div>;
}

// ---------------- IDEAS TAB ----------------
const IDEA_PLATFORM_ICON: Record<SocialPlatform, typeof Linkedin> = { LinkedIn: Linkedin, Facebook, Instagram, YouTube: Youtube };

function PostIdeasSection() {
  const ideas = useStore(postIdeasStore);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [prefill, setPrefill] = useState<PostWizardPrefill | null>(null);
  const [generating, setGenerating] = useState(false);
  const [detail, setDetail] = useState<PostIdea | null>(null);

  const regenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      const themes = [
        { titre: "Podcast — DRH d'aujourd'hui", description: "Nouveau format podcast interview DRH.", caption: "Bienvenue dans notre nouveau podcast : chaque mois, une DRH raconte sa transformation 🎙️", mediaConcept: "Vignette portrait + extrait audio.", hashtags: ["#Podcast", "#DRH"], platforms: ["LinkedIn", "YouTube"] as SocialPlatform[] },
        { titre: "Tendance — Semaine de 4 jours", description: "Débat sur la semaine de 4 jours au Maroc.", caption: "La semaine de 4 jours a-t-elle un avenir au Maroc ? Notre analyse en carrousel 👉", mediaConcept: "Carrousel 6 slides pour/contre.", hashtags: ["#4Jours", "#Debate"], platforms: ["LinkedIn", "Instagram"] as SocialPlatform[] },
      ];
      const pick = themes[Math.floor(Math.random() * themes.length)];
      postIdeasStore.add({ id: uid(), titre: pick.titre, description: pick.description, suggestedCaption: pick.caption, mediaConcept: pick.mediaConcept, hashtags: pick.hashtags, platforms: pick.platforms, suggestedDate: new Date().toISOString().slice(0, 10) });
      setGenerating(false);
      toast.success("Nouvelle idée générée");
    }, 700);
  };

  const createPost = (idea: PostIdea) => {
    setPrefill({ titre: idea.titre, caption: idea.suggestedCaption, hashtags: idea.hashtags, platforms: idea.platforms, idea: idea.description, date: idea.suggestedDate });
    setDetail(null);
    setWizardOpen(true);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div>
          <div className="text-sm font-semibold flex items-center gap-1.5"><Lightbulb className="h-4 w-4 text-[color:var(--gold)]" /> Idées de posts générées par l'IA</div>
          <div className="text-xs text-muted-foreground">Basées sur votre profil éditorial et vos thématiques.</div>
        </div>
        <Button onClick={regenerate} disabled={generating} className="ml-auto btn-premium hover:[&]:btn-premium-hover"><Sparkles className={cn("h-4 w-4 mr-1.5", generating && "animate-spin")} /> Générer de nouvelles idées</Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ideas.map((idea) => (
          <Card key={idea.id} className="p-0 overflow-hidden hover-lift cursor-pointer fade-up card-elevated group relative" onClick={() => setDetail(idea)}>
            <div className="h-40 bg-muted relative grid place-items-center text-muted-foreground">
              <div className="text-center px-4">
                <ImageIcon className="h-8 w-8 mx-auto opacity-40 mb-1" />
                <div className="text-[11px] italic line-clamp-2">{idea.mediaConcept}</div>
              </div>
              <div className="absolute top-2 left-2 flex gap-1">
                {idea.platforms.map((pl) => { const Icon = IDEA_PLATFORM_ICON[pl]; return <span key={pl} className="text-white bg-black/60 backdrop-blur rounded-full h-6 w-6 grid place-items-center"><Icon className="h-3 w-3" /></span>; })}
              </div>
              <span className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full bg-[color:var(--gold)]/90 text-[color:var(--gold-foreground)] backdrop-blur inline-flex items-center gap-1"><Sparkles className="h-3 w-3" /> IA</span>
              <button className="absolute bottom-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive" onClick={(e) => { e.stopPropagation(); postIdeasStore.remove(idea.id); toast.success("Idée supprimée"); }}><X className="h-3.5 w-3.5" /></button>
            </div>
            <div className="p-4">
              <h3 className="font-semibold line-clamp-1">{idea.titre}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{idea.suggestedCaption}</p>
              <div className="flex flex-wrap gap-1 mt-2">{idea.hashtags.slice(0, 3).map((h) => <span key={h} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[color:var(--gold)]/15 text-[color:var(--gold)] border border-[color:var(--gold)]/30">{h}</span>)}</div>
              <div className="flex items-center justify-between mt-3">
                <StatusBadge status="Brouillon" dot />
                <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {idea.suggestedDate}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Sheet open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto scroll-fancy">
          {detail && (
            <>
              <SheetHeader className="border-b pb-4">
                <div className="flex flex-wrap gap-2 mb-2 items-center">
                  {detail.platforms.map((pl) => { const Icon = PLATFORM_ICONS[pl]; return <span key={pl} className={cn("text-[10px] px-2 py-0.5 rounded-full border inline-flex items-center gap-1", PLATFORM_META[pl].bg, PLATFORM_META[pl].color)}><Icon className="h-3 w-3" /> {pl}</span>; })}
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[color:var(--gold)]/20 text-[color:var(--gold)] inline-flex items-center gap-1"><Sparkles className="h-3 w-3" /> Idée IA</span>
                  <StatusBadge status="Brouillon" dot />
                </div>
                <SheetTitle>{detail.titre}</SheetTitle>
                <div className="text-xs text-muted-foreground">Date suggérée : {detail.suggestedDate}</div>
              </SheetHeader>
              <div className="py-4 space-y-4">
                <section>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Description</h4>
                  <p className="text-sm">{detail.description}</p>
                </section>
                <section>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Média suggéré</h4>
                  <div className="rounded-lg border bg-muted/30 p-4 text-sm italic text-muted-foreground flex items-start gap-2"><ImageIcon className="h-4 w-4 mt-0.5 shrink-0" /> {detail.mediaConcept}</div>
                </section>
                <section>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Caption proposée</h4>
                  <p className="text-sm whitespace-pre-line rounded-lg border bg-muted/30 p-3">{detail.suggestedCaption}</p>
                </section>
                <section>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Hashtags</h4>
                  <div className="flex flex-wrap gap-1">{detail.hashtags.map((h) => <span key={h} className="text-[11px] px-2 py-0.5 rounded-full bg-[color:var(--gold)]/15 text-[color:var(--gold)] border border-[color:var(--gold)]/30">{h}</span>)}</div>
                </section>
              </div>
              <div className="sticky bottom-0 bg-background border-t -mx-6 px-6 py-3 flex flex-wrap gap-2">
                <Button onClick={() => createPost(detail)} className="btn-premium hover:[&]:btn-premium-hover flex-1"><Send className="h-4 w-4 mr-2" /> Créer le post</Button>
                <Button variant="outline" className="text-destructive border-destructive/30" onClick={() => { postIdeasStore.remove(detail.id); toast.success("Idée supprimée"); setDetail(null); }}><Trash2 className="h-4 w-4 mr-2" /> Supprimer</Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <PostWizard open={wizardOpen} onOpenChange={(v) => { setWizardOpen(v); if (!v) setPrefill(null); }} prefill={prefill} />
    </div>
  );
}

function ArticleIdeasSection() {
  const ideas = useStore(articleIdeasStore);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [prefill, setPrefill] = useState<ArticleWizardPrefill | null>(null);
  const [generating, setGenerating] = useState(false);
  const [detail, setDetail] = useState<{ idea: ArticleIdea; index: number } | null>(null);

  const regenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      const themes = [
        { titre: "Culture feedback : instaurer le rituel hebdomadaire", description: "Guide pratique pour installer une culture du feedback continu.", extrait: "Comment passer de l'entretien annuel au feedback continu sans épuiser les managers.", angle: "Pédagogique — méthode + outils.", keywords: ["Feedback", "Culture", "Management"], thematique: "Management", longueur: "Moyen (700-1200)" },
        { titre: "Diversité & inclusion : mesurer ce qui compte vraiment", description: "Article sur les KPI diversité pertinents.", extrait: "Au-delà des quotas : les 6 indicateurs D&I qui prédisent la performance.", angle: "Analytique — data + benchmark.", keywords: ["Diversité", "Inclusion", "KPI"], thematique: "D&I", longueur: "Long (1500+)" },
      ];
      const pick = themes[Math.floor(Math.random() * themes.length)];
      articleIdeasStore.add({ id: uid(), titre: pick.titre, description: pick.description, suggestedExtrait: pick.extrait, angle: pick.angle, keywords: pick.keywords, thematique: pick.thematique, longueur: pick.longueur, suggestedDate: new Date().toISOString().slice(0, 10) });
      setGenerating(false);
      toast.success("Nouvelle idée d'article générée");
    }, 700);
  };

  const createArticle = (idea: ArticleIdea) => {
    setPrefill({ titre: idea.titre, description: idea.description, keywords: idea.keywords, thematique: idea.thematique, longueur: idea.longueur, extrait: idea.suggestedExtrait });
    setDetail(null);
    setWizardOpen(true);
  };

  return (
    <div className="mb-6">

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div>
          <div className="text-sm font-semibold flex items-center gap-1.5"><Lightbulb className="h-4 w-4 text-[color:var(--gold)]" /> Idées d'articles générées par l'IA</div>
          <div className="text-xs text-muted-foreground">Sujets long-format alignés sur votre ligne éditoriale.</div>
        </div>
        <Button onClick={regenerate} disabled={generating} className="ml-auto btn-premium hover:[&]:btn-premium-hover"><Sparkles className={cn("h-4 w-4 mr-1.5", generating && "animate-spin")} /> Générer de nouvelles idées</Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {ideas.map((idea, i) => (
          <Card key={idea.id} className="p-0 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all fade-up cursor-pointer group relative" onClick={() => setDetail({ idea, index: i })}>
            <div className="h-40 bg-muted overflow-hidden relative">
              <img src={ARTICLE_IMAGES[(idea.titre.length + i) % ARTICLE_IMAGES.length]} alt={idea.titre} className="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
              <div className="absolute top-2 left-2 flex gap-1.5">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur uppercase tracking-wide">{idea.thematique}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[color:var(--gold)]/90 text-[color:var(--gold-foreground)] backdrop-blur inline-flex items-center gap-1"><Sparkles className="h-3 w-3" /> IA</span>
              </div>
              <button className="absolute bottom-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive" onClick={(e) => { e.stopPropagation(); articleIdeasStore.remove(idea.id); toast.success("Idée supprimée"); }}><X className="h-3.5 w-3.5" /></button>
            </div>
            <div className="p-4">
              <h3 className="font-semibold line-clamp-2 min-h-[44px]">{idea.titre}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{idea.suggestedExtrait}</p>
              <TagChips tags={idea.keywords} />
              <div className="flex items-center justify-between mt-3">
                <StatusBadge status="Brouillon" dot />
                <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {idea.suggestedDate}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Sheet open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto">
          {detail && (
            <>
              <SheetHeader className="border-b pb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary uppercase">{detail.idea.thematique}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[color:var(--gold)]/20 text-[color:var(--gold)] inline-flex items-center gap-1"><Sparkles className="h-3 w-3" /> Idée IA</span>
                  <StatusBadge status="Brouillon" dot />
                </div>
                <SheetTitle className="text-2xl mt-2">{detail.idea.titre}</SheetTitle>
                <div className="text-xs text-muted-foreground">Date suggérée : {detail.idea.suggestedDate} · Format : {detail.idea.longueur}</div>
                <TagChips tags={detail.idea.keywords} />
              </SheetHeader>
              <div className="py-4 space-y-4">
                <img src={ARTICLE_IMAGES[(detail.idea.titre.length + detail.index) % ARTICLE_IMAGES.length]} alt={detail.idea.titre} className="w-full h-56 object-cover rounded-lg" />
                <section>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Description</h4>
                  <p className="text-sm">{detail.idea.description}</p>
                </section>
                <section>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Extrait proposé</h4>
                  <p className="text-sm italic rounded-lg border bg-muted/30 p-3">"{detail.idea.suggestedExtrait}"</p>
                </section>
                <section>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Angle éditorial</h4>
                  <p className="text-sm">{detail.idea.angle}</p>
                </section>
                <section>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Mots-clés</h4>
                  <div className="flex flex-wrap gap-1">{detail.idea.keywords.map((h) => <span key={h} className="text-[11px] px-2 py-0.5 rounded-full bg-[color:var(--gold)]/15 text-[color:var(--gold)] border border-[color:var(--gold)]/30">#{h}</span>)}</div>
                </section>
              </div>
              <div className="sticky bottom-0 bg-background border-t -mx-6 px-6 py-3 flex flex-wrap gap-2">
                <Button onClick={() => createArticle(detail.idea)} className="btn-premium hover:[&]:btn-premium-hover flex-1"><FileText className="h-4 w-4 mr-2" /> Créer l'article</Button>
                <Button variant="outline" className="text-destructive border-destructive/30" onClick={() => { articleIdeasStore.remove(detail.idea.id); toast.success("Idée supprimée"); setDetail(null); }}><Trash2 className="h-4 w-4 mr-2" /> Supprimer</Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <ArticleWizard open={wizardOpen} onOpenChange={(v) => { setWizardOpen(v); if (!v) setPrefill(null); }} prefill={prefill} />
    </div>
  );
}



// ---------------- POSTS TAB ----------------
const PLATFORM_ICONS: Record<SocialPlatform, typeof Linkedin> = { LinkedIn: Linkedin, Facebook, Instagram, YouTube: Youtube };

function PostsTab() {
  const posts = useStore(postsStore);
  const [postOpen, setPostOpen] = useState(false);
  const [editing, setEditing] = useState<SocialPost | null>(null);
  const [detail, setDetail] = useState<SocialPost | null>(null);
  const [scheduleFor, setScheduleFor] = useState<SocialPost | null>(null);
  const [confirmDel, setConfirmDel] = useState<SocialPost | null>(null);

  const openNew = () => { setEditing(null); setPostOpen(true); };
  const openEdit = (p: SocialPost) => { setEditing(p); setPostOpen(true); };

  const publish = (p: SocialPost) => { postsStore.update(p.id, { statut: "Publié" }); burstConfetti(); toast.success("Post publié"); setDetail(null); };
  const setDraft = (p: SocialPost) => { postsStore.update(p.id, { statut: "Brouillon" }); toast.success("Retour brouillon"); };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="text-sm text-muted-foreground">{posts.length} publication{posts.length > 1 ? "s" : ""}</div>
        <Button onClick={openNew} className="ml-auto btn-premium hover:[&]:btn-premium-hover">
          <Plus className="h-4 w-4 mr-1" /> Nouveau post
        </Button>
      </div>
      <PostWizard open={postOpen} onOpenChange={setPostOpen} editing={editing} />
      <ScheduleDialog open={!!scheduleFor} onOpenChange={(v) => !v && setScheduleFor(null)} initialDate={scheduleFor?.date} initialTime={scheduleFor?.heure} onConfirm={({ date, time }) => { if (scheduleFor) { postsStore.update(scheduleFor.id, { statut: "Planifié", date, heure: time }); toast.success(`Post planifié pour le ${date} à ${time}`); setScheduleFor(null); } }} />

      <PostIdeasSection />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.map((p) => (
          <Card key={p.id} className="p-0 overflow-hidden hover-lift cursor-pointer fade-up card-elevated" onClick={() => setDetail(p)}>
            <div className="h-40 bg-muted relative">
              {p.media[0] ? <img src={p.media[0].url} alt="" className="w-full h-full object-cover" /> : <div className="grid place-items-center h-full text-muted-foreground text-xs">Aucun média</div>}
              <div className="absolute top-2 left-2 flex gap-1">
                {p.platforms.map((pl) => {
                  const Icon = PLATFORM_ICONS[pl];
                  return <span key={pl} className={cn("text-white bg-black/60 backdrop-blur rounded-full h-6 w-6 grid place-items-center")}><Icon className="h-3 w-3" /></span>;
                })}
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold line-clamp-1">{p.titre}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{p.caption}</p>
              <div className="flex flex-wrap gap-1 mt-2">{p.hashtags.slice(0, 3).map((h) => <span key={h} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[color:var(--gold)]/15 text-[color:var(--gold)] border border-[color:var(--gold)]/30">{h}</span>)}</div>
              <div className="flex items-center justify-between mt-3">
                <StatusBadge status={p.statut} dot={p.statut === "Brouillon"} />
                <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {p.date}{p.heure ? ` ${p.heure}` : ""}</span>
              </div>
            </div>
          </Card>
        ))}
        {posts.length === 0 && <Card className="p-16 text-center text-muted-foreground col-span-full">Aucun post pour le moment.</Card>}
      </div>

      {/* Detail sheet */}
      <Sheet open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto scroll-fancy">
          {detail && (
            <>
              <SheetHeader className="border-b pb-4">
                <div className="flex flex-wrap gap-2 mb-2">
                  {detail.platforms.map((pl) => {
                    const Icon = PLATFORM_ICONS[pl];
                    return <span key={pl} className={cn("text-[10px] px-2 py-0.5 rounded-full border inline-flex items-center gap-1", PLATFORM_META[pl].bg, PLATFORM_META[pl].color)}><Icon className="h-3 w-3" /> {pl}</span>;
                  })}
                  <StatusBadge status={detail.statut} dot={detail.statut === "Brouillon"} />
                </div>
                <SheetTitle>{detail.titre}</SheetTitle>
                <div className="text-xs text-muted-foreground">Publication : {detail.date}{detail.heure ? ` · ${detail.heure}` : ""} · Langue : {detail.langue} · Ton : {detail.ton}</div>
              </SheetHeader>
              <div className="py-4 space-y-4">
                {detail.media.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">{detail.media.map((m) => (
                    <div key={m.id} className="aspect-video rounded-lg overflow-hidden border bg-muted"><img src={m.url} alt={m.alt ?? ""} className="w-full h-full object-cover" /></div>
                  ))}</div>
                )}
                <section><h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Caption</h4><p className="text-sm whitespace-pre-line">{detail.caption}</p></section>
                <section><h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Hashtags</h4><div className="flex flex-wrap gap-1">{detail.hashtags.map((h) => <span key={h} className="text-[11px] px-2 py-0.5 rounded-full bg-[color:var(--gold)]/15 text-[color:var(--gold)] border border-[color:var(--gold)]/30">{h}</span>)}</div></section>
                <section>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Paramètres IA par plateforme</h4>
                  <div className="space-y-2">
                    {detail.platforms.map((pl) => (
                      <div key={pl} className={cn("rounded-lg border p-3", PLATFORM_META[pl].bg)}>
                        <div className={cn("text-xs font-semibold mb-1", PLATFORM_META[pl].color)}>{pl}</div>
                        <dl className="text-xs grid grid-cols-2 gap-x-3 gap-y-1">
                          {Object.entries(detail.platformConfig[pl] ?? {}).map(([k, v]) => (
                            <div key={k} className="flex justify-between"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{String(v)}</dd></div>
                          ))}
                        </dl>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
              <div className="sticky bottom-0 bg-background border-t -mx-6 px-6 py-3 flex flex-wrap gap-2">
                {detail.statut !== "Publié" && <Button onClick={() => publish(detail)} className="btn-premium hover:[&]:btn-premium-hover flex-1"><Send className="h-4 w-4 mr-2" /> Publier</Button>}
                <Button variant="outline" onClick={() => setScheduleFor(detail)} className="flex-1"><Clock className="h-4 w-4 mr-2" /> Planifier</Button>
                {detail.statut !== "Brouillon" && <Button variant="outline" onClick={() => setDraft(detail)}>Retour brouillon</Button>}
                <Button variant="outline" onClick={() => { openEdit(detail); setDetail(null); }}><Pencil className="h-4 w-4 mr-2" /> Modifier</Button>
                <Button variant="outline" className="text-destructive border-destructive/30" onClick={() => setConfirmDel(detail)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmDialog open={!!confirmDel} onOpenChange={(v) => !v && setConfirmDel(null)} title="Supprimer ce post ?" destructive confirmLabel="Supprimer" onConfirm={() => { if (confirmDel) { postsStore.remove(confirmDel.id); toast.success("Post supprimé"); setDetail(null); } setConfirmDel(null); }} />
    </div>
  );
}
