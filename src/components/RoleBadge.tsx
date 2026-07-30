import React from "react";
import { Role } from "../types.js";
import { Shield, ShieldAlert, ShieldCheck, User, CheckCircle2, Star, Trophy, Crown } from "lucide-react";

export type BadgeType = Role | "VERIFIED" | "CONTRIBUTOR" | "VIP" | "STAFF" | "Verified Creator" | "Administrator" | "Moderator" | "User";

interface RoleBadgeProps {
  role?: string | BadgeType;
  className?: string;
  showIcon?: boolean;
  size?: "xs" | "sm" | "md";
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ 
  role, 
  className = "", 
  showIcon = true,
  size = "xs"
}) => {
  let badgeStyles = "";
  let text = "";
  let Icon: React.ComponentType<{ className?: string }> = User;

  // Normalize role/badge name
  const b = role?.toString();

  if (b === "SUPER_ADMIN" || b === "STAFF") {
    badgeStyles = "bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.1)]";
    text = "Admin";
    Icon = ShieldAlert;
  } else if (b === "ADMIN" || b === "Administrator") {
    badgeStyles = "bg-purple-500/10 border-purple-500/30 text-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.1)]";
    text = "Administrator";
    Icon = ShieldCheck;
  } else if (b === "MODERATOR" || b === "Moderator") {
    badgeStyles = "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.1)]";
    text = "Moderator";
    Icon = Shield;
  } else if (b === "VERIFIED" || b === "Verified Creator") {
    badgeStyles = "bg-blue-500/10 border-blue-500/30 text-blue-400";
    text = "Verified";
    Icon = CheckCircle2;
  } else if (b === "CONTRIBUTOR" || b === "Contributor") {
    badgeStyles = "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
    text = "Contributor";
    Icon = Trophy;
  } else if (b === "VIP") {
    badgeStyles = "bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.1)]";
    text = "VIP";
    Icon = Crown;
  } else {
    badgeStyles = "bg-slate-950/50 border-slate-800 text-slate-500";
    text = b === "USER" || b === "User" ? "User" : (b || "User");
    Icon = User;
  }

  const sizeStyles = {
    xs: "px-1.5 py-0.5 text-[8px] gap-1",
    sm: "px-2 py-0.5 text-[10px] gap-1.5",
    md: "px-2.5 py-1 text-xs gap-1.5"
  };

  return (
    <span className={`inline-flex items-center font-mono font-bold tracking-wider uppercase border rounded-[4px] md:rounded-md transition-all ${sizeStyles[size]} ${badgeStyles} ${className}`}>
      {showIcon && <Icon className={size === "xs" ? "w-2.5 h-2.5" : size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} />}
      <span>{text}</span>
    </span>
  );
};
