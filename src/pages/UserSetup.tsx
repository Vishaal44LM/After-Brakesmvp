import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { chennaiAreas } from "@/data/chennaiAreas";
import { toast } from "sonner";
import { User, MapPin, Hash, Loader2 } from "lucide-react";

const UserSetup = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [pincode, setPincode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if (!name.trim()) { toast.error("Enter your name"); return; }
    if (!area) { toast.error("Select your area"); return; }
    if (pincode.length !== 6) { toast.error("Enter a valid 6-digit pincode"); return; }
    setLoading(true);
    // TODO: Save to database
    setTimeout(() => {
      setLoading(false);
      navigate("/dashboard");
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
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
