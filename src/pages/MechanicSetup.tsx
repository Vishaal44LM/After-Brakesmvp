import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { chennaiAreas } from "@/data/chennaiAreas";
import { toast } from "sonner";
import { User, Store, MapPin, Hash, Camera, Loader2 } from "lucide-react";

const MechanicSetup = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [garageName, setGarageName] = useState("");
  const [area, setArea] = useState("");
  const [pincode, setPincode] = useState("");
  const [garagePhoto, setGaragePhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setGaragePhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) { toast.error("Enter your name"); return; }
    if (!garageName.trim()) { toast.error("Enter your garage name"); return; }
    if (!area) { toast.error("Select your area"); return; }
    if (pincode.length !== 6) { toast.error("Enter a valid 6-digit pincode"); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/mechanic-dashboard");
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <h1 className="font-brand text-2xl font-bold text-foreground mb-1 text-center">Mechanic Profile</h1>
        <p className="text-muted-foreground text-sm mb-8 text-center">Set up your garage details</p>

        <div className="bg-card rounded-xl p-6 border border-border space-y-4 animate-slide-up">
          {/* Garage Photo */}
          <div className="flex flex-col items-center">
            <label className="cursor-pointer group">
              <div className="h-24 w-24 rounded-full bg-secondary border-2 border-dashed border-border flex items-center justify-center overflow-hidden group-hover:border-primary transition-colors">
                {garagePhoto ? (
                  <img src={garagePhoto} alt="Garage" className="h-full w-full object-cover" />
                ) : (
                  <Camera className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
            <span className="text-xs text-muted-foreground mt-2">Upload garage photo</span>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-2">
              <User className="h-4 w-4" /> Your Name
            </label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="bg-secondary border-0" />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-2">
              <Store className="h-4 w-4" /> Garage Name
            </label>
            <Input value={garageName} onChange={(e) => setGarageName(e.target.value)} placeholder="Your garage name" className="bg-secondary border-0" />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Area
            </label>
            <Select value={area} onValueChange={setArea}>
              <SelectTrigger className="bg-secondary border-0"><SelectValue placeholder="Select area" /></SelectTrigger>
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
          <Button className="w-full mt-2" onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MechanicSetup;
