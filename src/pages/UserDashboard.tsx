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
  Loader2, Send, Bot, User, Check, Phone, Car, Edit2, Plus, Trash2, Save, Search, Wrench, Mic, MicOff, Volume2,
  FolderOpen, FileText, Shield, Leaf, CalendarDays
} from "lucide-react";
import AIMechanicCharacter from "@/components/AIMechanicCharacter";
import RequestMechanicHome from "@/components/RequestMechanicHome";
import LiveMechanicTracker from "@/components/LiveMechanicTracker";
import { issueTypeLabel } from "@/data/issueTypes";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { chennaiAreas } from "@/data/chennaiAreas";

const vehicleTypes = ["Car", "Bike", "Scooter", "Auto", "Truck", "Bus", "Van"];
const fuelTypes = ["Petrol", "Diesel", "Electric", "CNG", "Hybrid"];
const transmissions = ["Manual", "Automatic", "CVT", "DCT", "AMT"];

const documentTypes = [
  { value: "service_history", label: "Service History", icon: Wrench },
  { value: "insurance", label: "Insurance", icon: Shield },
  { value: "rc", label: "RC (Registration Certificate)", icon: FileText },
  { value: "pollution_certificate", label: "Pollution Certificate", icon: Leaf },
];

// Find Mechanic Section with chat + issue submission
const FindMechanicSection = ({ user, vehicles }: { user: any; vehicles: any[] }) => {
  const navigate = useNavigate();
  const [searchArea, setSearchArea] = useState("");
  const [mechanics, setMechanics] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [contactingMechanic, setContactingMechanic] = useState<string | null>(null);
  const [issueDesc, setIssueDesc] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [submittingIssue, setSubmittingIssue] = useState(false);

  const handleSearch = async () => {
    if (!searchArea) { toast.error("Select an area to search"); return; }
    setSearching(true);
    setSearched(true);
    try {
      const { data, error } = await supabase.from("mechanic_profiles").select("*").eq("area", searchArea);
      if (error) throw error;
      setMechanics(data || []);
    } catch (e: any) {
      toast.error(e.message || "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const handleSubmitIssueToMechanic = async (mechanicId: string) => {
    if (!issueDesc.trim()) { toast.error("Describe your issue"); return; }
    if (!user) return;
    setSubmittingIssue(true);
    try {
      const mechanic = mechanics.find((m: any) => m.user_id === mechanicId);
      const { data: issue, error: issueErr } = await supabase.from("issues").insert({
        user_id: user.id,
        description: issueDesc,
        vehicle_id: selectedVehicleId || null,
        area: mechanic?.area || null,
        status: "open",
      }).select().single();
      if (issueErr) throw issueErr;

      // Send first message to establish chat
      await supabase.from("messages").insert({
        issue_id: issue.id,
        sender_id: user.id,
        content: issueDesc,
      });

      // Create a mechanic response so they can see it and chat
      await supabase.from("mechanic_responses").insert({
        issue_id: issue.id,
        mechanic_id: mechanicId,
        price_quote: 0,
        message: "Customer contacted you directly",
        status: "pending",
      });

      toast.success("Issue sent to mechanic! Opening chat...");
      setContactingMechanic(null);
      setIssueDesc("");
      navigate(`/chat/${issue.id}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to send");
    } finally {
      setSubmittingIssue(false);
    }
  };

  return (
    <section className="bg-card rounded-xl border border-border p-5 animate-slide-up">
      <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Search className="h-5 w-5 text-primary" /> Find Mechanics
      </h2>
      <div className="space-y-3 mb-4">
        <Select value={searchArea} onValueChange={setSearchArea}>
          <SelectTrigger className="bg-secondary border-0"><SelectValue placeholder="Select Area" /></SelectTrigger>
          <SelectContent>{chennaiAreas.map((a) => (<SelectItem key={a} value={a}>{a}</SelectItem>))}</SelectContent>
        </Select>
        <Button className="w-full" onClick={handleSearch} disabled={searching}>
          {searching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />} Search Mechanics
        </Button>
      </div>
      {searched && mechanics.length === 0 && !searching && (
        <p className="text-center text-muted-foreground text-sm py-6">No registered mechanics found in this area.</p>
      )}

      {mechanics.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-primary mb-2">Registered Mechanics ({mechanics.length})</h3>
          {mechanics.map((m: any) => (
            <div key={m.id} className="bg-secondary rounded-xl p-4 mb-3">
              <div className="flex items-center gap-3">
                {m.garage_photo_url ? (
                  <img src={m.garage_photo_url} className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">{m.garage_name?.[0] || "M"}</div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-sm">{m.garage_name}</h3>
                  <p className="text-xs text-muted-foreground">{m.name}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{m.area}</span>
                    <span className="flex items-center gap-1"><Star className="h-3 w-3 text-warning" />{m.rating ? `${Number(m.rating).toFixed(1)} (${m.total_ratings})` : "New"}</span>
                    {m.years_of_experience && <span className="text-xs">{m.years_of_experience} yrs exp</span>}
                  </div>
                  {m.garage_address && <p className="text-xs text-muted-foreground mt-0.5">{m.garage_address}</p>}
                  {(m as any).phone_number && (
                    <p className="text-xs text-success mt-0.5 flex items-center gap-1"><Phone className="h-3 w-3" /> +91 {(m as any).phone_number}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" onClick={() => setContactingMechanic(contactingMechanic === m.user_id ? null : m.user_id)}>
                  <MessageCircle className="h-3 w-3 mr-1" /> Chat
                </Button>
                {m.google_maps_link && (
                  <a href={m.google_maps_link} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="text-xs"><MapPin className="h-3 w-3 mr-1" />Map</Button>
                  </a>
                )}
              </div>

              {contactingMechanic === m.user_id && (
                <div className="mt-3 space-y-2 bg-card rounded-lg p-3 border border-border animate-fade-in">
                  <p className="text-xs text-muted-foreground font-medium">Send your issue to {m.garage_name}</p>
                  {vehicles.length > 0 && (
                    <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                      <SelectTrigger className="bg-secondary border-0 text-sm"><SelectValue placeholder="Select Vehicle" /></SelectTrigger>
                      <SelectContent>
                        {vehicles.map((v: any) => (
                          <SelectItem key={v.id} value={v.id}>{v.vehicle_type} {v.vehicle_brand} {v.vehicle_model}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Textarea value={issueDesc} onChange={(e) => setIssueDesc(e.target.value)} placeholder="Describe your vehicle issue..." className="bg-secondary border-0 min-h-[60px]" />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleSubmitIssueToMechanic(m.user_id)} disabled={submittingIssue}>
                      {submittingIssue ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Send className="h-3 w-3 mr-1" />} Send & Chat
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setContactingMechanic(null)}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

// AI Mechanic Character is now a standalone component
// Digital Garage Component
const DigitalGarage = ({ user, vehicles }: { user: any; vehicles: any[] }) => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [docType, setDocType] = useState("");
  const [docTitle, setDocTitle] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [docNotes, setDocNotes] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);

  useEffect(() => {
    if (user) fetchDocuments();
  }, [user]);

  const fetchDocuments = async () => {
    const { data } = await supabase
      .from("vehicle_documents")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setDocuments((data as any[]) || []);
    setLoading(false);
  };

  const handleUpload = async () => {
    if (!docFile) { toast.error("Select a file"); return; }
    if (!docType) { toast.error("Select document type"); return; }
    if (!selectedVehicle) { toast.error("Select a vehicle"); return; }

    setUploading(true);
    try {
      const ext = docFile.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("issue-images").upload(filePath, docFile);
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("issue-images").getPublicUrl(filePath);

      const { error } = await supabase.from("vehicle_documents").insert({
        user_id: user.id,
        vehicle_id: selectedVehicle,
        document_type: docType,
        title: docTitle || documentTypes.find(d => d.value === docType)?.label || docType,
        file_url: urlData.publicUrl,
        expiry_date: expiryDate || null,
        notes: docNotes || null,
      } as any);
      if (error) throw error;

      toast.success("Document uploaded!");
      setDocFile(null);
      setDocType("");
      setDocTitle("");
      setExpiryDate("");
      setDocNotes("");
      setSelectedVehicle("");
      fetchDocuments();
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    await supabase.from("vehicle_documents").delete().eq("id", docId);
    fetchDocuments();
    toast.success("Document removed");
  };

  const getVehicleLabel = (vehicleId: string) => {
    const v = vehicles.find((v: any) => v.id === vehicleId);
    return v ? `${v.vehicle_type} ${v.vehicle_brand || ""} ${v.vehicle_model || ""}`.trim() : "Vehicle";
  };

  const getDocIcon = (type: string) => {
    const dt = documentTypes.find(d => d.value === type);
    return dt ? dt.icon : FileText;
  };

  return (
    <section className="space-y-4">
      <div className="bg-card rounded-xl border border-border p-5 animate-slide-up">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-primary" /> Glove Box
        </h2>
        <p className="text-xs text-muted-foreground mb-4">Store service history, insurance, RC & pollution certificates. Valuable when selling your vehicle.</p>

        <div className="space-y-3">
          <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
            <SelectTrigger className="bg-secondary border-0"><SelectValue placeholder="Select Vehicle" /></SelectTrigger>
            <SelectContent>
              {vehicles.map((v: any) => (
                <SelectItem key={v.id} value={v.id}>{v.vehicle_type} {v.vehicle_brand} {v.vehicle_model}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={docType} onValueChange={setDocType}>
            <SelectTrigger className="bg-secondary border-0"><SelectValue placeholder="Document Type" /></SelectTrigger>
            <SelectContent>
              {documentTypes.map((d) => (
                <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input value={docTitle} onChange={(e) => setDocTitle(e.target.value)} placeholder="Title (optional)" className="bg-secondary border-0" />
          <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="bg-secondary border-0" placeholder="Expiry Date (optional)" />
          <Input value={docNotes} onChange={(e) => setDocNotes(e.target.value)} placeholder="Notes (optional)" className="bg-secondary border-0" />

          <label className="cursor-pointer block">
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-secondary text-muted-foreground text-sm hover:text-primary transition-colors border border-dashed border-border">
              <Upload className="h-4 w-4" /> {docFile ? docFile.name : "Choose file (PDF, Image, etc.)"}
            </div>
            <input type="file" accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={(e) => setDocFile(e.target.files?.[0] || null)} />
          </label>

          <Button className="w-full" onClick={handleUpload} disabled={uploading}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />} Upload Document
          </Button>
        </div>
      </div>

      {/* Documents List */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : documents.length === 0 ? (
        <div className="text-center text-muted-foreground text-sm py-6">No documents uploaded yet.</div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc: any) => {
            const DocIcon = getDocIcon(doc.document_type);
            return (
              <div key={doc.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-3 animate-slide-up">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <DocIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{doc.title || doc.document_type}</p>
                  <p className="text-xs text-muted-foreground">{getVehicleLabel(doc.vehicle_id)}</p>
                  <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                    {doc.expiry_date && (
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" /> Exp: {new Date(doc.expiry_date).toLocaleDateString()}
                      </span>
                    )}
                    <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="text-xs">View</Button>
                  </a>
                  <button onClick={() => handleDelete(doc.id)} className="text-destructive hover:text-destructive/80 p-1">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

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

  // Mechanic Responses
  const [issues, setIssues] = useState<any[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);

  // Profile State
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [editName, setEditName] = useState(profile?.name || "");
  const [editArea, setEditArea] = useState(profile?.area || "");
  const [editPhone, setEditPhone] = useState(profile?.phone || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ vehicle_type: "", vehicle_brand: "", vehicle_model: "", vehicle_year: "", fuel_type: "", transmission: "" });
  const [addingVehicle, setAddingVehicle] = useState(false);

  useEffect(() => {
    if (profile) {
      setEditName(profile.name || "");
      setEditArea(profile.area || "");
      setEditPhone(profile.phone || "");
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

      const { data: insertedIssue, error: issueError } = await supabase.from("issues").insert({
        user_id: user.id,
        description: issueText,
        image_url: imageUrl,
        vehicle_id: selectedVehicle || null,
        area: profile?.area || null,
        status: "open",
      }).select().single();
      if (issueError) throw issueError;

      toast.success("Issue submitted! Running AI analysis...");
      setIssueText("");
      setImageFile(null);
      setImagePreview(null);
      setSelectedVehicle("");
      setSubmitting(false);

      setAnalyzing(true);
      const { data: aiData, error: aiError } = await supabase.functions.invoke("analyze-issue", {
        body: { description: issueText, imageBase64, vehicleInfo },
      });

      if (!aiError && aiData?.analysis) {
        if (!aiData.analysis.is_valid_vehicle_image && imageFile) {
          toast.error(aiData.analysis.image_rejection_reason || "Please upload a valid vehicle image");
        } else {
          setAnalysis(aiData.analysis);
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
    setSavingProfile(true);
    try {
      await supabase.from("profiles").update({ name: editName, area: editArea, phone: editPhone }).eq("user_id", user!.id);
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
    <div className="min-h-screen bg-background pb-36">
      <Navbar role="user" onLogout={handleLogout} />
      <div className="container max-w-2xl py-4 px-4">
        <Tabs defaultValue="nearby" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-secondary">
            <TabsTrigger value="nearby" className="text-xs">🗺️ Nearby</TabsTrigger>
            <TabsTrigger value="garage" className="text-xs">📦 Glove Box</TabsTrigger>
            <TabsTrigger value="profile" className="text-xs">👤 Profile</TabsTrigger>
          </TabsList>

          {/* NEARBY = HOME (map + request flow + active jobs) */}
          <TabsContent value="nearby" className="space-y-4 mt-4">
            <RequestMechanicHome vehicles={vehicles} onActiveIssue={() => fetchIssues()} />

            {/* My active requests / quotes */}
            <section className="space-y-3">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" /> My Requests
              </h2>
              {loadingResponses && <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>}
              {(() => {
                // Show only one row per issue, preferring the accepted response
                const byIssue = new Map<string, any>();
                responses.forEach((r: any) => {
                  const cur = byIssue.get(r.issue_id);
                  if (!cur || (r.status === "accepted" && cur.status !== "accepted")) byIssue.set(r.issue_id, r);
                });
                const visible = Array.from(byIssue.values()).filter((r) => r.status === "accepted");
                if (!loadingResponses && visible.length === 0) {
                  return <div className="text-center text-muted-foreground text-xs py-4">No active jobs yet. Tap "Request a Mechanic" above to get help.</div>;
                }
                return visible.map((r: any) => (
                <div key={r.id} className="bg-card rounded-xl border border-border p-4 animate-slide-up">
                  <div className="flex items-center gap-3 mb-3">
                    {r.mechanic?.garage_photo_url ? (
                      <img src={r.mechanic.garage_photo_url} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-primary font-bold">{r.mechanic?.garage_name?.[0] || "M"}</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase tracking-wide text-primary font-semibold">{issueTypeLabel(r.issue?.issue_type)}</p>
                      <h3 className="font-semibold text-foreground text-sm truncate">{r.mechanic?.garage_name || "Mechanic"}</h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{r.mechanic?.area}</span>
                        {r.price_quote > 0 && <span className="flex items-center gap-0.5"><IndianRupee className="h-3 w-3" />{r.price_quote}</span>}
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded ${r.status === "accepted" ? "bg-success/20 text-success" : r.status === "rejected" ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"}`}>{r.status}</span>
                  </div>
                  {r.message && <p className="text-xs text-muted-foreground mb-2 bg-secondary rounded-lg p-2">{r.message}</p>}

                  <div className="flex flex-wrap gap-2">
                    {r.status === "pending" && r.price_quote > 0 && (
                      <Button size="sm" onClick={() => handleAcceptResponse(r.id, r.mechanic_id, r.issue_id)}>
                        <Check className="h-3 w-3 mr-1" /> Accept Quote
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => navigate(`/chat/${r.issue_id}`)}>
                      <MessageCircle className="h-3 w-3 mr-1" /> Chat
                    </Button>
                    {r.status === "accepted" && r.mechanic?.phone_number && (
                      <a href={`tel:${r.mechanic.phone_number}`}>
                        <Button size="sm" variant="secondary">
                          <Phone className="h-3 w-3 mr-1" /> +91 {r.mechanic.phone_number}
                        </Button>
                      </a>
                    )}
                  </div>

                  {r.status === "accepted" && (
                    <div className="mt-3 pt-3 border-t border-border space-y-3">
                      <LiveMechanicTracker
                        mechanicId={r.mechanic_id}
                        mechanicName={r.mechanic?.garage_name}
                        mechanicPhone={r.mechanic?.phone_number}
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground mr-1">Rate:</span>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} onClick={() => handleRateResponse(r.id, star)} className="transition-transform hover:scale-125">
                            <Star className={`h-4 w-4 ${(r.user_rating || 0) >= star ? "text-warning fill-warning" : "text-muted-foreground"}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                ));
              })()}
            </section>
          </TabsContent>

          {/* DIGITAL GARAGE TAB */}
          <TabsContent value="garage" className="space-y-4 mt-4">
            {user && <DigitalGarage user={user} vehicles={vehicles} />}
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
                <div><label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1"><Phone className="h-3 w-3" /> Phone Number</label>
                  <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, ""))} placeholder="10-digit phone number" maxLength={10} className="bg-secondary border-0" /></div>
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
      <AIMechanicCharacter profile={profile} vehicles={vehicles} />
    </div>
  );
};

export default UserDashboard;
