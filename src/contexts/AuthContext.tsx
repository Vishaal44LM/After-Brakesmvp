import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userRole: "user" | "mechanic" | null;
  profile: any;
  mechanicProfile: any;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  userRole: null,
  profile: null,
  mechanicProfile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<"user" | "mechanic" | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [mechanicProfile, setMechanicProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    const [roleRes, profileRes, mechProfileRes] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId).limit(1).single(),
      supabase.from("profiles").select("*").eq("user_id", userId).single(),
      supabase.from("mechanic_profiles").select("*").eq("user_id", userId).single(),
    ]);
    
    setUserRole((roleRes.data?.role as "user" | "mechanic") || null);
    setProfile(profileRes.data || null);
    setMechanicProfile(mechProfileRes.data || null);
  };

  const refreshProfile = async () => {
    if (user?.id) await fetchUserData(user.id);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user || null);
        if (session?.user) {
          setTimeout(() => fetchUserData(session.user.id), 0);
        } else {
          setUserRole(null);
          setProfile(null);
          setMechanicProfile(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setUserRole(null);
    setProfile(null);
    setMechanicProfile(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, userRole, profile, mechanicProfile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
