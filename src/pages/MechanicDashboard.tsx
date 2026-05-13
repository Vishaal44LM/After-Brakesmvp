import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Car, MapPin, AlertTriangle, IndianRupee, MessageCircle, Send, Loader2,
  Clock, Star, Edit2, Save, Camera, Store, User, Phone, Search, Link, FileCheck,
  Siren, Check, Navigation
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { chennaiAreas } from "@/data/chennaiAreas";
import { useBroadcastMechanicLocation } from "@/hooks/useBroadcastMechanicLocation";
import EmergencyAlertMap from "@/components/EmergencyAlertMap";

const MechanicDashboard = () => {
  const navigate = useNavigate();
  const { user, mechanicProfile, signOut, refreshProfile } = useAuth();

  // Broadcast live GPS while there is at least one accepted job
  const [hasAcceptedJob, setHasAcceptedJob] = useState(false);
  useBroadcastMechanicLocation(user?.id, hasAcceptedJob);

  const [nearbyIssues, setNearbyIssues] = useState<any[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [quote, setQuote] = useState("");
  const [message, setMessage] = useState("");
  const [availability, setAvailability] = useState("");
  const [submittingResponse, setSubmittingResponse] = useState(false);

  const [searchArea, setSearchArea] = useState("");

  const [myResponses, setMyResponses] = useState<any[]>([]);
  const [loadingMyResponses, setLoadingMyResponses] = useState(false);
  const [respondedIssueIds, setRespondedIssueIds] = useState<Set<string>>(new Set());

  const [phoneConsents, setPhoneConsents] = useState<any[]>([]);
  const [userPhones, setUserPhones] = useState<Record<string, string>>({});

  const [editName, setEditName] = useState(mechanicProfile?.name || "");
  const [editGarageName, setEditGarageName] = useState(mechanicProfile?.garage_name || "");
  const [editArea, setEditArea] = useState(mechanicProfile?.area || "");
  const [editAddress, setEditAddress] = useState("");
  const [editMapsLink, setEditMapsLink] = useState("");
  const [editExperience, setEditExperience] = useState("");
  const [editPhoneNumber, setEditPhoneNumber] = useState("");
  const [garagePhoto, setGaragePhoto] = useState<File | null>(null);
  const [garagePhotoPreview, setGaragePhotoPreview] = useState<string | null>(mechanicProfile?.garage_photo_url || null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [hiddenIssueIds, setHiddenIssueIds] = useState<Set<string>>(new Set());

  const [emergencyAlerts, setEmergencyAlerts] = useState<any[]>([]);
  const [loadingEmergencies, setLoadingEmergencies] = useState(false);

  useEffect(() => {
    if (mechanicProfile) {
      setEditName(mechanicProfile.name);
      setEditGarageName(mechanicProfile.garage_name);
      setEditArea(mechanicProfile.area);
      setGaragePhotoPreview(mechanicProfile.garage_photo_url);
      loadExtendedProfile();
    }
  }, [mechanicProfile]);

  const loadExtendedProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from("mechanic_profiles").select("garage_address, google_maps_link, years_of_experience, phone_number, is_available").eq("user_id", user.id).single();
    if (data) {
      setEditAddress((data as any).garage_address || "");
      setEditMapsLink((data as any).google_maps_link || "");
      setEditExperience((data as any).years_of_experience?.toString() || "");
      setEditPhoneNumber((data as any).phone_number || "");
      setIsAvailable((data as any).is_available !== false);
    }
  };

  const toggleAvailability = async (next: boolean) => {
    if (!user) return;
    setSavingAvailability(true);
    setIsAvailable(next);
    try {
      await supabase.from("mechanic_profiles").update({ is_available: next } as any).eq("user_id", user.id);
      toast.success(next ? "You're now available" : "You're offline");
    } catch (e: any) {
      toast.error(e.message);
      setIsAvailable(!next);
    } finally {
      setSavingAvailability(false);
    }
  };

  const handleRejectIssue = (issueId: string) => {
    setHiddenIssueIds((s) => new Set(s).add(issueId));
    toast.success("Request dismissed");
  };

  const handleAcceptResponseAsAccepted = async (responseId: string) => {
    try {
      await supabase.from("mechanic_responses").update({ status: "accepted" } as any).eq("id", responseId);
      toast.success("Job marked as accepted");
      fetchMyResponses();
    } catch (e: any) { toast.error(e.message); }
  };


  useEffect(() => {
    if (!user) return;
    fetchNearbyIssues();
    fetchMyResponses();
    fetchPhoneConsents();
    fetchEmergencyAlerts();

    const ch = supabase
      .channel("emergency-alerts-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "emergency_alerts" },
        () => fetchEmergencyAlerts(),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, mechanicProfile]);

  const fetchEmergencyAlerts = async () => {
    setLoadingEmergencies(true);
    try {
      const { data } = await supabase.from("emergency_alerts").select("*").eq("status", "active").order("created_at", { ascending: false });
      setEmergencyAlerts((data as any[]) || []);
    } catch {
      setEmergencyAlerts([]);
    } finally {
      setLoadingEmergencies(false);
    }
  };

  const fetchNearbyIssues = async (overrideArea?: string) => {
    if (!user) return;
    setLoadingIssues(true);
    try {
      let query = supabase
        .from("issues")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false });

      const filterArea = overrideArea || searchArea || mechanicProfile?.area;
      if (filterArea) query = query.eq("area", filterArea);

      const { data, error } = await query;
      if (error) { setNearbyIssues([]); setLoadingIssues(false); return; }

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
    } catch {
      setNearbyIssues([]);
    } finally {
      setLoadingIssues(false);
    }
  };

  const handleSearch = () => fetchNearbyIssues(searchArea);
  const handleResetSearch = () => { setSearchArea(""); fetchNearbyIssues(""); };

  const fetchMyResponses = async () => {
    if (!user) return;
    setLoadingMyResponses(true);
    const { data } = await supabase.from("mechanic_responses").select("*").eq("mechanic_id", user.id).order("created_at", { ascending: false });
    if (data && data.length > 0) {
      const issueIds = data.map((r: any) => r.issue_id);
      setRespondedIssueIds(new Set(issueIds));
      const { data: issuesData } = await supabase.from("issues").select("*").in("id", issueIds);
      setMyResponses(data.map((r: any) => ({ ...r, issue: issuesData?.find((i: any) => i.id === r.issue_id) })));
      setHasAcceptedJob(data.some((r: any) => r.status === "accepted"));
    } else {
      setMyResponses([]);
      setRespondedIssueIds(new Set());
      setHasAcceptedJob(false);
    }
    setLoadingMyResponses(false);
  };

  const fetchPhoneConsents = async () => {
    if (!user) return;
    const { data } = await supabase.from("phone_share_consents").select("*").eq("mechanic_id", user.id).eq("granted", true);
    setPhoneConsents(data || []);
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
      fetchNearbyIssues();
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
    if (!editName.trim() || !editGarageName.trim() || !editArea) {
      toast.error("Fill all fields correctly");
      return;
    }
    if (!editAddress.trim()) { toast.error("Garage address is mandatory"); return; }
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
        garage_photo_url: photoUrl,
        garage_address: editAddress,
        google_maps_link: editMapsLink || null,
        years_of_experience: parseInt(editExperience) || null,
        phone_number: editPhoneNumber || null,
      } as any).eq("user_id", user!.id);

      await supabase.from("profiles").update({ name: editName, area: editArea }).eq("user_id", user!.id);
      await refreshProfile();
      toast.success("Profile updated!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = async () => { await signOut(); navigate("/"); };
  const getUserPhone = (issueUserId: string) => userPhones[issueUserId] || null;
  const hasPhoneConsent = (issueId: string) => phoneConsents.some((c: any) => c.issue_id === issueId);
  const hasResponded = (issueId: string) => respondedIssueIds.has(issueId);

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="mechanic" onLogout={handleLogout} />
      <div className="container max-w-2xl py-4 px-4">
        <Tabs defaultValue="issues" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-secondary">
            <TabsTrigger value="issues" className="text-xs">🛠️ Requests</TabsTrigger>
            <TabsTrigger value="emergency" className="text-xs text-destructive">🚨 SOS</TabsTrigger>
            <TabsTrigger value="profile" className="text-xs">👤 Profile</TabsTrigger>
          </TabsList>

          {/* EMERGENCY ALERTS */}
          <TabsContent value="emergency" className="space-y-3 mt-4">
            <h2 className="text-lg font-semibold text-destructive flex items-center gap-2">
              <Siren className="h-5 w-5" /> Emergency Alerts
            </h2>
            {loadingEmergencies && <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-destructive" /></div>}
            {!loadingEmergencies && emergencyAlerts.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-10">No active emergency alerts.</div>
            )}
            {emergencyAlerts.map((alert: any) => (
              <div key={alert.id} className="bg-destructive/5 border-2 border-destructive/30 rounded-xl p-5 animate-slide-up relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-destructive animate-pulse" />
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <span className="text-sm font-bold text-destructive uppercase tracking-wide">Emergency</span>
                  <span className="text-xs text-muted-foreground ml-auto">{new Date(alert.created_at).toLocaleString()}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground font-medium">{alert.user_name || "Unknown"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{alert.user_area || "Unknown Area"}</span>
                  </div>
                  <a href={`tel:${alert.user_phone || ""}`} className="flex items-center gap-2 hover:text-primary">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-success font-medium">+91 {alert.user_phone || "N/A"}</span>
                  </a>
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{alert.vehicle_info || "Not specified"}</span>
                  </div>
                </div>
                <div className="mt-3">
                  <EmergencyAlertMap
                    alertId={alert.id}
                    initialLat={alert.latitude}
                    initialLng={alert.longitude}
                    userName={alert.user_name}
                  />
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={fetchEmergencyAlerts} className="w-full">
              <Loader2 className="h-4 w-4 mr-1" /> Refresh Alerts
            </Button>
          </TabsContent>

          {/* NEARBY ISSUES */}
          <TabsContent value="issues" className="space-y-3 mt-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" /> Nearby Issues
              {mechanicProfile && <span className="text-xs text-muted-foreground font-normal">({mechanicProfile.area})</span>}
            </h2>

            <div className="bg-card rounded-xl border border-border p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Search className="h-4 w-4 text-primary" />
                <span className="font-medium">Search Customers</span>
              </div>
              <Select value={searchArea} onValueChange={setSearchArea}>
                <SelectTrigger className="bg-secondary border-0 text-sm"><SelectValue placeholder="Filter by Area" /></SelectTrigger>
                <SelectContent>{chennaiAreas.map((a) => (<SelectItem key={a} value={a}>{a}</SelectItem>))}</SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSearch}><Search className="h-3 w-3 mr-1" /> Search</Button>
                <Button size="sm" variant="outline" onClick={handleResetSearch}>Reset</Button>
              </div>
            </div>

            {loadingIssues && <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
            {!loadingIssues && nearbyIssues.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-10">No issues found. Try changing your search filters.</div>
            )}
            {nearbyIssues.filter((i: any) => !hiddenIssueIds.has(i.id)).map((issue: any) => (
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
                </div>
                <p className="text-sm text-foreground mb-2">{issue.description}</p>
                {issue.image_url && (
                  <img src={issue.image_url} alt="Issue" className="w-full h-40 object-cover rounded-lg mb-2" />
                )}

                {hasPhoneConsent(issue.id) && getUserPhone(issue.user_id) && (
                  <div className="flex items-center gap-2 mb-3 bg-success/10 rounded-lg p-2">
                    <Phone className="h-4 w-4 text-success" />
                    <span className="text-sm text-success font-medium">+91 {getUserPhone(issue.user_id)}</span>
                  </div>
                )}

                <div className="flex gap-2 mt-2">
                  {hasResponded(issue.id) ? (
                    <>
                      <span className="text-xs text-muted-foreground flex items-center gap-1 bg-secondary rounded-lg px-3 py-1.5">✓ Responded</span>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/chat/${issue.id}`)}>
                        <MessageCircle className="h-3 w-3 mr-1" /> Chat
                      </Button>
                    </>
                  ) : respondingTo === issue.id ? (
                    <div className="w-full space-y-3 bg-secondary rounded-lg p-4 animate-fade-in">
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
                    <>
                      <Button size="sm" onClick={() => setRespondingTo(issue.id)}>
                        <Check className="h-3 w-3 mr-1" /> Accept
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleRejectIssue(issue.id)}>
                        Reject
                      </Button>
                    </>
                  )}
                </div>
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
                {r.user_rating && (
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-xs text-muted-foreground">User Rating:</span>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`h-3 w-3 ${s <= r.user_rating ? "text-warning fill-warning" : "text-muted-foreground"}`} />
                    ))}
                  </div>
                )}
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => navigate(`/chat/${r.issue_id}`)}>
                    <MessageCircle className="h-3 w-3 mr-1" /> Chat
                  </Button>
                  {hasPhoneConsent(r.issue_id) && getUserPhone(r.issue?.user_id) && (
                    <span className="flex items-center gap-1 text-xs text-success"><Phone className="h-3 w-3" /> +91 {getUserPhone(r.issue?.user_id)}</span>
                  )}
                </div>
              </div>
            ))}
          </TabsContent>

          {/* PROFILE */}
          <TabsContent value="profile" className="space-y-4 mt-4">
            <section className="bg-card rounded-xl border border-border p-5 animate-slide-up flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground text-sm">Availability</h3>
                <p className="text-xs text-muted-foreground">{isAvailable ? "You're showing as available to nearby users." : "You're offline — won't appear in Nearby."}</p>
              </div>
              <Switch checked={isAvailable} onCheckedChange={toggleAvailability} disabled={savingAvailability} />
            </section>

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
                <div><label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1"><MapPin className="h-3 w-3" /> Garage Address <span className="text-destructive">*</span></label>
                  <Textarea value={editAddress} onChange={(e) => setEditAddress(e.target.value)} placeholder="Full garage address" className="bg-secondary border-0 min-h-[60px]" /></div>
                <div><label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1"><Link className="h-3 w-3" /> Google Maps Link</label>
                  <Input value={editMapsLink} onChange={(e) => setEditMapsLink(e.target.value)} placeholder="https://maps.google.com/..." className="bg-secondary border-0" /></div>
                <div><label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1"><Clock className="h-3 w-3" /> Years of Experience</label>
                  <Input value={editExperience} onChange={(e) => setEditExperience(e.target.value.replace(/\D/g, ""))} placeholder="e.g. 5" maxLength={2} className="bg-secondary border-0" /></div>
                <div><label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1"><Phone className="h-3 w-3" /> Phone Number</label>
                  <Input value={editPhoneNumber} onChange={(e) => setEditPhoneNumber(e.target.value.replace(/\D/g, ""))} placeholder="10-digit number" maxLength={10} className="bg-secondary border-0" /></div>

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
