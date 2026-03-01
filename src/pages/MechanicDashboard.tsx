import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Car, Sparkles, MapPin, AlertTriangle, IndianRupee, MessageCircle, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

const mockIssues = [
  {
    id: 1, vehicleType: "Hyundai i20", summary: "Unusual brake noise when stopping",
    aiIssue: "Worn brake pads", priceRange: "₹800 – ₹1500", area: "Velachery", pincode: "600042",
  },
  {
    id: 2, vehicleType: "Honda City", summary: "Engine overheating in traffic",
    aiIssue: "Coolant leak / thermostat issue", priceRange: "₹1000 – ₹3000", area: "Adyar", pincode: "600020",
  },
  {
    id: 3, vehicleType: "TVS Apache", summary: "Chain making rattling noise",
    aiIssue: "Chain slack / sprocket wear", priceRange: "₹400 – ₹900", area: "T. Nagar", pincode: "600017",
  },
];

const MechanicDashboard = () => {
  const [respondingTo, setRespondingTo] = useState<number | null>(null);
  const [quote, setQuote] = useState("");
  const [message, setMessage] = useState("");
  const [availability, setAvailability] = useState("");

  const handleSubmitResponse = (issueId: number) => {
    if (!quote) { toast.error("Enter your price quote"); return; }
    toast.success("Response submitted!");
    setRespondingTo(null);
    setQuote("");
    setMessage("");
    setAvailability("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="mechanic" onLogout={() => window.location.href = "/login"} />
      <div className="container max-w-2xl py-6 px-4 space-y-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary" /> Nearby Issues
        </h2>

        {mockIssues.map((issue) => (
          <div key={issue.id} className="bg-card rounded-xl border border-border p-5 animate-slide-up">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Car className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{issue.vehicleType}</h3>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {issue.area}
                  </span>
                </div>
              </div>
              <span className="text-xs bg-secondary px-2 py-1 rounded text-muted-foreground">{issue.priceRange}</span>
            </div>
            <p className="text-sm text-foreground mb-2">{issue.summary}</p>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs text-primary font-medium">AI: {issue.aiIssue}</span>
            </div>

            {respondingTo === issue.id ? (
              <div className="space-y-3 bg-secondary rounded-lg p-4 mt-2 animate-fade-in">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Price Quote (₹)</label>
                  <Input value={quote} onChange={(e) => setQuote(e.target.value.replace(/\D/g, ""))} placeholder="1500" className="bg-card border-0" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Availability</label>
                  <Input value={availability} onChange={(e) => setAvailability(e.target.value)} placeholder="30 minutes" className="bg-card border-0" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Message (optional)</label>
                  <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Add a note..." className="bg-card border-0 min-h-[60px]" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleSubmitResponse(issue.id)}>
                    <Send className="h-3 w-3 mr-1" /> Submit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setRespondingTo(null)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setRespondingTo(issue.id)} className="mt-1">
                <MessageCircle className="h-3 w-3 mr-1" /> Respond
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MechanicDashboard;
