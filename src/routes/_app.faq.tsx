import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2, Copy, Briefcase, Lightbulb, GraduationCap, Receipt, Info, Compass, HelpCircle } from "lucide-react";
import { FAQ_CATEGORIES, faqStore, uid, useStore, type FaqItem } from "@/lib/mock-data";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/faq")({
  head: () => ({ meta: [{ title: "Service Client — Be One Consulting" }] }),
  component: Page,
});

const catIcon: Record<string, React.ElementType> = {
  "Recrutement": Briefcase,
  "Conseil & Stratégie": Lightbulb,
  "Formation": GraduationCap,
  "Facturation": Receipt,
  "Général": Info,
  "Missions & Méthodologie": Compass,
};

function empty(): FaqItem {
  return { id: "", categorie: FAQ_CATEGORIES[0], question: "", reponse: "", tags: [], actif: true, usage: 0 };
}
const PAGE_SIZE = 8;

function highlight(text: string, needle: string) {
  if (!needle) return text;
  const parts = text.split(new RegExp(`(${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"));
  return parts.map((p, i) => p.toLowerCase() === needle.toLowerCase() ? <mark key={i} className="bg-[color:var(--gold)]/40 rounded px-0.5">{p}</mark> : <span key={i}>{p}</span>);
}

function Page() {
  const rows = useStore(faqStore);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FaqItem>(empty());
  const [tagsInput, setTagsInput] = useState("");
  const [confirmDel, setConfirmDel] = useState<FaqItem | null>(null);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    return rows.filter((r) =>
      (cat === "all" || r.categorie === cat) &&
      (!q || r.question.toLowerCase().includes(needle) || r.reponse.toLowerCase().includes(needle) || r.tags.some((t) => t.toLowerCase().includes(needle))),
    );
  }, [rows, q, cat]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const save = () => {
    if (!editing.question || !editing.reponse) { toast.error("Question et réponse requises"); return; }
    const tags = tagsInput.split(",").map((s) => s.trim()).filter(Boolean);
    const item = { ...editing, tags: tags.length ? tags : editing.tags };
    if (editing.id) { faqStore.update(editing.id, item); toast.success("Q/R mise à jour"); }
    else { faqStore.add({ ...item, id: uid(), usage: 0 }); toast.success("Q/R ajoutée"); }
    setOpen(false);
  };

  const duplicate = (f: FaqItem) => {
    faqStore.add({ ...f, id: uid(), question: `${f.question} (copie)`, usage: 0 });
    toast.success("Q/R dupliquée");
  };

  const openEdit = (f: FaqItem) => {
    setEditing(f);
    setTagsInput(f.tags.join(", "));
    setOpen(true);
  };

  return (
    <AppShell title="Service Client — Base de connaissance" subtitle="Q/R alimentant l'agent de qualification et de service client">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <aside className="space-y-4">
          <Card className="p-3">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">Catégories</div>
            <div className="space-y-0.5">
              <button
                onClick={() => { setCat("all"); setPage(1); }}
                className={cn("w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors", cat === "all" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
              >
                <span className="inline-flex items-center gap-2"><HelpCircle className="h-4 w-4" /> Toutes</span>
                <span className="text-xs opacity-70 tabular-nums">{rows.length}</span>
              </button>
              {FAQ_CATEGORIES.map((c) => {
                const n = rows.filter((r) => r.categorie === c).length;
                const Icon = catIcon[c] ?? HelpCircle;
                return (
                  <button
                    key={c}
                    onClick={() => { setCat(c); setPage(1); }}
                    className={cn("w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors", cat === c ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
                  >
                    <span className="inline-flex items-center gap-2 truncate"><Icon className="h-4 w-4 shrink-0" /> <span className="truncate">{c}</span></span>
                    <span className="text-xs opacity-70 tabular-nums">{n}</span>
                  </button>
                );
              })}
            </div>
          </Card>
          <Card className="p-4 bg-[color:var(--gold)]/10 border-[color:var(--gold)]/30">
            <div className="text-xs text-muted-foreground">Utilisation ce mois</div>
            <div className="text-2xl font-bold mt-1">{rows.reduce((s, r) => s + r.usage, 0)}</div>
            <div className="text-xs text-muted-foreground mt-1">requêtes servies par l'agent</div>
          </Card>
        </aside>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Rechercher une question, un mot-clé, un tag..." className="pl-9" />
            </div>
            {q && <span className="text-xs text-muted-foreground">{filtered.length} résultat{filtered.length > 1 ? "s" : ""}</span>}
            <Button onClick={() => { setEditing(empty()); setTagsInput(""); setOpen(true); }} className="ml-auto bg-primary text-primary-foreground">
              <Plus className="h-4 w-4 mr-1" /> Nouvelle Q/R
            </Button>
          </div>

          {pageItems.length === 0 ? (
            <Card className="p-16 text-center text-muted-foreground">
              <HelpCircle className="h-10 w-10 mx-auto mb-2 opacity-40" />
              Aucun résultat pour ces critères.
            </Card>
          ) : (
            <Card className="p-2">
              <Accordion type="single" collapsible className="w-full">
                {pageItems.map((r) => (
                  <AccordionItem key={r.id} value={r.id} className="group">
                    <AccordionTrigger className="hover:no-underline px-3 py-3">
                      <div className="text-left flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] uppercase tracking-wide text-[color:var(--gold-foreground)] dark:text-[color:var(--gold)] font-semibold">{r.categorie}</span>
                          {!r.actif && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Inactif</span>}
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Utilisée {r.usage}× ce mois</span>
                        </div>
                        <div className="font-medium mt-0.5">{highlight(r.question, q)}</div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-4">
                      <p className="text-sm text-muted-foreground leading-relaxed">{highlight(r.reponse, q)}</p>
                      {r.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {r.tags.map((t) => <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-secondary">#{t}</span>)}
                        </div>
                      )}
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5 mr-1" /> Modifier</Button>
                        <Button size="sm" variant="outline" onClick={() => duplicate(r)}><Copy className="h-3.5 w-3.5 mr-1" /> Dupliquer</Button>
                        <Button size="sm" variant="outline" className="text-destructive border-destructive/30" onClick={() => setConfirmDel(r)}><Trash2 className="h-3.5 w-3.5 mr-1" /> Supprimer</Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Card>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{filtered.length} article{filtered.length > 1 ? "s" : ""} · Page {current} / {totalPages}</span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={current === 1}><ChevronLeft className="h-4 w-4" /></Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <Button key={n} size="sm" variant={n === current ? "default" : "outline"} onClick={() => setPage(n)} className={cn("min-w-9", n === current && "bg-primary text-primary-foreground")}>{n}</Button>
              ))}
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={current === totalPages}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing.id ? "Modifier la Q/R" : "Nouvelle question / réponse"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Catégorie</Label>
              <Select value={editing.categorie} onValueChange={(v) => setEditing({ ...editing, categorie: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{FAQ_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Question</Label><Input value={editing.question} onChange={(e) => setEditing({ ...editing, question: e.target.value })} /></div>
            <div className="space-y-1"><Label>Réponse</Label><Textarea rows={5} value={editing.reponse} onChange={(e) => setEditing({ ...editing, reponse: e.target.value })} /></div>
            <div className="space-y-1"><Label>Tags (séparés par virgules)</Label><Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="ex: candidature, délai" /></div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div><div className="text-sm font-medium">Actif</div><div className="text-xs text-muted-foreground">L'agent utilisera cette Q/R si activée.</div></div>
              <Switch checked={editing.actif} onCheckedChange={(v) => setEditing({ ...editing, actif: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={save} className="bg-primary text-primary-foreground">Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmDel}
        onOpenChange={(v) => !v && setConfirmDel(null)}
        title="Supprimer cette Q/R ?"
        destructive
        confirmLabel="Supprimer"
        onConfirm={() => { if (confirmDel) { faqStore.remove(confirmDel.id); toast.success("Q/R supprimée"); } setConfirmDel(null); }}
      />
    </AppShell>
  );
}
