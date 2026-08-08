import {
  Sparkles,
  Wrench,
  CircleDot,
  BatteryCharging,
  Fuel,
  KeyRound,
  Truck,
  Settings2,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";

export type ServiceItem = {
  value: string;
  label: string;
};

export type ServiceCategory = {
  value: string;
  label: string;
  icon: LucideIcon;
  services: ServiceItem[];
};

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    value: "detailing",
    label: "Car Detailing",
    icon: Sparkles,
    services: [
      { value: "exterior_wash", label: "Exterior Wash & Foam" },
      { value: "interior_detailing", label: "Interior Deep Cleaning" },
      { value: "ceramic_coating", label: "Ceramic Coating" },
      { value: "polishing", label: "Polishing & Buffing" },
      { value: "underbody_coating", label: "Underbody Anti-Rust Coating" },
      { value: "headlight_restoration", label: "Headlight Restoration" },
    ],
  },
  {
    value: "servicing",
    label: "Vehicle Servicing",
    icon: Wrench,
    services: [
      { value: "general_service", label: "General Service" },
      { value: "oil_change", label: "Engine Oil & Filter Change" },
      { value: "brake_service", label: "Brake Pad / Disc Service" },
      { value: "ac_service", label: "AC Service & Gas Refill" },
      { value: "suspension_check", label: "Suspension Check" },
      { value: "clutch_service", label: "Clutch Adjustment / Repair" },
      { value: "engine_diagnostics", label: "Engine Diagnostics" },
    ],
  },
  {
    value: "tyres",
    label: "Tyre Services",
    icon: CircleDot,
    services: [
      { value: "puncture", label: "Puncture Repair" },
      { value: "tyre_replacement", label: "Tyre Replacement" },
      { value: "wheel_alignment", label: "Wheel Alignment" },
      { value: "wheel_balancing", label: "Wheel Balancing" },
      { value: "air_nitrogen", label: "Air / Nitrogen Filling" },
      { value: "spare_tyre_fitting", label: "Spare Tyre Fitting" },
    ],
  },
  {
    value: "battery",
    label: "Battery Services",
    icon: BatteryCharging,
    services: [
      { value: "jump_start", label: "Jump Start" },
      { value: "battery_dead", label: "Battery Dead / Not Holding Charge" },
      { value: "battery_replacement", label: "Battery Replacement" },
      { value: "alternator_issue", label: "Alternator / Charging Issue" },
      { value: "terminal_cleaning", label: "Terminal Cleaning" },
    ],
  },
  {
    value: "fuel",
    label: "Fuel Assistance",
    icon: Fuel,
    services: [
      { value: "fuel_delivery", label: "Emergency Fuel Delivery" },
      { value: "wrong_fuel", label: "Wrong Fuel Drain" },
      { value: "fuel_pump_issue", label: "Fuel Pump Issue" },
      { value: "fuel_leak", label: "Fuel Leak" },
    ],
  },
  {
    value: "lockout",
    label: "Lockout Help",
    icon: KeyRound,
    services: [
      { value: "keys_locked_inside", label: "Keys Locked Inside" },
      { value: "key_lost", label: "Lost Key" },
      { value: "key_broken", label: "Broken Key in Lock" },
      { value: "central_lock_issue", label: "Central Locking Failure" },
    ],
  },
  {
    value: "towing",
    label: "Towing",
    icon: Truck,
    services: [
      { value: "flatbed_towing", label: "Flatbed Towing" },
      { value: "accident_recovery", label: "Accident Recovery" },
      { value: "two_wheeler_towing", label: "Two-Wheeler Towing" },
      { value: "garage_transfer", label: "Transfer to Garage" },
    ],
  },
  {
    value: "modding",
    label: "Modification & Accessories",
    icon: Settings2,
    services: [
      { value: "audio_upgrade", label: "Audio System Upgrade" },
      { value: "alloy_wheels", label: "Alloy Wheels Fitting" },
      { value: "lighting_upgrade", label: "Lighting Upgrade" },
      { value: "seat_covers", label: "Seat Covers & Upholstery" },
      { value: "performance_tuning", label: "Performance Tuning" },
      { value: "wrap_graphics", label: "Wrap & Graphics" },
    ],
  },
  {
    value: "breakdown",
    label: "Breakdown Assistance",
    icon: AlertTriangle,
    services: [
      { value: "engine_wont_start", label: "Engine Won't Start" },
      { value: "overheating", label: "Overheating" },
      { value: "smoke_from_engine", label: "Smoke From Engine" },
      { value: "brake_failure", label: "Brake Failure" },
      { value: "accident_damage", label: "Accident Damage" },
      { value: "other", label: "Other / Not Sure" },
    ],
  },
];

const SERVICE_LOOKUP = new Map<string, string>();
const CATEGORY_LOOKUP = new Map<string, string>();
SERVICE_CATEGORIES.forEach((c) => {
  CATEGORY_LOOKUP.set(c.value, c.label);
  c.services.forEach((s) => SERVICE_LOOKUP.set(s.value, s.label));
});

export const serviceLabel = (v?: string | null) =>
  (v && SERVICE_LOOKUP.get(v)) || v || "Service request";

export const categoryLabel = (v?: string | null) =>
  (v && CATEGORY_LOOKUP.get(v)) || v || "";

export const categoryIcon = (v?: string | null) =>
  SERVICE_CATEGORIES.find((c) => c.value === v)?.icon || Wrench;
