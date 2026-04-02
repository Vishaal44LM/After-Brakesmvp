import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, ArrowRight, ArrowLeft, Loader2, Lock, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<"phone" | "set-pin" | "enter-pin">("phone");
  const [loading, setLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmPinRefs = useRef<(HTMLInputElement | null)[]>([]);

  const selectedRole = localStorage.getItem("afterbrakes_selected_role") as "user" | "mechanic" | null;
  const savedPhone = localStorage.getItem("afterbrakes_phone");

  useEffect(() => {
    // Clear stale auth on login page
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session && savedPhone) {
        // Returning user with saved phone - auto check
        setPhone(savedPhone);
        handleCheckPhone(savedPhone);
      }
    });
  }, []);

  const handleCheckPhone = async (phoneNum: string) => {
    if (!/^\d{10}$/.test(phoneNum)) {
      toast.error("Enter a valid 10-digit phone number");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("auth-pin", {
        body: { phone: phoneNum, action: "check" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data.exists && data.hasPin) {
        setStep("enter-pin");
        setIsNewUser(false);
      } else if (data.exists && !data.hasPin) {
        // Existing user migrating from OTP - needs to set PIN
        setStep("set-pin");
        setIsNewUser(false);
      } else {
        setStep("set-pin");
        setIsNewUser(true);
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to check phone");
    } finally {
      setLoading(false);
    }
  };

  const handlePinInput = (value: string, index: number, setter: (v: string) => void, currentPin: string, refs: React.MutableRefObject<(HTMLInputElement | null)[]>) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newPin = currentPin.split("");
    newPin[index] = digit;
    setter(newPin.join(""));
    if (digit && index < 3) {
      refs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyDown = (e: React.KeyboardEvent, index: number, currentPin: string, setter: (v: string) => void, refs: React.MutableRefObject<(HTMLInputElement | null)[]>) => {
    if (e.key === "Backspace" && !currentPin[index] && index > 0) {
      refs.current[index - 1]?.focus();
      const newPin = currentPin.split("");
      newPin[index - 1] = "";
      setter(newPin.join(""));
    }
  };

  const handleRegister = async () => {
    if (pin.replace(/\s/g, "").length !== 4) {
      toast.error("Enter a 4-digit PIN");
      return;
    }
    if (pin !== confirmPin) {
      toast.error("PINs don't match");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("auth-pin", {
        body: { phone, pin, action: "register" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Sign in with the new credentials
      const email = data.email;
      const password = `AB_pin_${phone}_${pin}`;
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      // Save phone to localStorage
      localStorage.setItem("afterbrakes_phone", phone);

      if (data.isNew || !data.role) {
        // New user - assign role
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
      toast.error(e.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (pin.replace(/\s/g, "").length !== 4) {
      toast.error("Enter your 4-digit PIN");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("auth-pin", {
        body: { phone, pin, action: "login" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const email = data.email;
      const password = `AB_pin_${phone}_${pin}`;
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      localStorage.setItem("afterbrakes_phone", phone);

      if (!data.role) {
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
      toast.error(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeNumber = () => {
    setStep("phone");
    setPhone("");
    setPin("");
    setConfirmPin("");
    localStorage.removeItem("afterbrakes_phone");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm flex flex-col items-center">
        <img src={logo} alt="After Brakes" className="h-16 w-16 mb-4 animate-fade-in" />
        <h1 className="font-brand text-3xl font-bold text-foreground mb-1">After Brakes</h1>
        <div className="h-1 w-16 bg-primary rounded-full mb-2 animate-pulse-glow" />
        <p className="text-muted-foreground text-sm mb-8">Right Mechanic. Right Time.</p>

        <div className="w-full bg-card rounded-xl p-6 border border-border animate-slide-up">
          {step === "phone" && (
            <>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Phone Number</label>
              <div className="flex gap-2 mb-4">
                <div className="flex items-center bg-secondary rounded-lg px-3 text-sm text-muted-foreground">+91</div>
                <Input
                  type="tel"
                  placeholder="Enter 10-digit number"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="bg-secondary border-0 text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <Button className="w-full" onClick={() => handleCheckPhone(phone)} disabled={loading || phone.length !== 10}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Phone className="h-4 w-4 mr-2" />}
                Continue
              </Button>
            </>
          )}

          {step === "set-pin" && (
            <>
              <div className="text-center mb-4">
                <KeyRound className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">
                  {isNewUser ? "Set your 4-digit PIN" : "Set a new PIN for your account"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">+91 {phone}</p>
              </div>

              <label className="text-xs text-muted-foreground mb-2 block">Enter PIN</label>
              <div className="flex gap-3 justify-center mb-4">
                {[0, 1, 2, 3].map((i) => (
                  <Input
                    key={`pin-${i}`}
                    ref={(el) => { pinRefs.current[i] = el; }}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={pin[i] || ""}
                    onChange={(e) => handlePinInput(e.target.value, i, setPin, pin, pinRefs)}
                    onKeyDown={(e) => handlePinKeyDown(e, i, pin, setPin, pinRefs)}
                    className="w-14 h-14 text-center text-xl bg-secondary border-0 text-foreground font-bold"
                  />
                ))}
              </div>

              <label className="text-xs text-muted-foreground mb-2 block">Confirm PIN</label>
              <div className="flex gap-3 justify-center mb-4">
                {[0, 1, 2, 3].map((i) => (
                  <Input
                    key={`confirm-${i}`}
                    ref={(el) => { confirmPinRefs.current[i] = el; }}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={confirmPin[i] || ""}
                    onChange={(e) => handlePinInput(e.target.value, i, setConfirmPin, confirmPin, confirmPinRefs)}
                    onKeyDown={(e) => handlePinKeyDown(e, i, confirmPin, setConfirmPin, confirmPinRefs)}
                    className="w-14 h-14 text-center text-xl bg-secondary border-0 text-foreground font-bold"
                  />
                ))}
              </div>

              <Button className="w-full" onClick={handleRegister} disabled={loading || pin.length !== 4 || confirmPin.length !== 4}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                {isNewUser ? "Create Account" : "Set PIN & Continue"}
              </Button>
              <button
                className="w-full text-center text-sm text-muted-foreground mt-3 hover:text-primary transition-colors"
                onClick={handleChangeNumber}
              >
                Change phone number
              </button>
            </>
          )}

          {step === "enter-pin" && (
            <>
              <div className="text-center mb-4">
                <Lock className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">Enter your 4-digit PIN</p>
                <p className="text-xs text-muted-foreground mt-1">+91 {phone}</p>
              </div>

              <div className="flex gap-3 justify-center mb-4">
                {[0, 1, 2, 3].map((i) => (
                  <Input
                    key={`login-pin-${i}`}
                    ref={(el) => { pinRefs.current[i] = el; }}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={pin[i] || ""}
                    onChange={(e) => handlePinInput(e.target.value, i, setPin, pin, pinRefs)}
                    onKeyDown={(e) => handlePinKeyDown(e, i, pin, setPin, pinRefs)}
                    className="w-14 h-14 text-center text-xl bg-secondary border-0 text-foreground font-bold"
                  />
                ))}
              </div>

              <Button className="w-full" onClick={handleLogin} disabled={loading || pin.length !== 4}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                Unlock
              </Button>
              <button
                className="w-full text-center text-sm text-muted-foreground mt-3 hover:text-primary transition-colors"
                onClick={handleChangeNumber}
              >
                Not you? Change number
              </button>
            </>
          )}
        </div>

        <button onClick={() => navigate("/", { replace: true })} className="mt-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Role Selection
        </button>
      </div>
    </div>
  );
};

export default Login;
