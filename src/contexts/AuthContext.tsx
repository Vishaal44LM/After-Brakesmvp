import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  user_id: string;
  phone: string;
  name: string | null;
  area: string | null;
}

interface MechanicProfile {
  id: string;
  user_id: string;
  name: string;
  garage_name: string;
  garage_photo_url: string | null;
  area: string;
  pincode: string;
  rating: number | null;
  total_ratings: number | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  mechanicProfile: MechanicProfile | null;
  role: "user" | "mechanic" | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  mechanicProfile: null,
  role: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mechanicProfile, setMechanicProfile] = useState<MechanicProfile | null>(null);
  const [role, setRole] = useState<"user" | "mechanic" | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      const userRole = roles && roles.length > 0 ? roles[0].role as "user" | "mechanic" : null;
      setRole(userRole);

      // Fetch profile
      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();
      setProfile(prof as Profile | null);

      // Fetch mechanic profile if mechanic
      if (userRole === "mechanic") {
        const { data: mechProf } = await supabase
          .from("mechanic_profiles")
          .select("*")
          .eq("user_id", userId)
          .single();
        setMechanicProfile(mechProf as MechanicProfile | null);
      }
    } catch (e) {
      console.error("Error fetching user data:", e);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, sess) => {
        setSession(sess);
        setUser(sess?.user ?? null);
        if (sess?.user) {
          setTimeout(() => fetchUserData(sess.user.id), 0);
        } else {
          setProfile(null);
          setMechanicProfile(null);
          setRole(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session: sess }, error }) => {
      if (error) {
        // Clear stale session
        console.warn("Stale session cleared:", error.message);
        supabase.auth.signOut();
      }
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        fetchUserData(sess.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setMechanicProfile(null);
    setRole(null);
  };

  const refreshProfile = async () => {
    if (user) await fetchUserData(user.id);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, mechanicProfile, role, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
