import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CalendarClock, Loader2, MapPin, MessageCircle, Phone, Car, Ban,
  CheckCircle2, Hourglass, PlayCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { serviceLabel, categoryLabel } from "@/data/services";
import { toast } from "sonner";

type Booking = {
  id: string;
  service_category: string | null;
  service_name: string | null;
  description: string | null;
  scheduled_at: string | null;
  booking_status: string;
  status: string;
  area: string | null;
  vehicle_id: string | null;
  vehicleLabel?: string;
  mechanic?: any;
  responseId?: string;
};

export const formatSlot = (iso?: string | null) => {
  if (!iso) return "Not set";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short", day: "numeric", month: "short",
    hour: "numeric", minute: "2-digit",
  });
};

export const statusMeta = (b: { booking_status: string; scheduled_at: string | null }) => {
  switch (b.booking_status) {
    case "waiting":
      return { label: "Awaiting mechanic", cls: "bg-primary/20 text-primary", Icon: Hourglass };
    case "upcoming":
    case "accepted":
      return { label: "Confirmed", cls: "bg-success/20 text-success", Icon: CheckCircle2 };
    case "in_progress":
      return { label: "Service in progress", cls: "bg-success/20 text-success", Icon: PlayCircle };
    case "completed":
      return { label: "Completed", cls: "bg-muted text-muted-foreground", Icon: CheckCircle2 };
    case "cancelled":
      return { label: "Cancelled", cls: "bg-destructive/20 text-destructive", Icon: Ban };
    default:
      return { label: b.booking_status, cls: "bg-secondary text-muted-foreground", Icon: Hourglass };
  }
};

export default function ScheduledBookings({ vehicles }: { vehicles: any[] }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmCancel, setConfirmCancel] = useState<Booking | null>(null);

  const fetchBookings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: issues } = await supabase
        .from("issues")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_scheduled", true)
        .order("scheduled_at", { ascending: true });

      const list = (issues as any[]) || [];
      let responses: any[] = [];
      let mechs: any[] = [];
      if (list.length) {
        const ids = list.map((i) => i.id);
        const { data: resp } = await supabase
          .from("mechanic_responses")
          .select("*")
          .in("issue_id", ids)
          .eq("status", "accepted");
        responses = resp || [];
        const mechIds = [...new Set(responses.map((r) => r.mechanic_id))];
        if (mechIds.length) {
          const { data: mp } = await supabase
            .from("mechanic_profiles")
            .select("*")
            .in("user_id", mechIds);
          mechs = mp || [];
        }
      }

      setBookings(
        list.map((i) => {
          const r = responses.find((x) => x.issue_id === i.id);
          const veh = vehicles.find((v: any) => v.id === i.vehicle_id);
          return {
            ...i,
            vehicleLabel: veh
              ? `${veh.vehicle_type} ${veh.vehicle_brand || ""} ${veh.vehicle_model || ""}`.trim()
              : undefined,
            responseId: r?.id,
            mechanic: r ? mechs.find((m) => m.user_id === r.mechanic_id) : undefined,
          } as Booking;
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchBookings();
    const ch = supabase
      .channel(`user-scheduled-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "issues", filter: `user_id=eq.${user.id}` }, () => fetchBookings())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, vehicles]);

  const cancelBooking = async (b: Booking) => {
    try {
      await supabase.from("issues").update({ booking_status: "cancelled", status: "cancelled" } as any).eq("id", b.id);
      if (b.responseId) {
        await supabase.from("mechanic_responses").update({ status: "cancelled" } as any).eq("id", b.responseId);
      }
      toast.success("Booking cancelled");
      fetchBookings();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setConfirmCancel(null);
    }
  };

  const upcoming = bookings.filter((b) => !["completed", "cancelled"].includes(b.booking_status));
  const past = bookings.filter((b) => ["completed", "cancelled"].includes(b.booking_status));

  const Card = ({ b }: { b: Booking }) => {
    const meta = statusMeta(b);
    return (
      <div className="bg-card rounded-xl border border-border p-4 space-y-3 animate-slide-up">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-primary font-semibold">
              {categoryLabel(b.service_category)}
            </p>
            <h3 className="font-semibold text-sm">{serviceLabel(b.service_name)}</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <CalendarClock className="h-3 w-3 text-primary" /> {formatSlot(b.scheduled_at)}
            </p>
            {b.area && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {b.area}
              </p>
            )}
            {b.vehicleLabel && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Car className="h-3 w-3" /> {b.vehicleLabel}
              </p>
            )}
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded shrink-0 flex items-center gap-1 ${meta.cls}`}>
            <meta.Icon className="h-3 w-3" /> {meta.label}
          </span>
        </div>

        {b.mechanic && (
          <div className="flex items-center gap-3 rounded-lg bg-secondary p-3">
            {b.mechanic.garage_photo_url ? (
              <img src={b.mechanic.garage_photo_url} alt={b.mechanic.name} className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {b.mechanic.garage_name?.[0] || "M"}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{b.mechanic.garage_name}</p>
              <p className="text-xs text-muted-foreground truncate">{b.mechanic.name}</p>
            </div>
          </div>
        )}

        {b.description && (
          <p className="text-xs text-muted-foreground bg-secondary rounded-lg p-2 whitespace-pre-wrap">{b.description}</p>
        )}

        <div className="flex flex-wrap gap-2">
          {b.mechanic && (
            <Button size="sm" variant="outline" onClick={() => navigate(`/chat/${b.id}`)}>
              <MessageCircle className="h-3 w-3 mr-1" /> Chat
            </Button>
          )}
          {b.mechanic?.phone_number && (
            <a href={`tel:${b.mechanic.phone_number}`}>
              <Button size="sm" variant="secondary">
                <Phone className="h-3 w-3 mr-1" /> +91 {b.mechanic.phone_number}
              </Button>
            </a>
          )}
          {!["completed", "cancelled"].includes(b.booking_status) && (
            <Button size="sm" variant="destructive" className="ml-auto" onClick={() => setConfirmCancel(b)}>
              <Ban className="h-3 w-3 mr-1" /> Cancel
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-primary" /> Scheduled Bookings
      </h2>

      {loading && <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>}

      {!loading && bookings.length === 0 && (
        <div className="text-center text-muted-foreground text-sm py-10">
          No scheduled bookings yet. Pick a service and choose "Schedule for Later".
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-3">
          {upcoming.map((b) => <Card key={b.id} b={b} />)}
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">History</h3>
          {past.map((b) => <Card key={b.id} b={b} />)}
        </div>
      )}

      <AlertDialog open={!!confirmCancel} onOpenChange={(o) => !o && setConfirmCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
            <AlertDialogDescription>
              Your scheduled service will be cancelled and the mechanic notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => confirmCancel && cancelBooking(confirmCancel)}
            >
              Cancel Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
