import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Camera, Upload, Sparkles, Star, MapPin, MessageCircle, Clock, IndianRupee,
  Loader2, Send, Bot, User, Check, Phone, Car, Edit2, Plus, Trash2, Save, Hash
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { chennaiAreas } from "@/data/chennaiAreas";

const vehicleTypes = ["Car", "Bike", "Scooter", "Auto", "Truck", "Bus", "Van"];
const fuelTypes = ["Petrol", "Diesel", "Electric", "CNG", "Hybrid"];
const transmissions = ["Manual", "Automatic", "CVT", "DCT", "AMT"];

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, refreshProfile } = useAuth();

  // Report Issue State
  const [issueText, setIssueText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  // AI Chat State
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Mechanic Responses
  const [issues, setIssues] = useState<any[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);

  // Profile State
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [editName, setEditName] = useState(profile?.name || "");
  const [editArea, setEditArea] = useState(profile?.area || "");
  const [editPincode, setEditPincode] = useState(profile?.pincode || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ vehicle_type: "", vehicle_brand: "", vehicle_model: "", vehicle_year: "", fuel_type: "", transmission: "" });
  const [addingVehicle, setAddingVehicle] = useState(false);

  useEffect(() => {
    if (profile) {
      setEditName(profile.name || "");
      setEditArea(profile.area || "");
      setEditPincode(profile.pincode || "");
    }
  }, [profile]);

  useEffect(() => {
    if (user) {
      fetchVehicles();
      fetchIssues();
    }
  }, [user]);

  const fetchVehicles = async () => {
    if (!user) return;
    const { data } = await supabase.from("vehicles").select("*").eq("user_id", user.id);
    setVehicles(data || []);
  };

  const fetchIssues = async () => {
    if (!user) return;
    setLoadingResponses(true);
    const { data: issuesData } = await supabase
      .from("issues")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setIssues(issuesData || []);

    if (issuesData && issuesData.length > 0) {
      const issueIds = issuesData.map((i: any) => i.id);
      const { data: respData } = await supabase
        .from("mechanic_responses")
        .select("*")
        .in("issue_id", issueIds);

      if (respData && respData.length > 0) {
        const mechIds = [...new Set(respData.map((r: any) => r.mechanic_id))];
        const { data: mechProfiles } = await supabase
          .from("mechanic_profiles")
          .select("*")
          .in("user_id", mechIds);

        const enriched = respData.map((r: any) => ({
          ...r,
          mechanic: mechProfiles?.find((m: any) => m.user_id === r.mechanic_id),
          issue: issuesData.find((i: any) => i.id === r.issue_id),
        }));
        setResponses(enriched);
      }
    }
    setLoadingResponses(false);
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

  const handleSubmitIssue = async () => {
    if (!issueText.trim() && !imageFile) {
      toast.error("Describe your issue or upload an image");
      return;
    }
    if (!user) return;

    setSubmitting(true);
    setAnalysis(null);
    try {
      let imageUrl: string | null = null;
      let imageBase64: string | null = null;

      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const filePath = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("issue-images").upload(filePath, imageFile);
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from("issue-images").getPublicUrl(filePath);
        imageUrl = urlData.publicUrl;
        imageBase64 = imagePreview;
      }

      const vehicle = vehicles.find((v: any) => v.id === selectedVehicle);
      const vehicleInfo = vehicle ? `${vehicle.vehicle_type} ${vehicle.vehicle_brand || ""} ${vehicle.vehicle_model || ""} ${vehicle.vehicle_year || ""}`.trim() : "";

      // Save issue to database first
      const { data: insertedIssue, error: issueError } = await supabase.from("issues").insert({
        user_id: user.id,
        description: issueText,
        image_url: imageUrl,
        vehicle_id: selectedVehicle || null,
        area: profile?.area || null,
        pincode: profile?.pincode || null,
        status: "open",
      }).select().single();
      if (issueError) throw issueError;

      toast.success("Issue submitted! Running AI analysis...");
      setIssueText("");
      setImageFile(null);
      setImagePreview(null);
      setSelectedVehicle("");
      setSubmitting(false);

      // AI Analysis (runs after submit)
      setAnalyzing(true);
      const { data: aiData, error: aiError } = await supabase.functions.invoke("analyze-issue", {
        body: { description: issueText, imageBase64, vehicleInfo },
      });

      if (!aiError && aiData?.analysis) {
        if (!aiData.analysis.is_valid_vehicle_image && imageFile) {
          toast.error(aiData.analysis.image_rejection_reason || "Please upload a valid vehicle image");
        } else {
          setAnalysis(aiData.analysis);
          // Update issue with AI analysis
          await supabase.from("issues").update({ ai_analysis: aiData.analysis }).eq("id", insertedIssue.id);
        }
      }
      setAnalyzing(false);
      fetchIssues();
    } catch (e: any) {
      toast.error(e.message || "Failed to submit issue");
      setAnalyzing(false);
      setSubmitting(false);
    }
  };

  // AI Chat
  const handleSendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = { role: "user" as const, content: chatInput };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    const vehicleInfo = vehicles.map((v: any) => `${v.vehicle_type} ${v.vehicle_brand || ""} ${v.vehicle_model || ""}`).join(", ");
    const allMsgs = [...chatMessages, userMsg];

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMsgs,
          userContext: { area: profile?.area, pincode: profile?.pincode, vehicles: vehicleInfo },
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || "Chat failed");
      }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No stream");
      const decoder = new TextDecoder();
      let assistantSoFar = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              setChatMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {}
        }
      }
    } catch (e: any) {
      toast.error(e.message || "Chat error");
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleAcceptResponse = async (responseId: string, mechanicId: string, issueId: string) => {
    try {
      await supabase.from("mechanic_responses").update({ status: "accepted" }).eq("id", responseId);
      await supabase.from("phone_share_consents").insert({
        user_id: user!.id,
        mechanic_id: mechanicId,
        issue_id: issueId,
        granted: true,
      });
      toast.success("Quote accepted! Mechanic can now see your phone number.");
      fetchIssues();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleRateResponse = async (responseId: string, rating: number) => {
    try {
      const { error } = await supabase.from("mechanic_responses").update({ user_rating: rating } as any).eq("id", responseId);
      if (error) throw error;
      toast.success("Rating submitted!");
      fetchIssues();
    } catch (e: any) {
      toast.error(e.message || "Failed to rate");
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) { toast.error("Name required"); return; }
    if (!editArea) { toast.error("Area required"); return; }
    if (editPincode.length !== 6) { toast.error("Valid pincode required"); return; }
    setSavingProfile(true);
    try {
      await supabase.from("profiles").update({ name: editName, area: editArea, pincode: editPincode }).eq("user_id", user!.id);
      await refreshProfile();
      toast.success("Profile updated!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddVehicle = async () => {
    if (!newVehicle.vehicle_type) { toast.error("Select vehicle type"); return; }
    setAddingVehicle(true);
    try {
      await supabase.from("vehicles").insert({
        user_id: user!.id,
        vehicle_type: newVehicle.vehicle_type,
        vehicle_brand: newVehicle.vehicle_brand || null,
        vehicle_model: newVehicle.vehicle_model || null,
        vehicle_year: newVehicle.vehicle_year || null,
        fuel_type: newVehicle.fuel_type || null,
        transmission: newVehicle.transmission || null,
      });
      setNewVehicle({ vehicle_type: "", vehicle_brand: "", vehicle_model: "", vehicle_year: "", fuel_type: "", transmission: "" });
      fetchVehicles();
      toast.success("Vehicle added!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAddingVehicle(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    await supabase.from("vehicles").delete().eq("id", vehicleId);
    fetchVehicles();
    toast.success("Vehicle removed");
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="user" onLogout={handleLogout} />
      <div className="container max-w-2xl py-4 px-4">
        <Tabs defaultValue="report" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-secondary">
            <TabsTrigger value="report" className="text-xs">Report</TabsTrigger>
            <TabsTrigger value="ai-chat" className="text-xs">AI Chat</TabsTrigger>
            <TabsTrigger value="responses" className="text-xs">Responses</TabsTrigger>
            <TabsTrigger value="find-mechanic" className="text-xs">Find</TabsTrigger>
            <TabsTrigger value="profile" className="text-xs">Profile</TabsTrigger>
          </TabsList>

          {/* REPORT ISSUE TAB */}
          <TabsContent value="report" className="space-y-4 mt-4">
            <section className="bg-card rounded-xl border border-border p-5 animate-slide-up">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" /> Report an Issue
              </h2>

              {vehicles.length > 0 && (
                <div className="mb-3">
                  <label className="text-xs text-muted-foreground mb-1 block">Select Vehicle</label>
                  <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                    <SelectTrigger className="bg-secondary border-0"><SelectValue placeholder="Choose vehicle" /></SelectTrigger>
                    <SelectContent>
                      {vehicles.map((v: any) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.vehicle_type} {v.vehicle_brand} {v.vehicle_model} {v.vehicle_year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Textarea
                value={issueText}
                onChange={(e) => setIssueText(e.target.value)}
                placeholder="Describe your vehicle issue in detail..."
                className="bg-secondary border-0 mb-3 min-h-[80px]"
              />

              <div className="flex gap-3 items-center mb-4 flex-wrap">
                <label className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-muted-foreground text-sm hover:text-primary transition-colors">
                    <Camera className="h-4 w-4" /> {imagePreview ? "Change Photo" : "Take Photo"}
                  </div>
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
                </label>
                <label className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-muted-foreground text-sm hover:text-primary transition-colors">
                    <Upload className="h-4 w-4" /> Add Photos
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
                <label className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-muted-foreground text-sm hover:text-primary transition-colors">
                    <Plus className="h-4 w-4" /> Add File
                  </div>
                  <input type="file" accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp" className="hidden" onChange={handleImageUpload} />
                </label>
                {imagePreview && (
                  <img src={imagePreview} alt="Issue" className="h-12 w-12 rounded-lg object-cover border border-border" />
                )}
              </div>

              <Button className="w-full" onClick={handleSubmitIssue} disabled={submitting || analyzing}>
                {(submitting || analyzing) ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                {analyzing ? "Analyzing with AI..." : submitting ? "Submitting..." : "Submit Issue"}
              </Button>
            </section>

            {analyzing && (
              <section className="bg-card rounded-xl border border-border p-5 animate-slide-up">
                <div className="flex items-center gap-2 text-primary">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm font-medium">AI is analyzing your issue...</span>
                </div>
              </section>
            )}

            {analysis && (
              <section className="bg-card rounded-xl border border-primary/30 p-5 animate-slide-up glow-primary">
                <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" /> AI Analysis
                </h2>
                <div className="space-y-2">
                  <div className="bg-secondary rounded-lg p-3"><p className="text-xs text-muted-foreground">Issue</p><p className="text-sm font-medium text-foreground">{analysis.issue}</p></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-secondary rounded-lg p-3"><p className="text-xs text-muted-foreground">Part</p><p className="text-sm font-medium text-foreground">{analysis.affected_part}</p></div>
                    <div className="bg-secondary rounded-lg p-3"><p className="text-xs text-muted-foreground">Severity</p>
                      <p className={`text-sm font-medium ${analysis.severity === "High" ? "text-destructive" : analysis.severity === "Medium" ? "text-warning" : "text-success"}`}>{analysis.severity}</p>
                    </div>
                  </div>
                  <div className="bg-secondary rounded-lg p-3"><p className="text-xs text-muted-foreground">Recommendation</p><p className="text-sm text-foreground">{analysis.recommendation}</p></div>
                </div>
              </section>
            )}
          </TabsContent>

          {/* AI CHAT TAB */}
          <TabsContent value="ai-chat" className="mt-4">
            <section className="bg-card rounded-xl border border-border overflow-hidden animate-slide-up">
              <div className="p-4 border-b border-border flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">AI Assistant</h2>
              </div>
              <div className="h-[400px] overflow-y-auto p-4 space-y-3">
                {chatMessages.length === 0 && (
                  <div className="text-center text-muted-foreground text-sm py-10">
                    <Bot className="h-10 w-10 mx-auto mb-3 text-primary/50" />
                    <p>Ask me about vehicle issues, maintenance tips, or finding mechanics in your area.</p>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
                      msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                    }`}>
                      <pre className="whitespace-pre-wrap font-sans">{msg.content.replace(/\*+/g, "")}</pre>
                    </div>
                  </div>
                ))}
                {chatLoading && chatMessages[chatMessages.length - 1]?.role !== "assistant" && (
                  <div className="flex justify-start"><div className="bg-secondary rounded-xl px-4 py-2.5"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div></div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="p-3 border-t border-border flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendChat()}
                  placeholder="Ask about vehicle issues..."
                  className="bg-secondary border-0"
                />
                <Button size="icon" onClick={handleSendChat} disabled={chatLoading || !chatInput.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </section>
          </TabsContent>

          {/* RESPONSES TAB */}
          <TabsContent value="responses" className="space-y-3 mt-4">
            <h2 className="text-lg font-semibold text-foreground">Mechanic Responses</h2>
            {loadingResponses && <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
            {!loadingResponses && responses.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-10">No responses yet. Submit an issue to get quotes from mechanics.</div>
            )}
            {responses.map((r: any) => (
              <div key={r.id} className="bg-card rounded-xl border border-border p-4 animate-slide-up">
                <div className="flex items-center gap-3 mb-3">
                  {r.mechanic?.garage_photo_url ? (
                    <img src={r.mechanic.garage_photo_url} className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center text-primary font-bold">{r.mechanic?.garage_name?.[0] || "M"}</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm">{r.mechanic?.garage_name || "Mechanic"}</h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{r.mechanic?.area}</span>
                      <span className="flex items-center gap-1"><Star className="h-3 w-3 text-warning" />{r.mechanic?.rating || "New"}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-foreground font-semibold text-sm flex items-center gap-0.5"><IndianRupee className="h-3 w-3" />{r.price_quote}</p>
                    {r.availability && <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{r.availability}</p>}
                  </div>
                </div>
                {r.message && <p className="text-sm text-muted-foreground mb-3 bg-secondary rounded-lg p-2">{r.message}</p>}
                <p className="text-xs text-muted-foreground mb-2">Issue: {r.issue?.description?.slice(0, 60)}...</p>
                <div className="flex gap-2">
                  {r.status === "pending" && (
                    <Button size="sm" onClick={() => handleAcceptResponse(r.id, r.mechanic_id, r.issue_id)}>
                      <Check className="h-3 w-3 mr-1" /> Accept
                    </Button>
                  )}
                  {r.status === "accepted" && (
                    <span className="text-xs text-success flex items-center gap-1"><Check className="h-3 w-3" /> Accepted</span>
                  )}
                  <Button size="sm" variant="outline" onClick={() => navigate(`/chat/${r.issue_id}`)}>
                    <MessageCircle className="h-3 w-3 mr-1" /> Chat
                  </Button>
                </div>
                {r.status === "accepted" && (
                  <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground mr-1">Rate Mechanic:</span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} onClick={() => handleRateResponse(r.id, star)} className="transition-transform hover:scale-125">
                        <Star className={`h-5 w-5 ${(r.user_rating || 0) >= star ? "text-warning fill-warning" : "text-muted-foreground"}`} />
                      </button>
                    ))}
                    {r.user_rating && <span className="text-xs text-muted-foreground ml-2">({r.user_rating}/5)</span>}
                  </div>
                )}
              </div>
            ))}
          </TabsContent>

          {/* PROFILE TAB */}
          <TabsContent value="profile" className="space-y-4 mt-4">
            <section className="bg-card rounded-xl border border-border p-5 animate-slide-up">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2"><Edit2 className="h-5 w-5 text-primary" /> Edit Profile</h2>
              <div className="space-y-3">
                <div><label className="text-xs text-muted-foreground mb-1 block">Name</label>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="bg-secondary border-0" /></div>
                <div><label className="text-xs text-muted-foreground mb-1 block">Area</label>
                  <Select value={editArea} onValueChange={setEditArea}>
                    <SelectTrigger className="bg-secondary border-0"><SelectValue /></SelectTrigger>
                    <SelectContent>{chennaiAreas.map((a) => (<SelectItem key={a} value={a}>{a}</SelectItem>))}</SelectContent>
                  </Select></div>
                <div><label className="text-xs text-muted-foreground mb-1 block">Pincode</label>
                  <Input value={editPincode} onChange={(e) => setEditPincode(e.target.value.replace(/\D/g, ""))} maxLength={6} className="bg-secondary border-0" /></div>
                <Button onClick={handleSaveProfile} disabled={savingProfile}>
                  {savingProfile ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} Save
                </Button>
              </div>
            </section>

            {/* Vehicles */}
            <section className="bg-card rounded-xl border border-border p-5 animate-slide-up">
              <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2"><Car className="h-5 w-5 text-primary" /> My Vehicles</h2>
              {vehicles.map((v: any) => (
                <div key={v.id} className="flex items-center justify-between bg-secondary rounded-lg p-3 mb-2">
                  <span className="text-sm text-foreground">{v.vehicle_type} {v.vehicle_brand} {v.vehicle_model} {v.vehicle_year} {v.fuel_type && `• ${v.fuel_type}`} {v.transmission && `• ${v.transmission}`}</span>
                  <button onClick={() => handleDeleteVehicle(v.id)} className="text-destructive hover:text-destructive/80"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              <div className="mt-3 space-y-2 border-t border-border pt-3">
                <p className="text-xs text-muted-foreground">Add New Vehicle</p>
                <Select value={newVehicle.vehicle_type} onValueChange={(v) => setNewVehicle((p) => ({ ...p, vehicle_type: v }))}>
                  <SelectTrigger className="bg-secondary border-0"><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>{vehicleTypes.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}</SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-2">
                  <Input value={newVehicle.vehicle_brand} onChange={(e) => setNewVehicle((p) => ({ ...p, vehicle_brand: e.target.value }))} placeholder="Brand" className="bg-secondary border-0" />
                  <Input value={newVehicle.vehicle_model} onChange={(e) => setNewVehicle((p) => ({ ...p, vehicle_model: e.target.value }))} placeholder="Model" className="bg-secondary border-0" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Input value={newVehicle.vehicle_year} onChange={(e) => setNewVehicle((p) => ({ ...p, vehicle_year: e.target.value.replace(/\D/g, "") }))} placeholder="Year" maxLength={4} className="bg-secondary border-0" />
                  <Select value={newVehicle.fuel_type} onValueChange={(v) => setNewVehicle((p) => ({ ...p, fuel_type: v }))}>
                    <SelectTrigger className="bg-secondary border-0"><SelectValue placeholder="Fuel" /></SelectTrigger>
                    <SelectContent>{fuelTypes.map((f) => (<SelectItem key={f} value={f}>{f}</SelectItem>))}</SelectContent>
                  </Select>
                  <Select value={newVehicle.transmission} onValueChange={(v) => setNewVehicle((p) => ({ ...p, transmission: v }))}>
                    <SelectTrigger className="bg-secondary border-0"><SelectValue placeholder="Trans." /></SelectTrigger>
                    <SelectContent>{transmissions.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <Button size="sm" onClick={handleAddVehicle} disabled={addingVehicle}>
                  {addingVehicle ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />} Add Vehicle
                </Button>
              </div>
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserDashboard;
