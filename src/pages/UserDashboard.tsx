import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Star, MapPin, MessageCircle, IndianRupee, Loader2, Phone, Car, Edit2,
  Plus, Trash2, Save, User, Ban, CalendarClock, Sun, Sunset, Moon,
} from "lucide-react";
import RequestMechanicHome from "@/components/RequestMechanicHome";
import LiveMechanicTracker from "@/components/LiveMechanicTracker";
import ScheduledBookings from "@/components/ScheduledBookings";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import LocationPermissionGate from "@/components/LocationPermissionGate";
import InAppBrowserGate from "@/components/InAppBrowserGate";
import ContactUsSection from "@/components/ContactUsSection";
import { serviceLabel } from "@/data/services";
import { greetingFor, firstName } from "@/lib/greeting";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { chennaiAreas } from "@/data/chennaiAreas";
import { useBroadcastUserLocation } from "@/hooks/useBroadcastUserLocation";

const vehicleTypes = ["Car", "Bike", "Scooter", "Auto", "Truck", "Bus", "Van"];
const fuelTypes = ["Petrol", "Diesel", "Electric", "CNG", "Hybrid"];
const transmissions = ["Manual", "Automatic", "CVT", "DCT", "AMT"];

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, refreshProfile } = useAuth();

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

  const greeting = greetingFor();
  const GreetIcon = greeting === "Good Morning" ? Sun : greeting === "Good Afternoon" ? Sunset : Moon;

  /** A job is "live" when it's an instant request, or a scheduled one that has started. */
  const isLive = (r: any) =>
    r.status === "accepted" && (!r.issue?.is_scheduled || r.issue?.booking_status === "in_progress");

  const hasAcceptedJob = responses.some(isLive);
  useBroadcastUserLocation(user?.id, hasAcceptedJob);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      } else {
        setResponses([]);
      }
    } else {
      setResponses([]);
    }
    setLoadingResponses(false);
  };

  const handleCancelAccepted = async (responseId: string, issueId: string) => {
    try {
      await supabase.from("mechanic_responses").update({ status: "cancelled" } as any).eq("id", responseId);
      await supabase.from("issues").update({ status: "cancelled", booking_status: "cancelled" } as any).eq("id", issueId);
      toast.success("Request cancelled");
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
      <InAppBrowserGate />
      <LocationPermissionGate />
      <PWAInstallPrompt />
      <Navbar role="user" onLogout={handleLogout} />
      <div className="container max-w-2xl py-4 px-4">

        {/* Personalized greeting */}
        <div className="mb-4 flex items-center gap-3 animate-fade-in">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <GreetIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-foreground truncate">
              {greeting}, {firstName(profile?.name)}
            </h1>
            <p className="text-xs text-muted-foreground">Mechanics in Minutes.</p>
          </div>
        </div>

        <Tabs defaultValue="nearby" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-secondary">
            <TabsTrigger value="nearby" className="text-xs gap-1.5"><MapPin className="h-3.5 w-3.5" /> Nearby</TabsTrigger>
            <TabsTrigger value="scheduled" className="text-xs gap-1.5"><CalendarClock className="h-3.5 w-3.5" /> Scheduled</TabsTrigger>
            <TabsTrigger value="profile" className="text-xs gap-1.5"><User className="h-3.5 w-3.5" /> Profile</TabsTrigger>
          </TabsList>

          {/* NEARBY = HOME (map + request flow + active jobs) */}
          <TabsContent value="nearby" className="space-y-4 mt-4">
            {(() => {
              const accepted = responses.find(isLive);
              const topMap = accepted ? (
                <LiveMechanicTracker
                  mechanicId={accepted.mechanic_id}
                  mechanicName={accepted.mechanic?.name || accepted.mechanic?.garage_name}
                  mechanicPhone={accepted.mechanic?.phone_number}
                  mechanicPhotoUrl={accepted.mechanic?.garage_photo_url}
                  garageName={accepted.mechanic?.garage_name}
                  rating={accepted.mechanic?.rating}
                  totalRatings={accepted.mechanic?.total_ratings}
                  issueId={accepted.issue_id}
                  onChat={() => navigate(`/chat/${accepted.issue_id}`)}
                />
              ) : undefined;
              return (
                <RequestMechanicHome
                  vehicles={vehicles}
                  onActiveIssue={() => fetchIssues()}
                  topMapOverride={topMap}
                />
              );
            })()}

            {/* Active jobs */}
            <section className="space-y-3">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" /> My Requests
              </h2>
              {loadingResponses && <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>}
              {(() => {
                const byIssue = new Map<string, any>();
                responses.forEach((r: any) => {
                  const cur = byIssue.get(r.issue_id);
                  if (!cur || (r.status === "accepted" && cur.status !== "accepted")) byIssue.set(r.issue_id, r);
                });
                const visible = Array.from(byIssue.values()).filter(isLive);
                if (!loadingResponses && visible.length === 0) {
                  return <div className="text-center text-muted-foreground text-xs py-4">No active jobs yet. Pick a service above to get help.</div>;
                }
                return visible.map((r: any) => (
                  <div key={r.id} className="bg-card rounded-xl border border-border p-4 animate-slide-up">
                    <div className="flex items-center gap-3 mb-3">
                      {r.mechanic?.garage_photo_url ? (
                        <img src={r.mechanic.garage_photo_url} alt={r.mechanic?.garage_name || "Mechanic"} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-primary font-bold">{r.mechanic?.garage_name?.[0] || "M"}</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] uppercase tracking-wide text-primary font-semibold">{serviceLabel(r.issue?.service_name)}</p>
                        <h3 className="font-semibold text-foreground text-sm truncate">{r.mechanic?.garage_name || "Mechanic"}</h3>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{r.mechanic?.area}</span>
                          {r.price_quote > 0 && <span className="flex items-center gap-0.5"><IndianRupee className="h-3 w-3" />{r.price_quote}</span>}
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-success/20 text-success">{r.status}</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => navigate(`/chat/${r.issue_id}`)}>
                        <MessageCircle className="h-3 w-3 mr-1" /> Chat
                      </Button>
                      {r.mechanic?.phone_number && (
                        <a href={`tel:${r.mechanic.phone_number}`}>
                          <Button size="sm" variant="secondary">
                            <Phone className="h-3 w-3 mr-1" /> +91 {r.mechanic.phone_number}
                          </Button>
                        </a>
                      )}
                      <Button size="sm" variant="destructive" className="ml-auto" onClick={() => handleCancelAccepted(r.id, r.issue_id)}>
                        <Ban className="h-3 w-3 mr-1" /> Cancel
                      </Button>
                    </div>

                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground mr-1">Rate:</span>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} onClick={() => handleRateResponse(r.id, star)} className="transition-transform hover:scale-125">
                            <Star className={`h-4 w-4 ${(r.user_rating || 0) >= star ? "text-warning fill-warning" : "text-muted-foreground"}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </section>
          </TabsContent>

          {/* SCHEDULED BOOKINGS */}
          <TabsContent value="scheduled" className="space-y-4 mt-4">
            <ScheduledBookings vehicles={vehicles} />
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
              <div className="space-y-2 mb-4">
                {vehicles.length === 0 && <p className="text-xs text-muted-foreground">No vehicles added yet.</p>}
                {vehicles.map((v: any) => (
                  <div key={v.id} className="bg-secondary rounded-lg p-3 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{v.vehicle_type} {v.vehicle_brand} {v.vehicle_model}</p>
                      <p className="text-xs text-muted-foreground">
                        {[v.vehicle_year, v.fuel_type, v.transmission].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <button onClick={() => handleDeleteVehicle(v.id)} className="text-destructive hover:text-destructive/80 p-1 shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t border-border pt-3">
                <p className="text-xs text-muted-foreground font-medium">Add a vehicle</p>
                <Select value={newVehicle.vehicle_type} onValueChange={(v) => setNewVehicle({ ...newVehicle, vehicle_type: v })}>
                  <SelectTrigger className="bg-secondary border-0"><SelectValue placeholder="Vehicle Type" /></SelectTrigger>
                  <SelectContent>{vehicleTypes.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}</SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-2">
                  <Input value={newVehicle.vehicle_brand} onChange={(e) => setNewVehicle({ ...newVehicle, vehicle_brand: e.target.value })} placeholder="Brand" className="bg-secondary border-0" />
                  <Input value={newVehicle.vehicle_model} onChange={(e) => setNewVehicle({ ...newVehicle, vehicle_model: e.target.value })} placeholder="Model" className="bg-secondary border-0" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Input value={newVehicle.vehicle_year} onChange={(e) => setNewVehicle({ ...newVehicle, vehicle_year: e.target.value.replace(/\D/g, "") })} placeholder="Year" maxLength={4} className="bg-secondary border-0" />
                  <Select value={newVehicle.fuel_type} onValueChange={(v) => setNewVehicle({ ...newVehicle, fuel_type: v })}>
                    <SelectTrigger className="bg-secondary border-0"><SelectValue placeholder="Fuel" /></SelectTrigger>
                    <SelectContent>{fuelTypes.map((f) => (<SelectItem key={f} value={f}>{f}</SelectItem>))}</SelectContent>
                  </Select>
                  <Select value={newVehicle.transmission} onValueChange={(v) => setNewVehicle({ ...newVehicle, transmission: v })}>
                    <SelectTrigger className="bg-secondary border-0"><SelectValue placeholder="Trans." /></SelectTrigger>
                    <SelectContent>{transmissions.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddVehicle} disabled={addingVehicle} size="sm">
                  {addingVehicle ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />} Add Vehicle
                </Button>
              </div>
            </section>

            <ContactUsSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserDashboard;
