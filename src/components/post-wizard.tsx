import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Sparkles, Linkedin, Facebook, Instagram, Youtube, Image as ImageIcon, Video as VideoIcon, X, Plus, GripVertical, Send, Clock, Save, ChevronLeft, ChevronRight, Wand2 } from "lucide-react";
import { postsStore, PLATFORM_META, uid, type SocialPost, type SocialPlatform, type PostMedia } from "@/lib/mock-data";
import { ScheduleDialog } from "@/components/schedule-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const LANGUES = ["Français", "English", "العربية", "Español"];
const TONS = ["Professionnel", "Chaleureux", "Expert", "Inspirationnel", "Humoristique", "Direct"];
const PLATFORMS: SocialPlatform[] = ["LinkedIn", "Facebook", "Instagram", "YouTube"];

const platformIcon = { LinkedIn: Linkedin, Facebook, Instagram, YouTube: Youtube };

const STOCK_IMAGES = [
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=70",
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&q=70",
  "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=600&q=70",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=70",
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600&q=70",
  "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&q=70",
];

function emptyPost(): SocialPost {
  return { id: "", titre: "", caption: "", hashtags: [], media: [], platforms: [], platformConfig: {}, statut: "Brouillon", date: new Date().toISOString().slice(0, 10), heure: "09:00", auteur: "IA", langue: "Français", ton: "Professionnel" };
}

export function PostWizard({ open, onOpenChange, editing }: { open: boolean; onOpenChange: (v: boolean) => void; editing?: SocialPost | null }) {
  const [step, setStep] = useState(1);
  const [post, setPost] = useState<SocialPost>(emptyPost());
  const [scheduleOpen, setScheduleOpen] = useState(false);
  // step 1 inputs
  const [idea, setIdea] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [imageDesc, setImageDesc] = useState("");
  const [videoDesc, setVideoDesc] = useState("");
  const [keywords, setKeywords] = useState("");
  const [generating, setGenerating] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      setStep(1);
      if (editing) { setPost(editing); }
      else { setPost(emptyPost()); setIdea(""); setAiPrompt(""); setImageDesc(""); setVideoDesc(""); setKeywords(""); }
    }
  }, [open, editing]);

  const generate = () => {
    setGenerating(true);
    setTimeout(() => {
      const kw = keywords.split(",").map((s) => s.trim()).filter(Boolean);
      setPost({
        ...post,
        titre: idea.slice(0, 60) || "Post généré par IA",
        caption: `${idea || "Découvrez notre expertise Be One Consulting."} ${aiPrompt ? `\n\n${aiPrompt}` : ""}\n\nContactez-nous pour en savoir plus 👉`,
        hashtags: [...kw.map((k) => `#${k.replace(/\s+/g, "")}`), "#BeOneConsulting", "#RH", "#Maroc"].slice(0, 6),
        media: [
          { id: uid(), kind: "image", url: STOCK_IMAGES[0], alt: imageDesc || undefined },
          ...(imageDesc ? [{ id: uid(), kind: "image" as const, url: STOCK_IMAGES[1], alt: imageDesc }] : []),
          ...(videoDesc ? [{ id: uid(), kind: "video" as const, url: STOCK_IMAGES[2], alt: videoDesc }] : []),
        ],
      });
      setGenerating(false);
      setStep(2);
      toast.success("Post généré par l'IA");
    }, 900);
  };

  const togglePlatform = (p: SocialPlatform) => {
    const on = post.platforms.includes(p);
    const platforms = on ? post.platforms.filter((x) => x !== p) : [...post.platforms, p];
    const platformConfig = { ...post.platformConfig };
    if (!on && !platformConfig[p]) platformConfig[p] = defaultConfig(p);
    setPost({ ...post, platforms, platformConfig });
  };

  const moveMedia = (from: number, to: number) => {
    const media = [...post.media];
    const [it] = media.splice(from, 1);
    media.splice(to, 0, it);
    setPost({ ...post, media });
  };

  const save = (statut: SocialPost["statut"], date?: string, heure?: string) => {
    if (!post.titre) { toast.error("Titre requis"); return; }
    const item = { ...post, statut, date: date ?? post.date, heure: heure ?? post.heure };
    if (editing?.id) { postsStore.update(editing.id, item); toast.success("Post mis à jour"); }
    else { postsStore.add({ ...item, id: uid() }); toast.success(statut === "Publié" ? "Post publié" : statut === "Planifié" ? `Post planifié pour le ${item.date} à ${item.heure}` : "Brouillon enregistré"); }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto scroll-fancy p-0">
        <div className="bg-gradient-to-r from-primary via-primary/90 to-[color:var(--gold)]/70 text-primary-foreground px-6 py-5 border-b">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg"><Sparkles className="h-5 w-5" /> Nouveau post — Community Manager AI</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-1.5 pt-3">
            {[1, 2, 3].map((s) => <span key={s} className={cn("h-1.5 flex-1 rounded-full transition-colors", s <= step ? "bg-[color:var(--gold)]" : "bg-white/25")} />)}
          </div>
          <div className="text-xs text-primary-foreground/80 pt-2 font-medium">Étape {step} / 3 — {["Brief & génération", "Contenu & médias", "Plateformes & publication"][step - 1]}</div>
        </div>

        <div className="px-6 py-5 space-y-4">
          {step === 1 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1"><Label>Idée générale</Label><Textarea rows={2} value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="Ex: annonce du nouveau programme leadership de proximité" /></div>
              <div className="col-span-2 space-y-1"><Label>Prompt IA additionnel (optionnel)</Label><Textarea rows={2} value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Ex: mets l'accent sur le ROI managérial, ton inspirationnel" /></div>
              <div className="space-y-1"><Label className="flex items-center gap-1.5"><ImageIcon className="h-3.5 w-3.5" /> Description image</Label><Input value={imageDesc} onChange={(e) => setImageDesc(e.target.value)} placeholder="Ex: managers en workshop" /></div>
              <div className="space-y-1"><Label className="flex items-center gap-1.5"><VideoIcon className="h-3.5 w-3.5" /> Description vidéo</Label><Input value={videoDesc} onChange={(e) => setVideoDesc(e.target.value)} placeholder="Ex: teaser 15s dynamique" /></div>
              <div className="col-span-2 space-y-1"><Label>Mots-clés (virgules)</Label><Input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="Leadership, RH, Maroc" /></div>
              <div className="space-y-1"><Label>Langue</Label>
                <Select value={post.langue} onValueChange={(v) => setPost({ ...post, langue: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LANGUES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Ton</Label>
                <Select value={post.ton} onValueChange={(v) => setPost({ ...post, ton: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <div className="rounded-xl border p-3 bg-gradient-to-br from-[color:var(--gold)]/10 to-transparent border-[color:var(--gold)]/25 text-sm text-muted-foreground">Références (images/vidéos) : glissez-déposez ci-après une fois généré, ou ajoutez-les à l'étape 2.</div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1"><Label>Titre interne</Label><Input value={post.titre} onChange={(e) => setPost({ ...post, titre: e.target.value })} /></div>
              <div className="space-y-1"><Label>Caption</Label><Textarea rows={5} value={post.caption} onChange={(e) => setPost({ ...post, caption: e.target.value })} /></div>
              <div className="space-y-1">
                <Label>Hashtags (virgules)</Label>
                <Input value={post.hashtags.join(", ")} onChange={(e) => setPost({ ...post, hashtags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
                <div className="flex flex-wrap gap-1 pt-1">{post.hashtags.map((h) => <span key={h} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[color:var(--gold)]/15 text-[color:var(--gold)] border border-[color:var(--gold)]/30 font-medium">{h}</span>)}</div>
              </div>
              <div>
                <Label className="mb-2 block">Médias — glissez pour réorganiser</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {post.media.map((m, i) => (
                    <div key={m.id} draggable onDragStart={() => setDragIdx(i)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (dragIdx !== null && dragIdx !== i) moveMedia(dragIdx, i); setDragIdx(null); }}
                      className="relative group rounded-lg overflow-hidden border bg-muted aspect-video cursor-grab active:cursor-grabbing hover:border-[color:var(--gold)]">
                      <img src={m.url} alt={m.alt ?? ""} className="w-full h-full object-cover" />
                      {m.kind === "video" && <div className="absolute inset-0 grid place-items-center bg-black/40"><VideoIcon className="h-8 w-8 text-white" /></div>}
                      <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1"><GripVertical className="h-3 w-3" /> #{i + 1}</div>
                      <button onClick={() => setPost({ ...post, media: post.media.filter((x) => x.id !== m.id) })} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-red-500"><X className="h-3 w-3" /></button>
                    </div>
                  ))}
                  <button onClick={() => setPost({ ...post, media: [...post.media, { id: uid(), kind: "image", url: STOCK_IMAGES[post.media.length % STOCK_IMAGES.length] }] })} className="aspect-video rounded-lg border-2 border-dashed grid place-items-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                    <Plus className="h-6 w-6" />
                  </button>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => toast.success("Média régénéré par l'IA")}><Wand2 className="h-3.5 w-3.5 mr-1.5" /> Régénérer un visuel</Button>
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
                      <button key={p} type="button" onClick={() => togglePlatform(p)} className={cn("rounded-xl border p-3 flex flex-col items-center gap-1.5 transition-all", on ? cn(PLATFORM_META[p].bg, "ring-2 ring-primary/30") : "hover:bg-muted")}>
                        <Icon className={cn("h-5 w-5", PLATFORM_META[p].color)} />
                        <span className="text-xs font-medium">{p}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {post.platforms.map((p) => (
                <PlatformSettings key={p} platform={p} value={post.platformConfig[p] ?? defaultConfig(p)} onChange={(v) => setPost({ ...post, platformConfig: { ...post.platformConfig, [p]: v } })} />
              ))}

              {post.platforms.length === 0 && (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Sélectionnez au moins une plateforme pour configurer la génération.</div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/30 flex-row justify-between sm:justify-between">
          <Button variant="outline" onClick={() => (step > 1 ? setStep(step - 1) : onOpenChange(false))}>
            <ChevronLeft className="h-4 w-4 mr-1" /> {step > 1 ? "Précédent" : "Annuler"}
          </Button>
          <div className="flex gap-2">
            {step === 1 && <Button onClick={generate} disabled={generating} className="btn-premium hover:[&]:btn-premium-hover"><Sparkles className={cn("h-4 w-4 mr-2", generating && "animate-spin")} /> {generating ? "Génération..." : "Générer"}</Button>}
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
                <Button onClick={() => save("Publié")} className="btn-premium hover:[&]:btn-premium-hover"><Send className="h-4 w-4 mr-2" /> Publier</Button>
              </>
            )}
          </div>
        </DialogFooter>

        <ScheduleDialog open={scheduleOpen} onOpenChange={setScheduleOpen} initialDate={post.date} initialTime={post.heure} onConfirm={({ date, time }) => save("Planifié", date, time)} />
      </DialogContent>
    </Dialog>
  );
}

function defaultConfig(p: SocialPlatform): Record<string, string | number> {
  if (p === "Instagram") return { captionLength: 120, emojiDensity: "Moyenne", hashtagCount: 10, tone: "Chaleureux" };
  if (p === "LinkedIn") return { tone: "Professionnel", cta: "En savoir plus", paragraphes: "Moyen", hashtags: 3 };
  if (p === "Facebook") return { style: "Conversationnel", cta: "Réagir", longueur: "Court" };
  return { titre: "", description: "", tags: "", thumbnailPrompt: "" };
}

function PlatformSettings({ platform, value, onChange }: { platform: SocialPlatform; value: Record<string, string | number>; onChange: (v: Record<string, string | number>) => void }) {
  const Icon = platformIcon[platform];
  const set = (k: string, v: string | number) => onChange({ ...value, [k]: v });
  return (
    <Card className={cn("p-4 border", PLATFORM_META[platform].bg)}>
      <div className={cn("flex items-center gap-2 font-semibold text-sm mb-3", PLATFORM_META[platform].color)}><Icon className="h-4 w-4" /> Paramètres {platform}</div>
      {platform === "Instagram" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1"><Label className="text-xs">Longueur caption (car.)</Label><Slider min={50} max={300} step={10} value={[value.captionLength as number]} onValueChange={(v) => set("captionLength", v[0])} /><div className="text-[10px] text-muted-foreground text-right tabular-nums">{value.captionLength}</div></div>
          <div className="space-y-1"><Label className="text-xs">Densité émojis</Label>
            <Select value={value.emojiDensity as string} onValueChange={(v) => set("emojiDensity", v)}><SelectTrigger className="h-8"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Faible">Faible</SelectItem><SelectItem value="Moyenne">Moyenne</SelectItem><SelectItem value="Élevée">Élevée</SelectItem></SelectContent></Select>
          </div>
          <div className="space-y-1"><Label className="text-xs">Nombre de hashtags</Label><Slider min={0} max={30} step={1} value={[value.hashtagCount as number]} onValueChange={(v) => set("hashtagCount", v[0])} /><div className="text-[10px] text-muted-foreground text-right tabular-nums">{value.hashtagCount}</div></div>
          <div className="space-y-1"><Label className="text-xs">Ton</Label>
            <Select value={value.tone as string} onValueChange={(v) => set("tone", v)}><SelectTrigger className="h-8"><SelectValue /></SelectTrigger><SelectContent>{TONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
          </div>
        </div>
      )}
      {platform === "LinkedIn" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1"><Label className="text-xs">Ton professionnel</Label>
            <Select value={value.tone as string} onValueChange={(v) => set("tone", v)}><SelectTrigger className="h-8"><SelectValue /></SelectTrigger><SelectContent>{TONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="space-y-1"><Label className="text-xs">CTA</Label><Input className="h-8" value={value.cta as string} onChange={(e) => set("cta", e.target.value)} /></div>
          <div className="space-y-1"><Label className="text-xs">Style de paragraphes</Label>
            <Select value={value.paragraphes as string} onValueChange={(v) => set("paragraphes", v)}><SelectTrigger className="h-8"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Court">Court (1-2 lignes)</SelectItem><SelectItem value="Moyen">Moyen</SelectItem><SelectItem value="Long">Long (storytelling)</SelectItem></SelectContent></Select>
          </div>
          <div className="space-y-1"><Label className="text-xs">Nombre de hashtags</Label><Slider min={0} max={10} step={1} value={[value.hashtags as number]} onValueChange={(v) => set("hashtags", v[0])} /><div className="text-[10px] text-muted-foreground text-right tabular-nums">{value.hashtags}</div></div>
        </div>
      )}
      {platform === "Facebook" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1"><Label className="text-xs">Style</Label>
            <Select value={value.style as string} onValueChange={(v) => set("style", v)}><SelectTrigger className="h-8"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Conversationnel">Conversationnel</SelectItem><SelectItem value="Storytelling">Storytelling</SelectItem><SelectItem value="Info">Informatif</SelectItem></SelectContent></Select>
          </div>
          <div className="space-y-1"><Label className="text-xs">CTA</Label><Input className="h-8" value={value.cta as string} onChange={(e) => set("cta", e.target.value)} /></div>
          <div className="space-y-1"><Label className="text-xs">Longueur</Label>
            <Select value={value.longueur as string} onValueChange={(v) => set("longueur", v)}><SelectTrigger className="h-8"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Court">Court</SelectItem><SelectItem value="Moyen">Moyen</SelectItem><SelectItem value="Long">Long</SelectItem></SelectContent></Select>
          </div>
        </div>
      )}
      {platform === "YouTube" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1"><Label className="text-xs">Titre vidéo</Label><Input className="h-8" value={value.titre as string} onChange={(e) => set("titre", e.target.value)} /></div>
          <div className="col-span-2 space-y-1"><Label className="text-xs">Description</Label><Textarea rows={2} value={value.description as string} onChange={(e) => set("description", e.target.value)} /></div>
          <div className="space-y-1"><Label className="text-xs">Tags (virgules)</Label><Input className="h-8" value={value.tags as string} onChange={(e) => set("tags", e.target.value)} /></div>
          <div className="space-y-1"><Label className="text-xs">Prompt miniature</Label><Input className="h-8" value={value.thumbnailPrompt as string} onChange={(e) => set("thumbnailPrompt", e.target.value)} placeholder="Style vignette..." /></div>
        </div>
      )}
    </Card>
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
            <div className="text-xs text-muted-foreground mt-1">LinkedIn, Facebook, Instagram, YouTube — génération multi-plateforme, médias, hashtags.</div>
          </button>
          <button onClick={() => { onOpenChange(false); onPick("article"); }} className="rounded-xl border p-5 hover-lift text-left stat-gold">
            <div className="h-10 w-10 rounded-lg bg-background/60 grid place-items-center mb-2"><Youtube className="h-5 w-5 text-[color:var(--gold)]" style={{ display: "none" }} /><span className="text-lg font-bold text-[color:var(--gold)]">A</span></div>
            <div className="font-semibold text-sm">Article de blog</div>
            <div className="text-xs text-muted-foreground mt-1">Article long format optimisé SEO, image de couverture, tags, préview instantané.</div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
