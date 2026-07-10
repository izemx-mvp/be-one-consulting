import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Pencil, Trash2 } from "lucide-react";
import { candidatsStore, uid, useStore, type Candidat } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/recrutement")({
  head: () => ({ meta: [{ title: "Recrutement — Be One Consulting" }] }),
  component: Page,
});

const SOURCES: Candidat["source"][] = ["LinkedIn", "Facebook", "Instagram"];
const STATUTS: Candidat["statut"][] = ["Nouveau", "Présélectionné", "Entretien", "Rejeté", "Recruté"];

function empty(): Candidat {
  return { id: "", nom: "", poste: "", source: "LinkedIn", score: 60, statut: "Nouveau", email: "", telephone: "" };
}

function Page() {
  const rows = useStore(candidatsStore);
  const [statut, setStatut] = useState("all");
  const [source, setSource] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Candidat>(empty());

  const filtered = rows.filter((r) =>
    (statut === "all" || r.statut === statut) && (source === "all" || r.source === source),
  );

  const save = () => {
    if (!editing.nom || !editing.poste) return;
    if (editing.id) candidatsStore.update(editing.id, editing);
    else candidatsStore.add({ ...editing, id: uid() });
    setOpen(false);
  };

  return (
    <AppShell title="Recrutement — CVthèque" subtitle="Pipeline de candidats">
      <Tabs defaultValue="table">
        <TabsList>
          <TabsTrigger value="table">Tableau</TabsTrigger>
          <TabsTrigger value="kanban">Pipeline</TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="mt-4">
          <DataTable<Candidat>
            data={filtered}
            searchKeys={["nom", "poste", "email"]}
            addLabel="Nouveau candidat"
            onAdd={() => { setEditing(empty()); setOpen(true); }}
            filters={
              <>
                <Select value={statut} onValueChange={setStatut}>
                  <SelectTrigger className="w-[170px]"><SelectValue placeholder="Statut" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous statuts</SelectItem>
                    {STATUTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger className="w-[150px]"><SelectValue placeholder="Source" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes sources</SelectItem>
                    {SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </>
            }
            columns={[
              { header: "Nom", cell: (r) => <span className="font-medium">{r.nom}</span> },
              { header: "Poste visé", cell: (r) => r.poste },
              { header: "Source", cell: (r) => r.source },
              { header: "Score", cell: (r) => (
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-[color:var(--gold)]" style={{ width: `${r.score}%` }} />
                  </div>
                  <span className="text-xs tabular-nums">{r.score}</span>
                </div>
              ) },
              { header: "Statut", cell: (r) => <StatusBadge status={r.statut} /> },
            ]}
            rowActions={(r) => (
              <div className="flex justify-end gap-1">
                <Button size="icon" variant="ghost" onClick={() => { setEditing(r); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => candidatsStore.remove(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            )}
          />
        </TabsContent>

        <TabsContent value="kanban" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {STATUTS.map((col) => {
              const cards = rows.filter((r) => r.statut === col);
              return (
                <div key={col} className="bg-muted/40 rounded-lg p-3 min-h-[300px]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">{col}</span>
                    <span className="text-xs text-muted-foreground">{cards.length}</span>
                  </div>
                  <div className="space-y-2">
                    {cards.map((c) => (
                      <Card key={c.id} className="p-3 text-sm">
                        <div className="font-medium">{c.nom}</div>
                        <div className="text-xs text-muted-foreground">{c.poste}</div>
                        <div className="flex items-center justify-between mt-2 text-xs">
                          <span>{c.source}</span>
                          <span className="tabular-nums text-[color:var(--gold-foreground)] font-medium">{c.score}/100</span>
                        </div>
                      </Card>
                    ))}
                    {cards.length === 0 && (
                      <div className="text-xs text-muted-foreground text-center py-6">Aucun candidat</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing.id ? "Modifier le candidat" : "Nouveau candidat"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1"><Label>Nom complet</Label><Input value={editing.nom} onChange={(e) => setEditing({ ...editing, nom: e.target.value })} /></div>
            <div className="col-span-2 space-y-1"><Label>Poste visé</Label><Input value={editing.poste} onChange={(e) => setEditing({ ...editing, poste: e.target.value })} /></div>
            <div className="space-y-1"><Label>Email</Label><Input value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></div>
            <div className="space-y-1"><Label>Téléphone</Label><Input value={editing.telephone} onChange={(e) => setEditing({ ...editing, telephone: e.target.value })} /></div>
            <div className="space-y-1">
              <Label>Source</Label>
              <Select value={editing.source} onValueChange={(v) => setEditing({ ...editing, source: v as Candidat["source"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Statut</Label>
              <Select value={editing.statut} onValueChange={(v) => setEditing({ ...editing, statut: v as Candidat["statut"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1"><Label>Score de qualification (0-100)</Label><Input type="number" min={0} max={100} value={editing.score} onChange={(e) => setEditing({ ...editing, score: Number(e.target.value) })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={save} className="bg-primary text-primary-foreground">Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
