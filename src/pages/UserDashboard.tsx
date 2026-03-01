import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Upload, Sparkles, Star, MapPin, MessageCircle, Clock, IndianRupee, Loader2 } from "lucide-react";
import { toast } from "sonner";

const mockMechanics = [
  { id: 1, name: "Kumar Auto Works", area: "Velachery", rating: 4.8, quote: 1500, eta: "30 min", photo: null },
  { id: 2, name: "Sri Ganesh Motors", area: "Adyar", rating: 4.5, quote: 1200, eta: "45 min", photo: null },
  { id: 3, name: "Royal Garage", area: "T. Nagar", rating: 4.9, quote: 1800, eta: "20 min", photo: null },
];

const UserDashboard = () => {
  const [issueText, setIssueText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<null | { issue: string; part: string; severity: string }>(null);
  const [showMechanics, setShowMechanics] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = () => {
    if (!issueText.trim() && !image) {
      toast.error("Describe your issue or upload an image");
      return;
    }
    setAnalyzing(true);
    // TODO: Call AI edge function
    setTimeout(() => {
      setAnalysis({
        issue: "Brake pad wear detected",
        part: "Front Brake Pads",
        severity: "Medium",
      });
      setShowMechanics(true);
      setAnalyzing(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="user" onLogout={() => window.location.href = "/login"} />
      <div className="container max-w-2xl py-6 px-4 space-y-6">
        {/* Upload Issue */}
        <section className="bg-card rounded-xl border border-border p-5 animate-slide-up">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" /> Report an Issue
          </h2>
          <Textarea
            value={issueText}
            onChange={(e) => setIssueText(e.target.value)}
            placeholder="Describe your vehicle issue..."
            className="bg-secondary border-0 mb-3 min-h-[80px]"
          />
          <div className="flex gap-3 items-center mb-4">
            <label className="cursor-pointer">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-muted-foreground text-sm hover:text-primary transition-colors">
                <Camera className="h-4 w-4" /> {image ? "Change Photo" : "Add Photo"}
              </div>
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
            </label>
            {image && (
              <img src={image} alt="Issue" className="h-12 w-12 rounded-lg object-cover border border-border" />
            )}
          </div>
          <Button className="w-full" onClick={handleAnalyze} disabled={analyzing}>
            {analyzing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            {analyzing ? "Analyzing..." : "Analyze with AI"}
          </Button>
        </section>

        {/* AI Analysis */}
        {analysis && (
          <section className="bg-card rounded-xl border border-primary/30 p-5 animate-slide-up glow-primary">
            <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> AI Analysis
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-secondary rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Issue</p>
                <p className="text-sm font-medium text-foreground">{analysis.issue}</p>
              </div>
              <div className="bg-secondary rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Part</p>
                <p className="text-sm font-medium text-foreground">{analysis.part}</p>
              </div>
              <div className="bg-secondary rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Severity</p>
                <p className={`text-sm font-medium ${
                  analysis.severity === "High" ? "text-destructive" : 
                  analysis.severity === "Medium" ? "text-warning" : "text-success"
                }`}>
                  {analysis.severity}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Mechanic Responses */}
        {showMechanics && (
          <section className="space-y-3 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              Recommended Mechanics
            </h2>
            {mockMechanics.map((m) => (
              <div key={m.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4 hover:border-primary/50 transition-colors">
                <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center text-primary font-bold text-lg">
                  {m.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-sm">{m.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{m.area}</span>
                    <span className="flex items-center gap-1"><Star className="h-3 w-3 text-warning" />{m.rating}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{m.eta}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-foreground font-semibold text-sm flex items-center gap-0.5">
                    <IndianRupee className="h-3 w-3" />{m.quote}
                  </p>
                  <Button size="sm" variant="outline" className="mt-1 text-xs h-7">
                    <MessageCircle className="h-3 w-3 mr-1" /> Chat
                  </Button>
                </div>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
