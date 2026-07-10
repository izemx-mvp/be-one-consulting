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
import { Pencil, Trash2 } from "lucide-react";
import { rdvStore, uid, useStore, type RendezVous } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/rendezvous")({
  head: () => ({ meta: [{ title: "Rendez-vous & Rappels — Be One Consulting" }] }),
  component: Page,
});

const STATUTS: RendezVous["statutRappel"][] = ["Envoyé", "Programmé", "Non envoyé"];

function empty(): RendezVous {
  const dt = new Date(); dt.setHours(10, 0);
  return { id: "", contact: "", typeRdv: "Réunion client", dateHeure: dt.toISOString().slice(0, 16), canal: "WhatsApp", statutRappel: "Programmé", notes: "" };
}

function Page() {
  const rows = useStore(rdvStore);
  const [statut, setStatut] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RendezVous>(empty());

  const filtered = rows.filter((r) => statut === "all" || r.statutRappel === statut);

  const save = () => {
    if (!editing.contact) return;
    if (editing.id) rdvStore.update(editing.id, editing);
    else rdvStore.add({ ...editing, id: uid() });
    setOpen(false);
  };

  const fmt = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <AppShell title="Rendez-vous & Rappels" subtitle="Agenda et rappels WhatsApp automatisés">
      <DataTable<RendezVous>
        data={filtered}
        searchKeys={["contact", "typeRdv"]}
        addLabel="Nouveau rendez-vous"
        onAdd={() => { setEditing(empty()); setOpen(true); }}
        filters={
          <Select value={statut} onValueChange={setStatut}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Rappel" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les rappels</SelectItem>
              {STATUTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        }
        columns={[
          { header: "Contact", cell: (r) => <span className="font-medium">{r.contact}</span> },
          { header: "Type de RDV", cell: (r) => r.typeRdv },
          { header: "Date & heure", cell: (r) => fmt(r.dateHeure) },
          { header: "Canal", cell: (r) => (
            <span className="inline-flex items-center gap-1.5 text-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> {r.canal}
            </span>
          ) },
          { header: "Rappel", cell: (r) => <StatusBadge status={r.statutRappel} /> },
        ]}
        rowActions={(r) => (
          <div className="flex justify-end gap-1">
            <Button size="icon" variant="ghost" onClick={() => { setEditing(r); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" onClick={() => rdvStore.remove(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        )}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing.id ? "Modifier le rendez-vous" : "Nouveau rendez-vous"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1"><Label>Client / Candidat</Label><Input value={editing.contact} onChange={(e) => setEditing({ ...editing, contact: e.target.value })} /></div>
            <div className="space-y-1"><Label>Type de RDV</Label><Input value={editing.typeRdv} onChange={(e) => setEditing({ ...editing, typeRdv: e.target.value })} /></div>
            <div className="space-y-1"><Label>Date & heure</Label><Input type="datetime-local" value={editing.dateHeure} onChange={(e) => setEditing({ ...editing, dateHeure: e.target.value })} /></div>
            <div className="space-y-1">
              <Label>Statut du rappel</Label>
              <Select value={editing.statutRappel} onValueChange={(v) => setEditing({ ...editing, statutRappel: v as RendezVous["statutRappel"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Canal</Label><Input value={editing.canal} disabled /></div>
            <div className="col-span-2 space-y-1"><Label>Notes</Label><Textarea rows={3} value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} /></div>
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
