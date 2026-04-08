import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, ArrowRight, ArrowLeft, Loader2, Lock, UserPlus, LogIn } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);

  const selectedRole = localStorage.getItem("afterbrakes_selected_role") as "user" | "mechanic" | null;

  const handleLogin = async () => {
    if (!email.trim() || !password) { toast.error("Enter email and password"); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const userId = data.user.id;

      // Check role
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
      const role = roles && roles.length > 0 ? roles[0].role : null;

      if (!role) {
        const r = selectedRole || "user";
        await supabase.from("user_roles").insert({ user_id: userId, role: r });
        // Create profile if needed
        const { data: existingProfile } = await supabase.from("profiles").select("id").eq("user_id", userId).single();
        if (!existingProfile) {
          await supabase.from("profiles").insert({ user_id: userId, phone: "" });
        }
        navigate(r === "mechanic" ? "/setup/mechanic" : "/setup/user");
      } else {
        // Check profile completeness
        const { data: prof } = await supabase.from("profiles").select("name").eq("user_id", userId).single();
        let profileComplete = !!prof?.name;
        if (role === "mechanic") {
          const { data: mechProf } = await supabase.from("mechanic_profiles").select("id").eq("user_id", userId).single();
          if (!mechProf) profileComplete = false;
        }
        if (role === "user") {
          navigate(profileComplete ? "/dashboard" : "/setup/user");
        } else {
          navigate(profileComplete ? "/mechanic-dashboard" : "/setup/mechanic");
        }
      }
    } catch (e: any) {
      toast.error(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!email.trim() || !password) { toast.error("Enter email and password"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (password !== confirmPassword) { toast.error("Passwords don't match"); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error("Signup failed");

      const userId = data.user.id;
      const role = selectedRole || "user";

      // Assign role
      await supabase.from("user_roles").insert({ user_id: userId, role });

      // Create profile
      await supabase.from("profiles").upsert({ user_id: userId, phone: "" }, { onConflict: "user_id" });

      toast.success("Account created!");
      navigate(role === "mechanic" ? "/setup/mechanic" : "/setup/user");
    } catch (e: any) {
      toast.error(e.message || "Signup failed");
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
          {/* Toggle login/signup */}
          <div className="flex bg-secondary rounded-lg p-1 mb-6">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === "login" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === "signup" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              Sign Up
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-2">
                <Mail className="h-4 w-4" /> Email
              </label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-secondary border-0 text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-2">
                <Lock className="h-4 w-4" /> Password
              </label>
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-secondary border-0 text-foreground placeholder:text-muted-foreground"
              />
            </div>
            {mode === "signup" && (
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-2">
                  <Lock className="h-4 w-4" /> Confirm Password
                </label>
                <Input
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-secondary border-0 text-foreground placeholder:text-muted-foreground"
                />
              </div>
            )}
          </div>

          <Button
            className="w-full mt-4"
            onClick={mode === "login" ? handleLogin : handleSignup}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : mode === "login" ? (
              <LogIn className="h-4 w-4 mr-2" />
            ) : (
              <UserPlus className="h-4 w-4 mr-2" />
            )}
            {mode === "login" ? "Log In" : "Create Account"}
          </Button>
        </div>

        <button onClick={() => navigate("/", { replace: true })} className="mt-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Role Selection
        </button>
      </div>
    </div>
  );
};

export default Login;
