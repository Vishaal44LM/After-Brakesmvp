import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, ArrowRight, ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const selectedRole = localStorage.getItem("afterbrakes_selected_role") as "user" | "mechanic" | null;

  const startResendTimer = () => {
    setResendTimer(30);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOTP = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid email address");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("auth-email-otp", {
        body: { email, action: "send-otp" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("OTP sent to your email!");
      setStep("otp");
      startResendTimer();
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (e: any) {
      toast.error(e.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpInput = (value: string, index: number) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = otp.split("");
    while (newOtp.length < 4) newOtp.push("");
    newOtp[index] = digit;
    setOtp(newOtp.join(""));
    if (digit && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
      const newOtp = otp.split("");
      newOtp[index - 1] = "";
      setOtp(newOtp.join(""));
    }
  };

  const handleVerifyOTP = async () => {
    const cleanOtp = otp.replace(/\s/g, "");
    if (cleanOtp.length !== 4) {
      toast.error("Enter the 4-digit OTP");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("auth-email-otp", {
        body: { email, otp: cleanOtp, action: "verify-otp" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Sign in with credentials
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (signInError) throw signInError;

      localStorage.setItem("afterbrakes_email", email);

      if (data.isNew || !data.role) {
        const role = selectedRole || "user";
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          await supabase.from("user_roles").insert({ user_id: currentUser.id, role });
        }
        navigate(role === "mechanic" ? "/setup/mechanic" : "/setup/user");
      } else if (data.role === "user") {
        navigate(data.profileComplete ? "/dashboard" : "/setup/user");
      } else if (data.role === "mechanic") {
        navigate(data.profileComplete ? "/mechanic-dashboard" : "/setup/mechanic");
      }
    } catch (e: any) {
      toast.error(e.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    await handleSendOTP();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm flex flex-col items-center">
        <img src={logo} alt="After Brakes" className="h-16 w-16 mb-4 animate-fade-in" />
        <h1 className="font-brand text-3xl font-bold text-foreground mb-1">After Brakes</h1>
        <div className="h-1 w-16 bg-primary rounded-full mb-2 animate-pulse-glow" />
        <p className="text-muted-foreground text-sm mb-8">Right Mechanic. Right Time.</p>

        <div className="w-full bg-card rounded-xl p-6 border border-border animate-slide-up">
          {step === "email" && (
            <>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Email Address</label>
              <div className="flex gap-2 mb-4">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim())}
                  className="bg-secondary border-0 text-foreground placeholder:text-muted-foreground"
                  onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
                />
              </div>
              <Button className="w-full" onClick={handleSendOTP} disabled={loading || !email}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                Send OTP
              </Button>
            </>
          )}

          {step === "otp" && (
            <>
              <div className="text-center mb-4">
                <ShieldCheck className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">Enter the OTP sent to</p>
                <p className="text-xs text-muted-foreground mt-1">{email}</p>
              </div>

              <div className="flex gap-3 justify-center mb-4">
                {[0, 1, 2, 3].map((i) => (
                  <Input
                    key={`otp-${i}`}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={otp[i] || ""}
                    onChange={(e) => handleOtpInput(e.target.value, i)}
                    onKeyDown={(e) => handleOtpKeyDown(e, i)}
                    className="w-14 h-14 text-center text-xl bg-secondary border-0 text-foreground font-bold"
                  />
                ))}
              </div>

              <Button className="w-full" onClick={handleVerifyOTP} disabled={loading || otp.replace(/\s/g, "").length !== 4}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                Verify & Continue
              </Button>

              <button
                className="w-full text-center text-sm text-muted-foreground mt-3 hover:text-primary transition-colors disabled:opacity-50"
                onClick={handleResendOTP}
                disabled={resendTimer > 0}
              >
                {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
              </button>

              <button
                className="w-full text-center text-sm text-muted-foreground mt-2 hover:text-primary transition-colors"
                onClick={() => { setStep("email"); setOtp(""); }}
              >
                Change email
              </button>
            </>
          )}
        </div>

        <button onClick={() => navigate("/")} className="mt-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Role Selection
        </button>
      </div>
    </div>
  );
};

export default Login;
