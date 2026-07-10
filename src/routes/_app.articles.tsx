import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Check, X, Plus, Search, Sparkles, Pencil, Trash2, Clock, ChevronLeft, ChevronRight, FileText, LayoutGrid, CalendarDays, Wand2, ImageIcon, Settings2 } from "lucide-react";
import { articlesStore, THEMATIQUES, ARTICLE_IMAGES, uid, useStore, type Article } from "@/lib/mock-data";
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

const STATUTS: Article["statut"][] = ["Brouillon", "En attente de validation", "Publié"];
const PAGE_SIZE = 9;

const IA_IDEAS = [
  "Comment structurer un comité de rémunération en PME marocaine",
  "IA générative & RH : quelles applications concrètes en 2026 ?",
  "Marque employeur : les 7 signaux faibles à surveiller",
  "Négocier un package : ce que les cadres marocains attendent vraiment",
  "Restructuration : conduire le changement sans casser la culture",
  "Talent mapping : la nouvelle arme des DRH stratégiques",
  "Onboarding hybride : sécuriser les 100 premiers jours",
];

function coverFor(a: Article, i: number) {
  return ARTICLE_IMAGES[(a.titre.length + i) % ARTICLE_IMAGES.length];
}

function empty(): Article {
  return {
    id: "", titre: "", thematique: THEMATIQUES[0], auteur: "Manuel",
    contenu: "<h2>Nouveau titre</h2><p>Rédigez votre article ici...</p>",
    extrait: "", statut: "Brouillon",
    date: new Date().toISOString().slice(0, 10),
  };
}

function Page() {
  return (
    <AppShell title="Articles AI" subtitle="Agent Rédaction — génération d'idées, création IA ou manuelle, validation humaine et planification">
      <Tabs defaultValue="grid">
        <TabsList className="mb-4">
          <TabsTrigger value="grid"><LayoutGrid className="h-4 w-4 mr-2" /> Articles</TabsTrigger>
          <TabsTrigger value="calendar"><CalendarDays className="h-4 w-4 mr-2" /> Calendrier éditorial</TabsTrigger>
          <TabsTrigger value="ai"><Wand2 className="h-4 w-4 mr-2" /> Génération IA</TabsTrigger>
        </TabsList>
        <TabsContent value="grid"><GridTab /></TabsContent>
        <TabsContent value="calendar"><CalendarTab /></TabsContent>
        <TabsContent value="ai"><AiTab /></TabsContent>
      </Tabs>
    </AppShell>
  );
}

function GridTab() {
  const rows = useStore(articlesStore);
  const [statut, setStatut] = useState("all");
  const [thematique, setThematique] = useState("all");
  const [auteur, setAuteur] = useState("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Article>(empty());
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
      (!q || r.titre.toLowerCase().includes(needle) || r.thematique.toLowerCase().includes(needle)),
    );
  }, [rows, q, statut, thematique, auteur]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const save = () => {
    if (!editing.titre) { toast.error("Titre requis"); return; }
    if (editing.id) { articlesStore.update(editing.id, editing); toast.success("Article mis à jour"); }
    else { articlesStore.add({ ...editing, id: uid() }); toast.success("Article créé"); }
    setOpen(false);
  };
  const approve = (a: Article) => { articlesStore.update(a.id, { statut: "Publié" }); burstConfetti(); toast.success("Article approuvé et publié !", { description: a.titre }); setDetail(null); };
  const reject = (a: Article) => { articlesStore.update(a.id, { statut: "Brouillon" }); toast.success("Article renvoyé en brouillon", { description: rejectComment || "Sans commentaire" }); setRejectOpen(false); setRejectComment(""); setDetail(null); };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Rechercher un article..." className="pl-9" />
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
          {THEMATIQUES.map((t) => (
            <button key={t} onClick={() => setThematique(t)} className={cn("text-xs px-2.5 py-1 rounded-full border transition-colors", thematique === t ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted")}>{t}</button>
          ))}
        </div>
        <Button onClick={() => { setEditing(empty()); setOpen(true); }} className="ml-auto bg-primary text-primary-foreground">
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
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing.id ? "Modifier l'article" : "Nouvel article"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1"><Label>Titre</Label><Input value={editing.titre} onChange={(e) => setEditing({ ...editing, titre: e.target.value })} /></div>
            <div className="space-y-1">
              <Label>Thématique</Label>
              <Select value={editing.thematique} onValueChange={(v) => setEditing({ ...editing, thematique: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{THEMATIQUES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Auteur</Label>
              <Select value={editing.auteur} onValueChange={(v) => setEditing({ ...editing, auteur: v as Article["auteur"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Manuel">Manuel</SelectItem><SelectItem value="IA">IA</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Statut</Label>
              <Select value={editing.statut} onValueChange={(v) => setEditing({ ...editing, statut: v as Article["statut"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Date de publication</Label><Input type="date" value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })} /></div>
            <div className="col-span-2 space-y-1"><Label>Extrait (2 lignes)</Label><Input value={editing.extrait} onChange={(e) => setEditing({ ...editing, extrait: e.target.value })} /></div>
            <div className="col-span-2 space-y-1">
              <Label>Image de couverture</Label>
              <div className="grid grid-cols-6 gap-2">
                {ARTICLE_IMAGES.slice(0, 6).map((src, i) => (
                  <button key={i} type="button" className="aspect-video rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all" onClick={() => toast.success("Image de couverture mise à jour")}>
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
              <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1 mt-1"><ImageIcon className="h-3 w-3" /> Ou glissez ici votre propre image</div>
            </div>
            <div className="col-span-2 space-y-1"><Label>Contenu</Label><RichEditor value={editing.contenu} onChange={(v) => setEditing({ ...editing, contenu: v })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={save} className="bg-primary text-primary-foreground">Enregistrer</Button>
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
                <div className="text-xs text-muted-foreground">Publication : {detail.date}</div>
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
                <Button variant="outline" onClick={() => { setEditing(detail); setOpen(true); setDetail(null); }}><Pencil className="h-4 w-4 mr-2" /> Modifier</Button>
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

function CalendarTab() {
  const rows = useStore(articlesStore);
  const events: CalendarEvent[] = rows.map((a) => ({
    id: a.id,
    date: a.date,
    title: a.titre,
    tone: a.statut === "Publié" ? "success" : a.statut === "En attente de validation" ? "warn" : "muted",
    onClick: () => toast.info(a.titre, { description: `${a.thematique} · ${a.statut}` }),
  }));
  return (
    <div className="space-y-4">
      <Card className="p-4 flex items-center gap-4 flex-wrap">
        <div>
          <div className="font-semibold text-sm">Calendrier éditorial</div>
          <div className="text-xs text-muted-foreground">Visualisez et planifiez vos publications par jour. Cliquez un article pour voir ses détails.</div>
        </div>
        <div className="flex gap-3 ml-auto text-xs">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Publié</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> En attente</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-muted-foreground" /> Brouillon</span>
        </div>
      </Card>
      <MiniCalendar events={events} title="Planning de publication" />
    </div>
  );
}

function AiTab() {
  const [config, setConfig] = useState({
    frequency: "hebdomadaire",
    thematiquesActives: THEMATIQUES.slice(0, 4),
    ton: "professionnel",
    longueur: "moyen",
    autoValidate: false,
  });
  const [ideas, setIdeas] = useState(IA_IDEAS.slice(0, 4));
  const [loading, setLoading] = useState(false);

  const regenerate = () => {
    setLoading(true);
    setTimeout(() => {
      setIdeas([...IA_IDEAS].sort(() => Math.random() - 0.5).slice(0, 4));
      setLoading(false);
      toast.success("Nouvelles idées générées par l'IA");
    }, 700);
  };

  const createDraft = (idea: string) => {
    articlesStore.add({
      id: uid(), titre: idea, thematique: THEMATIQUES[Math.floor(Math.random() * THEMATIQUES.length)], auteur: "IA",
      contenu: `<h2>${idea}</h2><p>Cet article a été généré automatiquement par l'agent Rédaction de Be One Consulting. Il attend votre validation avant publication.</p>`,
      extrait: "Article proposé par l'agent Rédaction, en attente de validation.",
      statut: "En attente de validation",
      date: new Date().toISOString().slice(0, 10),
    });
    toast.success("Brouillon IA créé", { description: "Retrouvez-le dans « Articles »." });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-9 w-9 rounded-lg bg-[color:var(--gold)]/20 grid place-items-center"><Wand2 className="h-4 w-4 text-[color:var(--gold-foreground)] dark:text-[color:var(--gold)]" /></div>
          <div>
            <div className="font-semibold">Idées d'articles proposées par l'agent</div>
            <div className="text-xs text-muted-foreground">Basées sur les tendances RH & Business du secteur et sur les thématiques activées.</div>
          </div>
          <Button variant="outline" onClick={regenerate} disabled={loading} className="ml-auto"><Sparkles className={cn("h-4 w-4 mr-2", loading && "animate-spin")} /> Régénérer</Button>
        </div>
        <div className="space-y-2">
          {ideas.map((i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors">
              <div className="h-8 w-8 rounded-lg bg-[color:var(--gold)]/15 grid place-items-center shrink-0"><Sparkles className="h-4 w-4 text-[color:var(--gold-foreground)] dark:text-[color:var(--gold)]" /></div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{i}</div>
                <div className="text-xs text-muted-foreground">Angle proposé : décryptage sectoriel avec cas d'usage marocains.</div>
              </div>
              <Button size="sm" onClick={() => createDraft(i)} className="bg-primary text-primary-foreground"><Plus className="h-3.5 w-3.5 mr-1" /> Créer brouillon</Button>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-6 border-t">
          <Link to="/articles"><Button variant="outline">Voir tous les articles <ChevronRight className="h-4 w-4 ml-1" /></Button></Link>
        </div>
      </Card>
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          <div className="font-semibold">Configuration de génération</div>
        </div>
        <div className="space-y-1"><Label>Fréquence</Label>
          <Select value={config.frequency} onValueChange={(v) => setConfig({ ...config, frequency: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="quotidienne">Quotidienne</SelectItem><SelectItem value="hebdomadaire">Hebdomadaire</SelectItem><SelectItem value="bihebdomadaire">Bi-hebdomadaire</SelectItem><SelectItem value="mensuelle">Mensuelle</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label>Ton éditorial</Label>
          <Select value={config.ton} onValueChange={(v) => setConfig({ ...config, ton: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="professionnel">Professionnel & expert</SelectItem><SelectItem value="pedagogique">Pédagogique</SelectItem><SelectItem value="inspirationnel">Inspirationnel</SelectItem><SelectItem value="analytique">Analytique</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label>Longueur</Label>
          <Select value={config.longueur} onValueChange={(v) => setConfig({ ...config, longueur: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="court">Court (400-600 mots)</SelectItem><SelectItem value="moyen">Moyen (700-1200)</SelectItem><SelectItem value="long">Long (1500+)</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label>Thématiques activées</Label>
          <div className="flex flex-wrap gap-1.5">
            {THEMATIQUES.map((t) => {
              const on = config.thematiquesActives.includes(t);
              return (
                <button key={t} onClick={() => setConfig({ ...config, thematiquesActives: on ? config.thematiquesActives.filter((x) => x !== t) : [...config.thematiquesActives, t] })} className={cn("text-xs px-2.5 py-1 rounded-full border transition-colors", on ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted")}>{t}</button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div><div className="text-sm font-medium">Publier sans validation</div><div className="text-xs text-muted-foreground">Déconseillé — Fatima Zahra préfère valider.</div></div>
          <Switch checked={config.autoValidate} onCheckedChange={(v) => setConfig({ ...config, autoValidate: v })} />
        </div>
        <Button className="w-full bg-primary text-primary-foreground" onClick={() => toast.success("Configuration enregistrée")}>Enregistrer la configuration</Button>
      </Card>
    </div>
  );
}
