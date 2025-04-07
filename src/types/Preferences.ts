import {
  Bell,
  MessageSquare,
  Calendar,
  ShoppingCart,
  Users,
  BarChart,
  FileText,
  Star,
} from "lucide-react";

// Define the Preferences type
export type Preferences = {
  updates: boolean;
  messages: boolean;
  events: boolean;
  promotions: boolean;
  makkerbors: boolean;
  rangliste: boolean;
  nyheder: boolean;
  turneringer: boolean;
};

// Centralized configuration for preference labels and icons
export const preferenceConfig = {
  updates: { label: "Baneopdateringer", icon: Bell },
  messages: { label: "Nye beskeder", icon: MessageSquare },
  events: { label: "Begivenheder", icon: Calendar },
  promotions: { label: "Tilbud og kampagner", icon: ShoppingCart },
  makkerbors: { label: "Makkerbørs", icon: Users },
  rangliste: { label: "Rangliste", icon: BarChart },
  nyheder: { label: "Nyheder", icon: FileText },
  turneringer: { label: "Turneringer", icon: Star },
};
