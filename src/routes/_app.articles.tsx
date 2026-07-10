import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Check, X, Plus, Search, Sparkles, Pencil, Trash2, Clock, ChevronLeft, ChevronRight, FileText, LayoutGrid, CalendarDays, Wand2, ImageIcon, Settings2, Tag, AlertTriangle, Hash } from "lucide-react";
import { articlesStore, ARTICLE_IMAGES, editorialConfigStore, uid, useStore, type Article } from "@/lib/mock-data";
import { StatusBadge } from "@/components/status-badge";
import { RichEditor } from "@/components/rich-editor";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";
import { burstConfetti } from "@/lib/confetti";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/articles")({
  head: () => ({ meta: [{ title: "Articles AI — Be One Consulting" }] }),
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
    id: "", titre: "", thematique: cfg.thematiques[0] ?? "Général", auteur: "Manuel",
    contenu: "<h2>Nouveau titre</h2><p>Rédigez votre article ici...</p>",
    extrait: "", statut: "Brouillon",
    date: new Date().toISOString().slice(0, 10),
    tags: [],
    heure: "09:00",
  };
}

function Page() {
  const [detailArticle, setDetailArticle] = useState<Article | null>(null);
  return (
    <AppShell title="Articles AI" subtitle="Agent Rédaction — création IA ou manuelle, validation, planification et publication">
      <Tabs defaultValue="grid">
        <TabsList className="mb-4">
          <TabsTrigger value="grid"><LayoutGrid className="h-4 w-4 mr-2" /> Articles</TabsTrigger>
          <TabsTrigger value="calendar"><CalendarDays className="h-4 w-4 mr-2" /> Calendrier éditorial</TabsTrigger>
          <TabsTrigger value="config"><Settings2 className="h-4 w-4 mr-2" /> Configuration IA</TabsTrigger>
        </TabsList>
        <TabsContent value="grid"><GridTab externalDetail={detailArticle} setExternalDetail={setDetailArticle} /></TabsContent>
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
        <span key={t} className="text-[10px] inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[color:var(--gold)]/15 text-[color:var(--gold)] border border-[color:var(--gold)]/35 font-medium shadow-sm">
          <Hash className="h-2.5 w-2.5" />{t}
        </span>
      ))}
    </div>
  );
}

// ---------------- GRID TAB ----------------
function GridTab({ externalDetail, setExternalDetail }: { externalDetail: Article | null; setExternalDetail: (a: Article | null) => void }) {
  const cfg = useConfig();
  const rows = useStore(articlesStore);
  const [statut, setStatut] = useState("all");
  const [thematique, setThematique] = useState("all");
  const [auteur, setAuteur] = useState("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Article>(empty(cfg));
  const [tagsInput, setTagsInput] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState("");
  const [confirmDel, setConfirmDel] = useState<Article | null>(null);

  const detail = externalDetail;
  const setDetail = setExternalDetail;

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    return rows.filter((r) =>
      (statut === "all" || r.statut === statut) &&
      (thematique === "all" || r.thematique === thematique) &&
      (auteur === "all" || r.auteur === auteur) &&
      (!q || r.titre.toLowerCase().includes(needle) || r.thematique.toLowerCase().includes(needle) || r.tags.some((t) => t.toLowerCase().includes(needle))),
    );
  }, [rows, q, statut, thematique, auteur]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const openNew = () => { setEditing(empty(cfg)); setTagsInput(""); setOpen(true); };
  const openEdit = (a: Article) => { setEditing(a); setTagsInput(a.tags.join(", ")); setOpen(true); };

  // Brouillon must be reviewed (approved) before it can be scheduled or published.
  const isBrouillon = editing.statut === "Brouillon";
  const availableStatuts: Article["statut"][] = isBrouillon ? ["Brouillon"] : STATUTS;

  const save = () => {
    if (!editing.titre) { toast.error("Titre requis"); return; }
    const tags = tagsInput.split(",").map((s) => s.trim()).filter(Boolean);
    const item = { ...editing, tags };
    if (editing.id) { articlesStore.update(editing.id, item); toast.success("Article mis à jour"); }
    else { articlesStore.add({ ...item, id: uid() }); toast.success("Article créé"); }
    setOpen(false);
  };

  // Lifecycle actions from the detail sheet.
  const approveToPlanified = (a: Article) => { articlesStore.update(a.id, { statut: "Planifié" }); toast.success("Article approuvé et planifié", { description: a.titre }); setDetail(null); };
  const publishNow = (a: Article) => { articlesStore.update(a.id, { statut: "Publié" }); burstConfetti(); toast.success("Article publié !", { description: a.titre }); setDetail(null); };
  const unschedule = (a: Article) => { articlesStore.update(a.id, { statut: "Planifié" }); toast.success("Article redéplanifié", { description: a.titre }); setDetail(null); };
  const unpublish = (a: Article) => { articlesStore.update(a.id, { statut: "Brouillon" }); toast.success("Article retiré en brouillon", { description: a.titre }); setDetail(null); };
  const reject = (a: Article) => { articlesStore.update(a.id, { statut: "Brouillon" }); toast.success("Article renvoyé en brouillon", { description: rejectComment || "Sans commentaire" }); setRejectOpen(false); setRejectComment(""); setDetail(null); };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Rechercher un article, tag..." className="pl-9" />
        </div>
        <Select value={statut} onValueChange={setStatut}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent><SelectItem value="all">Tous statuts</SelectItem>{STATUTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={auteur} onValueChange={setAuteur}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Auteur" /></SelectTrigger>
          <SelectContent><SelectItem value="all">Tous auteurs</SelectItem><SelectItem value="IA">IA</SelectItem><SelectItem value="Manuel">Manuel</SelectItem></SelectContent>
        </Select>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setThematique("all")} className={cn("text-xs px-2.5 py-1 rounded-full border transition-colors", thematique === "all" ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted")}>Toutes</button>
          {cfg.thematiques.map((t) => (
            <button key={t} onClick={() => setThematique(t)} className={cn("text-xs px-2.5 py-1 rounded-full border transition-colors", thematique === t ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted")}>{t}</button>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pageItems.map((a, i) => (
            <Card key={a.id} className="p-0 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all fade-up cursor-pointer" onClick={() => setDetail(a)}>
              <div className="h-40 bg-muted overflow-hidden relative">
                <img src={coverFor(a, i)} alt={a.titre} className="w-full h-full object-cover transition-transform hover:scale-105" loading="lazy" />
                <div className="absolute top-2 left-2 flex gap-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur uppercase tracking-wide">{a.thematique}</span>
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
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {a.date}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between text-sm mt-4">
        <span className="text-muted-foreground">{filtered.length} article{filtered.length > 1 ? "s" : ""} · Page {current} / {totalPages}</span>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={current === 1}><ChevronLeft className="h-4 w-4" /></Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <Button key={n} size="sm" variant={n === current ? "default" : "outline"} onClick={() => setPage(n)} className={cn("min-w-9", n === current && "bg-primary text-primary-foreground")}>{n}</Button>
          ))}
          <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={current === totalPages}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto p-0">
          <div className="bg-gradient-to-r from-primary/10 via-[color:var(--gold)]/10 to-transparent px-6 py-4 border-b">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl"><FileText className="h-5 w-5 text-[color:var(--gold)]" /> {editing.id ? "Modifier l'article" : "Nouvel article"}</DialogTitle>
              <DialogDescription>Rédigez un contenu prêt à publier. Les tags améliorent la découverte et le référencement.</DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-6 py-4 space-y-5">
            <section>
              <div className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">Informations principales</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1"><Label>Titre</Label><Input value={editing.titre} onChange={(e) => setEditing({ ...editing, titre: e.target.value })} placeholder="Ex: 5 tendances RH à surveiller au Maroc en 2026" /></div>
                <div className="space-y-1">
                  <Label>Thématique</Label>
                  <Select value={editing.thematique} onValueChange={(v) => setEditing({ ...editing, thematique: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{cfg.thematiques.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Auteur</Label>
                  <Select value={editing.auteur} onValueChange={(v) => setEditing({ ...editing, auteur: v as Article["auteur"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="Manuel">Manuel</SelectItem><SelectItem value="IA">IA</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1"><Label>Extrait (2 lignes)</Label><Input value={editing.extrait} onChange={(e) => setEditing({ ...editing, extrait: e.target.value })} placeholder="Une phrase d'accroche qui résume l'article" /></div>
                <div className="col-span-2 space-y-1">
                  <Label className="flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" /> Tags <span className="text-muted-foreground text-xs font-normal">(séparés par virgules)</span></Label>
                  <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="RH, Leadership, Casablanca" />
                  {tagsInput && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {tagsInput.split(",").map((t) => t.trim()).filter(Boolean).map((t, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[color:var(--gold)]/15 text-[color:var(--gold)] border border-[color:var(--gold)]/30 font-medium"><Hash className="h-2.5 w-2.5 inline" />{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
            <section>
              <div className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">Planification</div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>Statut</Label>
                  <Select value={editing.statut} onValueChange={(v) => setEditing({ ...editing, statut: v as Article["statut"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {availableStatuts.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {isBrouillon && (
                    <p className="text-[11px] text-muted-foreground pt-0.5">Approuvez le brouillon depuis sa fiche pour le planifier ou le publier.</p>
                  )}
                </div>
                <div className="space-y-1"><Label>Date de publication</Label><Input type="date" value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })} /></div>
                <div className="space-y-1"><Label>Heure</Label><Input type="time" value={editing.heure ?? "09:00"} onChange={(e) => setEditing({ ...editing, heure: e.target.value })} /></div>
              </div>
            </section>
            <section>
              <div className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-2 flex items-center gap-1.5"><ImageIcon className="h-3.5 w-3.5" /> Image de couverture</div>
              <div className="grid grid-cols-6 gap-2">
                {ARTICLE_IMAGES.slice(0, 6).map((src, i) => (
                  <button key={i} type="button" className="aspect-video rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all" onClick={() => toast.success("Image de couverture mise à jour")}>
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </section>
            <section>
              <div className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">Contenu</div>
              <RichEditor value={editing.contenu} onChange={(v) => setEditing({ ...editing, contenu: v })} />
            </section>
          </div>
          <DialogFooter className="px-6 py-4 border-t bg-muted/30">
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={save} className="btn-premium hover:[&]:btn-premium-hover">Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto">
          {detail && (
            <>
              <SheetHeader className="border-b pb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary uppercase">{detail.thematique}</span>
                  {detail.auteur === "IA" && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[color:var(--gold)]/20 text-[color:var(--gold)] inline-flex items-center gap-1"><Sparkles className="h-3 w-3" /> IA</span>}
                  <StatusBadge status={detail.statut} dot={detail.statut === "Brouillon"} />
                </div>
                <SheetTitle className="text-2xl mt-2">{detail.titre}</SheetTitle>
                <div className="text-xs text-muted-foreground">Publication : {detail.date}{detail.heure ? ` · ${detail.heure}` : ""}</div>
                <TagChips tags={detail.tags} />
              </SheetHeader>
              <div className="py-4">
                <img src={coverFor(detail, 0)} alt={detail.titre} className="w-full h-56 object-cover rounded-lg" />
                <article className="prose prose-sm dark:prose-invert max-w-none mt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-4 [&_ul]:list-disc [&_ul]:pl-5" dangerouslySetInnerHTML={{ __html: detail.contenu }} />
              </div>
              <div className="sticky bottom-0 bg-background border-t -mx-6 px-6 py-3 flex flex-wrap gap-2">
                {detail.statut === "Brouillon" && (
                  <>
                    <Button onClick={() => approveToPlanified(detail)} className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1">
                      <Check className="h-4 w-4 mr-2" /> Approuver & Planifier
                    </Button>
                    <Button variant="outline" className="text-destructive border-destructive/30 flex-1" onClick={() => setRejectOpen(true)}>
                      <X className="h-4 w-4 mr-2" /> Demander révision
                    </Button>
                  </>
                )}
                {detail.statut === "Planifié" && (
                  <>
                    <Button onClick={() => publishNow(detail)} className="btn-premium hover:[&]:btn-premium-hover flex-1">
                      <Check className="h-4 w-4 mr-2" /> Publier maintenant
                    </Button>
                    <Button variant="outline" onClick={() => unpublish(detail)} className="flex-1">
                      <Clock className="h-4 w-4 mr-2" /> Retour brouillon
                    </Button>
                  </>
                )}
                {detail.statut === "Publié" && (
                  <>
                    <Button variant="outline" onClick={() => unschedule(detail)} className="flex-1">
                      <Clock className="h-4 w-4 mr-2" /> Déplanifier
                    </Button>
                    <Button variant="outline" className="text-destructive border-destructive/30 flex-1" onClick={() => unpublish(detail)}>
                      <X className="h-4 w-4 mr-2" /> Retirer
                    </Button>
                  </>
                )}
                <Button variant="outline" onClick={() => { openEdit(detail); setDetail(null); }}><Pencil className="h-4 w-4 mr-2" /> Modifier</Button>
                <Button variant="outline" className="text-destructive border-destructive/30" onClick={() => { setConfirmDel(detail); }}><Trash2 className="h-4 w-4 mr-2" /> Supprimer</Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Demander une révision</DialogTitle></DialogHeader>
          <Label>Commentaire à destination de l'auteur</Label>
          <Textarea rows={4} value={rejectComment} onChange={(e) => setRejectComment(e.target.value)} placeholder="Ex: préciser les sources, revoir le titre..." />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Annuler</Button>
            <Button onClick={() => detail && reject(detail)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Rejeter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmDel} onOpenChange={(v) => !v && setConfirmDel(null)}
        title="Supprimer cet article ?" destructive confirmLabel="Supprimer"
        onConfirm={() => { if (confirmDel) { articlesStore.remove(confirmDel.id); toast.success("Article supprimé"); setDetail(null); } setConfirmDel(null); }}
      />
    </div>
  );
}

// ---------------- CALENDAR TAB ----------------
const MONTHS_FR = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const DOW_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

type View = "year" | "month" | "week" | "day" | "agenda";

function toneFor(a: Article) {
  if (a.statut === "Publié") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40";
  if (a.statut === "Brouillon") return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40";
  if (a.statut === "Planifié") return "bg-[color:var(--gold)]/15 text-[color:var(--gold)] border-[color:var(--gold)]/40";
  return "bg-muted text-muted-foreground border-border";
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function CalendarTab({ onArticleClick }: { onArticleClick: (a: Article) => void }) {
  const rows = useStore(articlesStore);
  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState<Date>(new Date());

  const byDay = useMemo(() => {
    const m = new Map<string, Article[]>();
    for (const a of rows) {
      if (!m.has(a.date)) m.set(a.date, []);
      m.get(a.date)!.push(a);
    }
    return m;
  }, [rows]);

  const label = useMemo(() => {
    if (view === "year") return `${cursor.getFullYear()}`;
    if (view === "month") return `${MONTHS_FR[cursor.getMonth()]} ${cursor.getFullYear()}`;
    if (view === "week") {
      const s = startOfWeek(cursor);
      const e = new Date(s); e.setDate(s.getDate() + 6);
      return `Semaine du ${s.getDate()} ${MONTHS_FR[s.getMonth()].slice(0, 3)} – ${e.getDate()} ${MONTHS_FR[e.getMonth()].slice(0, 3)} ${e.getFullYear()}`;
    }
    if (view === "day") return `${DOW_FR[(cursor.getDay() + 6) % 7]} ${cursor.getDate()} ${MONTHS_FR[cursor.getMonth()]} ${cursor.getFullYear()}`;
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
          <div className="font-semibold text-sm">Calendrier éditorial</div>
          <div className="text-xs text-muted-foreground">Cliquez un article pour ouvrir ses détails.</div>
        </div>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <div className="inline-flex rounded-lg border p-0.5 bg-muted/40">
            {(["year", "month", "week", "day", "agenda"] as View[]).map((v) => (
              <button key={v} onClick={() => setView(v)} className={cn("text-xs px-3 py-1.5 rounded-md capitalize transition-colors", view === v ? "bg-background shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground")}>
                {v === "year" ? "Année" : v === "month" ? "Mois" : v === "week" ? "Semaine" : v === "day" ? "Jour" : "Agenda"}
              </button>
            ))}
          </div>
          {view !== "agenda" && (
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" onClick={() => setCursor(new Date())} className="h-8">Aujourd'hui</Button>
              <Button size="icon" variant="ghost" onClick={() => shift(-1)} className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => shift(1)} className="h-8 w-8"><ChevronRight className="h-4 w-4" /></Button>
            </div>
          )}
        </div>
        <div className="w-full flex items-center justify-between border-t pt-3">
          <div className="text-lg font-semibold">{label}</div>
          <div className="flex gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Publié</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> En attente</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[color:var(--gold)]" /> Planifié</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-muted-foreground" /> Brouillon</span>
          </div>
        </div>
      </Card>

      {view === "year" && <YearView year={cursor.getFullYear()} byDay={byDay} onMonth={(m) => { setCursor(new Date(cursor.getFullYear(), m, 1)); setView("month"); }} />}
      {view === "month" && <MonthView cursor={cursor} byDay={byDay} onArticleClick={onArticleClick} onDay={(d) => { setCursor(d); setView("day"); }} />}
      {view === "week" && <WeekView cursor={cursor} byDay={byDay} onArticleClick={onArticleClick} />}
      {view === "day" && <DayView cursor={cursor} byDay={byDay} onArticleClick={onArticleClick} />}
      {view === "agenda" && <AgendaView rows={rows} onArticleClick={onArticleClick} />}
    </div>
  );
}

function startOfWeek(d: Date) {
  const s = new Date(d);
  const dow = (s.getDay() + 6) % 7; // Mon=0
  s.setDate(s.getDate() - dow);
  s.setHours(0, 0, 0, 0);
  return s;
}

function YearView({ year, byDay, onMonth }: { year: number; byDay: Map<string, Article[]>; onMonth: (m: number) => void }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {MONTHS_FR.map((name, m) => {
        const first = new Date(year, m, 1);
        const startDow = (first.getDay() + 6) % 7;
        const days = new Date(year, m + 1, 0).getDate();
        const cells: (number | null)[] = [];
        for (let i = 0; i < startDow; i++) cells.push(null);
        for (let d = 1; d <= days; d++) cells.push(d);
        const total = Array.from(byDay.entries()).filter(([k]) => k.startsWith(`${year}-${String(m + 1).padStart(2, "0")}`)).reduce((s, [, v]) => s + v.length, 0);
        return (
          <button key={m} onClick={() => onMonth(m)} className="text-left rounded-xl border bg-card p-3 hover:border-primary hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-sm">{name}</div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{total}</span>
            </div>
            <div className="grid grid-cols-7 gap-0.5 text-[9px]">
              {DOW_FR.map((d) => <div key={d} className="text-center text-muted-foreground">{d[0]}</div>)}
              {cells.map((d, i) => {
                if (d === null) return <div key={i} />;
                const key = `${year}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                const has = byDay.get(key);
                return <div key={i} className={cn("aspect-square rounded grid place-items-center", has ? "bg-primary/20 text-primary font-semibold" : "text-muted-foreground")}>{d}</div>;
              })}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function MonthView({ cursor, byDay, onArticleClick, onDay }: { cursor: Date; byDay: Map<string, Article[]>; onArticleClick: (a: Article) => void; onDay: (d: Date) => void }) {
  const y = cursor.getFullYear(); const m = cursor.getMonth();
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
        {DOW_FR.map((d) => <div key={d} className="p-2 text-center">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 auto-rows-[minmax(120px,1fr)]">
        {cells.map((d, i) => {
          const isToday = d && d.toDateString() === today.toDateString();
          const key = d ? dateKey(d) : "";
          const evs = key ? byDay.get(key) ?? [] : [];
          return (
            <div key={i} className={cn("border-r border-b p-1.5 last:border-r-0", (i % 7 === 6) && "border-r-0", !d && "bg-muted/20")}>
              {d && (
                <>
                  <button onClick={() => onDay(d)} className={cn("text-xs font-medium mb-1 h-6 w-6 grid place-items-center rounded-full hover:bg-muted", isToday && "bg-primary text-primary-foreground hover:bg-primary")}>{d.getDate()}</button>
                  <div className="space-y-1">
                    {evs.slice(0, 3).map((a) => (
                      <button key={a.id} onClick={() => onArticleClick(a)} className={cn("w-full text-left text-[10px] leading-tight px-1.5 py-1 rounded border truncate hover:brightness-95 transition", toneFor(a))} title={a.titre}>
                        {a.heure && <span className="opacity-70 mr-1">{a.heure}</span>}{a.titre}
                      </button>
                    ))}
                    {evs.length > 3 && <button onClick={() => onDay(d)} className="text-[10px] text-muted-foreground pl-1 hover:text-foreground">+{evs.length - 3} autres</button>}
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

function WeekView({ cursor, byDay, onArticleClick }: { cursor: Date; byDay: Map<string, Article[]>; onArticleClick: (a: Article) => void }) {
  const start = startOfWeek(cursor);
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  const today = new Date();
  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
      {days.map((d) => {
        const evs = byDay.get(dateKey(d)) ?? [];
        const isToday = d.toDateString() === today.toDateString();
        return (
          <Card key={d.toISOString()} className="p-3 min-h-[280px]">
            <div className={cn("text-xs font-semibold mb-2 pb-2 border-b flex items-center justify-between", isToday && "text-primary")}>
              <span>{DOW_FR[(d.getDay() + 6) % 7]}</span>
              <span className={cn("h-6 w-6 rounded-full grid place-items-center", isToday && "bg-primary text-primary-foreground")}>{d.getDate()}</span>
            </div>
            <div className="space-y-1.5">
              {evs.length === 0 && <div className="text-[10px] text-muted-foreground italic">Aucune publication</div>}
              {evs.map((a) => (
                <button key={a.id} onClick={() => onArticleClick(a)} className={cn("w-full text-left text-[11px] px-2 py-1.5 rounded border hover:brightness-95 transition", toneFor(a))}>
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

function DayView({ cursor, byDay, onArticleClick }: { cursor: Date; byDay: Map<string, Article[]>; onArticleClick: (a: Article) => void }) {
  const evs = (byDay.get(dateKey(cursor)) ?? []).slice().sort((a, b) => (a.heure ?? "").localeCompare(b.heure ?? ""));
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
                <div className="text-xs text-muted-foreground p-3 border-r bg-muted/20 font-mono">{String(h).padStart(2, "0")}:00</div>
                <div className="p-2 space-y-1.5">
                  {items.map((a) => (
                    <button key={a.id} onClick={() => onArticleClick(a)} className={cn("w-full text-left px-3 py-2 rounded-lg border hover:brightness-95 transition", toneFor(a))}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono opacity-70">{a.heure}</span>
                        <span className="font-medium">{a.titre}</span>
                        <StatusBadge status={a.statut} />
                      </div>
                      <div className="text-[11px] opacity-80 mt-0.5">{a.thematique} · {a.auteur}</div>
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

function AgendaView({ rows, onArticleClick }: { rows: Article[]; onArticleClick: (a: Article) => void }) {
  const sorted = rows.slice().sort((a, b) => (a.date + (a.heure ?? "")).localeCompare(b.date + (b.heure ?? "")));
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
              <button key={a.id} onClick={() => onArticleClick(a)} className={cn("w-full text-left px-3 py-2 rounded-lg border hover:brightness-95 transition flex items-center gap-3", toneFor(a))}>
                <span className="text-xs font-mono opacity-70 w-12">{a.heure ?? "—"}</span>
                <span className="flex-1 font-medium truncate">{a.titre}</span>
                <StatusBadge status={a.statut} />
              </button>
            ))}
          </div>
        </Card>
      ))}
      {groups.size === 0 && <Card className="p-16 text-center text-muted-foreground">Aucun article planifié.</Card>}
    </div>
  );
}

// ---------------- CONFIG TAB ----------------
function ConfigTab() {
  const cfg = useConfig();
  const [newTheme, setNewTheme] = useState("");
  const [newAvoid, setNewAvoid] = useState("");
  const [genConfig, setGenConfig] = useState({ frequency: "hebdomadaire", ton: "professionnel", longueur: "moyen", autoValidate: false });

  const addTheme = () => {
    if (!newTheme.trim() || cfg.thematiques.includes(newTheme.trim())) return;
    editorialConfigStore.update(cfg.id, { thematiques: [...cfg.thematiques, newTheme.trim()] });
    setNewTheme(""); toast.success("Thématique ajoutée");
  };
  const removeTheme = (t: string) => editorialConfigStore.update(cfg.id, { thematiques: cfg.thematiques.filter((x) => x !== t) });
  const addAvoid = () => {
    if (!newAvoid.trim() || cfg.topicsAvoid.includes(newAvoid.trim())) return;
    editorialConfigStore.update(cfg.id, { topicsAvoid: [...cfg.topicsAvoid, newAvoid.trim()] });
    setNewAvoid(""); toast.success("Sujet ajouté à la liste d'exclusion");
  };
  const removeAvoid = (t: string) => editorialConfigStore.update(cfg.id, { topicsAvoid: cfg.topicsAvoid.filter((x) => x !== t) });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-9 w-9 rounded-lg bg-primary/15 grid place-items-center"><Tag className="h-4 w-4 text-primary" /></div>
          <div>
            <div className="font-semibold">Thématiques éditoriales</div>
            <div className="text-xs text-muted-foreground">Utilisées pour classer et générer les articles.</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {cfg.thematiques.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              {t}
              <button onClick={() => removeTheme(t)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
            </span>
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
          <div>
            <div className="font-semibold">Sujets à éviter</div>
            <div className="text-xs text-muted-foreground">L'agent Rédaction n'abordera jamais ces thèmes.</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {cfg.topicsAvoid.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
              {t}
              <button onClick={() => removeAvoid(t)} className="hover:text-destructive/70"><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input value={newAvoid} onChange={(e) => setNewAvoid(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addAvoid()} placeholder="Sujet à exclure..." />
          <Button onClick={addAvoid} variant="outline"><Plus className="h-4 w-4 mr-1" /> Exclure</Button>
        </div>
      </Card>

      <Card className="p-5 lg:col-span-2">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-9 w-9 rounded-lg bg-[color:var(--gold)]/20 grid place-items-center"><Wand2 className="h-4 w-4 text-[color:var(--gold)]" /></div>
          <div>
            <div className="font-semibold">Paramètres de génération IA</div>
            <div className="text-xs text-muted-foreground">Fréquence, ton, longueur et automatisation.</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1"><Label>Fréquence</Label>
            <Select value={genConfig.frequency} onValueChange={(v) => setGenConfig({ ...genConfig, frequency: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="quotidienne">Quotidienne</SelectItem><SelectItem value="hebdomadaire">Hebdomadaire</SelectItem><SelectItem value="bihebdomadaire">Bi-hebdomadaire</SelectItem><SelectItem value="mensuelle">Mensuelle</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label>Ton éditorial</Label>
            <Select value={genConfig.ton} onValueChange={(v) => setGenConfig({ ...genConfig, ton: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="professionnel">Professionnel & expert</SelectItem><SelectItem value="pedagogique">Pédagogique</SelectItem><SelectItem value="inspirationnel">Inspirationnel</SelectItem><SelectItem value="analytique">Analytique</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label>Longueur</Label>
            <Select value={genConfig.longueur} onValueChange={(v) => setGenConfig({ ...genConfig, longueur: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="court">Court (400-600 mots)</SelectItem><SelectItem value="moyen">Moyen (700-1200)</SelectItem><SelectItem value="long">Long (1500+)</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="md:col-span-3 flex items-center justify-between rounded-lg border p-3">
            <div><div className="text-sm font-medium">Publier sans validation</div><div className="text-xs text-muted-foreground">Déconseillé — Fatima Zahra préfère valider chaque article.</div></div>
            <Switch checked={genConfig.autoValidate} onCheckedChange={(v) => setGenConfig({ ...genConfig, autoValidate: v })} />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => toast.success("Configuration enregistrée")} className="btn-premium hover:[&]:btn-premium-hover">Enregistrer la configuration</Button>
        </div>
      </Card>
    </div>
  );
}
