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
import { demandesStore, uid, useStore, type Demande } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/demandes")({
  head: () => ({ meta: [{ title: "Demandes Clients — Be One Consulting" }] }),
  component: Page,
});

const TYPES: Demande["type"][] = ["Conseil", "Recrutement", "Formation", "Enquête", "Assessment"];
const STATUTS: Demande["statut"][] = ["Nouveau", "En cours", "Traité", "Redirigé"];

function empty(): Demande {
  return { id: "", nom: "", entreprise: "", type: "Conseil", date: new Date().toISOString().slice(0, 10), statut: "Nouveau", email: "", telephone: "", message: "" };
}

function Page() {
  const rows = useStore(demandesStore);
  const [type, setType] = useState<string>("all");
  const [statut, setStatut] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Demande>(empty());

  const filtered = rows.filter((r) =>
    (type === "all" || r.type === type) && (statut === "all" || r.statut === statut),
  );

  const save = () => {
    if (!editing.nom || !editing.entreprise) return;
    if (editing.id) demandesStore.update(editing.id, editing);
    else demandesStore.add({ ...editing, id: uid() });
    setOpen(false);
  };

  return (
    <AppShell title="Demandes Clients" subtitle="Gestion de l'intake des demandes entrantes">
      <DataTable<Demande>
        data={filtered}
        searchKeys={["nom", "entreprise", "email"]}
        addLabel="Nouvelle demande"
        onAdd={() => { setEditing(empty()); setOpen(true); }}
        filters={
          <>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-[170px]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statut} onValueChange={setStatut}>
              <SelectTrigger className="w-[170px]"><SelectValue placeholder="Statut" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                {STATUTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </>
        }
        columns={[
          { header: "Nom", cell: (r) => <span className="font-medium">{r.nom}</span> },
          { header: "Entreprise", cell: (r) => r.entreprise },
          { header: "Type", cell: (r) => <span className="text-sm">{r.type}</span> },
          { header: "Date", cell: (r) => r.date },
          { header: "Statut", cell: (r) => <StatusBadge status={r.statut} /> },
        ]}
        rowActions={(r) => (
          <div className="flex justify-end gap-1">
            <Button size="icon" variant="ghost" onClick={() => { setEditing(r); setOpen(true); }}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => demandesStore.remove(r.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        )}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing.id ? "Modifier la demande" : "Nouvelle demande"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1"><Label>Nom du contact</Label><Input value={editing.nom} onChange={(e) => setEditing({ ...editing, nom: e.target.value })} /></div>
            <div className="col-span-2 space-y-1"><Label>Entreprise</Label><Input value={editing.entreprise} onChange={(e) => setEditing({ ...editing, entreprise: e.target.value })} /></div>
            <div className="space-y-1"><Label>Email</Label><Input value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></div>
            <div className="space-y-1"><Label>Téléphone</Label><Input value={editing.telephone} onChange={(e) => setEditing({ ...editing, telephone: e.target.value })} /></div>
            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={editing.type} onValueChange={(v) => setEditing({ ...editing, type: v as Demande["type"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Statut</Label>
              <Select value={editing.statut} onValueChange={(v) => setEditing({ ...editing, statut: v as Demande["statut"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1"><Label>Date</Label><Input type="date" value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })} /></div>
            <div className="col-span-2 space-y-1"><Label>Message</Label><Textarea rows={3} value={editing.message} onChange={(e) => setEditing({ ...editing, message: e.target.value })} /></div>
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
