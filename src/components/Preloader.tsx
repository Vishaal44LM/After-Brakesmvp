import { useEffect } from "react";
import logo from "@/assets/logo-transparent.png";

// In holding mode this stays on screen indefinitely (Index passes a no-op
// onComplete). When the full app reopens, restore the fade-out timers here.
const Preloader = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    if (onComplete) return;
  }, [onComplete]);

  return (
    <div className="brand-holding-screen fixed inset-0 z-50 flex flex-col items-center justify-center">
      <img
        src={logo}
        alt="After Brakes"
        width={760}
        height={770}
        className="h-32 md:h-40 w-auto object-contain animate-fade-in"
      />
    </div>
  );
};

export default Preloader;
