import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Upload, Sparkles, Star, MapPin, MessageCircle, Clock, IndianRupee, Loader2, Send, Check, Phone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import ChatDialog from "@/components/ChatDialog";

const UserDashboard = () => {
  const { user, profile, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const [issueText, setIssueText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [responses, setResponses] = useState<any[]>([]);
  const [currentIssueId, setCurrentIssueId] = useState<string | null>(null);
  const [pastIssues, setPastIssues] = useState<any[]>([]);
  const [showPast, setShowPast] = useState(false);
  const [chatIssueId, setChatIssueId] = useState<string | null>(null);
  const [chatMechanicId, setChatMechanicId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadVehicles();
      loadPastIssues();
    }
  }, [user]);

  useEffect(() => {
    if (currentIssueId) loadResponses(currentIssueId);
  }, [currentIssueId]);

  const loadVehicles = async () => {
    const { data } = await supabase.from("vehicles").select("*").eq("user_id", user!.id);
    setVehicles(data || []);
    if (data && data.length > 0) setSelectedVehicle(data[0].id);
  };

  const loadPastIssues = async () => {
    const { data } = await supabase.from("issues").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
    setPastIssues(data || []);
  };

  const loadResponses = async (issueId: string) => {
    const { data } = await supabase
      .from("mechanic_responses")
      .select("*, mechanic_profiles:mechanic_id(garage_name, garage_photo_url, area, rating)")
      .eq("issue_id", issueId);
    setResponses(data || []);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !user) return null;
    const ext = imageFile.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("issue-images").upload(path, imageFile);
    if (error) throw error;
    const { data } = supabase.storage.from("issue-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmitDirect = async () => {
    if (!issueText.trim() && !imageFile) {
      toast.error("Describe your issue or upload an image");
      return;
    }
    if (!selectedVehicle) { toast.error("Select a vehicle"); return; }
    
    setSubmitting(true);
    try {
      let imageUrl = await uploadImage();

      const { data: issue, error } = await supabase.from("issues").insert({
        user_id: user!.id,
        vehicle_id: selectedVehicle,
        description: issueText,
        image_url: imageUrl,
        pincode: profile?.pincode,
        area: profile?.area,
        status: "open",
      }).select().single();

      if (error) throw error;
      setCurrentIssueId(issue.id);
      toast.success("Issue submitted! Mechanics will be notified.");
      loadPastIssues();
    } catch (e: any) {
      toast.error(e.message || "Failed to submit issue");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnalyze = async () => {
    if (!issueText.trim() && !imageFile) {
      toast.error("Describe your issue or upload an image");
      return;
    }
    setAnalyzing(true);
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      // First verify image if provided
      if (imageUrl) {
        const { data: verifyData, error: verifyError } = await supabase.functions.invoke("analyze-issue", {
          body: { imageUrl, action: "verify-image" },
        });
        if (verifyError) throw verifyError;
        if (verifyData?.analysis?.isVehicleImage === false) {
          toast.error("Please upload a valid vehicle-related image");
          setAnalyzing(false);
          return;
        }
      }

      // Analyze issue
      const { data, error } = await supabase.functions.invoke("analyze-issue", {
        body: { description: issueText, imageUrl, action: "analyze" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setAnalysis(data.analysis);

      // Save issue with AI analysis
      if (!selectedVehicle) { toast.error("Select a vehicle"); setAnalyzing(false); return; }
      
      const { data: issue, error: issueError } = await supabase.from("issues").insert({
        user_id: user!.id,
        vehicle_id: selectedVehicle,
        description: issueText,
        image_url: imageUrl,
        ai_analysis: data.analysis,
        pincode: profile?.pincode,
        area: profile?.area,
        status: "open",
      }).select().single();

      if (issueError) throw issueError;
      setCurrentIssueId(issue.id);
      toast.success("AI analysis complete! Issue submitted to mechanics.");
      loadPastIssues();
    } catch (e: any) {
      toast.error(e.message || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAcceptQuote = async (responseId: string, mechanicId: string) => {
    try {
      await supabase.from("mechanic_responses").update({ status: "accepted" }).eq("id", responseId);
      await supabase.from("issues").update({ status: "confirmed" }).eq("id", currentIssueId);
      toast.success("Quote accepted!");
      loadResponses(currentIssueId!);
    } catch (e: any) {
      toast.error("Failed to accept quote");
    }
  };

  const handleSharePhone = async (mechanicId: string) => {
    if (!currentIssueId) return;
    try {
      await supabase.from("phone_share_consents").upsert({
        issue_id: currentIssueId,
        user_id: user!.id,
        mechanic_id: mechanicId,
        granted: true,
      });
      toast.success("Phone number shared with mechanic");
    } catch (e: any) {
      toast.error("Failed to share phone number");
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="user" onLogout={handleLogout} />
      <div className="container max-w-2xl py-6 px-4 space-y-6">
        {/* Upload Issue */}
        <section className="bg-card rounded-xl border border-border p-5 animate-slide-up">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" /> Report an Issue
          </h2>

          {vehicles.length > 0 && (
            <div className="mb-3">
              <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                <SelectTrigger className="bg-secondary border-0">
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.vehicle_brand} {v.vehicle_model} ({v.vehicle_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Textarea
            value={issueText}
            onChange={(e) => setIssueText(e.target.value)}
            placeholder="Describe your vehicle issue..."
            className="bg-secondary border-0 mb-3 min-h-[80px]"
          />
          <div className="flex gap-3 items-center mb-4">
            <label className="cursor-pointer">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-muted-foreground text-sm hover:text-primary transition-colors">
                <Camera className="h-4 w-4" /> {imagePreview ? "Change Photo" : "Add Photo"}
              </div>
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
            </label>
            {imagePreview && (
              <img src={imagePreview} alt="Issue" className="h-12 w-12 rounded-lg object-cover border border-border" />
            )}
          </div>
          <div className="flex gap-3">
            <Button className="flex-1" onClick={handleSubmitDirect} disabled={submitting || analyzing}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Submit
            </Button>
            <Button className="flex-1" variant="outline" onClick={handleAnalyze} disabled={analyzing || submitting}>
              {analyzing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              AI Analysis
            </Button>
          </div>
        </section>

        {/* AI Analysis */}
        {analysis && (
          <section className="bg-card rounded-xl border border-primary/30 p-5 animate-slide-up glow-primary">
            <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> AI Analysis
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Issue</p>
                <p className="text-sm font-medium text-foreground">{analysis.issue || "N/A"}</p>
              </div>
              <div className="bg-secondary rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Affected Part</p>
                <p className="text-sm font-medium text-foreground">{analysis.part || "N/A"}</p>
              </div>
              <div className="bg-secondary rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Severity</p>
                <p className={`text-sm font-medium ${
                  analysis.severity === "High" ? "text-destructive" :
                  analysis.severity === "Medium" ? "text-warning" : "text-success"
                }`}>{analysis.severity || "N/A"}</p>
              </div>
              <div className="bg-secondary rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Est. Cost</p>
                <p className="text-sm font-medium text-foreground">
                  ₹{analysis.estimatedCostMin || "?"} - ₹{analysis.estimatedCostMax || "?"}
                </p>
              </div>
            </div>
            {analysis.recommendation && (
              <p className="text-sm text-muted-foreground mt-3 bg-secondary rounded-lg p-3">{analysis.recommendation}</p>
            )}
          </section>
        )}

        {/* Mechanic Responses */}
        {responses.length > 0 && (
          <section className="space-y-3 animate-slide-up">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              Mechanic Responses
            </h2>
            {responses.map((r: any) => (
              <div key={r.id} className="bg-card rounded-xl border border-border p-4 flex flex-col gap-3 hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                    {r.mechanic_profiles?.garage_photo_url ? (
                      <img src={r.mechanic_profiles.garage_photo_url} alt="Garage" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-primary font-bold text-lg">{r.mechanic_profiles?.garage_name?.[0] || "M"}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm">{r.mechanic_profiles?.garage_name || "Unknown Garage"}</h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{r.mechanic_profiles?.area || "N/A"}</span>
                      <span className="flex items-center gap-1"><Star className="h-3 w-3 text-warning" />{r.mechanic_profiles?.rating || "New"}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{r.availability || "N/A"}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-foreground font-semibold text-sm flex items-center gap-0.5">
                      <IndianRupee className="h-3 w-3" />{r.price_quote}
                    </p>
                  </div>
                </div>
                {r.message && <p className="text-sm text-muted-foreground">{r.message}</p>}
                <div className="flex gap-2 flex-wrap">
                  {r.status === "pending" && (
                    <Button size="sm" onClick={() => handleAcceptQuote(r.id, r.mechanic_id)}>
                      <Check className="h-3 w-3 mr-1" /> Accept
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => { setChatIssueId(currentIssueId); setChatMechanicId(r.mechanic_id); }}>
                    <MessageCircle className="h-3 w-3 mr-1" /> Chat
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleSharePhone(r.mechanic_id)}>
                    <Phone className="h-3 w-3 mr-1" /> Share Phone
                  </Button>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Past Issues */}
        <section>
          <Button variant="ghost" onClick={() => setShowPast(!showPast)} className="w-full justify-start text-muted-foreground">
            {showPast ? "Hide" : "View"} Past Issues ({pastIssues.length})
          </Button>
          {showPast && pastIssues.length > 0 && (
            <div className="space-y-2 mt-2">
              {pastIssues.map((issue: any) => (
                <div
                  key={issue.id}
                  className="bg-card rounded-lg border border-border p-3 cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => { setCurrentIssueId(issue.id); setAnalysis(issue.ai_analysis); }}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-foreground truncate flex-1">{issue.description || "No description"}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ml-2 ${
                      issue.status === "open" ? "bg-warning/20 text-warning" :
                      issue.status === "confirmed" ? "bg-success/20 text-success" : "bg-secondary text-muted-foreground"
                    }`}>{issue.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(issue.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Chat Dialog */}
      {chatIssueId && chatMechanicId && (
        <ChatDialog
          issueId={chatIssueId}
          otherUserId={chatMechanicId}
          currentUserId={user!.id}
          onClose={() => { setChatIssueId(null); setChatMechanicId(null); }}
        />
      )}
    </div>
  );
};

export default UserDashboard;
