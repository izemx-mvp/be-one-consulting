import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { auth, DEMO_EMAIL, DEMO_PASSWORD, LOGO_URL } from "@/lib/auth";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Connexion — Be One Consulting" },
      { name: "description", content: "Espace d'administration interne Be One Consulting." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setTimeout(() => {
      auth.login(email, password);
      toast.success("Bienvenue Fatima Zahra !");
      navigate({ to: "/dashboard" });
    }, 800);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-sidebar text-sidebar-foreground relative overflow-hidden">
        {/* Gradient mesh background */}
        <div className="absolute inset-0 opacity-70 pointer-events-none">
          <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-[color:var(--gold)]/15 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-[420px] w-[420px] rounded-full bg-primary/40 blur-3xl" />
          <svg className="absolute inset-0 h-full w-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="p" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M0 40L40 0" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#p)" />
          </svg>
        </div>
        <div className="relative flex items-center gap-3 fade-up">
          <div className="bg-white rounded-lg p-2">
            <img src={LOGO_URL} alt="Be One Consulting" className="h-10 w-10 object-contain" />
          </div>
          <span className="font-semibold text-lg">Be One Consulting</span>
        </div>
        <div className="relative space-y-6 max-w-md fade-up" style={{ animationDelay: "80ms" }}>
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[color:var(--gold)]">
            <span className="h-px w-8 bg-[color:var(--gold)]" /> Espace administrateur
          </div>
          <h2 className="text-3xl font-semibold leading-tight">
            Premier partenaire marocain en solutions <span className="text-[color:var(--gold)]">Ressources Humaines</span> & Business Performance.
          </h2>
          <p className="text-sidebar-foreground/70">
            Suivi des demandes clients, CVthèque, enquêtes, rendez-vous, articles et base de connaissance — une plateforme unifiée pour piloter votre activité.
          </p>
        </div>
        <div className="relative text-xs text-sidebar-foreground/50">
          © {new Date().getFullYear()} Be One Consulting — Casablanca, Maroc.
        </div>
      </div>

      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-md p-8 space-y-6 shadow-xl border-border/60 fade-up">
          <div className="lg:hidden flex justify-center">
            <img src={LOGO_URL} alt="Be One Consulting" className="h-12 w-12 object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Bienvenue</h1>
            <p className="text-sm text-muted-foreground mt-1">Connectez-vous à votre espace administrateur.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Adresse e-mail</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mot de passe</Label>
                <a href="#" onClick={(e) => e.preventDefault()} className="text-xs text-muted-foreground hover:text-foreground">
                  Mot de passe oublié ?
                </a>
              </div>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground h-11">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Connexion...</> : "Se connecter"}
            </Button>
          </form>

          <div className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground border border-border/50">
            <div className="font-medium text-foreground mb-1 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--gold)] pulse-soft" />
              Identifiants de démonstration
            </div>
            Email : <span className="font-mono">{DEMO_EMAIL}</span><br />
            Mot de passe : <span className="font-mono">{DEMO_PASSWORD}</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
