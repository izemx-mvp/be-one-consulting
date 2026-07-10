import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Inbox, Users, ClipboardList, CalendarClock, Newspaper, HelpCircle, LogOut } from "lucide-react";
import { LOGO_URL, auth, useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";

const nav = [
  { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/demandes", label: "Demandes Clients", icon: Inbox },
  { to: "/recrutement", label: "Recrutement", icon: Users },
  { to: "/enquetes", label: "Enquêtes & Études", icon: ClipboardList },
  { to: "/rendezvous", label: "Rendez-vous", icon: CalendarClock },
  { to: "/articles", label: "Articles & Blog", icon: Newspaper },
  { to: "/faq", label: "Base de connaissance", icon: HelpCircle },
] as const;

export function AppShell({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    auth.logout();
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-64 shrink-0 bg-sidebar text-sidebar-foreground flex flex-col">
        <div className="p-5 border-b border-sidebar-border flex items-center gap-3">
          <div className="bg-white rounded-md p-1.5">
            <img src={LOGO_URL} alt="Be One Consulting" className="h-8 w-auto" />
          </div>
          <div className="leading-tight">
            <div className="font-semibold">Be One</div>
            <div className="text-xs text-sidebar-foreground/70">Consulting</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((item) => {
            const active = pathname === item.to || pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-[color:var(--gold)] text-[color:var(--gold-foreground)] font-medium"
                    : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-sidebar-border text-xs text-sidebar-foreground/70">
          Premier partenaire marocain en solutions RH & Business Performance.
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-card flex items-center justify-between px-6">
          <div>
            <h1 className="text-lg font-semibold text-foreground">{title}</h1>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right text-sm">
              <div className="font-medium">{user?.name ?? "Invité"}</div>
              <div className="text-xs text-muted-foreground">{user?.email}</div>
            </div>
            <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground grid place-items-center font-medium">
              {(user?.name ?? "?").split(" ").map((s) => s[0]).slice(0, 2).join("")}
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-1" /> Déconnexion
            </Button>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
