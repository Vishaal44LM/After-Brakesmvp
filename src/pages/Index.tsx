import { useState, useCallback } from "react";
import Preloader from "@/components/Preloader";
import RoleSelect from "@/pages/RoleSelect";

const Index = () => {
  const [loaded, setLoaded] = useState(false);
  const handleComplete = useCallback(() => setLoaded(true), []);

  if (!loaded) return <Preloader onComplete={handleComplete} />;
  return <RoleSelect />;
};

export default Index;
