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
  updates: { label: "Product Updates", icon: Bell },
  messages: { label: "New Messages", icon: MessageSquare },
  events: { label: "Event Reminders", icon: Calendar },
  promotions: { label: "Promotions & Offers", icon: ShoppingCart },
  makkerbors: { label: "Partner Board", icon: Users },
  rangliste: { label: "Rankings", icon: BarChart },
  nyheder: { label: "News", icon: FileText },
  turneringer: { label: "Tournaments", icon: Star },
};
