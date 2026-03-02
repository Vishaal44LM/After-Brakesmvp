import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { chennaiAreas } from "@/data/chennaiAreas";
import { toast } from "sonner";
import { User, MapPin, Hash, Loader2, Car, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Vehicle {
  vehicle_type: string;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_year: string;
}

const UserSetup = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [pincode, setPincode] = useState("");
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([{ vehicle_type: "", vehicle_brand: "", vehicle_model: "", vehicle_year: "" }]);

  const addVehicle = () => {
    setVehicles([...vehicles, { vehicle_type: "", vehicle_brand: "", vehicle_model: "", vehicle_year: "" }]);
  };

  const removeVehicle = (index: number) => {
    if (vehicles.length > 1) {
      setVehicles(vehicles.filter((_, i) => i !== index));
    }
  };

  const updateVehicle = (index: number, field: keyof Vehicle, value: string) => {
    const updated = [...vehicles];
    updated[index][field] = value;
    setVehicles(updated);
  };

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error("Enter your name"); return; }
    if (!area) { toast.error("Select your area"); return; }
    if (pincode.length !== 6) { toast.error("Enter a valid 6-digit pincode"); return; }
    
    const validVehicles = vehicles.filter(v => v.vehicle_type.trim());
    if (validVehicles.length === 0) { toast.error("Add at least one vehicle"); return; }

    if (!user) { toast.error("Not authenticated"); return; }

    setLoading(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ name, area, pincode, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
      if (profileError) throw profileError;

      // Insert vehicles
      const vehicleData = validVehicles.map(v => ({
        user_id: user.id,
        vehicle_type: v.vehicle_type,
        vehicle_brand: v.vehicle_brand || null,
        vehicle_model: v.vehicle_model || null,
        vehicle_year: v.vehicle_year || null,
      }));

      const { error: vehicleError } = await supabase.from("vehicles").insert(vehicleData);
      if (vehicleError) throw vehicleError;

      await refreshProfile();
      toast.success("Profile set up successfully!");
      navigate("/dashboard");
    } catch (e: any) {
      toast.error(e.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <h1 className="font-brand text-2xl font-bold text-foreground mb-1 text-center">Set Up Your Profile</h1>
        <p className="text-muted-foreground text-sm mb-8 text-center">Tell us a bit about yourself</p>

        <div className="bg-card rounded-xl p-6 border border-border space-y-4 animate-slide-up">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-2">
              <User className="h-4 w-4" /> Name
            </label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className="bg-secondary border-0" />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Area
            </label>
            <Select value={area} onValueChange={setArea}>
              <SelectTrigger className="bg-secondary border-0">
                <SelectValue placeholder="Select your area" />
              </SelectTrigger>
              <SelectContent>
                {chennaiAreas.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-2">
              <Hash className="h-4 w-4" /> Pincode
            </label>
            <Input
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
              placeholder="6-digit pincode"
              maxLength={6}
              className="bg-secondary border-0"
            />
          </div>

          {/* Vehicles Section */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Car className="h-4 w-4" /> Your Vehicles
            </label>
            {vehicles.map((v, i) => (
              <div key={i} className="bg-secondary rounded-lg p-3 mb-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Vehicle {i + 1}</span>
                  {vehicles.length > 1 && (
                    <button onClick={() => removeVehicle(i)} className="text-muted-foreground hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <Input
                  value={v.vehicle_type}
                  onChange={(e) => updateVehicle(i, "vehicle_type", e.target.value)}
                  placeholder="Vehicle type (e.g., Car, Bike)"
                  className="bg-card border-0 text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={v.vehicle_brand}
                    onChange={(e) => updateVehicle(i, "vehicle_brand", e.target.value)}
                    placeholder="Brand"
                    className="bg-card border-0 text-sm"
                  />
                  <Input
                    value={v.vehicle_model}
                    onChange={(e) => updateVehicle(i, "vehicle_model", e.target.value)}
                    placeholder="Model"
                    className="bg-card border-0 text-sm"
                  />
                </div>
                <Input
                  value={v.vehicle_year}
                  onChange={(e) => updateVehicle(i, "vehicle_year", e.target.value.replace(/\D/g, ""))}
                  placeholder="Year"
                  maxLength={4}
                  className="bg-card border-0 text-sm"
                />
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addVehicle} className="w-full mt-1">
              <Plus className="h-3 w-3 mr-1" /> Add Another Vehicle
            </Button>
          </div>

          <Button className="w-full mt-2" onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserSetup;
