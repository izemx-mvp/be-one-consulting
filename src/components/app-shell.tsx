import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Inbox, Users, ClipboardList, CalendarClock, Newspaper, HelpCircle, LogOut, Bell, Search, Sun, Moon, ChevronsLeft, ChevronsRight, ChevronRight, Sparkles, User, Settings, ShieldCheck } from "lucide-react";
import { LOGO_URL, auth, useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState, type ReactNode } from "react";
import { useTheme } from "@/lib/theme";
import { notificationsStore, useStore, demandesStore, candidatsStore, articlesStore, faqStore, usersStore, currentUser, type ModuleKey } from "@/lib/mock-data";
import { useCurrentUser, useCan } from "@/lib/permissions";

const nav: { to: string; label: string; icon: typeof LayoutDashboard; module: ModuleKey }[] = [
  { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard, module: "dashboard" },
  { to: "/demandes", label: "Qualification AI", icon: Inbox, module: "demandes" },
  { to: "/recrutement", label: "Recrutement AI", icon: Users, module: "recrutement" },
  { to: "/enquetes", label: "Enquêtes AI", icon: ClipboardList, module: "enquetes" },
  { to: "/articles", label: "Articles AI", icon: Newspaper, module: "articles" },
  { to: "/faq", label: "Base de connaissance", icon: HelpCircle, module: "faq" },
  { to: "/utilisateurs", label: "Utilisateurs", icon: ShieldCheck, module: "utilisateurs" },
];

const routeLabels: Record<string, string> = {
  dashboard: "Tableau de bord",
  demandes: "Qualification AI",
  recrutement: "Recrutement AI",
  enquetes: "Enquêtes AI",
  articles: "Articles AI",
  faq: "Base de connaissance",
  utilisateurs: "Utilisateurs",
};


function GlobalSearch() {
  const [q, setQ] = useState("");
  const demandes = useStore(demandesStore);
  const candidats = useStore(candidatsStore);
  const articles = useStore(articlesStore);
  const faq = useStore(faqStore);
  const needle = q.trim().toLowerCase();
  const results = needle ? {
    demandes: demandes.filter((d) => d.nom.toLowerCase().includes(needle) || d.entreprise.toLowerCase().includes(needle)).slice(0, 4),
    candidats: candidats.filter((c) => c.nom.toLowerCase().includes(needle) || c.poste.toLowerCase().includes(needle)).slice(0, 4),
    articles: articles.filter((a) => a.titre.toLowerCase().includes(needle)).slice(0, 4),
    faq: faq.filter((f) => f.question.toLowerCase().includes(needle)).slice(0, 4),
  } : null;
  const total = results ? results.demandes.length + results.candidats.length + results.articles.length + results.faq.length : 0;
  return (
    <Popover open={!!needle}>
      <PopoverTrigger asChild>
        <div className="relative w-full max-w-md hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Recherche globale — candidats, demandes, articles..." className="pl-9 bg-background/60" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[520px] p-0" align="start">
        <div className="p-3 border-b text-xs text-muted-foreground">
          {total} résultat{total > 1 ? "s" : ""} pour « {q} »
        </div>
        <div className="max-h-[380px] overflow-auto">
          {results && (
            <>
              {results.demandes.length > 0 && <Group title="Demandes">
                {results.demandes.map((d) => (
                  <Link key={d.id} to="/demandes" className="block px-3 py-2 hover:bg-muted text-sm" onClick={() => setQ("")}>
                    <div className="font-medium">{d.nom} <span className="text-muted-foreground font-normal">— {d.entreprise}</span></div>
                    <div className="text-xs text-muted-foreground">{d.type} · {d.statut}</div>
                  </Link>
                ))}
              </Group>}
              {results.candidats.length > 0 && <Group title="Candidats">
                {results.candidats.map((c) => (
                  <Link key={c.id} to="/recrutement" className="block px-3 py-2 hover:bg-muted text-sm" onClick={() => setQ("")}>
                    <div className="font-medium">{c.nom}</div>
                    <div className="text-xs text-muted-foreground">{c.poste} · {c.source}</div>
                  </Link>
                ))}
              </Group>}
              {results.articles.length > 0 && <Group title="Articles">
                {results.articles.map((a) => (
                  <Link key={a.id} to="/articles" className="block px-3 py-2 hover:bg-muted text-sm" onClick={() => setQ("")}>
                    <div className="font-medium">{a.titre}</div>
                    <div className="text-xs text-muted-foreground">{a.thematique} · {a.statut}</div>
                  </Link>
                ))}
              </Group>}
              {results.faq.length > 0 && <Group title="Base de connaissance">
                {results.faq.map((f) => (
                  <Link key={f.id} to="/faq" className="block px-3 py-2 hover:bg-muted text-sm" onClick={() => setQ("")}>
                    <div className="font-medium">{f.question}</div>
                    <div className="text-xs text-muted-foreground">{f.categorie}</div>
                  </Link>
                ))}
              </Group>}
              {total === 0 && <div className="p-6 text-center text-sm text-muted-foreground">Aucun résultat.</div>}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{title}</div>
      {children}
    </div>
  );
}

function Notifications() {
  const notifs = useStore(notificationsStore);
  const unread = notifs.filter((n) => !n.lu).length;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unread > 0 && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-0" align="end">
        <div className="p-3 border-b flex items-center justify-between">
          <span className="font-semibold text-sm">Notifications</span>
          <button
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => notifs.forEach((n) => !n.lu && notificationsStore.update(n.id, { lu: true }))}
          >Tout marquer comme lu</button>
        </div>
        <div className="max-h-[360px] overflow-auto divide-y">
          {notifs.map((n) => (
            <div key={n.id} className={cn("p-3 flex gap-3", !n.lu && "bg-muted/30")}>
              <div className={cn("mt-1 h-2 w-2 rounded-full shrink-0", n.type === "success" && "bg-emerald-500", n.type === "warn" && "bg-amber-500", n.type === "info" && "bg-sky-500")} />
              <div className="min-w-0">
                <div className="text-sm">{n.titre}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{n.at}</div>
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Changer de thème">
      {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}

export function AppShell({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const currentAppUser = useCurrentUser();
  const can = useCan();
  const allUsers = useStore(usersStore);
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const segments = pathname.split("/").filter(Boolean);
  const crumbs = segments.map((s) => routeLabels[s] ?? s);

  const visibleNav = nav.filter((n) => can(n.module, "read"));

  const handleLogout = () => {
    auth.logout();
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen flex bg-background">
      <aside className={cn("shrink-0 bg-sidebar text-sidebar-foreground flex flex-col transition-[width] duration-300 border-r border-sidebar-border", collapsed ? "w-[76px]" : "w-64")}>
        <div className={cn("border-b border-sidebar-border flex items-center justify-center", collapsed ? "p-3" : "p-5")}>
          <div className={cn("bg-white rounded-xl shadow-sm flex items-center justify-center", collapsed ? "h-11 w-11 p-1.5" : "h-16 w-full p-2.5")}>
            <img src={LOGO_URL} alt="Be One Consulting" className={cn("object-contain", collapsed ? "h-8 w-8" : "h-11 w-auto max-w-full")} />
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {visibleNav.map((item) => {
            const active = pathname === item.to || pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-[color:var(--gold)] shadow-[0_0_10px_var(--gold-glow)]" />}
                <item.icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-[color:var(--gold)]")} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={() => setCollapsed((v) => !v)}
          className="mx-3 mb-3 h-9 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground flex items-center justify-center transition-colors"
          aria-label="Réduire le menu"
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </button>
        {!collapsed && (
          <div className="p-4 border-t border-sidebar-border text-[11px] leading-relaxed text-sidebar-foreground/60">
            Premier partenaire marocain en solutions RH & Business Performance.
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b glass flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Admin</span>
              {crumbs.map((c, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <ChevronRight className="h-3 w-3" />
                  <span className={cn(i === crumbs.length - 1 && "text-foreground font-medium")}>{c}</span>
                </span>
              ))}
            </div>
            <div className="flex-1 flex justify-center">
              <GlobalSearch />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Notifications />
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 ml-2 pl-3 border-l h-9">
                  <div className="text-right text-sm hidden sm:block">
                    <div className="font-medium leading-tight">{currentAppUser?.nom ?? user?.name ?? "Invité"}</div>
                    <div className="text-[11px] text-muted-foreground leading-tight flex items-center gap-1 justify-end">
                      <span className={cn("inline-block h-1.5 w-1.5 rounded-full", currentAppUser?.role === "Admin" ? "bg-[color:var(--gold)]" : "bg-primary")} />
                      {currentAppUser?.role ?? "Administratrice"}
                    </div>
                  </div>
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground grid place-items-center font-semibold text-sm shadow-sm">
                    {(currentAppUser?.nom ?? user?.name ?? "?").split(" ").map((s) => s[0]).slice(0, 2).join("")}
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel>
                  <div className="font-medium">{currentAppUser?.nom}</div>
                  <div className="text-xs text-muted-foreground font-normal">{currentAppUser?.email}</div>
                  <div className="text-[10px] uppercase tracking-wider text-[color:var(--gold)] font-semibold mt-1">{currentAppUser?.role} · {currentAppUser?.fonction}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Changer d'utilisateur (démo)</DropdownMenuLabel>
                {allUsers.filter((u) => u.actif).map((u) => (
                  <DropdownMenuItem key={u.id} onClick={() => currentUser.set(u.id)} className={cn("gap-2", u.id === currentAppUser?.id && "bg-muted/60")}>
                    <div className={cn("h-6 w-6 rounded-full grid place-items-center text-[10px] font-bold text-white", u.role === "Admin" ? "bg-[color:var(--gold)]" : "bg-primary")}>
                      {u.nom.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm truncate">{u.nom}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{u.role} · {u.fonction}</div>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive"><LogOut className="h-4 w-4 mr-2" /> Déconnexion</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </header>
        <main className="flex-1 overflow-auto app-bg relative">
          <div className="absolute inset-x-0 top-0 h-72 grid-bg pointer-events-none" />
          <div className="relative">
          <div className="p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
            <div className="mb-6 fade-up">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    {title}
                    <Sparkles className="h-4 w-4 text-[color:var(--gold)]" />
                  </h1>
                  {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
                </div>
              </div>
            </div>
            {children}
          </div>
          </div>
        </main>
      </div>
    </div>
  );
}
