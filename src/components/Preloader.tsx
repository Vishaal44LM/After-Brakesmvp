import logo from "@/assets/logo-transparent.png";

// Temporary holding mode: the app stops here indefinitely.
// When the full app reopens, restore onComplete + fade-out timers.
const Preloader = () => (
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

export default Preloader;
