import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MapPin, IndianRupee, MessageCircle, Loader2,
  Clock, Star, Edit2, Save, Camera, Store, User, Phone, Link, FileCheck,
  Navigation, Wrench, CalendarClock, Sun, Sunset, Moon
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { chennaiAreas } from "@/data/chennaiAreas";
import { greetingFor, firstName } from "@/lib/greeting";
import { useBroadcastMechanicLocation } from "@/hooks/useBroadcastMechanicLocation";
import MechanicRequestsHome from "@/components/MechanicRequestsHome";
import ScheduledServices from "@/components/ScheduledServices";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import LocationPermissionGate from "@/components/LocationPermissionGate";
import InAppBrowserGate from "@/components/InAppBrowserGate";
import ContactUsSection from "@/components/ContactUsSection";

const MechanicDashboard = () => {
  const navigate = useNavigate();
  const { user, mechanicProfile, signOut, refreshProfile } = useAuth();

  // Broadcast live GPS while there is at least one accepted job
  const [hasAcceptedJob, setHasAcceptedJob] = useState(false);
  useBroadcastMechanicLocation(user?.id, hasAcceptedJob);

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

  // Track whether we have any accepted job to enable GPS broadcast
  useEffect(() => {
    if (!user) return;
    const refreshAccepted = async () => {
      const { data } = await supabase
        .from("mechanic_responses")
        .select("id")
        .eq("mechanic_id", user.id)
        .eq("status", "accepted")
        .limit(1);
      setHasAcceptedJob(!!(data && data.length));
    };
    refreshAccepted();
    const ch = supabase
      .channel(`mech-accept-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mechanic_responses", filter: `mechanic_id=eq.${user.id}` },
        () => refreshAccepted(),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

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
    if (!editName.trim()) { toast.error("Full Name is required"); return; }
    if (!editPhoneNumber || editPhoneNumber.length < 10) { toast.error("A valid 10-digit Phone Number is required"); return; }
    if (!editGarageName.trim()) { toast.error("Garage Name is required"); return; }
    if (!editArea) { toast.error("Area is required"); return; }
    if (!editAddress.trim()) { toast.error("Garage Location / Address is required"); return; }
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

  const greeting = greetingFor();
  const GreetIcon = greeting === "Good Morning" ? Sun : greeting === "Good Afternoon" ? Sunset : Moon;

  return (
    <div className="min-h-screen bg-background">
      <InAppBrowserGate />
      <LocationPermissionGate />
      <PWAInstallPrompt />
      <Navbar role="mechanic" onLogout={handleLogout} />
      <div className="container max-w-2xl py-4 px-4">
        {/* Personalized greeting */}
        <div className="mb-4 flex items-center gap-3 animate-fade-in">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <GreetIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-foreground truncate">
              {greeting}, {firstName(mechanicProfile?.name)}
            </h1>
            <p className="text-xs text-muted-foreground">
              {isAvailable ? "You're online and receiving requests." : "You're offline — turn availability on to get requests."}
            </p>
          </div>
        </div>

        <Tabs defaultValue="issues" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-secondary">
            <TabsTrigger value="issues" className="text-xs gap-1.5"><Wrench className="h-3.5 w-3.5" /> Requests</TabsTrigger>
            <TabsTrigger value="scheduled" className="text-xs gap-1.5"><CalendarClock className="h-3.5 w-3.5" /> Scheduled</TabsTrigger>
            <TabsTrigger value="profile" className="text-xs gap-1.5"><User className="h-3.5 w-3.5" /> Profile</TabsTrigger>
          </TabsList>

          {/* REQUESTS HOME — map + incoming list */}
          <TabsContent value="issues" className="space-y-4 mt-4">
            <MechanicRequestsHome />
          </TabsContent>

          {/* SCHEDULED SERVICES */}
          <TabsContent value="scheduled" className="space-y-4 mt-4">
            <ScheduledServices />
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
                <span className="text-xs text-muted-foreground mt-1">Profile Photo</span>
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

            <ContactUsSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MechanicDashboard;
