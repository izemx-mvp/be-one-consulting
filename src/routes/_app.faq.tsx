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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { FAQ_CATEGORIES, faqStore, uid, useStore, type FaqItem } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/faq")({
  head: () => ({ meta: [{ title: "Base de connaissance — Be One Consulting" }] }),
  component: Page,
});

function empty(): FaqItem {
  return { id: "", categorie: FAQ_CATEGORIES[0], question: "", reponse: "" };
}

const PAGE_SIZE = 6;

function Page() {
  const rows = useStore(faqStore);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FaqItem>(empty());

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    return rows.filter((r) =>
      (cat === "all" || r.categorie === cat) &&
      (!q || r.question.toLowerCase().includes(needle) || r.reponse.toLowerCase().includes(needle)),
    );
  }, [rows, q, cat]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const save = () => {
    if (!editing.question || !editing.reponse) return;
    if (editing.id) faqStore.update(editing.id, editing);
    else faqStore.add({ ...editing, id: uid() });
    setOpen(false);
  };

  return (
    <AppShell title="Service Client — Base de connaissance" subtitle="Foire aux questions et articles de support">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="p-4 h-fit lg:sticky lg:top-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase mb-3">Catégories</div>
          <div className="space-y-1">
            <button
              onClick={() => { setCat("all"); setPage(1); }}
              className={`w-full text-left px-3 py-2 rounded-md text-sm ${cat === "all" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              Toutes ({rows.length})
            </button>
            {FAQ_CATEGORIES.map((c) => {
              const n = rows.filter((r) => r.categorie === c).length;
              return (
                <button
                  key={c}
                  onClick={() => { setCat(c); setPage(1); }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between ${cat === c ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                >
                  <span>{c}</span>
                  <span className="text-xs opacity-70">{n}</span>
                </button>
              );
            })}
          </div>
        </Card>

        <div className="lg:col-span-3 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Rechercher une question ou un mot-clé..." className="pl-9" />
            </div>
            <Button onClick={() => { setEditing(empty()); setOpen(true); }} className="bg-primary text-primary-foreground">
              <Plus className="h-4 w-4 mr-1" /> Nouvelle Q/R
            </Button>
          </div>

          {pageItems.length === 0 ? (
            <Card className="p-10 text-center text-muted-foreground">Aucun résultat</Card>
          ) : (
            <Card className="p-2">
              <Accordion type="single" collapsible className="w-full">
                {pageItems.map((r) => (
                  <AccordionItem key={r.id} value={r.id}>
                    <AccordionTrigger className="hover:no-underline px-3">
                      <div className="text-left">
                        <div className="text-xs text-[color:var(--gold-foreground)] font-medium uppercase tracking-wide">{r.categorie}</div>
                        <div className="font-medium">{r.question}</div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3">
                      <p className="text-sm text-muted-foreground">{r.reponse}</p>
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => { setEditing(r); setOpen(true); }}>
                          <Pencil className="h-3.5 w-3.5 mr-1" /> Modifier
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive border-destructive/30" onClick={() => faqStore.remove(r.id)}>
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Supprimer
                        </Button>
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
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={current === 1}>
                <ChevronLeft className="h-4 w-4" /> Précédent
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <Button key={n} size="sm" variant={n === current ? "default" : "outline"} onClick={() => setPage(n)} className={n === current ? "bg-primary text-primary-foreground" : ""}>
                  {n}
                </Button>
              ))}
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={current === totalPages}>
                Suivant <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing.id ? "Modifier l'article" : "Nouvelle question / réponse"}</DialogTitle></DialogHeader>
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
