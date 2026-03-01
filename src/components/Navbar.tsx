import { useNavigate, useLocation } from "react-router-dom";
import logo from "@/assets/logo.png";
import { LogOut, User, Wrench, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  role?: "user" | "mechanic" | null;
  onLogout?: () => void;
}

const Navbar = ({ role, onLogout }: NavbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img src={logo} alt="After Brakes" className="h-9 w-9 md:h-10 md:w-10" />
          <span className="font-brand text-xl md:text-2xl font-bold text-foreground hidden sm:inline">
            After Brakes
          </span>
        </div>

        <div className="flex items-center gap-2">
          {role && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(role === "user" ? "/dashboard" : "/mechanic-dashboard")}
                className={location.pathname.includes("dashboard") ? "text-primary" : "text-muted-foreground"}
              >
                <Home className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/profile")}
                className={location.pathname === "/profile" ? "text-primary" : "text-muted-foreground"}
              >
                {role === "user" ? <User className="h-4 w-4 mr-1" /> : <Wrench className="h-4 w-4 mr-1" />}
                <span className="hidden sm:inline">Profile</span>
              </Button>
            </>
          )}
          {onLogout && (
            <Button variant="ghost" size="sm" onClick={onLogout} className="text-muted-foreground">
              <LogOut className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
