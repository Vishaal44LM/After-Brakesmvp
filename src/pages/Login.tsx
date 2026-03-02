import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [demoOtp, setDemoOtp] = useState<string | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSendOTP = async () => {
    if (phone.length !== 10) {
      toast.error("Enter a valid 10-digit phone number");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: { phone },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      setDemoOtp(data.demo_otp);
      setStep("otp");
      toast.success(`OTP sent! Demo OTP: ${data.demo_otp}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const val = value.replace(/\D/g, "").slice(0, 1);
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    if (val && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const code = otp.join("");
    if (code.length !== 4) {
      toast.error("Enter a valid 4-digit OTP");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: { phone, code },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Set session from the edge function response
      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      }

      // Route based on user state
      if (data.isNewUser || !data.role) {
        navigate("/role-select");
      } else if (data.role === "user" && data.hasProfile) {
        navigate("/dashboard");
      } else if (data.role === "mechanic" && data.hasMechanicProfile) {
        navigate("/mechanic-dashboard");
      } else if (data.role === "user") {
        navigate("/setup/user");
      } else if (data.role === "mechanic") {
        navigate("/setup/mechanic");
      } else {
        navigate("/role-select");
      }
    } catch (e: any) {
      toast.error(e.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
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
                  onKeyDown={(e) => e.key === "Enter" && phone.length === 10 && handleSendOTP()}
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
              {demoOtp && (
                <p className="text-xs text-primary mb-3 text-center">Demo OTP: <strong>{demoOtp}</strong></p>
              )}
              <div className="flex gap-3 justify-center mb-4">
                {[0, 1, 2, 3].map((i) => (
                  <Input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={otp[i]}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-12 h-12 text-center text-lg bg-secondary border-0 text-foreground"
                    autoFocus={i === 0}
                  />
                ))}
              </div>
              <Button
                className="w-full"
                onClick={handleVerifyOTP}
                disabled={loading || otp.join("").length !== 4}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                Verify OTP
              </Button>
              <button
                className="w-full text-center text-sm text-muted-foreground mt-3 hover:text-primary transition-colors"
                onClick={() => { setStep("phone"); setOtp(["", "", "", ""]); setDemoOtp(null); }}
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
