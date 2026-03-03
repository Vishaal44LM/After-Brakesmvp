import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Car, Sparkles, MapPin, AlertTriangle, IndianRupee, MessageCircle, Send, Loader2,
  Clock, Star, Edit2, Save, Camera, Store, Hash, User, Phone
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { chennaiAreas } from "@/data/chennaiAreas";

const MechanicDashboard = () => {
  const navigate = useNavigate();
  const { user, mechanicProfile, signOut, refreshProfile } = useAuth();

  // Issues state
  const [nearbyIssues, setNearbyIssues] = useState<any[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(true);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [quote, setQuote] = useState("");
  const [message, setMessage] = useState("");
  const [availability, setAvailability] = useState("");
  const [submittingResponse, setSubmittingResponse] = useState(false);

  // My Responses
  const [myResponses, setMyResponses] = useState<any[]>([]);
  const [loadingMyResponses, setLoadingMyResponses] = useState(false);

  // Phone consents
  const [phoneConsents, setPhoneConsents] = useState<any[]>([]);
  const [userPhones, setUserPhones] = useState<Record<string, string>>({});

  // Profile edit
  const [editName, setEditName] = useState(mechanicProfile?.name || "");
  const [editGarageName, setEditGarageName] = useState(mechanicProfile?.garage_name || "");
  const [editArea, setEditArea] = useState(mechanicProfile?.area || "");
  const [editPincode, setEditPincode] = useState(mechanicProfile?.pincode || "");
  const [garagePhoto, setGaragePhoto] = useState<File | null>(null);
  const [garagePhotoPreview, setGaragePhotoPreview] = useState<string | null>(mechanicProfile?.garage_photo_url || null);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (mechanicProfile) {
      setEditName(mechanicProfile.name);
      setEditGarageName(mechanicProfile.garage_name);
      setEditArea(mechanicProfile.area);
      setEditPincode(mechanicProfile.pincode);
      setGaragePhotoPreview(mechanicProfile.garage_photo_url);
    }
  }, [mechanicProfile]);

  useEffect(() => {
    if (user && mechanicProfile) {
      fetchNearbyIssues();
      fetchMyResponses();
      fetchPhoneConsents();
    }
  }, [user, mechanicProfile]);

  const fetchNearbyIssues = async () => {
    setLoadingIssues(true);
    try {
      let query = supabase
        .from("issues")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (mechanicProfile?.pincode) {
        query = query.eq("pincode", mechanicProfile.pincode);
      }

      const { data } = await query;

      // Enrich with vehicle info
      if (data && data.length > 0) {
        const vehicleIds = data.filter((i: any) => i.vehicle_id).map((i: any) => i.vehicle_id);
        let vehicleMap: Record<string, any> = {};
        if (vehicleIds.length > 0) {
          const { data: vehiclesData } = await supabase.from("vehicles").select("*").in("id", vehicleIds);
          vehiclesData?.forEach((v: any) => { vehicleMap[v.id] = v; });
        }
        setNearbyIssues(data.map((i: any) => ({ ...i, vehicle: vehicleMap[i.vehicle_id] || null })));
      } else {
        setNearbyIssues([]);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoadingIssues(false);
    }
  };

  const fetchMyResponses = async () => {
    if (!user) return;
    setLoadingMyResponses(true);
    const { data } = await supabase
      .from("mechanic_responses")
      .select("*")
      .eq("mechanic_id", user.id)
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      const issueIds = data.map((r: any) => r.issue_id);
      const { data: issuesData } = await supabase.from("issues").select("*").in("id", issueIds);
      setMyResponses(data.map((r: any) => ({ ...r, issue: issuesData?.find((i: any) => i.id === r.issue_id) })));
    } else {
      setMyResponses([]);
    }
    setLoadingMyResponses(false);
  };

  const fetchPhoneConsents = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("phone_share_consents")
      .select("*")
      .eq("mechanic_id", user.id)
      .eq("granted", true);
    setPhoneConsents(data || []);

    // Fetch phone numbers for consented users
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map((c: any) => c.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, phone").in("user_id", userIds);
      const phoneMap: Record<string, string> = {};
      profiles?.forEach((p: any) => { phoneMap[p.user_id] = p.phone; });
      setUserPhones(phoneMap);
    }
  };

  const handleSubmitResponse = async (issueId: string) => {
    if (!quote) { toast.error("Enter your price quote"); return; }
    if (!user) return;
    setSubmittingResponse(true);
    try {
      const { error } = await supabase.from("mechanic_responses").insert({
        issue_id: issueId,
        mechanic_id: user.id,
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
      fetchMyResponses();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmittingResponse(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setGaragePhoto(file);
      const reader = new FileReader();
      reader.onload = () => setGaragePhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim() || !editGarageName.trim() || !editArea || editPincode.length !== 6) {
      toast.error("Fill all fields correctly");
      return;
    }
    setSavingProfile(true);
    try {
      let photoUrl = mechanicProfile?.garage_photo_url || null;
      if (garagePhoto) {
        const ext = garagePhoto.name.split(".").pop();
        const filePath = `${user!.id}/garage.${ext}`;
        await supabase.storage.from("garage-photos").upload(filePath, garagePhoto, { upsert: true });
        const { data: urlData } = supabase.storage.from("garage-photos").getPublicUrl(filePath);
        photoUrl = urlData.publicUrl;
      }

      await supabase.from("mechanic_profiles").update({
        name: editName,
        garage_name: editGarageName,
        area: editArea,
        pincode: editPincode,
        garage_photo_url: photoUrl,
      }).eq("user_id", user!.id);

      await supabase.from("profiles").update({ name: editName, area: editArea, pincode: editPincode }).eq("user_id", user!.id);
      await refreshProfile();
      toast.success("Profile updated!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const getUserPhone = (issueUserId: string) => {
    return userPhones[issueUserId] || null;
  };

  const hasPhoneConsent = (issueId: string) => {
    return phoneConsents.some((c: any) => c.issue_id === issueId);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="mechanic" onLogout={handleLogout} />
      <div className="container max-w-2xl py-4 px-4">
        <Tabs defaultValue="issues" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-secondary">
            <TabsTrigger value="issues" className="text-xs">Nearby Issues</TabsTrigger>
            <TabsTrigger value="responses" className="text-xs">My Responses</TabsTrigger>
            <TabsTrigger value="profile" className="text-xs">Profile</TabsTrigger>
          </TabsList>

          {/* NEARBY ISSUES */}
          <TabsContent value="issues" className="space-y-3 mt-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" /> Nearby Issues
              {mechanicProfile && <span className="text-xs text-muted-foreground font-normal">({mechanicProfile.pincode})</span>}
            </h2>
            {loadingIssues && <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
            {!loadingIssues && nearbyIssues.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-10">No issues in your area right now.</div>
            )}
            {nearbyIssues.map((issue: any) => (
              <div key={issue.id} className="bg-card rounded-xl border border-border p-5 animate-slide-up">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Car className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">
                        {issue.vehicle ? `${issue.vehicle.vehicle_type} ${issue.vehicle.vehicle_brand || ""} ${issue.vehicle.vehicle_model || ""}` : "Vehicle"}
                      </h3>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {issue.area || "Unknown"}
                      </span>
                    </div>
                  </div>
                  {issue.ai_analysis?.estimated_price_range && (
                    <span className="text-xs bg-secondary px-2 py-1 rounded text-muted-foreground">{(issue.ai_analysis as any).estimated_price_range}</span>
                  )}
                </div>
                <p className="text-sm text-foreground mb-2">{issue.description}</p>
                {issue.image_url && (
                  <img src={issue.image_url} alt="Issue" className="w-full h-40 object-cover rounded-lg mb-2" />
                )}
                {issue.ai_analysis && (
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-xs text-primary font-medium">AI: {(issue.ai_analysis as any).issue} • {(issue.ai_analysis as any).severity}</span>
                  </div>
                )}

                {/* Phone number display */}
                {hasPhoneConsent(issue.id) && getUserPhone(issue.user_id) && (
                  <div className="flex items-center gap-2 mb-3 bg-success/10 rounded-lg p-2">
                    <Phone className="h-4 w-4 text-success" />
                    <span className="text-sm text-success font-medium">+91 {getUserPhone(issue.user_id)}</span>
                  </div>
                )}

                {respondingTo === issue.id ? (
                  <div className="space-y-3 bg-secondary rounded-lg p-4 mt-2 animate-fade-in">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Price Quote (₹)</label>
                      <Input value={quote} onChange={(e) => setQuote(e.target.value.replace(/\D/g, ""))} placeholder="1500" className="bg-card border-0" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Availability (date & time)</label>
                      <Input value={availability} onChange={(e) => setAvailability(e.target.value)} placeholder="e.g. Tomorrow 10 AM" className="bg-card border-0" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Message (optional)</label>
                      <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Add details..." className="bg-card border-0 min-h-[60px]" />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSubmitResponse(issue.id)} disabled={submittingResponse}>
                        {submittingResponse ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Send className="h-3 w-3 mr-1" />} Submit
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
          </TabsContent>

          {/* MY RESPONSES */}
          <TabsContent value="responses" className="space-y-3 mt-4">
            <h2 className="text-lg font-semibold text-foreground">My Responses</h2>
            {loadingMyResponses && <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
            {!loadingMyResponses && myResponses.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-10">You haven't responded to any issues yet.</div>
            )}
            {myResponses.map((r: any) => (
              <div key={r.id} className="bg-card rounded-xl border border-border p-4 animate-slide-up">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-foreground font-medium">{r.issue?.description?.slice(0, 60)}...</p>
                  <span className={`text-xs px-2 py-0.5 rounded ${r.status === "accepted" ? "bg-success/20 text-success" : "bg-primary/20 text-primary"}`}>{r.status}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><IndianRupee className="h-3 w-3" />{r.price_quote}</span>
                  {r.availability && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{r.availability}</span>}
                </div>
                {r.status === "accepted" && (
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => navigate(`/chat/${r.issue_id}`)}>
                      <MessageCircle className="h-3 w-3 mr-1" /> Chat
                    </Button>
                    {hasPhoneConsent(r.issue_id) && getUserPhone(r.issue?.user_id) && (
                      <span className="flex items-center gap-1 text-xs text-success"><Phone className="h-3 w-3" /> +91 {getUserPhone(r.issue?.user_id)}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </TabsContent>

          {/* PROFILE */}
          <TabsContent value="profile" className="space-y-4 mt-4">
            <section className="bg-card rounded-xl border border-border p-5 animate-slide-up">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2"><Edit2 className="h-5 w-5 text-primary" /> Garage Profile</h2>

              <div className="flex flex-col items-center mb-4">
                <label className="cursor-pointer group">
                  <div className="h-20 w-20 rounded-full bg-secondary border-2 border-dashed border-border flex items-center justify-center overflow-hidden group-hover:border-primary transition-colors">
                    {garagePhotoPreview ? <img src={garagePhotoPreview} className="h-full w-full object-cover" /> : <Camera className="h-6 w-6 text-muted-foreground" />}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
                <span className="text-xs text-muted-foreground mt-1">Change photo</span>
              </div>

              <div className="space-y-3">
                <div><label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1"><User className="h-3 w-3" /> Name</label>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="bg-secondary border-0" /></div>
                <div><label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1"><Store className="h-3 w-3" /> Garage Name</label>
                  <Input value={editGarageName} onChange={(e) => setEditGarageName(e.target.value)} className="bg-secondary border-0" /></div>
                <div><label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1"><MapPin className="h-3 w-3" /> Area</label>
                  <Select value={editArea} onValueChange={setEditArea}>
                    <SelectTrigger className="bg-secondary border-0"><SelectValue /></SelectTrigger>
                    <SelectContent>{chennaiAreas.map((a) => (<SelectItem key={a} value={a}>{a}</SelectItem>))}</SelectContent>
                  </Select></div>
                <div><label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1"><Hash className="h-3 w-3" /> Pincode</label>
                  <Input value={editPincode} onChange={(e) => setEditPincode(e.target.value.replace(/\D/g, ""))} maxLength={6} className="bg-secondary border-0" /></div>

                {/* Rating display */}
                <div className="bg-secondary rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-warning" />
                    <span className="text-sm text-foreground font-medium">{mechanicProfile?.rating || "0"}</span>
                    <span className="text-xs text-muted-foreground">({mechanicProfile?.total_ratings || 0} ratings)</span>
                  </div>
                </div>

                <Button onClick={handleSaveProfile} disabled={savingProfile}>
                  {savingProfile ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} Save Profile
                </Button>
              </div>
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MechanicDashboard;
