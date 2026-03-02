import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { chennaiAreas } from "@/data/chennaiAreas";
import { toast } from "sonner";
import { User, MapPin, Hash, Car, Plus, X, Save, Loader2, Camera, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { user, profile, mechanicProfile, userRole, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [pincode, setPincode] = useState("");
  const [saving, setSaving] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [newVehicle, setNewVehicle] = useState({ vehicle_type: "", vehicle_brand: "", vehicle_model: "", vehicle_year: "" });
  const [addingVehicle, setAddingVehicle] = useState(false);
  const [pastIssues, setPastIssues] = useState<any[]>([]);

  // Mechanic fields
  const [garageName, setGarageName] = useState("");
  const [garagePhoto, setGaragePhoto] = useState<File | null>(null);
  const [garagePhotoPreview, setGaragePhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setArea(profile.area || "");
      setPincode(profile.pincode || "");
    }
    if (mechanicProfile) {
      setGarageName(mechanicProfile.garage_name || "");
      setGaragePhotoPreview(mechanicProfile.garage_photo_url || null);
    }
    if (user) {
      loadVehicles();
      loadPastIssues();
    }
  }, [profile, mechanicProfile, user]);

  const loadVehicles = async () => {
    const { data } = await supabase.from("vehicles").select("*").eq("user_id", user!.id);
    setVehicles(data || []);
  };

  const loadPastIssues = async () => {
    const { data } = await supabase.from("issues").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
    setPastIssues(data || []);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({
        name, area, pincode, updated_at: new Date().toISOString(),
      }).eq("user_id", user!.id);
      if (error) throw error;

      // Update mechanic profile if applicable
      if (userRole === "mechanic" && mechanicProfile) {
        let photoUrl = mechanicProfile.garage_photo_url;
        if (garagePhoto) {
          const ext = garagePhoto.name.split(".").pop();
          const path = `${user!.id}/garage.${ext}`;
          await supabase.storage.from("garage-photos").upload(path, garagePhoto, { upsert: true });
          const { data } = supabase.storage.from("garage-photos").getPublicUrl(path);
          photoUrl = data.publicUrl;
        }
        await supabase.from("mechanic_profiles").update({
          name, garage_name: garageName, area, pincode, garage_photo_url: photoUrl, updated_at: new Date().toISOString(),
        }).eq("user_id", user!.id);
      }

      await refreshProfile();
      toast.success("Profile updated!");
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleAddVehicle = async () => {
    if (!newVehicle.vehicle_type.trim()) { toast.error("Enter vehicle type"); return; }
    setAddingVehicle(true);
    try {
      const { error } = await supabase.from("vehicles").insert({
        user_id: user!.id,
        ...newVehicle,
      });
      if (error) throw error;
      setNewVehicle({ vehicle_type: "", vehicle_brand: "", vehicle_model: "", vehicle_year: "" });
      loadVehicles();
      toast.success("Vehicle added!");
    } catch (e: any) {
      toast.error(e.message || "Failed to add vehicle");
    } finally {
      setAddingVehicle(false);
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    await supabase.from("vehicles").delete().eq("id", id);
    loadVehicles();
    toast.success("Vehicle removed");
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar role={userRole} onLogout={handleLogout} />
      <div className="container max-w-lg py-6 px-4 space-y-6">
        <h1 className="font-brand text-2xl font-bold text-foreground">Profile</h1>

        <div className="bg-card rounded-xl p-5 border border-border space-y-4">
          {/* Mechanic: Garage Photo */}
          {userRole === "mechanic" && (
            <>
              <div className="flex flex-col items-center">
                <label className="cursor-pointer group">
                  <div className="h-20 w-20 rounded-full bg-secondary border-2 border-dashed border-border flex items-center justify-center overflow-hidden group-hover:border-primary transition-colors">
                    {garagePhotoPreview ? (
                      <img src={garagePhotoPreview} alt="Garage" className="h-full w-full object-cover" />
                    ) : (
                      <Camera className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setGaragePhoto(file);
                      const reader = new FileReader();
                      reader.onload = () => setGaragePhotoPreview(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }} />
                </label>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-2">
                  <Store className="h-4 w-4" /> Garage Name
                </label>
                <Input value={garageName} onChange={(e) => setGarageName(e.target.value)} className="bg-secondary border-0" />
              </div>
            </>
          )}

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-2">
              <User className="h-4 w-4" /> Name
            </label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-secondary border-0" />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Area
            </label>
            <Select value={area} onValueChange={setArea}>
              <SelectTrigger className="bg-secondary border-0"><SelectValue /></SelectTrigger>
              <SelectContent>
                {chennaiAreas.map((a) => (<SelectItem key={a} value={a}>{a}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-2">
              <Hash className="h-4 w-4" /> Pincode
            </label>
            <Input value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))} maxLength={6} className="bg-secondary border-0" />
          </div>
          <Button className="w-full" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>

        {/* Vehicles Section (User only) */}
        {userRole === "user" && (
          <div className="bg-card rounded-xl p-5 border border-border space-y-3">
            <h2 className="text-foreground font-semibold flex items-center gap-2">
              <Car className="h-4 w-4 text-primary" /> My Vehicles
            </h2>
            {vehicles.map((v: any) => (
              <div key={v.id} className="flex items-center justify-between bg-secondary rounded-lg p-3">
                <div>
                  <p className="text-sm text-foreground font-medium">{v.vehicle_brand} {v.vehicle_model}</p>
                  <p className="text-xs text-muted-foreground">{v.vehicle_type} {v.vehicle_year && `• ${v.vehicle_year}`}</p>
                </div>
                <button onClick={() => handleDeleteVehicle(v.id)} className="text-muted-foreground hover:text-destructive">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <div className="bg-secondary rounded-lg p-3 space-y-2">
              <Input value={newVehicle.vehicle_type} onChange={(e) => setNewVehicle({ ...newVehicle, vehicle_type: e.target.value })} placeholder="Type (Car, Bike...)" className="bg-card border-0 text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <Input value={newVehicle.vehicle_brand} onChange={(e) => setNewVehicle({ ...newVehicle, vehicle_brand: e.target.value })} placeholder="Brand" className="bg-card border-0 text-sm" />
                <Input value={newVehicle.vehicle_model} onChange={(e) => setNewVehicle({ ...newVehicle, vehicle_model: e.target.value })} placeholder="Model" className="bg-card border-0 text-sm" />
              </div>
              <Button size="sm" variant="outline" className="w-full" onClick={handleAddVehicle} disabled={addingVehicle}>
                {addingVehicle ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                Add Vehicle
              </Button>
            </div>
          </div>
        )}

        {/* Past Issues (User only) */}
        {userRole === "user" && pastIssues.length > 0 && (
          <div className="bg-card rounded-xl p-5 border border-border space-y-3">
            <h2 className="text-foreground font-semibold">Past Issues</h2>
            {pastIssues.map((issue: any) => (
              <div key={issue.id} className="bg-secondary rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-foreground truncate flex-1">{issue.description || "No description"}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ml-2 ${
                    issue.status === "open" ? "bg-warning/20 text-warning" :
                    issue.status === "confirmed" ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
                  }`}>{issue.status}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{new Date(issue.created_at).toLocaleDateString()}</p>
                {issue.ai_analysis && (
                  <p className="text-xs text-primary mt-1">AI: {issue.ai_analysis.issue}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
