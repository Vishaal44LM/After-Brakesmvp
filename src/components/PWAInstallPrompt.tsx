import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Share, MoreVertical, Smartphone, Zap, Bell, MapPin } from "lucide-react";
import { isAndroid, isIOS } from "@/lib/browserEnv";

type Platform = "ios" | "android" | "desktop";

const STORAGE_KEY = "ab_pwa_prompt_v1";

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as any).standalone === true
  );
}

function detectPlatform(): Platform {
  if (isIOS()) return "ios";
  if (isAndroid()) return "android";
  return "desktop";
}

/**
 * Onboarding popup shown once per user (per browser) encouraging
 * the install of After Brakes as a PWA. Triggers the native
 * beforeinstallprompt where supported (Android Chrome, Desktop
 * Chrome/Edge) and shows manual instructions on iOS Safari.
 */
export default function PWAInstallPrompt() {
  const [open, setOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const platform = detectPlatform();

  useEffect(() => {
    if (isStandalone()) return;
    const status = localStorage.getItem(STORAGE_KEY);
    if (status === "installed" || status === "never") return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler as any);

    // Slight delay so it doesn't compete with dashboard load animation
    const t = window.setTimeout(() => setOpen(true), 1200);

    const installedHandler = () => {
      localStorage.setItem(STORAGE_KEY, "installed");
      setOpen(false);
    };
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler as any);
      window.removeEventListener("appinstalled", installedHandler);
      window.clearTimeout(t);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice?.outcome === "accepted") {
          localStorage.setItem(STORAGE_KEY, "installed");
          setOpen(false);
        }
        setDeferredPrompt(null);
      } catch {
        /* ignore */
      }
    }
    // iOS / fallback: instructions stay visible; user follows them manually.
  };

  const handleLater = () => {
    localStorage.setItem(STORAGE_KEY, "later");
    setOpen(false);
  };

  const handleNever = () => {
    localStorage.setItem(STORAGE_KEY, "never");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleLater(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center mb-2">
            <Smartphone className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-center">Install After Brakes</DialogTitle>
          <DialogDescription className="text-center">
            Get the best experience by adding After Brakes to your Home Screen.
          </DialogDescription>
        </DialogHeader>

        <ul className="text-xs text-muted-foreground space-y-1.5 px-1">
          <li className="flex items-center gap-2"><Zap className="h-3.5 w-3.5 text-primary" /> Faster access during vehicle emergencies</li>
          <li className="flex items-center gap-2"><Smartphone className="h-3.5 w-3.5 text-primary" /> App-like full-screen experience</li>
          <li className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-primary" /> Improved location tracking</li>
          <li className="flex items-center gap-2"><Bell className="h-3.5 w-3.5 text-primary" /> Better notifications</li>
        </ul>

        {platform === "ios" && (
          <div className="rounded-md border border-border bg-secondary/40 p-3 text-xs space-y-1.5">
            <p className="font-medium text-foreground">Add to Home Screen (Safari)</p>
            <p className="text-muted-foreground flex items-center gap-1.5">
              1. Tap the <Share className="inline h-3.5 w-3.5" /> Share button
            </p>
            <p className="text-muted-foreground">2. Scroll down and tap <strong>Add to Home Screen</strong></p>
            <p className="text-muted-foreground">3. Tap <strong>Add</strong></p>
          </div>
        )}

        {platform === "android" && !deferredPrompt && (
          <div className="rounded-md border border-border bg-secondary/40 p-3 text-xs space-y-1.5">
            <p className="font-medium text-foreground">Install App (Chrome)</p>
            <p className="text-muted-foreground flex items-center gap-1.5">
              1. Tap the browser menu <MoreVertical className="inline h-3.5 w-3.5" />
            </p>
            <p className="text-muted-foreground">2. Select <strong>Install app</strong> or <strong>Add to Home Screen</strong></p>
            <p className="text-muted-foreground">3. Confirm installation</p>
          </div>
        )}

        {platform === "desktop" && !deferredPrompt && (
          <div className="rounded-md border border-border bg-secondary/40 p-3 text-xs space-y-1.5">
            <p className="font-medium text-foreground">Install on Desktop</p>
            <p className="text-muted-foreground">Click the install icon in the address bar to install After Brakes as a desktop app.</p>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-col gap-2">
          {deferredPrompt ? (
            <Button onClick={handleInstall} className="w-full">
              <Download className="h-4 w-4 mr-2" /> Install Now
            </Button>
          ) : (
            <Button onClick={() => setOpen(false)} className="w-full">
              Got it
            </Button>
          )}
          <div className="flex w-full gap-2">
            <Button variant="ghost" onClick={handleLater} className="flex-1">Maybe Later</Button>
            <Button variant="ghost" onClick={handleNever} className="flex-1 text-muted-foreground">Don't show again</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
