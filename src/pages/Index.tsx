import { useState, useCallback } from "react";
import Preloader from "@/components/Preloader";
import Login from "@/pages/Login";

const Index = () => {
  const [loaded, setLoaded] = useState(false);
  const handleComplete = useCallback(() => setLoaded(true), []);

  if (!loaded) return <Preloader onComplete={handleComplete} />;
  return <Login />;
};

export default Index;
