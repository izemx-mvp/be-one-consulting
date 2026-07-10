import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { auth, DEMO_EMAIL, DEMO_PASSWORD, LOGO_URL } from "@/lib/auth";

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
  const navigate = useNavigate();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    auth.login(email, password);
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-md p-2">
            <img src={LOGO_URL} alt="Be One Consulting" className="h-10 w-auto" />
          </div>
          <span className="font-semibold text-lg">Be One Consulting</span>
        </div>
        <div className="space-y-6 max-w-md">
          <h2 className="text-3xl font-semibold leading-tight">
            Premier partenaire marocain en solutions Ressources Humaines & Business Performance.
          </h2>
          <p className="text-sidebar-foreground/70">
            Plateforme interne d'administration : suivi des demandes clients, CVthèque, enquêtes,
            rendez-vous, articles et base de connaissance.
          </p>
        </div>
        <div className="text-xs text-sidebar-foreground/60">
          © {new Date().getFullYear()} Be One Consulting — Casablanca, Maroc.
        </div>
      </div>

      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-md p-8 space-y-6">
          <div className="lg:hidden flex justify-center">
            <img src={LOGO_URL} alt="Be One Consulting" className="h-12 w-auto" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Bienvenue</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Connectez-vous à votre espace administrateur.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Adresse e-mail</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full bg-primary text-primary-foreground">
              Se connecter
            </Button>
          </form>

          <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
            <div className="font-medium text-foreground mb-1">Identifiants de démonstration</div>
            Email : {DEMO_EMAIL}<br />
            Mot de passe : {DEMO_PASSWORD}
          </div>
        </Card>
      </div>
    </div>
  );
}
