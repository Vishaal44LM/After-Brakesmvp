import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

/**
 * Shows an in-app dialog asking the user to enable location access after login.
 * - Opens if browser permission is "prompt" or "denied".
 * - Clicking "Enable Location" triggers the native browser prompt.
 * - Persists a "dismissed" flag for the session so we don't nag.
 */
export default function LocationPermissionGate() {
  const [open, setOpen] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const dismissed = sessionStorage.getItem("loc_prompt_dismissed") === "1";
    if (dismissed) return;
    if (!("geolocation" in navigator)) return;

    const check = async () => {
      try {
        // Permissions API is widely supported on modern browsers
        if ("permissions" in navigator) {
          const status = await (navigator as any).permissions.query({ name: "geolocation" });
          if (cancelled) return;
          if (status.state === "granted") return;
          setDenied(status.state === "denied");
          setOpen(true);
        } else {
          setOpen(true);
        }
      } catch {
        setOpen(true);
      }
    };
    check();
    return () => { cancelled = true; };
  }, []);

  const requestPermission = () => {
    setRequesting(true);
    navigator.geolocation.getCurrentPosition(
      () => {
        setRequesting(false);
        setOpen(false);
        sessionStorage.setItem("loc_prompt_dismissed", "1");
        toast.success("Location enabled");
      },
      (err) => {
        setRequesting(false);
        setDenied(true);
        if (err.code === err.PERMISSION_DENIED) {
          toast.error("Location blocked. Enable it in your browser settings to see nearby mechanics.");
        } else {
          toast.error("Couldn't get your location. Try again.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const skip = () => {
    sessionStorage.setItem("loc_prompt_dismissed", "1");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) skip(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="mx-auto h-14 w-14 rounded-full bg-primary/15 flex items-center justify-center mb-2">
            <MapPin className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-center">Enable Location</DialogTitle>
          <DialogDescription className="text-center">
            We use your live location to find the nearest mechanics and share accurate ETAs.
            Without it, the map defaults to Chennai city center.
          </DialogDescription>
        </DialogHeader>

        {denied && (
          <div className="flex items-start gap-2 text-xs text-warning bg-warning/10 rounded-md p-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>
              Location is blocked. Tap the lock/ⓘ icon in your browser's address bar →
              Site settings → allow Location, then reload.
            </span>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button onClick={requestPermission} disabled={requesting} className="w-full">
            {requesting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MapPin className="h-4 w-4 mr-2" />}
            Enable Location
          </Button>
          <Button variant="ghost" onClick={skip} className="w-full">Not now</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
