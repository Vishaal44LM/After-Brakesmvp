import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, AlertTriangle, ExternalLink, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { detectInAppBrowser, isAndroid, isIOS, openInExternalBrowser } from "@/lib/browserEnv";

/**
 * Mandatory location permission flow.
 *
 * Renders a non-dismissable full-screen blocker until the browser grants
 * geolocation. Required for both Customer and Mechanic dashboards so that
 * nearby search, mechanic tracking, and service requests have an accurate fix.
 *
 * Behaviour:
 *  - granted  → silently capture coords, unmount.
 *  - prompt   → show modal, "Enable Location" triggers browser prompt.
 *  - denied / error → show retry + browser-specific instructions.
 *  - in-app webview (Instagram / Facebook / …) → offer "Open in Safari/Chrome".
 *  - re-checks every time the tab regains focus in case the user just
 *    changed the browser setting.
 */

type PermState = "checking" | "prompt" | "granted" | "denied" | "error" | "unsupported";

export default function LocationPermissionGate() {
  const [state, setState] = useState<PermState>("checking");
  const [requesting, setRequesting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inApp = detectInAppBrowser();

  const persist = (lat: number, lng: number) => {
    try {
      sessionStorage.setItem("user_coords", JSON.stringify({ lat, lng, ts: Date.now() }));
      localStorage.setItem("loc_permission_granted", "1");
      window.dispatchEvent(new CustomEvent("user-coords", { detail: { lat, lng } }));
    } catch {}
  };

  const captureCoords = () =>
    new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (p) => { persist(p.coords.latitude, p.coords.longitude); resolve(); },
        () => resolve(),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
      );
    });

  const evaluate = async () => {
    if (!("geolocation" in navigator)) { setState("unsupported"); return; }
    try {
      if ("permissions" in navigator) {
        const status = await (navigator as any).permissions.query({ name: "geolocation" });
        if (status.state === "granted") {
          await captureCoords();
          setState("granted");
        } else if (status.state === "denied") {
          setState("denied");
        } else {
          setState("prompt");
        }
        status.onchange = () => evaluate();
      } else {
        setState("prompt");
      }
    } catch {
      setState("prompt");
    }
  };

  useEffect(() => {
    evaluate();
    const onFocus = () => { if (state !== "granted") evaluate(); };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestPermission = () => {
    setRequesting(true);
    setErrorMsg(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setRequesting(false);
        persist(pos.coords.latitude, pos.coords.longitude);
        setState("granted");
        toast.success("Location enabled");
      },
      (err) => {
        setRequesting(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setState("denied");
            setErrorMsg(null);
            break;
          case err.POSITION_UNAVAILABLE:
            setState("error");
            setErrorMsg("Couldn't determine your position. Check GPS / network and try again.");
            break;
          case err.TIMEOUT:
            setState("error");
            setErrorMsg("Location request timed out. Move to an open area and try again.");
            break;
          default:
            setState("error");
            setErrorMsg("Couldn't get your location. Try again.");
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  };

  if (state === "granted" || state === "checking") return null;

  const deniedInstructions = isIOS()
    ? "iPhone Safari: Settings → Safari → Location → Allow. Then reload this page."
    : isAndroid()
      ? "Chrome Android: tap the lock icon in the address bar → Permissions → Location → Allow. Then reload."
      : "Desktop: click the lock icon in the address bar → Site settings → Location → Allow. Then reload.";

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-sm bg-background border border-border rounded-2xl p-6 shadow-2xl animate-scale-in">
        <div className="mx-auto h-16 w-16 rounded-full bg-primary/15 flex items-center justify-center mb-4">
          <MapPin className="h-8 w-8 text-primary" />
        </div>

        <h2 className="text-xl font-semibold text-center mb-2">Location Access Required</h2>
        <p className="text-sm text-muted-foreground text-center mb-4">
          To use After Brakes, location access is mandatory. Please enable location permission so we can:
        </p>

        <ul className="text-sm text-muted-foreground space-y-1.5 mb-4 pl-1">
          <li>• Find nearby mechanics</li>
          <li>• Track service requests accurately</li>
          <li>• Show your live location on the map</li>
          <li>• Improve service response times</li>
        </ul>

        {inApp && (
          <div className="flex items-start gap-2 text-xs text-warning bg-warning/10 rounded-md p-2 mb-3">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>
              Location is often blocked inside {inApp.charAt(0).toUpperCase() + inApp.slice(1)}.
              Open After Brakes in {isIOS() ? "Safari" : "Chrome"} to continue.
            </span>
          </div>
        )}

        {state === "denied" && (
          <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 rounded-md p-3 mb-3">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium mb-1">Location access is required to continue.</p>
              <p>{deniedInstructions}</p>
            </div>
          </div>
        )}

        {state === "error" && errorMsg && (
          <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 rounded-md p-2 mb-3">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {state === "unsupported" && (
          <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 rounded-md p-2 mb-3">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>Your browser doesn't support location. Please use a modern browser like Chrome or Safari.</span>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {inApp ? (
            <Button onClick={() => openInExternalBrowser()} className="w-full" size="lg">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in {isIOS() ? "Safari" : isAndroid() ? "Chrome" : "Browser"}
            </Button>
          ) : state === "denied" ? (
            <>
              <Button onClick={() => window.location.reload()} className="w-full" size="lg">
                <RotateCw className="h-4 w-4 mr-2" />
                Reload after enabling
              </Button>
              <Button onClick={requestPermission} variant="outline" disabled={requesting} className="w-full">
                {requesting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RotateCw className="h-4 w-4 mr-2" />}
                Retry
              </Button>
            </>
          ) : state === "error" ? (
            <Button onClick={requestPermission} disabled={requesting} className="w-full" size="lg">
              {requesting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RotateCw className="h-4 w-4 mr-2" />}
              Retry
            </Button>
          ) : state === "unsupported" ? null : (
            <Button onClick={requestPermission} disabled={requesting} className="w-full" size="lg">
              {requesting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MapPin className="h-4 w-4 mr-2" />}
              Enable Location
            </Button>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground text-center mt-4">
          Without location access, core features will not function.
        </p>
      </div>
    </div>
  );
}
