import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Check, Pencil, Trash2, X, Eye } from "lucide-react";
import { articlesStore, THEMATIQUES, uid, useStore, type Article } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/articles")({
  head: () => ({ meta: [{ title: "Articles & Blog — Be One Consulting" }] }),
  component: Page,
});

const STATUTS: Article["statut"][] = ["Brouillon", "En attente de validation", "Publié"];

function empty(): Article {
  return { id: "", titre: "", thematique: THEMATIQUES[0], auteur: "Manuel", contenu: "", statut: "Brouillon", date: new Date().toISOString().slice(0, 10) };
}

function Page() {
  const rows = useStore(articlesStore);
  const [statut, setStatut] = useState("all");
  const [thematique, setThematique] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Article>(empty());
  const [preview, setPreview] = useState<Article | null>(null);

  const filtered = rows.filter((r) => (statut === "all" || r.statut === statut) && (thematique === "all" || r.thematique === thematique));

  const save = () => {
    if (!editing.titre) return;
    if (editing.id) articlesStore.update(editing.id, editing);
    else articlesStore.add({ ...editing, id: uid() });
    setOpen(false);
  };

  return (
    <AppShell title="Articles & Blog" subtitle="Rédaction, validation et publication de contenus">
      <DataTable<Article>
        data={filtered}
        searchKeys={["titre", "thematique"]}
        addLabel="Nouvel article"
        onAdd={() => { setEditing(empty()); setOpen(true); }}
        filters={
          <>
            <Select value={statut} onValueChange={setStatut}>
              <SelectTrigger className="w-[210px]"><SelectValue placeholder="Statut" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                {STATUTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={thematique} onValueChange={setThematique}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Thématique" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes thématiques</SelectItem>
                {THEMATIQUES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </>
        }
        columns={[
          { header: "Titre", cell: (r) => <button onClick={() => setPreview(r)} className="font-medium hover:underline text-left">{r.titre}</button> },
          { header: "Thématique", cell: (r) => r.thematique },
          { header: "Auteur", cell: (r) => (
            <span className={r.auteur === "IA" ? "text-xs px-2 py-0.5 rounded-full bg-[color:var(--gold)]/20 text-[color:var(--gold-foreground)]" : "text-xs px-2 py-0.5 rounded-full bg-muted"}>
              {r.auteur}
            </span>
          ) },
          { header: "Date", cell: (r) => r.date },
          { header: "Statut", cell: (r) => <StatusBadge status={r.statut} /> },
        ]}
        rowActions={(r) => (
          <div className="flex justify-end gap-1">
            {r.statut === "En attente de validation" && (
              <>
                <Button size="sm" variant="outline" className="text-emerald-700 border-emerald-200" onClick={() => articlesStore.update(r.id, { statut: "Publié" })}>
                  <Check className="h-4 w-4 mr-1" /> Approuver
                </Button>
                <Button size="sm" variant="outline" className="text-destructive border-destructive/30" onClick={() => articlesStore.update(r.id, { statut: "Brouillon" })}>
                  <X className="h-4 w-4 mr-1" /> Rejeter
                </Button>
              </>
            )}
            <Button size="icon" variant="ghost" onClick={() => setPreview(r)}><Eye className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" onClick={() => { setEditing(r); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" onClick={() => articlesStore.remove(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        )}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
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
                <SelectContent>
                  <SelectItem value="Manuel">Manuel</SelectItem>
                  <SelectItem value="IA">IA</SelectItem>
                </SelectContent>
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
            <div className="col-span-2 space-y-1"><Label>Contenu</Label><Textarea rows={8} value={editing.contenu} onChange={(e) => setEditing({ ...editing, contenu: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={save} className="bg-primary text-primary-foreground">Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!preview} onOpenChange={(v) => !v && setPreview(null)}>
        <DialogContent className="sm:max-w-2xl">
          {preview && (
            <>
              <DialogHeader><DialogTitle>{preview.titre}</DialogTitle></DialogHeader>
              <div className="text-xs text-muted-foreground flex gap-3">
                <span>{preview.thematique}</span> · <span>{preview.auteur}</span> · <span>{preview.date}</span>
              </div>
              <div className="prose max-w-none text-sm whitespace-pre-wrap mt-2">{preview.contenu}</div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
