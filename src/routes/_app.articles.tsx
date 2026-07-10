import { createFileRoute } from "@tanstack/react-router";
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
import { Check, X, Plus, Search, Sparkles, Pencil, Trash2, Clock, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { articlesStore, THEMATIQUES, uid, useStore, type Article } from "@/lib/mock-data";
import { StatusBadge } from "@/components/status-badge";
import { RichEditor } from "@/components/rich-editor";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";
import { burstConfetti } from "@/lib/confetti";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/articles")({
  head: () => ({ meta: [{ title: "Articles & Blog — Be One Consulting" }] }),
  component: Page,
});

const STATUTS: Article["statut"][] = ["Brouillon", "En attente de validation", "Publié"];
const PAGE_SIZE = 9;

function empty(): Article {
  return {
    id: "", titre: "", thematique: THEMATIQUES[0], auteur: "Manuel",
    contenu: "<h2>Nouveau titre</h2><p>Rédigez votre article ici...</p>",
    extrait: "", statut: "Brouillon",
    date: new Date().toISOString().slice(0, 10),
  };
}

function ThumbGrad({ label, seed }: { label: string; seed: number }) {
  const h1 = seed % 360;
  const h2 = (seed * 3 + 60) % 360;
  return (
    <div className="h-36 rounded-lg grid place-items-center text-4xl font-bold text-white shadow-inner relative overflow-hidden" style={{ background: `linear-gradient(135deg, hsl(${h1} 45% 35%), hsl(${h2} 60% 50%))` }}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.25),transparent_60%)]" />
      <span className="relative">{label}</span>
    </div>
  );
}

function Page() {
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

  const approve = (a: Article) => {
    articlesStore.update(a.id, { statut: "Publié" });
    burstConfetti();
    toast.success("Article approuvé et publié !", { description: a.titre });
    setDetail(null);
  };

  const reject = (a: Article) => {
    articlesStore.update(a.id, { statut: "Brouillon" });
    toast.success("Article renvoyé en brouillon", { description: rejectComment || "Sans commentaire" });
    setRejectOpen(false);
    setRejectComment("");
    setDetail(null);
  };

  return (
    <AppShell title="Articles & Blog" subtitle="Génération IA, validation humaine et publication">
      <div className="rounded-xl border p-3 mb-4 flex items-center gap-3 bg-[color:var(--gold)]/10 border-[color:var(--gold)]/30">
        <Sparkles className="h-4 w-4 text-[color:var(--gold-foreground)] dark:text-[color:var(--gold)]" />
        <div className="text-sm">
          <span className="font-medium">Prochaine génération automatique dans 3 jours</span>
          <span className="text-muted-foreground"> — thématiques configurées : {THEMATIQUES.slice(0, 3).join(", ")}...</span>
        </div>
        <Button size="sm" variant="ghost" className="ml-auto" onClick={() => toast.info("Configuration à venir")}>Configurer</Button>
      </div>

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
            <Card key={a.id} className="p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all fade-up cursor-pointer" onClick={() => setDetail(a)}>
              <ThumbGrad label={a.thematique[0]} seed={a.titre.length * 17 + i} />
              <div className="flex items-center gap-2 mt-3">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary uppercase tracking-wide">{a.thematique}</span>
                {a.auteur === "IA" ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[color:var(--gold)]/20 text-[color:var(--gold-foreground)] dark:text-[color:var(--gold)] inline-flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> IA
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted">Manuel</span>
                )}
              </div>
              <h3 className="font-semibold mt-2 line-clamp-2">{a.titre}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.extrait}</p>
              <div className="flex items-center justify-between mt-3">
                <StatusBadge status={a.statut} dot={a.statut === "En attente de validation"} />
                <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {a.date}</span>
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

      {/* Editor Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl">
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
            <div className="space-y-1"><Label>Date</Label><Input type="date" value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })} /></div>
            <div className="col-span-2 space-y-1"><Label>Extrait (2 lignes)</Label><Input value={editing.extrait} onChange={(e) => setEditing({ ...editing, extrait: e.target.value })} /></div>
            <div className="col-span-2 space-y-1"><Label>Contenu</Label><RichEditor value={editing.contenu} onChange={(v) => setEditing({ ...editing, contenu: v })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={save} className="bg-primary text-primary-foreground">Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview / Validation Drawer */}
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
                <div className="text-xs text-muted-foreground">{detail.date}</div>
              </SheetHeader>
              <div className="py-4">
                <ThumbGrad label={detail.thematique[0]} seed={detail.titre.length * 17} />
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

      {/* Reject dialog */}
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
        open={!!confirmDel}
        onOpenChange={(v) => !v && setConfirmDel(null)}
        title="Supprimer cet article ?"
        destructive
        confirmLabel="Supprimer"
        onConfirm={() => { if (confirmDel) { articlesStore.remove(confirmDel.id); toast.success("Article supprimé"); setDetail(null); } setConfirmDel(null); }}
      />
    </AppShell>
  );
}
