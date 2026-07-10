import { cn } from "@/lib/utils";

type Tone = "default" | "success" | "warn" | "info" | "danger" | "muted" | "gold" | "purple";

const tones: Record<Tone, string> = {
  default: "bg-secondary text-secondary-foreground",
  success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
  warn: "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200",
  info: "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200",
  danger: "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200",
  muted: "bg-muted text-muted-foreground",
  gold: "bg-[color:var(--gold)]/20 text-[color:var(--gold-foreground)] dark:text-[color:var(--gold)]",
  purple: "bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-200",
};

const map: Record<string, Tone> = {
  "Nouveau": "info",
  "En cours": "warn",
  "En cours de qualification": "warn",
  "Traité": "success",
  "Redirigé": "purple",
  "Présélectionné": "info",
  "Entretien": "warn",
  "Offre": "gold",
  "Rejeté": "danger",
  "Recruté": "success",
  "Terminé": "success",
  "En attente de relance": "warn",
  "Relance en cours": "warn",
  "Envoyé": "success",
  "Programmé": "info",
  "Non envoyé": "danger",
  "Confirmé": "success",
  "Brouillon": "muted",
  "En attente de validation": "warn",
  "Publié": "success",
  "Ouvert": "info",
  "Répondu": "success",
  "Relancé": "warn",
  "Non répondu": "muted",
  "Haute": "danger",
  "Moyenne": "warn",
  "Basse": "muted",
};

export function StatusBadge({ status, className, dot }: { status: string; className?: string; dot?: boolean }) {
  const tone = map[status] ?? "default";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone], className)}>
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", tone === "warn" && "bg-amber-500 pulse-soft", tone === "info" && "bg-sky-500", tone === "success" && "bg-emerald-500", tone === "danger" && "bg-red-500", tone === "gold" && "bg-[color:var(--gold)]", tone === "purple" && "bg-violet-500", tone === "muted" && "bg-muted-foreground/50")} />}
      {status}
    </span>
  );
}
