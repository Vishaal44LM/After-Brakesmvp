import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Copy, Check, MapPin, Bell, Zap, Smartphone, Map as MapIcon,
  ArrowRight, Instagram, Chrome, ExternalLink, HelpCircle, Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { detectInAppBrowser } from "@/lib/browserEnv";
import logo from "@/assets/logo.png";

const SITE_URL = "afterbrakes.vercel.app";

const benefits = [
  { icon: MapPin, title: "Accurate Live GPS", desc: "Precise real-time location tracking" },
  { icon: Bell, title: "Instant Notifications", desc: "Never miss a mechanic update" },
  { icon: Zap, title: "Faster Performance", desc: "Smooth, native-feel experience" },
  { icon: Smartphone, title: "Install to Home Screen", desc: "One-tap app launch" },
  { icon: MapIcon, title: "Better Maps Experience", desc: "Full interactive maps" },
];

const steps = [
  { n: 1, title: "Copy URL", desc: "Tap the copy button below" },
  { n: 2, title: "Open your browser", desc: "Safari, Chrome, Edge or Firefox" },
  { n: 3, title: "Paste the URL", desc: "Into the browser's address bar" },
  { n: 4, title: "Enjoy After Brakes", desc: "Full experience unlocked" },
];

/**
 * Premium, non-dismissible onboarding gate shown when After Brakes is
 * opened inside an in-app browser (Instagram / Facebook / Messenger).
 * The user must open the site in a real browser before continuing.
 */
export default function InAppBrowserGate() {
  const inApp = detectInAppBrowser();
  const [copied, setCopied] = useState(false);
  const [visibleBenefits, setVisibleBenefits] = useState(0);

  // Stagger benefit card entrance animation.
  useEffect(() => {
    if (!inApp) return;
    let cancelled = false;
    const step = (i: number) => {
      if (cancelled) return;
      setVisibleBenefits(i);
      if (i < benefits.length) setTimeout(() => step(i + 1), 140);
    };
    step(1);
    return () => { cancelled = true; };
  }, [inApp]);

  if (!inApp) return null;

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(SITE_URL);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = SITE_URL;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch {}
      document.body.removeChild(ta);
    }
    toast.success("Website URL copied successfully!");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const checkStillInApp = () => {
    if (detectInAppBrowser()) {
      toast.error("You're still inside " + inApp[0].toUpperCase() + inApp.slice(1) + ". Please open in your browser.");
    } else {
      window.location.reload();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[10000] bg-gradient-to-br from-background via-background to-primary/10 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      onTouchMove={(e) => e.stopPropagation()}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />

      <div className="relative min-h-full flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-md rounded-3xl border border-border/60 bg-card/70 backdrop-blur-2xl shadow-2xl p-6 animate-scale-in">

          {/* HERO — Instagram ➜ Browser ➜ After Brakes */}
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Instagram className="h-7 w-7 text-white" />
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground animate-pulse" />
            <div className="h-14 w-14 rounded-2xl bg-secondary border border-border flex items-center justify-center">
              <Chrome className="h-7 w-7 text-primary" />
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground animate-pulse" />
            <div className="h-14 w-14 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/20">
              <img src={logo} alt="After Brakes" className="h-8 w-8" />
            </div>
          </div>

          {/* Welcome */}
          <div className="text-center mb-5">
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="h-3 w-3" /> Welcome
            </div>
            <h2 className="font-brand text-2xl font-bold text-foreground mb-1.5">
              Open After Brakes in Your Browser
            </h2>
            <p className="text-sm text-muted-foreground">
              To unlock the complete After Brakes experience, open the website in your preferred browser.
            </p>
          </div>

          {/* Benefits — staggered */}
          <div className="grid grid-cols-2 gap-2 mb-5">
            {benefits.map((b, i) => {
              const Icon = b.icon;
              const shown = i < visibleBenefits;
              return (
                <div
                  key={b.title}
                  className={`rounded-xl border border-border/60 bg-secondary/40 p-3 transition-all duration-500 ${
                    shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                  }`}
                >
                  <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center mb-1.5">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-xs font-semibold text-foreground leading-tight">{b.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{b.desc}</p>
                </div>
              );
            })}
          </div>

          {/* URL Card */}
          <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-4 mb-5 shadow-inner">
            <p className="text-[10px] uppercase tracking-widest text-primary/80 font-bold mb-2">Website URL</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm font-mono text-foreground truncate font-semibold">{SITE_URL}</code>
              <Button
                size="sm"
                onClick={copyUrl}
                className={`rounded-xl transition-all ${copied ? "bg-success hover:bg-success text-success-foreground" : ""}`}
              >
                {copied ? (
                  <><Check className="h-3.5 w-3.5 mr-1 animate-scale-in" /> Copied</>
                ) : (
                  <><Copy className="h-3.5 w-3.5 mr-1" /> Copy</>
                )}
              </Button>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="mb-5">
            <p className="text-xs font-semibold text-foreground mb-3">How to continue</p>
            <div className="relative pl-3">
              <div className="absolute left-[13px] top-2 bottom-2 w-px bg-border" />
              {steps.map((s, i) => (
                <div key={s.n} className="relative flex gap-3 pb-3 last:pb-0 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="relative z-10 h-6 w-6 shrink-0 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center shadow-md shadow-primary/30">
                    {s.n}
                  </div>
                  <div className="flex-1 -mt-0.5">
                    <p className="text-xs font-semibold text-foreground">{s.title}</p>
                    <p className="text-[10px] text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Why? */}
          <div className="rounded-xl bg-secondary/60 border border-border/60 p-3 mb-5">
            <div className="flex items-start gap-2">
              <HelpCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-foreground mb-0.5">Why do I need to do this?</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Instagram's built-in browser limits GPS, notifications, maps, and app installation.
                  Opening After Brakes in your preferred browser unlocks the complete experience.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button className="w-full h-11 rounded-xl text-sm font-semibold" onClick={copyUrl}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Website URL
            </Button>
            <Button variant="outline" className="w-full h-11 rounded-xl text-sm" onClick={checkStillInApp}>
              <ExternalLink className="h-4 w-4 mr-2" />
              I've Opened It in My Browser
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
