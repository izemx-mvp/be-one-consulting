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
import { Check, X, Plus, Search, Sparkles, Pencil, Trash2, Clock, ChevronLeft, ChevronRight, FileText, LayoutGrid, CalendarDays, Wand2, ImageIcon, Settings2, Lightbulb, CalendarCheck, Send, Tag, AlertTriangle, Hash } from "lucide-react";
import { articlesStore, ARTICLE_IMAGES, editorialConfigStore, uid, useStore, type Article } from "@/lib/mock-data";
import { StatusBadge } from "@/components/status-badge";
import { RichEditor } from "@/components/rich-editor";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { MiniCalendar, type CalendarEvent } from "@/components/mini-calendar";
import { toast } from "sonner";
import { burstConfetti } from "@/lib/confetti";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/articles")({
  head: () => ({ meta: [{ title: "Articles AI — Be One Consulting" }] }),
  component: Page,
});

const STATUTS: Article["statut"][] = ["Idée", "Brouillon", "En attente de validation", "Planifié", "Publié"];
const PAGE_SIZE = 9;

const IA_IDEAS = [
  "Comment structurer un comité de rémunération en PME marocaine",
  "IA générative & RH : quelles applications concrètes en 2026 ?",
  "Marque employeur : les 7 signaux faibles à surveiller",
  "Négocier un package : ce que les cadres marocains attendent vraiment",
  "Restructuration : conduire le changement sans casser la culture",
  "Talent mapping : la nouvelle arme des DRH stratégiques",
  "Onboarding hybride : sécuriser les 100 premiers jours",
  "Automatiser le sourcing sans perdre l'humain",
  "Politique salariale au Maroc : benchmarks 2026",
  "Culture de feedback : rituels concrets à mettre en place",
];

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
  return (
    <AppShell title="Articles AI" subtitle="Agent Rédaction — idées, création IA ou manuelle, validation, planification et publication">
      <Tabs defaultValue="grid">
        <TabsList className="mb-4">
          <TabsTrigger value="grid"><LayoutGrid className="h-4 w-4 mr-2" /> Articles</TabsTrigger>
          <TabsTrigger value="ideas"><Lightbulb className="h-4 w-4 mr-2" /> Idées</TabsTrigger>
          <TabsTrigger value="calendar"><CalendarDays className="h-4 w-4 mr-2" /> Calendrier éditorial</TabsTrigger>
          <TabsTrigger value="config"><Settings2 className="h-4 w-4 mr-2" /> Configuration IA</TabsTrigger>
        </TabsList>
        <TabsContent value="grid"><GridTab /></TabsContent>
        <TabsContent value="ideas"><IdeasTab /></TabsContent>
        <TabsContent value="calendar"><CalendarTab /></TabsContent>
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
        <span key={t} className="text-[10px] inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[color:var(--gold)]/10 text-[color:var(--gold-foreground)] dark:text-[color:var(--gold)] border border-[color:var(--gold)]/20">
          <Hash className="h-2.5 w-2.5" />{t}
        </span>
      ))}
    </div>
  );
}

// ---------------- GRID TAB ----------------
function GridTab() {
  const cfg = useConfig();
  const rows = useStore(articlesStore).filter((a) => a.statut !== "Idée");
  const [statut, setStatut] = useState("all");
  const [thematique, setThematique] = useState("all");
  const [auteur, setAuteur] = useState("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Article>(empty(cfg));
  const [tagsInput, setTagsInput] = useState("");
  const [detail, setDetail] = useState<Article | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState("");
  const [confirmDel, setConfirmDel] = useState<Article | null>(null);

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

  const save = () => {
    if (!editing.titre) { toast.error("Titre requis"); return; }
    const tags = tagsInput.split(",").map((s) => s.trim()).filter(Boolean);
    const item = { ...editing, tags };
    if (editing.id) { articlesStore.update(editing.id, item); toast.success("Article mis à jour"); }
    else { articlesStore.add({ ...item, id: uid() }); toast.success("Article créé"); }
    setOpen(false);
  };
  const approve = (a: Article) => { articlesStore.update(a.id, { statut: "Publié" }); burstConfetti(); toast.success("Article approuvé et publié !", { description: a.titre }); setDetail(null); };
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
          <SelectContent><SelectItem value="all">Tous statuts</SelectItem>{STATUTS.filter((s) => s !== "Idée").map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
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
                  <StatusBadge status={a.statut} dot={a.statut === "En attente de validation"} />
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
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[color:var(--gold)]/15 text-[color:var(--gold-foreground)] dark:text-[color:var(--gold)]"><Hash className="h-2.5 w-2.5 inline" />{t}</span>
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
                    <SelectContent>{STATUTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
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
                  {detail.auteur === "IA" && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[color:var(--gold)]/20 text-[color:var(--gold-foreground)] dark:text-[color:var(--gold)] inline-flex items-center gap-1"><Sparkles className="h-3 w-3" /> IA</span>}
                  <StatusBadge status={detail.statut} dot={detail.statut === "En attente de validation"} />
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
                {detail.statut === "En attente de validation" && (
                  <>
                    <Button onClick={() => approve(detail)} className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1">
                      <Check className="h-4 w-4 mr-2" /> Approuver & Publier
                    </Button>
                    <Button variant="outline" className="text-destructive border-destructive/30 flex-1" onClick={() => setRejectOpen(true)}>
                      <X className="h-4 w-4 mr-2" /> Rejeter / Demander révision
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

// ---------------- IDEAS TAB ----------------
function IdeasTab() {
  const cfg = useConfig();
  const rows = useStore(articlesStore).filter((a) => a.statut === "Idée");
  const [loading, setLoading] = useState(false);
  const [planFor, setPlanFor] = useState<Article | null>(null);
  const [planDate, setPlanDate] = useState(new Date().toISOString().slice(0, 10));
  const [planTime, setPlanTime] = useState("09:00");

  const generate = () => {
    setLoading(true);
    setTimeout(() => {
      const picks = [...IA_IDEAS].sort(() => Math.random() - 0.5).slice(0, 4);
      picks.forEach((titre) => {
        articlesStore.add({
          id: uid(), titre,
          thematique: cfg.thematiques[Math.floor(Math.random() * cfg.thematiques.length)],
          auteur: "IA",
          contenu: `<h2>${titre}</h2><p>Idée générée par l'agent Rédaction. Angle proposé : décryptage sectoriel avec cas d'usage marocains.</p>`,
          extrait: "Idée proposée par l'agent Rédaction, en attente de traitement.",
          statut: "Idée",
          date: new Date().toISOString().slice(0, 10),
          tags: ["IA", "Idée"],
          heure: "09:00",
        });
      });
      setLoading(false);
      toast.success("4 nouvelles idées générées");
    }, 700);
  };

  const approve = (a: Article) => {
    articlesStore.update(a.id, { statut: "En attente de validation" });
    toast.success("Idée approuvée — brouillon envoyé en validation");
  };
  const publish = (a: Article) => {
    articlesStore.update(a.id, { statut: "Publié" });
    burstConfetti(); toast.success("Article publié !");
  };
  const doPlan = () => {
    if (!planFor) return;
    articlesStore.update(planFor.id, { statut: "Planifié", date: planDate, heure: planTime });
    toast.success("Planifié", { description: `${planDate} à ${planTime}` });
    setPlanFor(null);
  };

  return (
    <div className="space-y-4">
      <Card className="p-5 flex flex-wrap items-center gap-4 bg-gradient-to-br from-[color:var(--gold)]/10 via-primary/5 to-transparent border-[color:var(--gold)]/30">
        <div className="h-12 w-12 rounded-xl bg-[color:var(--gold)]/20 grid place-items-center"><Lightbulb className="h-6 w-6 text-[color:var(--gold-foreground)] dark:text-[color:var(--gold)]" /></div>
        <div className="flex-1 min-w-[240px]">
          <div className="font-semibold">Idées générées par l'agent Rédaction</div>
          <div className="text-xs text-muted-foreground">Approuvez, planifiez ou publiez directement. Vous pouvez aussi éditer avant validation.</div>
        </div>
        <Button onClick={generate} disabled={loading} className="btn-premium hover:[&]:btn-premium-hover">
          <Sparkles className={cn("h-4 w-4 mr-2", loading && "animate-spin")} /> Générer 4 idées
        </Button>
      </Card>

      {rows.length === 0 ? (
        <Card className="p-16 text-center text-muted-foreground">
          <Lightbulb className="h-10 w-10 mx-auto mb-2 opacity-40" />
          Aucune idée en attente. Cliquez sur « Générer 4 idées ».
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rows.map((a) => (
            <Card key={a.id} className="p-4 hover:shadow-md transition-all fade-up">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-[color:var(--gold)]/15 grid place-items-center shrink-0"><Sparkles className="h-5 w-5 text-[color:var(--gold-foreground)] dark:text-[color:var(--gold)]" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">{a.thematique}</span>
                    <StatusBadge status="Idée" />
                  </div>
                  <div className="font-semibold leading-snug">{a.titre}</div>
                  <p className="text-xs text-muted-foreground mt-1">{a.extrait}</p>
                  <TagChips tags={a.tags} />
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    <Button size="sm" onClick={() => approve(a)} className="bg-emerald-600 hover:bg-emerald-700 text-white"><Check className="h-3.5 w-3.5 mr-1" /> Approuver</Button>
                    <Button size="sm" variant="outline" onClick={() => { setPlanFor(a); setPlanDate(a.date); setPlanTime(a.heure ?? "09:00"); }}><CalendarCheck className="h-3.5 w-3.5 mr-1" /> Planifier</Button>
                    <Button size="sm" variant="outline" onClick={() => publish(a)}><Send className="h-3.5 w-3.5 mr-1" /> Publier</Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { articlesStore.remove(a.id); toast.success("Idée écartée"); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!planFor} onOpenChange={(v) => !v && setPlanFor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><CalendarCheck className="h-5 w-5 text-primary" /> Planifier la publication</DialogTitle>
            <DialogDescription>{planFor?.titre}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Date</Label><Input type="date" value={planDate} onChange={(e) => setPlanDate(e.target.value)} /></div>
            <div className="space-y-1"><Label>Heure</Label><Input type="time" value={planTime} onChange={(e) => setPlanTime(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanFor(null)}>Annuler</Button>
            <Button onClick={doPlan} className="btn-premium hover:[&]:btn-premium-hover">Planifier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------- CALENDAR TAB ----------------
function CalendarTab() {
  const rows = useStore(articlesStore).filter((a) => a.statut !== "Idée");
  const events: CalendarEvent[] = rows.map((a) => ({
    id: a.id,
    date: a.date,
    title: a.titre,
    tone: a.statut === "Publié" ? "success" : a.statut === "En attente de validation" ? "warn" : a.statut === "Planifié" ? "muted" : "muted",
    onClick: () => toast.info(a.titre, { description: `${a.thematique} · ${a.statut}${a.heure ? ` · ${a.heure}` : ""}` }),
  }));
  return (
    <div className="space-y-4">
      <Card className="p-4 flex items-center gap-4 flex-wrap">
        <div>
          <div className="font-semibold text-sm">Calendrier éditorial</div>
          <div className="text-xs text-muted-foreground">Publications planifiées par jour. Cliquez un article pour voir ses détails.</div>
        </div>
        <div className="flex gap-3 ml-auto text-xs">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Publié</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> En attente</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-muted-foreground" /> Brouillon / Planifié</span>
        </div>
      </Card>
      <MiniCalendar events={events} title="Planning de publication" />
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
          <div className="h-9 w-9 rounded-lg bg-[color:var(--gold)]/20 grid place-items-center"><Wand2 className="h-4 w-4 text-[color:var(--gold-foreground)] dark:text-[color:var(--gold)]" /></div>
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
