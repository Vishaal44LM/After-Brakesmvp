import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, AlertTriangle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { detectInAppBrowser, isAndroid, isIOS, openInExternalBrowser } from "@/lib/browserEnv";

/**
 * Robust location permission flow:
 * - granted: silently stash coordinates in sessionStorage; never show dialog.
 * - prompt:  open dialog, request on click, handle every error code.
 * - denied:  open dialog with browser-specific instructions.
 * - in-app browsers (Instagram / Facebook / etc.): surface "Open in Safari/Chrome"
 *   because geolocation is frequently blocked inside those webviews.
 */
export default function LocationPermissionGate() {
  const [open, setOpen] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [denied, setDenied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inApp = detectInAppBrowser();

  useEffect(() => {
    let cancelled = false;
    if (sessionStorage.getItem("loc_prompt_dismissed") === "1") return;
    if (!("geolocation" in navigator)) {
      setErrorMsg("Your browser doesn't support location.");
      setOpen(true);
      return;
    }

    const check = async () => {
      try {
        if ("permissions" in navigator) {
          const status = await (navigator as any).permissions.query({ name: "geolocation" });
          if (cancelled) return;
          if (status.state === "granted") {
            // Capture once so the map has a fix immediately on first render.
            navigator.geolocation.getCurrentPosition(
              (p) => persist(p.coords.latitude, p.coords.longitude),
              () => {},
              { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
            );
            return;
          }
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

  const persist = (lat: number, lng: number) => {
    try {
      sessionStorage.setItem("user_coords", JSON.stringify({ lat, lng, ts: Date.now() }));
      window.dispatchEvent(new CustomEvent("user-coords", { detail: { lat, lng } }));
    } catch {}
  };

  const requestPermission = () => {
    setRequesting(true);
    setErrorMsg(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setRequesting(false);
        setOpen(false);
        sessionStorage.setItem("loc_prompt_dismissed", "1");
        persist(pos.coords.latitude, pos.coords.longitude);
        toast.success("Location enabled");
      },
      (err) => {
        setRequesting(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setDenied(true);
            setErrorMsg("Permission denied. Enable location in your browser settings, then reload.");
            break;
          case err.POSITION_UNAVAILABLE:
            setErrorMsg("Couldn't determine your position. Check GPS / network and try again.");
            break;
          case err.TIMEOUT:
            setErrorMsg("Location request timed out. Move to an open area and try again.");
            break;
          default:
            setErrorMsg("Couldn't get your location. Try again.");
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
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
            You can also type your address manually on the map.
          </DialogDescription>
        </DialogHeader>

        {inApp && (
          <div className="flex items-start gap-2 text-xs text-warning bg-warning/10 rounded-md p-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>
              Location access may be restricted inside {inApp.charAt(0).toUpperCase() + inApp.slice(1)}.
              For the best experience, open After Brakes in {isIOS() ? "Safari" : "Chrome"}.
            </span>
          </div>
        )}

        {errorMsg && (
          <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 rounded-md p-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {denied && !errorMsg && (
          <div className="flex items-start gap-2 text-xs text-warning bg-warning/10 rounded-md p-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>
              Tap the lock/ⓘ icon in your browser's address bar → Site settings → allow Location, then reload.
            </span>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-col gap-2">
          {inApp ? (
            <Button onClick={() => openInExternalBrowser()} className="w-full">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in {isIOS() ? "Safari" : isAndroid() ? "Chrome" : "Browser"}
            </Button>
          ) : (
            <Button onClick={requestPermission} disabled={requesting} className="w-full">
              {requesting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MapPin className="h-4 w-4 mr-2" />}
              Enable Location
            </Button>
          )}
          <Button variant="ghost" onClick={skip} className="w-full">Continue without GPS</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
