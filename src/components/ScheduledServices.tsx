import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CalendarClock, Loader2, MapPin, MessageCircle, Phone, Car, Ban,
  Check, PlayCircle, CheckCircle2, Navigation, MessageSquareQuote,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { serviceLabel, categoryLabel } from "@/data/services";
import { formatSlot } from "@/components/ScheduledBookings";
import RequestMiniMap from "@/components/RequestMiniMap";
import { toast } from "sonner";

/** Mechanics may start a scheduled job from 30 minutes before the slot. */
const START_WINDOW_MS = 30 * 60 * 1000;

type Row = {
  id: string;
  user_id: string;
  service_category: string | null;
  service_name: string | null;
  description: string | null;
  scheduled_at: string | null;
  booking_status: string;
  status: string;
  area: string | null;
  latitude: number | null;
  longitude: number | null;
  vehicle_id: string | null;
  vehicleLabel?: string;
  userName?: string;
  userPhone?: string;
  responseId?: string;
  mine: boolean;
};

export default function ScheduledServices() {
  const navigate = useNavigate();
  const { user, mechanicProfile } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<Row | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 15000);
    return () => window.clearInterval(t);
  }, []);

  const fetchRows = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: myResponses } = await supabase
        .from("mechanic_responses")
        .select("*")
        .eq("mechanic_id", user.id);
      const respByIssue = new Map<string, any>((myResponses || []).map((r: any) => [r.issue_id, r]));
      const mineIds = (myResponses || [])
        .filter((r: any) => r.status === "accepted")
        .map((r: any) => r.issue_id);

      const { data: openScheduled } = await supabase
        .from("issues")
        .select("*")
        .eq("is_scheduled", true)
        .eq("status", "open")
        .order("scheduled_at", { ascending: true })
        .limit(60);

      const { data: mineScheduled } = mineIds.length
        ? await supabase.from("issues").select("*").eq("is_scheduled", true).in("id", mineIds)
        : { data: [] as any[] };

      const openClean = ((openScheduled as any[]) || []).filter((i) => !respByIssue.has(i.id));
      const all = [...((mineScheduled as any[]) || []), ...openClean].filter(
        (i) => i.booking_status !== "cancelled",
      );

      const userIds = [...new Set(all.map((i) => i.user_id))];
      const vehicleIds = all.filter((i) => i.vehicle_id).map((i) => i.vehicle_id);
      const [{ data: profiles }, { data: vehicles }] = await Promise.all([
        userIds.length
          ? supabase.from("profiles").select("user_id, name, phone").in("user_id", userIds)
          : Promise.resolve({ data: [] as any[] }),
        vehicleIds.length
          ? supabase.from("vehicles").select("*").in("id", vehicleIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      setRows(
        all.map((i) => {
          const r = respByIssue.get(i.id);
          const mine = r?.status === "accepted";
          const p = (profiles || []).find((x: any) => x.user_id === i.user_id);
          const veh = (vehicles || []).find((v: any) => v.id === i.vehicle_id);
          return {
            ...i,
            mine,
            responseId: r?.id,
            userName: p?.name,
            userPhone: mine ? p?.phone : undefined,
            vehicleLabel: veh
              ? `${veh.vehicle_type} ${veh.vehicle_brand || ""} ${veh.vehicle_model || ""}`.trim()
              : undefined,
          } as Row;
        }).sort((a, b) => {
          if (a.mine !== b.mine) return a.mine ? -1 : 1;
          return new Date(a.scheduled_at || 0).getTime() - new Date(b.scheduled_at || 0).getTime();
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchRows();
    const ch = supabase
      .channel("mech-scheduled-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "issues" }, () => fetchRows())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const accept = async (r: Row) => {
    if (!user) return;
    setActing(r.id);
    try {
      const { error } = await supabase.from("mechanic_responses").insert({
        issue_id: r.id,
        mechanic_id: user.id,
        price_quote: 0,
        message: `Scheduled service confirmed by ${mechanicProfile?.garage_name || "mechanic"}`,
        status: "accepted",
      } as any);
      if (error) throw error;
      await supabase.from("issues").update({ booking_status: "upcoming" } as any).eq("id", r.id);
      toast.success("Booking confirmed");
      fetchRows();
    } catch (e: any) {
      toast.error(e.message);
    } finally { setActing(null); }
  };

  const reject = async (r: Row) => {
    if (!user) return;
    setActing(r.id);
    try {
      await supabase.from("mechanic_responses").insert({
        issue_id: r.id,
        mechanic_id: user.id,
        price_quote: 0,
        message: "Declined",
        status: "rejected",
      } as any);
      toast.success("Dismissed");
      fetchRows();
    } catch (e: any) {
      toast.error(e.message);
    } finally { setActing(null); }
  };

  const startService = async (r: Row) => {
    setActing(r.id);
    try {
      await supabase.from("issues").update({
        booking_status: "in_progress",
        started_at: new Date().toISOString(),
      } as any).eq("id", r.id);
      toast.success("Service started — live tracking is now active");
      fetchRows();
    } catch (e: any) {
      toast.error(e.message);
    } finally { setActing(null); }
  };

  const completeService = async (r: Row) => {
    setActing(r.id);
    try {
      await supabase.from("issues").update({
        booking_status: "completed",
        status: "completed",
        completed_at: new Date().toISOString(),
      } as any).eq("id", r.id);
      toast.success("Service marked complete");
      fetchRows();
    } catch (e: any) {
      toast.error(e.message);
    } finally { setActing(null); }
  };

  const cancelJob = async (r: Row) => {
    setActing(r.id);
    try {
      if (r.responseId) {
        await supabase.from("mechanic_responses").update({ status: "cancelled" } as any).eq("id", r.responseId);
      }
      await supabase.from("issues").update({ booking_status: "waiting", status: "open" } as any).eq("id", r.id);
      toast.success("Booking released back to other mechanics");
      fetchRows();
    } catch (e: any) {
      toast.error(e.message);
    } finally { setActing(null); setConfirmCancel(null); }
  };

  const mine = rows.filter((r) => r.mine);
  const open = rows.filter((r) => !r.mine);

  const Card = ({ r }: { r: Row }) => {
    const slot = r.scheduled_at ? new Date(r.scheduled_at).getTime() : 0;
    const canStart = r.mine && r.booking_status === "upcoming" && now >= slot - START_WINDOW_MS;
    return (
      <div className={`bg-card rounded-xl border p-4 space-y-3 animate-slide-up ${r.mine ? "border-success/40" : "border-border"}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-primary font-semibold">
              {categoryLabel(r.service_category)}
            </p>
            <h3 className="font-semibold text-sm">{serviceLabel(r.service_name)}</h3>
            <p className="text-xs text-muted-foreground">{r.userName || "Customer"}</p>
            <p className="text-xs text-primary flex items-center gap-1 mt-1">
              <CalendarClock className="h-3 w-3" /> {formatSlot(r.scheduled_at)}
            </p>
            {r.area && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {r.area}
              </p>
            )}
            {r.vehicleLabel && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Car className="h-3 w-3" /> {r.vehicleLabel}
              </p>
            )}
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded shrink-0 ${
            r.booking_status === "in_progress" ? "bg-success/20 text-success"
            : r.mine ? "bg-success/20 text-success" : "bg-primary/20 text-primary"
          }`}>
            {r.booking_status === "in_progress" ? "in progress" : r.mine ? "confirmed" : "new"}
          </span>
        </div>

        {r.description && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <MessageSquareQuote className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] uppercase tracking-wide font-semibold text-primary">Customer's note</span>
            </div>
            <p className="text-sm whitespace-pre-wrap leading-snug">{r.description}</p>
          </div>
        )}

        {r.latitude != null && r.longitude != null && (
          <RequestMiniMap userLat={r.latitude} userLng={r.longitude} height={140} />
        )}

        <div className="flex flex-wrap gap-2">
          {!r.mine && (
            <>
              <Button size="sm" className="flex-1" onClick={() => accept(r)} disabled={acting === r.id}>
                {acting === r.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Check className="h-3 w-3 mr-1" />} Accept Booking
              </Button>
              <Button size="sm" variant="outline" onClick={() => reject(r)} disabled={acting === r.id}>
                Decline
              </Button>
            </>
          )}

          {r.mine && r.booking_status === "upcoming" && (
            <Button size="sm" onClick={() => startService(r)} disabled={!canStart || acting === r.id}>
              <PlayCircle className="h-3 w-3 mr-1" />
              {canStart ? "Start Service" : "Starts near slot time"}
            </Button>
          )}

          {r.mine && r.booking_status === "in_progress" && (
            <Button size="sm" onClick={() => completeService(r)} disabled={acting === r.id}>
              <CheckCircle2 className="h-3 w-3 mr-1" /> Mark Complete
            </Button>
          )}

          {r.mine && (
            <>
              <Button size="sm" variant="outline" onClick={() => navigate(`/chat/${r.id}`)}>
                <MessageCircle className="h-3 w-3 mr-1" /> Chat
              </Button>
              {r.userPhone && (
                <a href={`tel:${r.userPhone}`}>
                  <Button size="sm" variant="secondary"><Phone className="h-3 w-3 mr-1" /> Call</Button>
                </a>
              )}
              {r.latitude != null && r.longitude != null && (
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${r.latitude},${r.longitude}`} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline"><Navigation className="h-3 w-3 mr-1" /> Navigate</Button>
                </a>
              )}
              {r.booking_status !== "completed" && (
                <Button size="sm" variant="destructive" className="ml-auto" onClick={() => setConfirmCancel(r)}>
                  <Ban className="h-3 w-3 mr-1" /> Cancel
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-primary" /> Scheduled Services
      </h2>

      {loading && <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>}

      {!loading && rows.length === 0 && (
        <div className="text-center text-muted-foreground text-sm py-10">
          No scheduled services yet. Bookings customers schedule in advance will appear here.
        </div>
      )}

      {mine.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">My Bookings</h3>
          {mine.map((r) => <Card key={r.id} r={r} />)}
        </div>
      )}

      {open.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Available Bookings</h3>
          {open.map((r) => <Card key={r.id} r={r} />)}
        </div>
      )}

      <AlertDialog open={!!confirmCancel} onOpenChange={(o) => !o && setConfirmCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
            <AlertDialogDescription>
              The customer will be notified and the booking re-opened for other mechanics.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => confirmCancel && cancelJob(confirmCancel)}
            >
              Cancel Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
