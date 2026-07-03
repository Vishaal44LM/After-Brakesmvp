import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Preloader from "@/components/Preloader";
import RoleSelect from "@/pages/RoleSelect";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();
  const [preloaderDone, setPreloaderDone] = useState(false);
  const handleComplete = useCallback(() => setPreloaderDone(true), []);

  // Auto-redirect signed-in users to their dashboard once the preloader
  // finishes and the auth state has resolved.
  useEffect(() => {
    if (!preloaderDone || loading) return;
    if (user && role === "mechanic") navigate("/mechanic-dashboard", { replace: true });
    else if (user && role === "user") navigate("/dashboard", { replace: true });
  }, [preloaderDone, loading, user, role, navigate]);

  if (!preloaderDone) return <Preloader onComplete={handleComplete} />;

  // If auth is still resolving, or we're about to redirect, keep the preloader
  // frame visible to avoid flashing the role screen.
  if (loading || (user && (role === "user" || role === "mechanic"))) {
    return <Preloader onComplete={() => {}} />;
  }

  return <RoleSelect />;
};

export default Index;
