import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, ArrowLeft, Loader2, UserPlus, LogIn, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const PREVIEW_APP_URL = "https://id-preview--562d32da-d46b-4fe8-a88f-b0d51e71002c.lovable.app";

const Login = () => {
  const navigate = useNavigate();
  const { user, role, profile, mechanicProfile, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const selectedRole = localStorage.getItem("afterbrakes_selected_role") as "user" | "mechanic" | null;

  const appBaseUrl = useMemo(() => {
    if (typeof window === "undefined") return PREVIEW_APP_URL;

    const { origin, hostname } = window.location;
    return hostname.endsWith(".lovableproject.com") ? PREVIEW_APP_URL : origin;
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (user && role) {
      if (role === "user") {
        navigate(profile?.name ? "/dashboard" : "/setup/user", { replace: true });
      } else if (role === "mechanic") {
        navigate(mechanicProfile ? "/mechanic-dashboard" : "/setup/mechanic", { replace: true });
      }
    }
  }, [user, role, profile, mechanicProfile, authLoading, navigate]);

  const verificationRedirectUrl = `${appBaseUrl}/auth/callback`;

  const handleSignup = async () => {
    if (!email.trim()) {
      toast.error("Enter your email");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: verificationRedirectUrl,
        },
      });

      if (error) throw error;

      setEmailSent(true);
      toast.success("Verification email sent! Check your inbox.");
    } catch (e: any) {
      toast.error(e.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim()) {
      toast.error("Enter your email first");
      return;
    }

    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
        options: {
          emailRedirectTo: verificationRedirectUrl,
        },
      });

      if (error) throw error;
      toast.success("Verification email sent again.");
    } catch (e: any) {
      toast.error(e.message || "Couldn't resend verification email");
    } finally {
      setResending(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim()) {
      toast.error("Enter your email");
      return;
    }

    if (!password) {
      toast.error("Enter your password");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;

      const userId = data.user.id;
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
      const userRole = roles && roles.length > 0 ? roles[0].role : null;

      if (!userRole) {
        const assignRole = selectedRole || "user";
        await supabase.from("user_roles").insert({ user_id: userId, role: assignRole });
        navigate(assignRole === "mechanic" ? "/setup/mechanic" : "/setup/user");
        return;
      }

      if (userRole === "user") {
        const { data: prof } = await supabase.from("profiles").select("name").eq("user_id", userId).single();
        navigate(prof?.name ? "/dashboard" : "/setup/user");
        return;
      }

      const { data: mechProf } = await supabase.from("mechanic_profiles").select("id").eq("user_id", userId).single();
      navigate(mechProf ? "/mechanic-dashboard" : "/setup/mechanic");
    } catch (e: any) {
      toast.error(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm flex flex-col items-center">
          <img src={logo} alt="After Brakes" className="mb-4 h-16 w-16 animate-fade-in" />
          <h1 className="mb-1 font-brand text-3xl font-bold text-foreground">After Brakes</h1>
          <div className="mb-2 h-1 w-16 rounded-full bg-primary animate-pulse-glow" />

          <div className="w-full animate-slide-up rounded-xl border border-border bg-card p-6 text-center">
            <Mail className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h2 className="mb-2 text-lg font-semibold text-foreground">Check your email</h2>
            <p className="mb-3 text-sm text-muted-foreground">
              We sent a verification link to <span className="font-medium text-foreground">{email}</span>.
            </p>
            <p className="mb-6 text-xs text-muted-foreground">
              When you tap <span className="font-medium text-foreground">Verify Email</span>, it will open the app and complete verification automatically.
            </p>

            <div className="space-y-3">
              <Button className="w-full" onClick={handleResendVerification} disabled={resending}>
                {resending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Resend verification email
              </Button>

              <Button
                className="w-full"
                variant="outline"
                onClick={() => {
                  setEmailSent(false);
                  setMode("login");
                  setPassword("");
                  setConfirmPassword("");
                }}
              >
                <LogIn className="mr-2 h-4 w-4" /> Go to Login
              </Button>
            </div>
          </div>

          <button
            onClick={() => navigate("/", { replace: true })}
            className="mt-8 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Role Selection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm flex flex-col items-center">
        <img src={logo} alt="After Brakes" className="mb-4 h-16 w-16 animate-fade-in" />
        <h1 className="mb-1 font-brand text-3xl font-bold text-foreground">After Brakes</h1>
        <div className="mb-2 h-1 w-16 rounded-full bg-primary animate-pulse-glow" />
        <p className="mb-8 text-sm text-muted-foreground">Right Mechanic. Right Time.</p>

        <div className="w-full animate-slide-up rounded-xl border border-border bg-card p-6">
          <div className="mb-6 flex rounded-lg bg-secondary p-1">
            <button
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${mode === "login" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              onClick={() => {
                setMode("login");
                setPassword("");
                setConfirmPassword("");
              }}
            >
              Login
            </button>
            <button
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${mode === "signup" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              onClick={() => {
                setMode("signup");
                setPassword("");
                setConfirmPassword("");
              }}
            >
              Sign Up
            </button>
          </div>

          <label className="mb-2 block text-sm font-medium text-muted-foreground">Email</label>
          <div className="mb-4 flex gap-2">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-0 bg-secondary text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <label className="mb-2 block text-sm font-medium text-muted-foreground">Password</label>
          <Input
            type="password"
            placeholder={mode === "signup" ? "Create a password (min 6 chars)" : "Enter your password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-4 border-0 bg-secondary text-foreground placeholder:text-muted-foreground"
          />

          {mode === "signup" && (
            <>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Confirm Password</label>
              <Input
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mb-4 border-0 bg-secondary text-foreground placeholder:text-muted-foreground"
              />
            </>
          )}

          {mode === "login" ? (
            <Button className="w-full" onClick={handleLogin} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
              Login
            </Button>
          ) : (
            <Button className="w-full" onClick={handleSignup} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              Create Account
            </Button>
          )}
        </div>

        <button
          onClick={() => navigate("/", { replace: true })}
          className="mt-8 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Role Selection
        </button>
      </div>
    </div>
  );
};

export default Login;
