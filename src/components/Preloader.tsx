import { useState, useEffect } from "react";
import logo from "@/assets/logo.png";

const Preloader = ({ onComplete }: { onComplete: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setFadeOut(true), 200);
          setTimeout(() => onComplete(), 700);
          return 100;
        }
        return prev + 2;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <img
        src={logo}
        alt="After Brakes"
        className="h-20 w-20 md:h-[100px] md:w-[100px] animate-fade-in mb-6"
      />
      <h1 className="font-brand text-3xl md:text-4xl font-bold text-foreground animate-fade-in mb-2">
        After Brakes
      </h1>
      <p className="text-muted-foreground text-sm md:text-base animate-fade-in" style={{ animationDelay: "0.3s" }}>
        Mechanics in Minutes.
      </p>
      <div className="mt-8 w-48 h-1 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-100 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default Preloader;
