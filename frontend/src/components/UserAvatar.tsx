import React, { useState } from "react";
import type { ShopItem } from "../types";

interface UserAvatarProps {
  avatarUrl?: string | null;
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  equippedAvatar?: ShopItem | null;
  equippedFrame?: ShopItem | null;
  className?: string;
  borderClass?: string;
}

const SIZE_MAP = {
  xs: "w-7 h-7 text-xs rounded-lg",
  sm: "w-9 h-9 text-sm rounded-xl",
  md: "w-12 h-12 text-lg rounded-xl",
  lg: "w-16 h-16 text-2xl rounded-2xl",
  xl: "w-20 h-20 text-3xl rounded-2xl",
  "2xl": "w-24 h-24 text-4xl rounded-3xl",
};

export function UserAvatar({
  avatarUrl,
  name,
  size = "md",
  equippedAvatar,
  equippedFrame,
  className = "",
  borderClass = "",
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);

  // If an avatar skin is equipped from inventory, it takes visual priority over base avatarUrl
  const effectiveAvatar = equippedAvatar?.icon || avatarUrl;

  const isImage =
    Boolean(effectiveAvatar) &&
    !imgError &&
    (effectiveAvatar!.startsWith("http") ||
      effectiveAvatar!.startsWith("data:image/") ||
      effectiveAvatar!.startsWith("blob:") ||
      effectiveAvatar!.startsWith("/"));

  const sizeClasses = SIZE_MAP[size] || SIZE_MAP.md;

  const hasGoldFrame =
    equippedFrame?.name.toLowerCase().includes("gold") || equippedFrame?.rarity === "Legendary";
  const hasPhoenixFrame = equippedFrame?.name.toLowerCase().includes("phoenix");

  const resolvedBorder = borderClass || (hasPhoenixFrame
    ? "ring-2 ring-orange-500 ring-offset-2 ring-offset-surface shadow-[0_0_20px_rgba(249,115,22,0.6)]"
    : hasGoldFrame
    ? "ring-2 ring-gold ring-offset-2 ring-offset-surface shadow-goldGlow"
    : "border border-white/15");

  return (
    <div
      className={`relative shrink-0 overflow-hidden flex items-center justify-center font-display select-none transition-all duration-300 ${sizeClasses} ${
        resolvedBorder
      } bg-gradient-to-br from-arcane/80 via-indigo-700 to-arcane2 text-white shadow-md ${className}`}
    >
      {isImage ? (
        <img
          src={effectiveAvatar!}
          alt={name}
          className="w-full h-full object-cover rounded-[inherit]"
          onError={() => setImgError(true)}
        />
      ) : effectiveAvatar ? (
        <span className="leading-none drop-shadow-sm">{effectiveAvatar}</span>
      ) : (
        <span className="font-bold uppercase tracking-wider">
          {name ? name.charAt(0).toUpperCase() : "A"}
        </span>
      )}
    </div>
  );
}
