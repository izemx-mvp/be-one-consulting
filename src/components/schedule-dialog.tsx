import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Clock, Globe } from "lucide-react";

const TZ = [
  "Africa/Casablanca (GMT+1)",
  "Europe/Paris (GMT+1)",
  "Europe/London (GMT+0)",
  "America/New_York (GMT-5)",
  "Asia/Dubai (GMT+4)",
];

export function ScheduleDialog({
  open,
  onOpenChange,
  onConfirm,
  initialDate,
  initialTime,
  title = "Planifier la publication",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (payload: { date: string; time: string; timezone: string }) => void;
  initialDate?: string;
  initialTime?: string;
  title?: string;
}) {
  const [date, setDate] = useState(initialDate ?? new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(initialTime ?? "09:00");
  const [timezone, setTimezone] = useState(TZ[0]);
  useEffect(() => { if (open) { setDate(initialDate ?? new Date().toISOString().slice(0, 10)); setTime(initialTime ?? "09:00"); } }, [open, initialDate, initialTime]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><CalendarIcon className="h-4 w-4 text-[color:var(--gold)]" /> {title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label className="flex items-center gap-1.5 text-xs"><CalendarIcon className="h-3.5 w-3.5" /> Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div className="space-y-1"><Label className="flex items-center gap-1.5 text-xs"><Clock className="h-3.5 w-3.5" /> Heure</Label><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
          </div>
          <div className="space-y-1"><Label className="flex items-center gap-1.5 text-xs"><Globe className="h-3.5 w-3.5" /> Fuseau horaire</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TZ.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="rounded-lg border p-3 bg-muted/30 text-xs text-muted-foreground">
            La publication sera automatiquement mise en ligne le <b className="text-foreground">{date}</b> à <b className="text-foreground">{time}</b> ({timezone.split(" ")[0]}).
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button className="btn-premium hover:[&]:btn-premium-hover" onClick={() => { onConfirm({ date, time, timezone }); onOpenChange(false); }}>Planifier</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
