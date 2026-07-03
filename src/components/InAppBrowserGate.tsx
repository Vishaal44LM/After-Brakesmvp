import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Smartphone, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { detectInAppBrowser } from "@/lib/browserEnv";

const SITE_URL = "afterbrakes.vercel.app";

/**
 * Non-dismissible full-screen blocker shown when After Brakes is opened
 * inside Instagram's in-app browser (or Facebook / Messenger — same class
 * of restrictive webview). The user must copy the URL and open it in a
 * real browser before they can use the app.
 */
export default function InAppBrowserGate() {
  const inApp = detectInAppBrowser();
  const [copied, setCopied] = useState(false);

  if (!inApp) return null;

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(SITE_URL);
      toast.success("Website URL copied successfully.");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older webviews
      const ta = document.createElement("textarea");
      ta.value = SITE_URL;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); toast.success("Website URL copied successfully."); }
      catch { toast.error("Copy failed — long-press the URL to copy manually."); }
      document.body.removeChild(ta);
    }
  };

  const brand = inApp.charAt(0).toUpperCase() + inApp.slice(1);

  return (
    <div
      className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div className="w-full max-w-sm bg-background border border-border rounded-2xl p-6 shadow-2xl animate-scale-in">
        <div className="mx-auto h-16 w-16 rounded-full bg-warning/15 flex items-center justify-center mb-4">
          <Smartphone className="h-8 w-8 text-warning" />
        </div>

        <h2 className="text-xl font-semibold text-center mb-2">
          Open After Brakes in Your Browser
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-4">
          For the best experience, After Brakes must be opened in your device's browser.
          <br /><br />
          {brand}'s in-app browser restricts important features such as:
        </p>

        <ul className="text-xs text-muted-foreground space-y-1 mb-4 pl-1">
          <li>• Accurate GPS tracking</li>
          <li>• Real-time location updates</li>
          <li>• Notifications</li>
          <li>• Home Screen installation</li>
          <li>• Overall performance</li>
        </ul>

        <div className="rounded-lg border border-border bg-secondary p-3 mb-4">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Website URL</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm font-mono text-foreground truncate">{SITE_URL}</code>
            <Button size="sm" variant={copied ? "secondary" : "default"} onClick={copyUrl}>
              <Copy className="h-3.5 w-3.5 mr-1" />
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground bg-secondary/60 rounded-md p-3 space-y-1.5">
          <div className="flex items-start gap-2 text-warning">
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
            <span className="font-medium">How to continue</span>
          </div>
          <ol className="list-decimal list-inside space-y-0.5 pl-1">
            <li>Copy the website URL above.</li>
            <li>Open your preferred browser (Safari, Chrome, Edge, Firefox).</li>
            <li>Paste the URL into the address bar.</li>
            <li>Continue using After Brakes with full functionality.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
