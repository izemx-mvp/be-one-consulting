import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, Pencil, Trash2, ShieldCheck, User as UserIcon, Mail, Briefcase, CheckCircle2 } from "lucide-react";
import { usersStore, useStore, uid, MODULES, MODULE_LABELS, allPerms, type AppUser, type CrudPerm, type ModuleKey } from "@/lib/mock-data";
import { useCurrentUser } from "@/lib/permissions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/utilisateurs")({
  head: () => ({ meta: [{ title: "Utilisateurs — Be One Consulting" }] }),
  component: Page,
});

const actions: { key: keyof CrudPerm; label: string; short: string }[] = [
  { key: "read", label: "Lecture", short: "R" },
  { key: "create", label: "Création", short: "C" },
  { key: "update", label: "Modification", short: "U" },
  { key: "delete", label: "Suppression", short: "D" },
];

function emptyUser(): AppUser {
  return {
    id: "", nom: "", email: "", role: "Collaborateur", fonction: "", actif: true,
    dateAjout: new Date().toISOString().slice(0, 10),
    permissions: { ...allPerms(false), dashboard: { read: true, create: false, update: false, delete: false } },
  };
}

function Page() {
  const me = useCurrentUser();
  const users = useStore(usersStore);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AppUser>(emptyUser());
  const [confirmDel, setConfirmDel] = useState<AppUser | null>(null);

  const isAdmin = me?.role === "Admin";

  const filtered = useMemo(() => users.filter((u) =>
    (roleFilter === "all" || u.role === roleFilter) &&
    (!q || u.nom.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase()) || u.fonction.toLowerCase().includes(q.toLowerCase()))
  ), [users, q, roleFilter]);

  const openNew = () => { setEditing(emptyUser()); setOpen(true); };
  const openEdit = (u: AppUser) => { setEditing({ ...u, permissions: { ...u.permissions } }); setOpen(true); };

  const save = () => {
    if (!editing.nom || !editing.email) { toast.error("Nom et email requis"); return; }
    const perms = editing.role === "Admin" ? allPerms(true) : editing.permissions;
    if (editing.id) { usersStore.update(editing.id, { ...editing, permissions: perms }); toast.success("Utilisateur mis à jour"); }
    else { usersStore.add({ ...editing, permissions: perms, id: uid() }); toast.success("Utilisateur créé"); }
    setOpen(false);
  };

  const togglePerm = (m: ModuleKey, a: keyof CrudPerm, v: boolean) => {
    setEditing((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [m]: { ...prev.permissions[m], [a]: v, ...(a !== "read" && v ? { read: true } : {}) },
      },
    }));
  };

  const setAllForModule = (m: ModuleKey, v: boolean) => {
    setEditing((prev) => ({
      ...prev,
      permissions: { ...prev.permissions, [m]: { read: v, create: v, update: v, delete: v } },
    }));
  };

  const admins = users.filter((u) => u.role === "Admin").length;
  const collabs = users.length - admins;
  const activeCount = users.filter((u) => u.actif).length;

  return (
    <AppShell title="Gestion des utilisateurs" subtitle="Rôles, permissions granulaires par module et statut des collaborateurs">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatCard icon={UserIcon} label="Utilisateurs" value={users.length} tone="primary" />
        <StatCard icon={ShieldCheck} label="Administrateurs" value={admins} tone="gold" />
        <StatCard icon={Briefcase} label="Collaborateurs" value={collabs} tone="sky" />
        <StatCard icon={CheckCircle2} label="Actifs" value={activeCount} tone="emerald" />
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[240px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher par nom, email, fonction..." className="pl-9" />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les rôles</SelectItem>
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="Collaborateur">Collaborateur</SelectItem>
            </SelectContent>
          </Select>
          {isAdmin && (
            <Button onClick={openNew} className="ml-auto btn-premium hover:[&]:btn-premium-hover">
              <Plus className="h-4 w-4 mr-1" /> Nouvel utilisateur
            </Button>
          )}
        </div>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="p-3 font-medium">Utilisateur</th>
                <th className="p-3 font-medium">Rôle</th>
                <th className="p-3 font-medium">Fonction</th>
                <th className="p-3 font-medium">Modules accessibles</th>
                <th className="p-3 font-medium">Statut</th>
                <th className="p-3 font-medium">Ajouté le</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const readable = MODULES.filter((m) => u.permissions[m]?.read).length;
                return (
                  <tr key={u.id} className="border-t hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className={cn("h-9 w-9 rounded-full grid place-items-center text-xs font-bold text-white shrink-0", u.role === "Admin" ? "bg-gradient-to-br from-[color:var(--gold)] to-amber-600" : "bg-gradient-to-br from-primary to-primary/70")}>
                          {u.nom.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium truncate">{u.nom}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> {u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={cn("text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border font-semibold", u.role === "Admin" ? "bg-[color:var(--gold)]/15 text-[color:var(--gold)] border-[color:var(--gold)]/40" : "bg-primary/10 text-primary border-primary/30")}>{u.role}</span>
                    </td>
                    <td className="p-3 text-muted-foreground">{u.fonction}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {u.role === "Admin"
                          ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-[color:var(--gold)]/15 text-[color:var(--gold)]">Tous les modules</span>
                          : (
                            <>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary">{readable}/{MODULES.length} modules</span>
                              {MODULES.filter((m) => u.permissions[m]?.read).slice(0, 3).map((m) => (
                                <span key={m} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{MODULE_LABELS[m]}</span>
                              ))}
                            </>
                          )
                        }
                      </div>
                    </td>
                    <td className="p-3">
                      <Switch checked={u.actif} onCheckedChange={(v) => usersStore.update(u.id, { actif: v })} disabled={!isAdmin} />
                    </td>
                    <td className="p-3 text-muted-foreground text-xs">{u.dateAjout}</td>
                    <td className="p-3 text-right">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(u)} disabled={!isAdmin}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setConfirmDel(u)} disabled={!isAdmin || u.id === me?.id}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={7} className="p-10 text-center text-muted-foreground">Aucun utilisateur.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto p-0">
          <div className="bg-gradient-to-r from-primary/10 via-[color:var(--gold)]/10 to-transparent px-6 py-4 border-b">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl"><ShieldCheck className="h-5 w-5 text-[color:var(--gold)]" /> {editing.id ? "Modifier l'utilisateur" : "Nouvel utilisateur"}</DialogTitle>
              <DialogDescription>Les administrateurs ont accès à tous les modules. Les collaborateurs voient uniquement les modules cochés en lecture.</DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-6 py-4 space-y-5">
            <section>
              <div className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">Informations</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Nom complet</Label><Input value={editing.nom} onChange={(e) => setEditing({ ...editing, nom: e.target.value })} placeholder="Ex: Meriem Bennis" /></div>
                <div className="space-y-1"><Label>Email professionnel</Label><Input type="email" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} placeholder="prenom.nom@beone-consulting.com" /></div>
                <div className="space-y-1"><Label>Fonction</Label><Input value={editing.fonction} onChange={(e) => setEditing({ ...editing, fonction: e.target.value })} placeholder="Ex: Consultant Senior" /></div>
                <div className="space-y-1">
                  <Label>Rôle</Label>
                  <Select value={editing.role} onValueChange={(v) => setEditing({ ...editing, role: v as AppUser["role"], permissions: v === "Admin" ? allPerms(true) : editing.permissions })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin — accès complet</SelectItem>
                      <SelectItem value="Collaborateur">Collaborateur — accès défini par permissions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            {editing.role === "Collaborateur" && (
              <section>
                <div className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">Matrice de permissions</div>
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="text-left p-3 font-medium">Module</th>
                        {actions.map((a) => (
                          <th key={a.key} className="p-3 font-medium text-center text-xs" title={a.label}>{a.label}</th>
                        ))}
                        <th className="p-3 font-medium text-center text-xs">Tout</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MODULES.map((m) => {
                        const perm = editing.permissions[m];
                        const allOn = actions.every((a) => perm[a.key]);
                        return (
                          <tr key={m} className="border-t">
                            <td className="p-3 font-medium">{MODULE_LABELS[m]}</td>
                            {actions.map((a) => (
                              <td key={a.key} className="p-3 text-center">
                                <Checkbox checked={perm[a.key]} onCheckedChange={(v) => togglePerm(m, a.key, !!v)} />
                              </td>
                            ))}
                            <td className="p-3 text-center">
                              <Checkbox checked={allOn} onCheckedChange={(v) => setAllForModule(m, !!v)} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="text-[11px] text-muted-foreground pt-2">Cocher Création, Modification ou Suppression active automatiquement la Lecture. Les modules sans lecture sont masqués dans la navigation.</p>
              </section>
            )}

            <section className="flex items-center justify-between rounded-lg border p-3">
              <div><div className="text-sm font-medium">Compte actif</div><div className="text-xs text-muted-foreground">Les comptes inactifs ne peuvent pas se connecter.</div></div>
              <Switch checked={editing.actif} onCheckedChange={(v) => setEditing({ ...editing, actif: v })} />
            </section>
          </div>
          <DialogFooter className="px-6 py-4 border-t bg-muted/30">
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={save} className="btn-premium hover:[&]:btn-premium-hover">Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!confirmDel} onOpenChange={(v) => !v && setConfirmDel(null)} title="Supprimer cet utilisateur ?" destructive confirmLabel="Supprimer" onConfirm={() => { if (confirmDel) { usersStore.remove(confirmDel.id); toast.success("Utilisateur supprimé"); } setConfirmDel(null); }} />
    </AppShell>
  );
}

function StatCard({ icon: Icon, label, value, tone }: { icon: typeof UserIcon; label: string; value: number; tone: "primary" | "gold" | "sky" | "emerald" }) {
  const toneClasses = {
    primary: "from-primary/15 to-primary/5 text-primary",
    gold: "from-[color:var(--gold)]/20 to-[color:var(--gold)]/5 text-[color:var(--gold)]",
    sky: "from-sky-500/15 to-sky-500/5 text-sky-600 dark:text-sky-400",
    emerald: "from-emerald-500/15 to-emerald-500/5 text-emerald-600 dark:text-emerald-400",
  }[tone];
  return (
    <Card className="p-4 flex items-center gap-3">
      <div className={cn("h-11 w-11 rounded-xl grid place-items-center bg-gradient-to-br", toneClasses)}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
      </div>
    </Card>
  );
}
