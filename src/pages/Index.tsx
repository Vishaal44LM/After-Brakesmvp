import { useState, useCallback } from "react";
import Preloader from "@/components/Preloader";

const Index = () => {
  const [preloaderDone, setPreloaderDone] = useState(false);
  const handleComplete = useCallback(() => setPreloaderDone(true), []);

  if (!preloaderDone) return <Preloader onComplete={handleComplete} />;

  return (
    <main className="brand-holding-screen flex min-h-svh items-center justify-center p-6">
      <h1 className="font-brand text-center text-4xl font-bold sm:text-6xl">STAY TUNED</h1>
    </main>
  );
};

export default Index;
