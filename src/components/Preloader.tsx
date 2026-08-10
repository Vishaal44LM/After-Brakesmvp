import { useState, useEffect } from "react";
import logo from "@/assets/logo-transparent.png";

const Preloader = ({ onComplete }: { onComplete: () => void }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setFadeOut(true), 2200);
    const completeTimer = window.setTimeout(onComplete, 2700);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
      style={{ backgroundColor: "#2B5CE0" }}
    >
      <img
        src={logo}
        alt="After Brakes"
        width={760}
        height={770}
        className="mb-6 h-32 md:h-40 w-auto object-contain animate-fade-in"
      />

      <h1 className="font-brand text-3xl md:text-4xl font-bold text-black animate-fade-in mb-2">
        After Brakes
      </h1>
    </div>
  );
};

export default Preloader;
