import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (phone.length !== 10) {
      toast.error("Enter a valid 10-digit phone number");
      return;
    }
    setLoading(true);
    // TODO: Integrate with backend OTP service
    setTimeout(() => {
      setStep("otp");
      setLoading(false);
      toast.success("OTP sent successfully!");
    }, 1000);
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 4) {
      toast.error("Enter a valid 4-digit OTP");
      return;
    }
    setLoading(true);
    // TODO: Verify OTP and check user in database
    setTimeout(() => {
      setLoading(false);
      // Simulating new user → go to role selection
      navigate("/role-select");
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm flex flex-col items-center">
        <img src={logo} alt="After Brakes" className="h-16 w-16 mb-4 animate-fade-in" />
        <h1 className="font-brand text-3xl font-bold text-foreground mb-1">After Brakes</h1>
        <div className="h-1 w-16 bg-primary rounded-full mb-2 animate-pulse-glow" />
        <p className="text-muted-foreground text-sm mb-8">Right Mechanic. Right Time.</p>

        <div className="w-full bg-card rounded-xl p-6 border border-border animate-slide-up">
          {step === "phone" ? (
            <>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Phone Number
              </label>
              <div className="flex gap-2 mb-4">
                <div className="flex items-center bg-secondary rounded-lg px-3 text-sm text-muted-foreground">
                  +91
                </div>
                <Input
                  type="tel"
                  placeholder="Enter 10-digit number"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="bg-secondary border-0 text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleSendOTP}
                disabled={loading || phone.length !== 10}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Phone className="h-4 w-4 mr-2" />}
                Send OTP
              </Button>
            </>
          ) : (
            <>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Enter OTP sent to +91 {phone}
              </label>
              <div className="flex gap-2 justify-center mb-4">
                {[0, 1, 2, 3].map((i) => (
                  <Input
                    key={i}
                    type="text"
                    maxLength={1}
                    value={otp[i] || ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      const newOtp = otp.split("");
                      newOtp[i] = val;
                      setOtp(newOtp.join(""));
                      if (val && e.target.nextElementSibling) {
                        (e.target.nextElementSibling as HTMLInputElement)?.focus();
                      }
                    }}
                    className="w-12 h-12 text-center text-lg bg-secondary border-0 text-foreground"
                  />
                ))}
              </div>
              <Button
                className="w-full"
                onClick={handleVerifyOTP}
                disabled={loading || otp.length !== 4}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                Verify OTP
              </Button>
              <button
                className="w-full text-center text-sm text-muted-foreground mt-3 hover:text-primary transition-colors"
                onClick={() => { setStep("phone"); setOtp(""); }}
              >
                Change phone number
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
