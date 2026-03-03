import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { chennaiAreas } from "@/data/chennaiAreas";
import { toast } from "sonner";
import { User, MapPin, Hash, Loader2, Car, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Vehicle {
  vehicle_type: string;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_year: string;
  fuel_type: string;
  transmission: string;
}

const vehicleTypes = ["Car", "Bike", "Scooter", "Auto", "Truck", "Bus", "Van"];
const fuelTypes = ["Petrol", "Diesel", "Electric", "CNG", "Hybrid"];
const transmissions = ["Manual", "Automatic", "CVT", "DCT", "AMT"];

const UserSetup = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [pincode, setPincode] = useState("");
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    { vehicle_type: "", vehicle_brand: "", vehicle_model: "", vehicle_year: "", fuel_type: "", transmission: "" },
  ]);

  const updateVehicle = (index: number, field: keyof Vehicle, value: string) => {
    setVehicles((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  };

  const addVehicle = () => {
    setVehicles((prev) => [...prev, { vehicle_type: "", vehicle_brand: "", vehicle_model: "", vehicle_year: "", fuel_type: "", transmission: "" }]);
  };

  const removeVehicle = (index: number) => {
    if (vehicles.length <= 1) return;
    setVehicles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error("Enter your name"); return; }
    if (!area) { toast.error("Select your area"); return; }
    if (pincode.length !== 6) { toast.error("Enter a valid 6-digit pincode"); return; }
    
    const validVehicles = vehicles.filter((v) => v.vehicle_type);
    if (validVehicles.length === 0) { toast.error("Add at least one vehicle"); return; }

    if (!user) { toast.error("Please login first"); return; }

    setLoading(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ name, area, pincode })
        .eq("user_id", user.id);
      if (profileError) throw profileError;

      // Insert vehicles
      const vehicleInserts = validVehicles.map((v) => ({
        user_id: user.id,
        vehicle_type: v.vehicle_type,
        vehicle_brand: v.vehicle_brand || null,
        vehicle_model: v.vehicle_model || null,
        vehicle_year: v.vehicle_year || null,
        fuel_type: v.fuel_type || null,
        transmission: v.transmission || null,
      }));

      const { error: vehicleError } = await supabase.from("vehicles").insert(vehicleInserts);
      if (vehicleError) throw vehicleError;

      await refreshProfile();
      toast.success("Profile setup complete!");
      navigate("/dashboard");
    } catch (e: any) {
      toast.error(e.message || "Setup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <button onClick={() => navigate("/role-select")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h1 className="font-brand text-2xl font-bold text-foreground mb-1 text-center">Set Up Your Profile</h1>
        <p className="text-muted-foreground text-sm mb-6 text-center">Tell us about yourself and your vehicle</p>

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
              <SelectTrigger className="bg-secondary border-0"><SelectValue placeholder="Select your area" /></SelectTrigger>
              <SelectContent>
                {chennaiAreas.map((a) => (<SelectItem key={a} value={a}>{a}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-2">
              <Hash className="h-4 w-4" /> Pincode
            </label>
            <Input value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))} placeholder="6-digit pincode" maxLength={6} className="bg-secondary border-0" />
          </div>
        </div>

        {/* Vehicles */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Car className="h-4 w-4 text-primary" /> Your Vehicles</h3>
            <Button size="sm" variant="outline" onClick={addVehicle}><Plus className="h-3 w-3 mr-1" /> Add</Button>
          </div>
          {vehicles.map((v, i) => (
            <div key={i} className="bg-card rounded-xl p-4 border border-border space-y-3 animate-slide-up">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Vehicle {i + 1}</span>
                {vehicles.length > 1 && (
                  <button onClick={() => removeVehicle(i)} className="text-destructive hover:text-destructive/80">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Select value={v.vehicle_type} onValueChange={(val) => updateVehicle(i, "vehicle_type", val)}>
                <SelectTrigger className="bg-secondary border-0"><SelectValue placeholder="Vehicle Type" /></SelectTrigger>
                <SelectContent>{vehicleTypes.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}</SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-2">
                <Input value={v.vehicle_brand} onChange={(e) => updateVehicle(i, "vehicle_brand", e.target.value)} placeholder="Brand (e.g. Honda)" className="bg-secondary border-0" />
                <Input value={v.vehicle_model} onChange={(e) => updateVehicle(i, "vehicle_model", e.target.value)} placeholder="Model (e.g. City)" className="bg-secondary border-0" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Input value={v.vehicle_year} onChange={(e) => updateVehicle(i, "vehicle_year", e.target.value.replace(/\D/g, ""))} placeholder="Year" maxLength={4} className="bg-secondary border-0" />
                <Select value={v.fuel_type} onValueChange={(val) => updateVehicle(i, "fuel_type", val)}>
                  <SelectTrigger className="bg-secondary border-0"><SelectValue placeholder="Fuel" /></SelectTrigger>
                  <SelectContent>{fuelTypes.map((f) => (<SelectItem key={f} value={f}>{f}</SelectItem>))}</SelectContent>
                </Select>
                <Select value={v.transmission} onValueChange={(val) => updateVehicle(i, "transmission", val)}>
                  <SelectTrigger className="bg-secondary border-0"><SelectValue placeholder="Trans." /></SelectTrigger>
                  <SelectContent>{transmissions.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>

        <Button className="w-full mt-4" onClick={handleSubmit} disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Continue to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default UserSetup;
