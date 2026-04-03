import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Car, Wrench, ArrowRight } from "lucide-react";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";

const roles = [
  {
    id: "user" as const,
    icon: Car,
    title: "Vehicle Owner",
    description: "Find trusted mechanics near you",
  },
  {
    id: "mechanic" as const,
    icon: Wrench,
    title: "Mechanic / Garage",
    description: "Connect with customers & grow",
  },
];

const RoleSelect = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<"user" | "mechanic" | null>(null);

  const handleContinue = () => {
    if (!selected) return;
    localStorage.setItem("afterbrakes_selected_role", selected);
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <img src={logo} alt="After Brakes" className="h-16 w-16 mb-4 animate-fade-in" />
      <h1 className="font-brand text-2xl md:text-3xl font-bold text-foreground mb-2 text-center">
        How do you want to use After Brakes?
      </h1>
      <p className="text-muted-foreground text-sm mb-10">Choose your role to get started</p>

      <div className="relative flex w-full max-w-sm bg-secondary rounded-full p-1 mb-8 animate-slide-up">
        {/* Sliding highlight */}
        <div
          className="absolute top-1 bottom-1 rounded-full bg-primary transition-all duration-300 ease-in-out glow-primary"
          style={{
            width: "calc(50% - 4px)",
            left: selected === "mechanic" ? "calc(50% + 2px)" : "4px",
            opacity: selected ? 1 : 0,
          }}
        />

        {roles.map((role) => {
          const isActive = selected === role.id;
          return (
            <button
              key={role.id}
              onClick={() => setSelected(role.id)}
              className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-full text-sm font-medium transition-colors duration-300 ${
                isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <role.icon className="h-4 w-4" />
              <span>{role.title}</span>
            </button>
          );
        })}
      </div>

      {/* Description card */}
      <div
        className={`text-center mb-8 transition-all duration-300 ${
          selected ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
      >
        <p className="text-muted-foreground text-sm">
          {selected ? roles.find((r) => r.id === selected)?.description : ""}
        </p>
      </div>

      <Button
        onClick={handleContinue}
        disabled={!selected}
        className="rounded-full px-8 gap-2 transition-all duration-300"
        size="lg"
      >
        Continue <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default RoleSelect;
