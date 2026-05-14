export const ISSUE_TYPES = [
  { value: "puncture", label: "Puncture", emoji: "🛞" },
  { value: "engine_wont_start", label: "Engine won't start", emoji: "🔧" },
  { value: "battery_dead", label: "Battery dead", emoji: "🔋" },
  { value: "overheating", label: "Overheating", emoji: "🌡️" },
  { value: "brake_issue", label: "Brake issue", emoji: "🛑" },
  { value: "fuel_issue", label: "Fuel issue", emoji: "⛽" },
  { value: "towing_needed", label: "Towing needed", emoji: "🚛" },
  { value: "other", label: "Other", emoji: "❓" },
];

export const issueTypeLabel = (v?: string | null) =>
  ISSUE_TYPES.find((t) => t.value === v)?.label || v || "Service request";
