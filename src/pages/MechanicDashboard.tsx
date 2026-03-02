import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Car, Sparkles, MapPin, AlertTriangle, IndianRupee, MessageCircle, Send, Loader2, Phone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import ChatDialog from "@/components/ChatDialog";

const MechanicDashboard = () => {
  const { user, mechanicProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [issues, setIssues] = useState<any[]>([]);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [quote, setQuote] = useState("");
  const [message, setMessage] = useState("");
  const [availability, setAvailability] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [chatIssueId, setChatIssueId] = useState<string | null>(null);
  const [chatUserId, setChatUserId] = useState<string | null>(null);
  const [phoneConsents, setPhoneConsents] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user && mechanicProfile) {
      loadIssues();
      loadPhoneConsents();
    }
  }, [user, mechanicProfile]);

  const loadIssues = async () => {
    // Load open issues matching mechanic's pincode
    const { data } = await supabase
      .from("issues")
      .select("*, vehicles(*), profiles:user_id(name, area, phone)")
      .eq("status", "open")
      .eq("pincode", mechanicProfile?.pincode || "")
      .order("created_at", { ascending: false });
    setIssues(data || []);
  };

  const loadPhoneConsents = async () => {
    const { data } = await supabase
      .from("phone_share_consents")
      .select("issue_id, user_id, profiles:user_id(phone)")
      .eq("mechanic_id", user!.id)
      .eq("granted", true);
    
    const consents: Record<string, string> = {};
    data?.forEach((c: any) => {
      consents[c.issue_id] = c.profiles?.phone || "";
    });
    setPhoneConsents(consents);
  };

  const handleSubmitResponse = async (issueId: string) => {
    if (!quote) { toast.error("Enter your price quote"); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("mechanic_responses").insert({
        issue_id: issueId,
        mechanic_id: user!.id,
        price_quote: parseInt(quote),
        message: message || null,
        availability: availability || null,
      });
      if (error) throw error;
      toast.success("Response submitted!");
      setRespondingTo(null);
      setQuote("");
      setMessage("");
      setAvailability("");
    } catch (e: any) {
      toast.error(e.message || "Failed to submit response");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="mechanic" onLogout={handleLogout} />
      <div className="container max-w-2xl py-6 px-4 space-y-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary" /> Nearby Issues ({issues.length})
        </h2>

        {issues.length === 0 && (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <p className="text-muted-foreground">No open issues in your area ({mechanicProfile?.pincode})</p>
          </div>
        )}

        {issues.map((issue: any) => (
          <div key={issue.id} className="bg-card rounded-xl border border-border p-5 animate-slide-up">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Car className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">
                    {issue.vehicles?.vehicle_brand} {issue.vehicles?.vehicle_model} ({issue.vehicles?.vehicle_type})
                  </h3>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {issue.area || issue.profiles?.area || "N/A"}
                  </span>
                </div>
              </div>
              {issue.ai_analysis && (
                <span className="text-xs bg-secondary px-2 py-1 rounded text-muted-foreground">
                  ₹{issue.ai_analysis.estimatedCostMin}-{issue.ai_analysis.estimatedCostMax}
                </span>
              )}
            </div>
            <p className="text-sm text-foreground mb-2">{issue.description}</p>
            {issue.image_url && (
              <img src={issue.image_url} alt="Issue" className="w-full h-32 object-cover rounded-lg mb-2" />
            )}
            {issue.ai_analysis && (
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-xs text-primary font-medium">AI: {issue.ai_analysis.issue}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  issue.ai_analysis.severity === "High" ? "bg-destructive/20 text-destructive" :
                  issue.ai_analysis.severity === "Medium" ? "bg-warning/20 text-warning" : "bg-success/20 text-success"
                }`}>{issue.ai_analysis.severity}</span>
              </div>
            )}

            {/* Phone consent info */}
            {phoneConsents[issue.id] && (
              <div className="flex items-center gap-2 mb-3 bg-success/10 rounded-lg p-2">
                <Phone className="h-3 w-3 text-success" />
                <span className="text-xs text-success">User phone: +91 {phoneConsents[issue.id]}</span>
              </div>
            )}

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
                  <Button size="sm" onClick={() => handleSubmitResponse(issue.id)} disabled={submitting}>
                    {submitting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Send className="h-3 w-3 mr-1" />}
                    Submit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setRespondingTo(null)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 mt-1">
                <Button size="sm" variant="outline" onClick={() => setRespondingTo(issue.id)}>
                  <MessageCircle className="h-3 w-3 mr-1" /> Respond
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setChatIssueId(issue.id); setChatUserId(issue.user_id); }}>
                  <MessageCircle className="h-3 w-3 mr-1" /> Chat
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {chatIssueId && chatUserId && (
        <ChatDialog
          issueId={chatIssueId}
          otherUserId={chatUserId}
          currentUserId={user!.id}
          onClose={() => { setChatIssueId(null); setChatUserId(null); }}
        />
      )}
    </div>
  );
};

export default MechanicDashboard;
