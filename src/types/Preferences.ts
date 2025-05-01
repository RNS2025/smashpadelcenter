import {
  Bell,
  MessageSquare,
  Calendar,
  ShoppingCart,
  Users,
  BarChart,
  FileText,
  Star,
  LucideIcon,
} from "lucide-react";

// Define the Preferences type
export type Preferences = {
  general: boolean;
  events: boolean;
  makkerbors: boolean;
  turneringer: boolean;
};

// Type for preference configuration
export type PreferenceConfig = {
  [K in keyof Preferences]: {
    label: string;
    icon: LucideIcon;
  };
};

export const preferenceConfig: PreferenceConfig = {
  general: { label: "Generelle opdateringer", icon: Bell },
  events: { label: "Begivenheder", icon: Calendar },
  makkerbors: { label: "Makkerbørs", icon: Users },
  turneringer: { label: "Turneringer", icon: Star },
};
