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
import { Pencil, Trash2, BarChart3 } from "lucide-react";
import { enquetesStore, uid, useStore, type Enquete } from "@/lib/mock-data";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_app/enquetes")({
  head: () => ({ meta: [{ title: "Enquêtes & Études — Be One Consulting" }] }),
  component: Page,
});

const TYPES: Enquete["type"][] = ["Enquête satisfaction", "Étude de marché", "Audit organisationnel"];
const STATUTS: Enquete["statut"][] = ["En cours", "Terminé", "En attente de relance"];

function empty(): Enquete {
  return { id: "", client: "", type: "Enquête satisfaction", envoyees: 100, reponses: 0, dateLancement: new Date().toISOString().slice(0, 10), statut: "En cours" };
}

function Page() {
  const rows = useStore(enquetesStore);
  const [type, setType] = useState("all");
  const [statut, setStatut] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Enquete>(empty());
  const [detail, setDetail] = useState<Enquete | null>(null);

  const filtered = rows.filter((r) => (type === "all" || r.type === type) && (statut === "all" || r.statut === statut));

  const save = () => {
    if (!editing.client) return;
    if (editing.id) enquetesStore.update(editing.id, editing);
    else enquetesStore.add({ ...editing, id: uid() });
    setOpen(false);
  };

  const detailData = detail
    ? [
        { note: "Très satisfait", n: Math.round(detail.reponses * 0.45) },
        { note: "Satisfait", n: Math.round(detail.reponses * 0.32) },
        { note: "Neutre", n: Math.round(detail.reponses * 0.14) },
        { note: "Peu satisfait", n: Math.round(detail.reponses * 0.06) },
        { note: "Insatisfait", n: Math.round(detail.reponses * 0.03) },
      ]
    : [];

  return (
    <AppShell title="Enquêtes & Études" subtitle="Suivi des enquêtes clients et études terrain">
      <DataTable<Enquete>
        data={filtered}
        searchKeys={["client"]}
        addLabel="Nouvelle enquête"
        onAdd={() => { setEditing(empty()); setOpen(true); }}
        filters={
          <>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-[210px]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statut} onValueChange={setStatut}>
              <SelectTrigger className="w-[190px]"><SelectValue placeholder="Statut" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                {STATUTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </>
        }
        columns={[
          { header: "Client", cell: (r) => <button onClick={() => setDetail(r)} className="font-medium hover:underline text-left">{r.client}</button> },
          { header: "Type", cell: (r) => r.type },
          { header: "Réponses", cell: (r) => (
            <div className="text-sm">
              <span className="font-medium">{r.reponses}</span> / {r.envoyees}
              <div className="w-24 h-1.5 rounded-full bg-muted mt-1 overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${(r.reponses / r.envoyees) * 100}%` }} />
              </div>
            </div>
          ) },
          { header: "Date de lancement", cell: (r) => r.dateLancement },
          { header: "Statut", cell: (r) => <StatusBadge status={r.statut} /> },
        ]}
        rowActions={(r) => (
          <div className="flex justify-end gap-1">
            <Button size="icon" variant="ghost" onClick={() => setDetail(r)}><BarChart3 className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" onClick={() => { setEditing(r); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" onClick={() => enquetesStore.remove(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        )}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing.id ? "Modifier l'enquête" : "Nouvelle enquête"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1"><Label>Client</Label><Input value={editing.client} onChange={(e) => setEditing({ ...editing, client: e.target.value })} /></div>
            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={editing.type} onValueChange={(v) => setEditing({ ...editing, type: v as Enquete["type"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Statut</Label>
              <Select value={editing.statut} onValueChange={(v) => setEditing({ ...editing, statut: v as Enquete["statut"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Envoyées</Label><Input type="number" value={editing.envoyees} onChange={(e) => setEditing({ ...editing, envoyees: Number(e.target.value) })} /></div>
            <div className="space-y-1"><Label>Réponses reçues</Label><Input type="number" value={editing.reponses} onChange={(e) => setEditing({ ...editing, reponses: Number(e.target.value) })} /></div>
            <div className="col-span-2 space-y-1"><Label>Date de lancement</Label><Input type="date" value={editing.dateLancement} onChange={(e) => setEditing({ ...editing, dateLancement: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={save} className="bg-primary text-primary-foreground">Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="sm:max-w-2xl">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle>{detail.client} — {detail.type}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-3 gap-3">
                <Card className="p-4">
                  <div className="text-xs text-muted-foreground">Taux de réponse</div>
                  <div className="text-2xl font-semibold mt-1">{Math.round((detail.reponses / detail.envoyees) * 100)}%</div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs text-muted-foreground">Réponses</div>
                  <div className="text-2xl font-semibold mt-1">{detail.reponses}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs text-muted-foreground">Score moyen (NPS)</div>
                  <div className="text-2xl font-semibold mt-1">+{20 + ((detail.reponses % 50))}</div>
                </Card>
              </div>
              <div className="h-64 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={detailData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="note" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="n" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
