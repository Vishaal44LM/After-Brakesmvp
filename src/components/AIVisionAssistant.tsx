import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Camera, FileText, Upload, Loader2, Sparkles, X, ShieldAlert,
  AlertTriangle, CheckCircle2, Info, CalendarDays, Wrench, Gauge, ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Mode = "image" | "document";

interface Analysis {
  is_valid: boolean;
  rejection_reason?: string;
  category: string;
  summary: string;
  severity: "Info" | "Low" | "Medium" | "High" | "Critical";
  explanation: string;
  recommended_actions: string[];
  important_dates?: { label: string; date: string }[];
  missing_information?: string[];
  vehicle_health_score?: number;
  maintenance_recommendations?: string[];
  urgent_warnings?: string[];
  safety_alerts?: string[];
  service_suggestions?: string[];
}

const severityStyle: Record<Analysis["severity"], { bg: string; text: string; Icon: any }> = {
  Info: { bg: "bg-primary/15", text: "text-primary", Icon: Info },
  Low: { bg: "bg-success/15", text: "text-success", Icon: CheckCircle2 },
  Medium: { bg: "bg-warning/15", text: "text-warning", Icon: AlertTriangle },
  High: { bg: "bg-destructive/15", text: "text-destructive", Icon: AlertTriangle },
  Critical: { bg: "bg-destructive/25", text: "text-destructive", Icon: ShieldAlert },
};

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

const AIVisionAssistant = () => {
  const [mode, setMode] = useState<Mode>("image");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);

  const pick = (m: Mode) => {
    setMode(m);
    setTimeout(() => (m === "image" ? imgRef : docRef).current?.click(), 0);
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 15 * 1024 * 1024) { toast.error("File must be under 15MB"); return; }
    setFile(f);
    setAnalysis(null);
    if (f.type.startsWith("image/")) {
      setPreview(await fileToDataUrl(f));
    } else {
      setPreview(null);
    }
  };

  const reset = () => { setFile(null); setPreview(null); setAnalysis(null); };

  const analyze = async () => {
    if (!file) { toast.error("Please upload a vehicle image or document first"); return; }
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const dataUrl = preview || (await fileToDataUrl(file));
      const { data, error } = await supabase.functions.invoke("analyze-vehicle-vision", {
        body: { fileBase64: dataUrl, fileName: file.name, mimeType: file.type, mode },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const a: Analysis = data.analysis;
      if (!a.is_valid) {
        toast.error(a.rejection_reason || `Please upload a valid vehicle ${mode}`);
      } else {
        setAnalysis(a);
        toast.success("Analysis complete");
      }
    } catch (e: any) {
      toast.error(e.message || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const sev = analysis ? severityStyle[analysis.severity] : null;

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="bg-card rounded-xl border border-border p-5 animate-slide-up">
        <div className="flex items-start gap-3 mb-4">
          <div className="h-11 w-11 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground">AI Vehicle Vision</h2>
            <p className="text-xs text-muted-foreground">Upload a vehicle image or automobile document — get instant diagnostics, insights and recommendations.</p>
          </div>
        </div>

        {/* Upload options */}
        {!file && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => pick("image")}
              className="group flex flex-col items-center gap-2 p-4 rounded-xl border border-dashed border-border bg-secondary/40 hover:border-primary hover:bg-primary/5 transition"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Camera className="h-5 w-5 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">Vehicle Image</p>
                <p className="text-[10px] text-muted-foreground">Dashboard, damage, tyres…</p>
              </div>
            </button>
            <button
              onClick={() => pick("document")}
              className="group flex flex-col items-center gap-2 p-4 rounded-xl border border-dashed border-border bg-secondary/40 hover:border-primary hover:bg-primary/5 transition"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">Vehicle Document</p>
                <p className="text-[10px] text-muted-foreground">RC, insurance, PUC…</p>
              </div>
            </button>
          </div>
        )}

        <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
        <input ref={docRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={onFile} />

        {/* File preview */}
        {file && (
          <div className="rounded-xl border border-border bg-secondary/40 p-3 animate-fade-in">
            <div className="flex items-start gap-3">
              {preview ? (
                <img src={preview} alt="preview" className="h-16 w-16 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{mode === "image" ? "Vehicle image" : "Automobile document"}</p>
                <p className="text-[10px] text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
              </div>
              <button onClick={reset} className="text-muted-foreground hover:text-destructive p-1"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex gap-2 mt-3">
              <Button className="flex-1" onClick={analyze} disabled={analyzing}>
                {analyzing ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Analyzing…</> : <><Sparkles className="h-4 w-4 mr-2" /> Analyze</>}
              </Button>
              <Button variant="outline" onClick={() => pick(mode)}><Upload className="h-4 w-4 mr-1" /> Replace</Button>
            </div>
          </div>
        )}
      </div>

      {/* Result Report Card */}
      {analysis && sev && (
        <div className="bg-card rounded-xl border border-border p-5 animate-slide-up space-y-4">
          {/* Header row */}
          <div className="flex items-start gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${sev.bg}`}>
              <sev.Icon className={`h-5 w-5 ${sev.text}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{analysis.category}</p>
              <h3 className="text-base font-semibold text-foreground leading-snug">{analysis.summary}</h3>
            </div>
            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${sev.bg} ${sev.text}`}>
              {analysis.severity}
            </span>
          </div>

          {/* Health score */}
          {mode === "image" && typeof analysis.vehicle_health_score === "number" && analysis.vehicle_health_score > 0 && (
            <div className="rounded-xl bg-secondary/50 border border-border p-3">
              <div className="flex items-center gap-2 mb-2">
                <Gauge className="h-4 w-4 text-primary" />
                <p className="text-xs font-semibold text-foreground">Vehicle Health Score</p>
                <span className="ml-auto text-sm font-bold text-foreground">{analysis.vehicle_health_score}/100</span>
              </div>
              <div className="h-2 rounded-full bg-background overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    analysis.vehicle_health_score >= 70 ? "bg-success" : analysis.vehicle_health_score >= 40 ? "bg-warning" : "bg-destructive"
                  }`}
                  style={{ width: `${analysis.vehicle_health_score}%` }}
                />
              </div>
            </div>
          )}

          {/* Explanation */}
          <div>
            <p className="text-xs font-semibold text-foreground mb-1">Explanation</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{analysis.explanation}</p>
          </div>

          {/* Urgent warnings & safety alerts */}
          {!!analysis.urgent_warnings?.length && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3">
              <p className="text-xs font-semibold text-destructive flex items-center gap-1.5 mb-1.5"><ShieldAlert className="h-3.5 w-3.5" /> Urgent Attention</p>
              <ul className="space-y-1 text-xs text-foreground list-disc list-inside">
                {analysis.urgent_warnings.map((w, i) => (<li key={i}>{w}</li>))}
              </ul>
            </div>
          )}
          {!!analysis.safety_alerts?.length && (
            <div className="rounded-xl border border-warning/40 bg-warning/10 p-3">
              <p className="text-xs font-semibold text-warning flex items-center gap-1.5 mb-1.5"><AlertTriangle className="h-3.5 w-3.5" /> Safety Alerts</p>
              <ul className="space-y-1 text-xs text-foreground list-disc list-inside">
                {analysis.safety_alerts.map((w, i) => (<li key={i}>{w}</li>))}
              </ul>
            </div>
          )}

          {/* Recommended actions */}
          {!!analysis.recommended_actions?.length && (
            <div>
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2"><ClipboardList className="h-3.5 w-3.5 text-primary" /> Recommended Actions</p>
              <ol className="space-y-1.5">
                {analysis.recommended_actions.map((a, i) => (
                  <li key={i} className="flex gap-2 text-sm text-foreground">
                    <span className="h-5 w-5 shrink-0 rounded-full bg-primary/15 text-primary text-[11px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                    <span className="flex-1">{a}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Important dates */}
          {!!analysis.important_dates?.length && (
            <div>
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2"><CalendarDays className="h-3.5 w-3.5 text-primary" /> Important Dates</p>
              <div className="grid grid-cols-2 gap-2">
                {analysis.important_dates.map((d, i) => (
                  <div key={i} className="rounded-lg bg-secondary/60 border border-border p-2">
                    <p className="text-[10px] uppercase text-muted-foreground">{d.label}</p>
                    <p className="text-xs font-semibold text-foreground">{d.date}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Missing info */}
          {!!analysis.missing_information?.length && (
            <div className="rounded-xl border border-border bg-secondary/40 p-3">
              <p className="text-xs font-semibold text-foreground mb-1.5">Missing Information</p>
              <ul className="space-y-1 text-xs text-muted-foreground list-disc list-inside">
                {analysis.missing_information.map((w, i) => (<li key={i}>{w}</li>))}
              </ul>
            </div>
          )}

          {/* Maintenance & service suggestions */}
          {(!!analysis.maintenance_recommendations?.length || !!analysis.service_suggestions?.length) && (
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-3">
              <p className="text-xs font-semibold text-primary flex items-center gap-1.5 mb-2"><Wrench className="h-3.5 w-3.5" /> Smart Insights</p>
              {!!analysis.maintenance_recommendations?.length && (
                <div className="mb-2">
                  <p className="text-[10px] uppercase text-muted-foreground mb-1">Maintenance</p>
                  <ul className="space-y-1 text-xs text-foreground list-disc list-inside">
                    {analysis.maintenance_recommendations.map((w, i) => (<li key={i}>{w}</li>))}
                  </ul>
                </div>
              )}
              {!!analysis.service_suggestions?.length && (
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground mb-1">Service Suggestions</p>
                  <ul className="space-y-1 text-xs text-foreground list-disc list-inside">
                    {analysis.service_suggestions.map((w, i) => (<li key={i}>{w}</li>))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default AIVisionAssistant;
