import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      // Supabase will automatically pick up the tokens from the URL hash
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Auth callback error:", error);
        navigate("/login", { replace: true });
        return;
      }

      if (session) {
        // Check if user has a role
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id);

        const role = roles && roles.length > 0 ? roles[0].role : null;

        if (!role) {
          navigate("/login", { replace: true });
        } else if (role === "user") {
          const { data: prof } = await supabase.from("profiles").select("name").eq("user_id", session.user.id).single();
          navigate(prof?.name ? "/dashboard" : "/setup/user", { replace: true });
        } else if (role === "mechanic") {
          const { data: mechProf } = await supabase.from("mechanic_profiles").select("id").eq("user_id", session.user.id).single();
          navigate(mechProf ? "/mechanic-dashboard" : "/setup/mechanic", { replace: true });
        }
      } else {
        // Email verified but no session yet - go to login
        navigate("/login", { replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Verifying your email...</p>
    </div>
  );
};

export default AuthCallback;
