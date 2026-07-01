import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, AlertTriangle, Smartphone } from "lucide-react";
import { detectInAppBrowser, isAndroid, isIOS, openInExternalBrowser } from "@/lib/browserEnv";

/**
 * Non-dismissible full-screen popup shown when After Brakes is opened
 * inside an in-app browser (Instagram / Facebook / Messenger / …).
 *
 * The user can either:
 *   - "I Opened It In Browser" → hides the gate for this session
 *   - "Continue Anyway"        → hides the gate for this session
 *
 * We don't auto-redirect — many in-app browsers block that, and it just
 * confuses the user. We simply guide them to open in Safari / Chrome.
 */
export default function InAppBrowserGate() {
  const inApp = detectInAppBrowser();
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem("ab_inapp_gate_ack") === "1";
    } catch {
      return false;
    }
  });

  if (!inApp || dismissed) return null;

  const ack = () => {
    try { sessionStorage.setItem("ab_inapp_gate_ack", "1"); } catch {}
    setDismissed(true);
  };

  const brand = inApp.charAt(0).toUpperCase() + inApp.slice(1);
  const iphone = isIOS();
  const android = isAndroid();

  return (
    <div
      className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-sm bg-background border border-border rounded-2xl p-6 shadow-2xl animate-scale-in">
        <div className="mx-auto h-16 w-16 rounded-full bg-warning/15 flex items-center justify-center mb-4">
          <Smartphone className="h-8 w-8 text-warning" />
        </div>

        <h2 className="text-xl font-semibold text-center mb-2">
          Open After Brakes in Your Browser
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-4">
          For accurate GPS tracking, notifications, map functionality, and a
          better experience, open After Brakes in your device's browser.
        </p>

        <div className="text-xs text-muted-foreground bg-secondary rounded-md p-3 mb-4 space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-warning flex-shrink-0 mt-0.5" />
            <span>Detected inside <strong>{brand}</strong> in-app browser.</span>
          </div>
          {iphone && (
            <ol className="list-decimal list-inside space-y-0.5 pl-1">
              <li>Tap the menu (⋯) in the top-right corner.</li>
              <li>Select <strong>"Open in Safari"</strong>.</li>
              <li>Return to After Brakes.</li>
            </ol>
          )}
          {android && (
            <ol className="list-decimal list-inside space-y-0.5 pl-1">
              <li>Tap the menu (⋮).</li>
              <li>Select <strong>"Open in Browser"</strong> or <strong>"Open in Chrome"</strong>.</li>
              <li>Return to After Brakes.</li>
            </ol>
          )}
          {!iphone && !android && (
            <p>Copy the link and open it in Chrome, Safari, Edge, or Firefox.</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={() => openInExternalBrowser()} className="w-full" size="lg">
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in {iphone ? "Safari" : android ? "Chrome" : "Browser"}
          </Button>
          <Button onClick={ack} variant="outline" className="w-full">
            I Opened It In Browser
          </Button>
          <Button onClick={ack} variant="ghost" className="w-full text-muted-foreground">
            Continue Anyway
          </Button>
        </div>
      </div>
    </div>
  );
}
