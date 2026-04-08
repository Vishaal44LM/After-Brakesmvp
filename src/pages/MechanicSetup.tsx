import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { chennaiAreas } from "@/data/chennaiAreas";
import { toast } from "sonner";
import { User, Store, MapPin, Camera, Loader2, ArrowLeft, FileCheck, Clock, Link, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const MechanicSetup = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [garageName, setGarageName] = useState("");
  const [area, setArea] = useState("");
  const [garageAddress, setGarageAddress] = useState("");
  const [googleMapsLink, setGoogleMapsLink] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [garagePhoto, setGaragePhoto] = useState<File | null>(null);
  const [garagePhotoPreview, setGaragePhotoPreview] = useState<string | null>(null);
  const [idProofFile, setIdProofFile] = useState<File | null>(null);
  const [idProofPreview, setIdProofPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setGaragePhoto(file);
      const reader = new FileReader();
      reader.onload = () => setGaragePhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleIdProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIdProofFile(file);
      const reader = new FileReader();
      reader.onload = () => setIdProofPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error("Enter your name"); return; }
    if (!garageName.trim()) { toast.error("Enter your garage name"); return; }
    if (!area) { toast.error("Select your area"); return; }
    if (!garageAddress.trim()) { toast.error("Enter your garage address"); return; }
    if (!idProofFile) { toast.error("Upload an ID proof"); return; }
    if (!yearsOfExperience) { toast.error("Enter years of experience"); return; }
    if (!user) { toast.error("Please login first"); return; }

    setLoading(true);
    try {
      let garagePhotoUrl: string | null = null;
      let idProofUrl: string | null = null;

      if (garagePhoto) {
        const ext = garagePhoto.name.split(".").pop();
        const filePath = `${user.id}/garage.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("garage-photos")
          .upload(filePath, garagePhoto, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("garage-photos").getPublicUrl(filePath);
        garagePhotoUrl = urlData.publicUrl;
      }

      const idExt = idProofFile.name.split(".").pop();
      const idPath = `${user.id}/id-proof.${idExt}`;
      const { error: idUploadError } = await supabase.storage
        .from("garage-photos")
        .upload(idPath, idProofFile, { upsert: true });
      if (idUploadError) throw idUploadError;
      const { data: idUrlData } = supabase.storage.from("garage-photos").getPublicUrl(idPath);
      idProofUrl = idUrlData.publicUrl;

      await supabase.from("profiles").update({ name, area }).eq("user_id", user.id);

      const { error } = await supabase.from("mechanic_profiles").insert({
        user_id: user.id,
        name,
        garage_name: garageName,
        garage_photo_url: garagePhotoUrl,
        area,
        pincode: "000000",
        garage_address: garageAddress,
        google_maps_link: googleMapsLink || null,
        years_of_experience: parseInt(yearsOfExperience) || null,
        id_proof_url: idProofUrl,
        id_proof_verified: false,
        phone_number: phoneNumber || null,
      } as any);
      if (error) throw error;

      await refreshProfile();
      toast.success("Garage profile created!");
      navigate("/mechanic-dashboard");
    } catch (e: any) {
      toast.error(e.message || "Setup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h1 className="font-brand text-2xl font-bold text-foreground mb-1 text-center">Mechanic Profile</h1>
        <p className="text-muted-foreground text-sm mb-6 text-center">Set up your garage details</p>

        <div className="bg-card rounded-xl p-6 border border-border space-y-4 animate-slide-up">
          <div className="flex flex-col items-center">
            <label className="cursor-pointer group">
              <div className="h-24 w-24 rounded-full bg-secondary border-2 border-dashed border-border flex items-center justify-center overflow-hidden group-hover:border-primary transition-colors">
                {garagePhotoPreview ? (
                  <img src={garagePhotoPreview} alt="Garage" className="h-full w-full object-cover" />
                ) : (
                  <Camera className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
            <span className="text-xs text-muted-foreground mt-2">Upload garage photo</span>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-2"><User className="h-4 w-4" /> Your Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="bg-secondary border-0" />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-2"><Store className="h-4 w-4" /> Garage Name</label>
            <Input value={garageName} onChange={(e) => setGarageName(e.target.value)} placeholder="Your garage name" className="bg-secondary border-0" />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-2"><MapPin className="h-4 w-4" /> Area</label>
            <Select value={area} onValueChange={setArea}>
              <SelectTrigger className="bg-secondary border-0"><SelectValue placeholder="Select area" /></SelectTrigger>
              <SelectContent>{chennaiAreas.map((a) => (<SelectItem key={a} value={a}>{a}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-2"><MapPin className="h-4 w-4" /> Garage Address <span className="text-destructive">*</span></label>
            <Textarea value={garageAddress} onChange={(e) => setGarageAddress(e.target.value)} placeholder="Full garage address" className="bg-secondary border-0 min-h-[60px]" />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-2"><Link className="h-4 w-4" /> Google Maps Link <span className="text-xs">(optional)</span></label>
            <Input value={googleMapsLink} onChange={(e) => setGoogleMapsLink(e.target.value)} placeholder="https://maps.google.com/..." className="bg-secondary border-0" />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-2"><Clock className="h-4 w-4" /> Years of Experience</label>
            <Input value={yearsOfExperience} onChange={(e) => setYearsOfExperience(e.target.value.replace(/\D/g, ""))} placeholder="e.g. 5" maxLength={2} className="bg-secondary border-0" />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-2"><Phone className="h-4 w-4" /> Phone Number</label>
            <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))} placeholder="10-digit number" maxLength={10} className="bg-secondary border-0" />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-2"><FileCheck className="h-4 w-4" /> ID Proof <span className="text-destructive">*</span></label>
            <p className="text-xs text-muted-foreground mb-2">Upload any government ID (Aadhaar, PAN, Driving License, etc.)</p>
            <label className="cursor-pointer">
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-secondary text-muted-foreground text-sm hover:text-primary transition-colors border border-dashed border-border">
                <FileCheck className="h-4 w-4" /> {idProofPreview ? "Change ID Proof" : "Upload ID Proof"}
              </div>
              <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleIdProofUpload} />
            </label>
            {idProofPreview && (
              <img src={idProofPreview} alt="ID Proof" className="h-20 rounded-lg mt-2 object-cover border border-border" />
            )}
          </div>
          <Button className="w-full mt-2" onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Continue to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MechanicSetup;
