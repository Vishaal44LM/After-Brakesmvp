import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let isActive = true;

    const routeAuthenticatedUser = async (userId: string) => {
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
      let userRole = roles && roles.length > 0 ? roles[0].role : null;

      if (!userRole) {
        const storedRole = (localStorage.getItem("afterbrakes_selected_role") as "user" | "mechanic" | null) || "user";
        const { error: roleError } = await supabase.from("user_roles").insert({ user_id: userId, role: storedRole });

        if (!roleError) {
          userRole = storedRole;
        }
      }

      if (!isActive) return;

      if (userRole === "mechanic") {
        const { data: mechanicProfile } = await supabase
          .from("mechanic_profiles")
          .select("id")
          .eq("user_id", userId)
          .single();

        if (!isActive) return;
        navigate(mechanicProfile ? "/mechanic-dashboard" : "/setup/mechanic", { replace: true });
        return;
      }

      const { data: profile } = await supabase.from("profiles").select("name").eq("user_id", userId).single();

      if (!isActive) return;
      navigate(profile?.name ? "/dashboard" : "/setup/user", { replace: true });
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user) {
        window.setTimeout(() => {
          void routeAuthenticatedUser(session.user.id);
        }, 0);
      }
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        void routeAuthenticatedUser(session.user.id);
        return;
      }

      window.setTimeout(() => {
        if (isActive) {
          navigate("/login", { replace: true });
        }
      }, 2500);
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Verifying your email and opening the app...</p>
    </div>
  );
};

export default AuthCallback;
