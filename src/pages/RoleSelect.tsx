import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Car, Wrench, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const roles = [
  {
    id: "user" as const,
    icon: Car,
    title: "I Need Vehicle Service",
    description: "Find trusted mechanics near you with AI-powered diagnostics",
    path: "/setup/user",
  },
  {
    id: "mechanic" as const,
    icon: Wrench,
    title: "I Am a Mechanic / Garage Owner",
    description: "Get connected with customers and grow your business",
    path: "/setup/mechanic",
  },
];

const RoleSelect = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSelectRole = async (roleId: "user" | "mechanic", path: string) => {
    if (!user) {
      toast.error("Please login first");
      navigate("/login");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("user_roles").insert({
        user_id: user.id,
        role: roleId,
      });
      if (error) throw error;
      await refreshProfile();
      navigate(path);
    } catch (e: any) {
      toast.error(e.message || "Failed to set role");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <h1 className="font-brand text-2xl md:text-3xl font-bold text-foreground mb-2 text-center">
        How do you want to use After Brakes?
      </h1>
      <p className="text-muted-foreground text-sm mb-10">Choose your role to get started</p>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
        {roles.map((role, i) => (
          <button
            key={role.id}
            onClick={() => handleSelectRole(role.id, role.path)}
            disabled={loading}
            className="flex-1 bg-card border border-border rounded-xl p-6 flex flex-col items-center gap-4 hover:border-primary hover:glow-primary transition-all duration-300 group animate-slide-up disabled:opacity-50"
            style={{ animationDelay: `${i * 0.15}s` }}
          >
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              {loading ? <Loader2 className="h-7 w-7 text-primary animate-spin" /> : <role.icon className="h-7 w-7 text-primary" />}
            </div>
            <h2 className="text-foreground font-semibold text-lg">{role.title}</h2>
            <p className="text-muted-foreground text-sm text-center">{role.description}</p>
          </button>
        ))}
      </div>

      <button onClick={() => navigate("/login")} className="mt-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Login
      </button>
    </div>
  );
};

export default RoleSelect;
