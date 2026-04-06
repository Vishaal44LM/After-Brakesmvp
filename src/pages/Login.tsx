import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, ArrowRight, ArrowLeft, Loader2, Lock, UserPlus, LogIn } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { user, role, profile, mechanicProfile, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const selectedRole = localStorage.getItem("afterbrakes_selected_role") as "user" | "mechanic" | null;

  // Redirect if already logged in
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

  const handleSignup = async () => {
    if (!email.trim()) { toast.error("Enter your email"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (password !== confirmPassword) { toast.error("Passwords don't match"); return; }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
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

  const handleLogin = async () => {
    if (!email.trim()) { toast.error("Enter your email"); return; }
    if (!password) { toast.error("Enter your password"); return; }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;

      const userId = data.user.id;

      // Check role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      const userRole = roles && roles.length > 0 ? roles[0].role : null;

      if (!userRole) {
        // New user needs role assignment
        const assignRole = selectedRole || "user";
        await supabase.from("user_roles").insert({ user_id: userId, role: assignRole });
        navigate(assignRole === "mechanic" ? "/setup/mechanic" : "/setup/user");
      } else if (userRole === "user") {
        const { data: prof } = await supabase.from("profiles").select("name").eq("user_id", userId).single();
        navigate(prof?.name ? "/dashboard" : "/setup/user");
      } else if (userRole === "mechanic") {
        const { data: mechProf } = await supabase.from("mechanic_profiles").select("id").eq("user_id", userId).single();
        navigate(mechProf ? "/mechanic-dashboard" : "/setup/mechanic");
      }
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
          <img src={logo} alt="After Brakes" className="h-16 w-16 mb-4 animate-fade-in" />
          <h1 className="font-brand text-3xl font-bold text-foreground mb-1">After Brakes</h1>
          <div className="h-1 w-16 bg-primary rounded-full mb-2 animate-pulse-glow" />

          <div className="w-full bg-card rounded-xl p-6 border border-border animate-slide-up text-center">
            <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">Check your email</h2>
            <p className="text-sm text-muted-foreground mb-4">
              We've sent a verification link to <span className="font-medium text-foreground">{email}</span>.
              Click the link to verify your account.
            </p>
            <p className="text-xs text-muted-foreground mb-6">
              After verifying, come back here and log in.
            </p>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => { setEmailSent(false); setMode("login"); setPassword(""); }}
            >
              <LogIn className="h-4 w-4 mr-2" /> Go to Login
            </Button>
          </div>

          <button
            onClick={() => navigate("/", { replace: true })}
            className="mt-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
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
        <img src={logo} alt="After Brakes" className="h-16 w-16 mb-4 animate-fade-in" />
        <h1 className="font-brand text-3xl font-bold text-foreground mb-1">After Brakes</h1>
        <div className="h-1 w-16 bg-primary rounded-full mb-2 animate-pulse-glow" />
        <p className="text-muted-foreground text-sm mb-8">Right Mechanic. Right Time.</p>

        <div className="w-full bg-card rounded-xl p-6 border border-border animate-slide-up">
          {/* Mode toggle */}
          <div className="flex bg-secondary rounded-lg p-1 mb-6">
            <button
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === "login" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              onClick={() => { setMode("login"); setPassword(""); setConfirmPassword(""); }}
            >
              Login
            </button>
            <button
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === "signup" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              onClick={() => { setMode("signup"); setPassword(""); setConfirmPassword(""); }}
            >
              Sign Up
            </button>
          </div>

          <label className="text-sm font-medium text-muted-foreground mb-2 block">Email</label>
          <div className="flex gap-2 mb-4">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-secondary border-0 text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <label className="text-sm font-medium text-muted-foreground mb-2 block">Password</label>
          <Input
            type="password"
            placeholder={mode === "signup" ? "Create a password (min 6 chars)" : "Enter your password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-secondary border-0 text-foreground placeholder:text-muted-foreground mb-4"
          />

          {mode === "signup" && (
            <>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Confirm Password</label>
              <Input
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-secondary border-0 text-foreground placeholder:text-muted-foreground mb-4"
              />
            </>
          )}

          {mode === "login" ? (
            <Button className="w-full" onClick={handleLogin} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LogIn className="h-4 w-4 mr-2" />}
              Login
            </Button>
          ) : (
            <Button className="w-full" onClick={handleSignup} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
              Create Account
            </Button>
          )}
        </div>

        <button
          onClick={() => navigate("/", { replace: true })}
          className="mt-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Role Selection
        </button>
      </div>
    </div>
  );
};

export default Login;
