import {
  CircleDot,
  Wrench,
  BatteryWarning,
  Thermometer,
  OctagonAlert,
  Fuel,
  Truck,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

export type IssueType = {
  value: string;
  label: string;
  icon: LucideIcon;
};

export const ISSUE_TYPES: IssueType[] = [
  { value: "puncture", label: "Puncture", icon: CircleDot },
  { value: "engine_wont_start", label: "Engine won't start", icon: Wrench },
  { value: "battery_dead", label: "Battery dead", icon: BatteryWarning },
  { value: "overheating", label: "Overheating", icon: Thermometer },
  { value: "brake_issue", label: "Brake issue", icon: OctagonAlert },
  { value: "fuel_issue", label: "Fuel issue", icon: Fuel },
  { value: "towing_needed", label: "Towing needed", icon: Truck },
  { value: "other", label: "Other", icon: HelpCircle },
];

export const issueTypeLabel = (v?: string | null) =>
  ISSUE_TYPES.find((t) => t.value === v)?.label || v || "Service request";
