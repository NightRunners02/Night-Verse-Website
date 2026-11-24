import React from "react";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  User as UserIcon,
  CheckCircle2,
  Star,
  Trophy,
  Crown,
  Sparkles,
  Award,
  Lock
} from "lucide-react";

export const getBadgeIconComponent = (iconName?: string): React.ComponentType<{ className?: string }> => {
  switch (iconName?.toLowerCase()) {
    case "shieldalert":
      return ShieldAlert;
    case "shieldcheck":
      return ShieldCheck;
    case "shield":
      return Shield;
    case "checkcircle2":
      return CheckCircle2;
    case "trophy":
      return Trophy;
    case "crown":
      return Crown;
    case "sparkles":
      return Sparkles;
    case "star":
      return Star;
    case "award":
      return Award;
    case "lock":
      return Lock;
    case "user":
    default:
      return UserIcon;
  }
};
