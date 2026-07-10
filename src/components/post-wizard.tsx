import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Linkedin, Facebook, Instagram, Youtube, Image as ImageIcon, Video as VideoIcon, X, Plus, GripVertical, Send, Clock, Save, ChevronLeft, ChevronRight, Wand2, FileText, Check } from "lucide-react";
import { postsStore, cmConfigStore, uid, useStore, PLATFORM_META, type SocialPost, type SocialPlatform } from "@/lib/mock-data";
import { ScheduleDialog } from "@/components/schedule-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const LANGUES = ["Français", "English", "العربية", "Español"];
const TONS = ["Professionnel", "Chaleureux", "Expert", "Inspirationnel", "Humoristique", "Direct"];
const PLATFORMS: SocialPlatform[] = ["LinkedIn", "Facebook", "Instagram", "YouTube"];
const platformIcon = { LinkedIn: Linkedin, Facebook, Instagram, YouTube: Youtube };

const STOCK_IMAGES = [
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=70",
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=70",
  "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800&q=70",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=70",
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=70",
  "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&q=70",
];

function emptyPost(): SocialPost {
  return { id: "", titre: "", caption: "", hashtags: [], media: [], platforms: [], platformConfig: {}, statut: "Brouillon", date: new Date().toISOString().slice(0, 10), heure: "09:00", auteur: "IA", langue: "Français", ton: "Professionnel" };
}

export type PostWizardPrefill = Partial<{
  titre: string; caption: string; hashtags: string[]; platforms: SocialPlatform[];
  idea: string; date: string;
}>;

export function PostWizard({ open, onOpenChange, editing, prefill }: { open: boolean; onOpenChange: (v: boolean) => void; editing?: SocialPost | null; prefill?: PostWizardPrefill | null }) {
  const [step, setStep] = useState(1);
  const [post, setPost] = useState<SocialPost>(emptyPost());
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [idea, setIdea] = useState("");
  const [keywords, setKeywords] = useState("");
  const [generating, setGenerating] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const cfgs = useStore(cmConfigStore);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    if (editing) {
      setPost(editing);
      setIdea(""); setKeywords(editing.hashtags.map((h) => h.replace(/^#/, "")).join(", "));
    } else {
      const base = emptyPost();
      if (prefill) {
        base.titre = prefill.titre ?? "";
        base.caption = prefill.caption ?? "";
        base.hashtags = prefill.hashtags ?? [];
        base.platforms = prefill.platforms ?? [];
        base.date = prefill.date ?? base.date;
      }
      setPost(base);
      setIdea(prefill?.idea ?? "");
      setKeywords((prefill?.hashtags ?? []).map((h) => h.replace(/^#/, "")).join(", "));
    }
  }, [open, editing, prefill]);

  const addMedia = (kind: "image" | "video") => {
    setPost((p) => ({ ...p, media: [...p.media, { id: uid(), kind, url: STOCK_IMAGES[p.media.length % STOCK_IMAGES.length], description: "", reference: "", prompt: "" }] }));
  };
  const updateMedia = (id: string, patch: Partial<SocialPost["media"][number]>) => {
    setPost((p) => ({ ...p, media: p.media.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
  };
  const removeMedia = (id: string) => setPost((p) => ({ ...p, media: p.media.filter((m) => m.id !== id) }));
  const moveMedia = (from: number, to: number) => {
    setPost((p) => { const media = [...p.media]; const [it] = media.splice(from, 1); media.splice(to, 0, it); return { ...p, media }; });
  };

  const generate = () => {
    setGenerating(true);
    setTimeout(() => {
      const kw = keywords.split(",").map((s) => s.trim()).filter(Boolean);
      const orderedDescs = post.media.map((m, i) => m.description || `Visuel ${i + 1}`);
      setPost((p) => ({
        ...p,
        titre: p.titre || idea.slice(0, 60) || "Post généré par IA",
        caption: p.caption || `${idea || "Découvrez notre expertise Be One Consulting."}${orderedDescs.length ? `\n\n📸 ${orderedDescs.join(" · ")}` : ""}\n\nContactez-nous pour en savoir plus 👉`,
        hashtags: p.hashtags.length ? p.hashtags : [...kw.map((k) => `#${k.replace(/\s+/g, "")}`), "#BeOneConsulting", "#RH", "#Maroc"].slice(0, 6),
        media: p.media.length ? p.media : [{ id: uid(), kind: "image" as const, url: STOCK_IMAGES[0], description: idea || undefined }],
      }));
      setGenerating(false);
      setStep(2);
      toast.success("Post généré par l'IA");
    }, 900);
  };

  const togglePlatform = (p: SocialPlatform) => {
    const on = post.platforms.includes(p);
    const platforms = on ? post.platforms.filter((x) => x !== p) : [...post.platforms, p];
    const platformConfig = { ...post.platformConfig };
    if (!on) {
      // hydrate from centralized configuration
      const cfg = cfgs.find((c) => c.platform === p);
      platformConfig[p] = cfg ? { ...cfg.settings } as Record<string, string | number> : {};
    }
    setPost({ ...post, platforms, platformConfig });
  };

  const save = (statut: SocialPost["statut"], date?: string, heure?: string) => {
    if (!post.titre) { toast.error("Titre requis"); return; }
    if (statut !== "Brouillon" && post.platforms.length === 0) { toast.error("Sélectionnez au moins une plateforme"); return; }
    const item = { ...post, statut, date: date ?? post.date, heure: heure ?? post.heure };
    if (editing?.id) { postsStore.update(editing.id, item); toast.success("Post mis à jour"); }
    else { postsStore.add({ ...item, id: uid() }); toast.success(statut === "Publié" ? "Post publié" : statut === "Planifié" ? `Post planifié pour le ${item.date} à ${item.heure}` : "Brouillon enregistré"); }
    onOpenChange(false);
  };

  const stepLabels = ["Médias & contenu", "Aperçu IA", "Plateformes & publication"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto scroll-fancy p-0">
        <div className="bg-gradient-to-r from-primary via-primary/90 to-[color:var(--gold)]/70 text-primary-foreground px-6 py-5 border-b">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg"><Sparkles className="h-5 w-5" /> {editing ? "Modifier le post" : "Nouveau post"} — Community Manager AI</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-1.5 pt-3">
            {[1, 2, 3].map((s) => <span key={s} className={cn("h-1.5 flex-1 rounded-full transition-colors", s <= step ? "bg-[color:var(--gold)]" : "bg-white/25")} />)}
          </div>
          <div className="text-xs text-primary-foreground/80 pt-2 font-medium">Étape {step} / 3 — {stepLabels[step - 1]}</div>
        </div>

        <div className="px-6 py-5 space-y-4">
          {step === 1 && (
            <>
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">Médias du post</div>
                    <div className="text-xs text-muted-foreground">L'ordre définit la séquence carrousel. Glissez pour réorganiser.</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => addMedia("image")}><ImageIcon className="h-3.5 w-3.5 mr-1.5" /> Image</Button>
                    <Button size="sm" variant="outline" onClick={() => addMedia("video")}><VideoIcon className="h-3.5 w-3.5 mr-1.5" /> Vidéo</Button>
                  </div>
                </div>
                {post.media.length === 0 && (
                  <div className="rounded-xl border-2 border-dashed p-8 text-center text-sm text-muted-foreground">
                    Aucun média. Ajoutez des images ou vidéos — chacun aura sa propre description IA.
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {post.media.map((m, i) => (
                    <div key={m.id}
                      draggable
                      onDragStart={() => setDragIdx(i)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => { if (dragIdx !== null && dragIdx !== i) moveMedia(dragIdx, i); setDragIdx(null); }}
                      className="rounded-xl border bg-card overflow-hidden hover:border-[color:var(--gold)] transition-colors">
                      <div className="relative aspect-video bg-muted">
                        <img src={m.url} alt={m.description ?? ""} className="w-full h-full object-cover" />
                        {m.kind === "video" && <div className="absolute inset-0 grid place-items-center bg-black/40"><VideoIcon className="h-10 w-10 text-white" /></div>}
                        <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded flex items-center gap-1 cursor-grab"><GripVertical className="h-3 w-3" /> #{i + 1} · {m.kind === "image" ? "Image" : "Vidéo"}</div>
                        <button onClick={() => removeMedia(m.id)} className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1 hover:bg-red-500"><X className="h-3 w-3" /></button>
                      </div>
                      <div className="p-3 space-y-2">
                        <div className="space-y-1"><Label className="text-[11px]">Description (utilisée par l'IA)</Label><Input className="h-8" value={m.description ?? ""} onChange={(e) => updateMedia(m.id, { description: e.target.value })} placeholder="Ex: manager en workshop, ambiance lumineuse" /></div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1"><Label className="text-[11px]">Référence / inspiration</Label><Input className="h-8" value={m.reference ?? ""} onChange={(e) => updateMedia(m.id, { reference: e.target.value })} placeholder="URL ou source" /></div>
                          <div className="space-y-1"><Label className="text-[11px]">Prompt visuel</Label><Input className="h-8" value={m.prompt ?? ""} onChange={(e) => updateMedia(m.id, { prompt: e.target.value })} placeholder="Style, palette..." /></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-3 pt-3 border-t">
                <div className="text-sm font-semibold">Brief général</div>
                <div className="space-y-1"><Label>Idée générale</Label><Textarea rows={2} value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="Ex: annonce du nouveau programme leadership de proximité" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Langue</Label>
                    <Select value={post.langue} onValueChange={(v) => setPost({ ...post, langue: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{LANGUES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select>
                  </div>
                  <div className="space-y-1"><Label>Ton</Label>
                    <Select value={post.ton} onValueChange={(v) => setPost({ ...post, ton: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
                  </div>
                </div>
                <div className="space-y-1"><Label>Mots-clés (virgules)</Label><Input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="Leadership, RH, Maroc" /></div>
              </section>
            </>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="rounded-xl border p-3 bg-gradient-to-br from-[color:var(--gold)]/10 to-transparent border-[color:var(--gold)]/25 text-xs text-muted-foreground flex items-center gap-2"><Sparkles className="h-4 w-4 text-[color:var(--gold)]" /> L'IA a rédigé le contenu à partir de votre brief. Éditez librement.</div>
              <div className="space-y-1"><Label>Titre interne</Label><Input value={post.titre} onChange={(e) => setPost({ ...post, titre: e.target.value })} /></div>
              <div className="space-y-1"><Label>Caption</Label><Textarea rows={6} value={post.caption} onChange={(e) => setPost({ ...post, caption: e.target.value })} /></div>
              <div className="space-y-1">
                <Label>Hashtags (virgules)</Label>
                <Input value={post.hashtags.join(", ")} onChange={(e) => setPost({ ...post, hashtags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
                <div className="flex flex-wrap gap-1 pt-1">{post.hashtags.map((h) => <span key={h} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[color:var(--gold)]/15 text-[color:var(--gold)] border border-[color:var(--gold)]/30 font-medium">{h}</span>)}</div>
              </div>
              <div>
                <Label className="mb-2 block">Ordre des médias — glissez pour réorganiser</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {post.media.map((m, i) => (
                    <div key={m.id} draggable onDragStart={() => setDragIdx(i)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (dragIdx !== null && dragIdx !== i) moveMedia(dragIdx, i); setDragIdx(null); }}
                      className="relative group rounded-lg overflow-hidden border bg-muted aspect-video cursor-grab active:cursor-grabbing hover:border-[color:var(--gold)]">
                      <img src={m.url} alt={m.description ?? ""} className="w-full h-full object-cover" />
                      {m.kind === "video" && <div className="absolute inset-0 grid place-items-center bg-black/40"><VideoIcon className="h-8 w-8 text-white" /></div>}
                      <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1"><GripVertical className="h-3 w-3" /> #{i + 1}</div>
                      <button onClick={() => removeMedia(m.id)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-red-500"><X className="h-3 w-3" /></button>
                    </div>
                  ))}
                  <button onClick={() => addMedia("image")} className="aspect-video rounded-lg border-2 border-dashed grid place-items-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                    <Plus className="h-6 w-6" />
                  </button>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => toast.success("Contenu régénéré par l'IA")}><Wand2 className="h-3.5 w-3.5 mr-1.5" /> Régénérer avec l'IA</Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Plateformes de publication</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {PLATFORMS.map((p) => {
                    const Icon = platformIcon[p];
                    const on = post.platforms.includes(p);
                    return (
                      <button key={p} type="button" onClick={() => togglePlatform(p)} className={cn("relative rounded-xl border p-4 flex flex-col items-center gap-1.5 transition-all", on ? cn(PLATFORM_META[p].bg, "ring-2 ring-primary/40") : "hover:bg-muted")}>
                        {on && <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-primary text-primary-foreground grid place-items-center"><Check className="h-2.5 w-2.5" /></span>}
                        <Icon className={cn("h-6 w-6", PLATFORM_META[p].color)} />
                        <span className="text-xs font-medium">{p}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="text-[11px] text-muted-foreground pt-2 flex items-center gap-1.5"><Sparkles className="h-3 w-3 text-[color:var(--gold)]" /> Les paramètres IA sont hérités automatiquement depuis la configuration de chaque plateforme.</div>
              </div>

              <div className="rounded-xl border p-4 bg-muted/30 space-y-2">
                <div className="text-sm font-semibold flex items-center gap-2"><FileText className="h-4 w-4" /> Récapitulatif</div>
                <div className="text-xs space-y-0.5 text-muted-foreground">
                  <div><b className="text-foreground">Titre :</b> {post.titre || "—"}</div>
                  <div><b className="text-foreground">Médias :</b> {post.media.length} ({post.media.filter((m) => m.kind === "image").length} image · {post.media.filter((m) => m.kind === "video").length} vidéo)</div>
                  <div><b className="text-foreground">Plateformes :</b> {post.platforms.join(", ") || "aucune"}</div>
                  <div><b className="text-foreground">Hashtags :</b> {post.hashtags.length}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/30 flex-row justify-between sm:justify-between">
          <Button variant="outline" onClick={() => (step > 1 ? setStep(step - 1) : onOpenChange(false))}>
            <ChevronLeft className="h-4 w-4 mr-1" /> {step > 1 ? "Précédent" : "Annuler"}
          </Button>
          <div className="flex gap-2 flex-wrap justify-end">
            {step === 1 && <Button onClick={generate} disabled={generating} className="btn-premium hover:[&]:btn-premium-hover"><Sparkles className={cn("h-4 w-4 mr-2", generating && "animate-spin")} /> {generating ? "Génération..." : "Générer le post"}</Button>}
            {step === 2 && (
              <>
                <Button variant="outline" onClick={() => save("Brouillon")}><Save className="h-4 w-4 mr-2" /> Brouillon</Button>
                <Button onClick={() => setStep(3)} className="btn-premium hover:[&]:btn-premium-hover">Suivant <ChevronRight className="h-4 w-4 ml-1" /></Button>
              </>
            )}
            {step === 3 && (
              <>
                <Button variant="outline" onClick={() => save("Brouillon")}><Save className="h-4 w-4 mr-2" /> Brouillon</Button>
                <Button variant="outline" onClick={() => setScheduleOpen(true)}><Clock className="h-4 w-4 mr-2" /> Planifier</Button>
                <Button onClick={() => save("Publié")} className="btn-premium hover:[&]:btn-premium-hover"><Send className="h-4 w-4 mr-2" /> Publier maintenant</Button>
              </>
            )}
          </div>
        </DialogFooter>

        <ScheduleDialog open={scheduleOpen} onOpenChange={setScheduleOpen} initialDate={post.date} initialTime={post.heure} onConfirm={({ date, time }) => save("Planifié", date, time)} />
      </DialogContent>
    </Dialog>
  );
}

export function ContentTypePicker({ open, onOpenChange, onPick }: { open: boolean; onOpenChange: (v: boolean) => void; onPick: (t: "post" | "article") => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-[color:var(--gold)]" /> Que voulez-vous créer ?</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          <button onClick={() => { onOpenChange(false); onPick("post"); }} className="rounded-xl border p-5 hover-lift text-left stat-primary">
            <div className="h-10 w-10 rounded-lg bg-background/60 grid place-items-center mb-2"><Instagram className="h-5 w-5 text-pink-600" /></div>
            <div className="font-semibold text-sm">Post réseaux sociaux</div>
            <div className="text-xs text-muted-foreground mt-1">Multi-médias, drag & drop, publication multi-plateformes.</div>
          </button>
          <button onClick={() => { onOpenChange(false); onPick("article"); }} className="rounded-xl border p-5 hover-lift text-left stat-gold">
            <div className="h-10 w-10 rounded-lg bg-background/60 grid place-items-center mb-2"><FileText className="h-5 w-5 text-[color:var(--gold)]" /></div>
            <div className="font-semibold text-sm">Article de blog</div>
            <div className="text-xs text-muted-foreground mt-1">Génération IA long format, SEO, couverture, preview complet.</div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
