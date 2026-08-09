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
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
      style={{ backgroundColor: "#2B5CE0" }}
    >
      <div className="mb-6 rounded-3xl bg-black p-4 shadow-2xl animate-fade-in">
        <img
          src={logo}
          alt="After Brakes"
          width={512}
          height={512}
          className="h-32 md:h-40 w-32 md:w-40 object-contain"
        />
      </div>
      <h1 className="font-brand text-3xl md:text-4xl font-bold text-black animate-fade-in mb-2">
        After Brakes
      </h1>
      <div className="mt-8 w-48 h-1.5 rounded-full bg-transparent border border-black overflow-hidden">
        <div
          className="h-full bg-black rounded-full transition-all duration-100 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default Preloader;
