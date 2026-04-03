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
        Right Mechanic. Right Time.
      </p>
      {/* Road with car driving */}
      <div className="mt-8 w-64 relative">
        {/* Road */}
        <div className="w-full h-3 rounded-full bg-secondary overflow-hidden relative">
          {/* Road markings */}
          <div className="absolute inset-0 flex items-center justify-around">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="w-3 h-[2px] bg-muted-foreground/20 rounded" />
            ))}
          </div>
          {/* Progress fill */}
          <div
            className="h-full bg-primary/30 rounded-full transition-all duration-100 ease-out absolute left-0 top-0"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Car emoji driving on the road */}
        <div
          className="absolute -top-5 transition-all duration-100 ease-out"
          style={{ left: `calc(${progress}% - 12px)` }}
        >
          <span className="text-2xl" role="img" aria-label="car">🚗</span>
        </div>
        {/* Exhaust smoke behind car */}
        {progress > 5 && progress < 100 && (
          <div
            className="absolute -top-3 transition-all duration-100"
            style={{ left: `calc(${progress}% - 28px)` }}
          >
            <span className="text-xs opacity-40">💨</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Preloader;
