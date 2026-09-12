import React, { useState, useRef } from "react";
import { X, Upload, Link as LinkIcon, Sparkles, Trash2, Check, RefreshCw, Shield, Image as ImageIcon } from "lucide-react";
import { api, ApiError } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "./Toast";
import { playLevelUpSound, playClickSound } from "../utils/sound";
import { UserAvatar } from "./UserAvatar";
import { RPG_AVATAR_PRESETS } from "../utils/avatarPresets";
import type { ShopItem } from "../types";

interface ProfilePictureModalProps {
  isOpen: boolean;
  onClose: () => void;
  equippedItems?: ShopItem[];
  onAvatarUpdated?: (newAvatarUrl: string | null) => void;
}

type TabType = "presets" | "upload" | "url";

export function ProfilePictureModal({
  isOpen,
  onClose,
  equippedItems = [],
  onAvatarUpdated,
}: ProfilePictureModalProps) {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<TabType>("presets");
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(user?.avatarUrl || null);
  const [urlInput, setUrlInput] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  if (!isOpen || !user) return null;

  const equippedAvatarItem = equippedItems.find((i) => i.type === "Avatar") || null;
  const frameItem = equippedItems.find((i) => i.type === "Frame") || null;

  const hasGoldFrame = frameItem?.name.toLowerCase().includes("gold") || frameItem?.rarity === "Legendary";
  const hasPhoenixFrame = frameItem?.name.toLowerCase().includes("phoenix");

  const frameClass = hasPhoenixFrame
    ? "ring-2 ring-orange-500 ring-offset-2 ring-offset-surface shadow-[0_0_20px_rgba(249,115,22,0.6)]"
    : hasGoldFrame
    ? "ring-2 ring-gold ring-offset-2 ring-offset-surface shadow-goldGlow"
    : "border border-white/20 shadow-glow";

  const categories = ["All", "Warrior", "Mage", "Rogue", "Mythic"];
  const filteredPresets = selectedCategory === "All"
    ? RPG_AVATAR_PRESETS
    : RPG_AVATAR_PRESETS.filter((p) => p.category === selectedCategory);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.push("Please select an image file (PNG, JPG, WEBP, GIF).", "error");
      return;
    }

    if (file.size > 2.5 * 1024 * 1024) {
      toast.push("Image must be smaller than 2.5 MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setSelectedAvatar(reader.result);
        toast.push("Photo loaded! Click 'Save Portrait' to apply.", "success");
      }
    };
    reader.onerror = () => {
      toast.push("Failed to read image file.", "error");
    };
    reader.readAsDataURL(file);
  }

  function handleApplyUrl() {
    if (!urlInput.trim()) {
      toast.push("Please enter a valid image URL.", "error");
      return;
    }
    setSelectedAvatar(urlInput.trim());
    toast.push("Image URL selected! Preview updated.", "info");
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.put("/character/avatar", { avatarUrl: selectedAvatar });
      await refreshUser();
      if (onAvatarUpdated) {
        onAvatarUpdated(selectedAvatar);
      }
      playLevelUpSound();
      toast.push(
        selectedAvatar ? "Hero Portrait updated successfully! ✨" : "Profile picture reset to default.",
        "success"
      );
      onClose();
    } catch (err) {
      toast.push(err instanceof ApiError ? err.message : "Failed to update profile picture.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-white/15 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl space-y-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-arcane/20 via-surface to-gold/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-arcane/20 border border-arcane/40 text-arcane">
              <Sparkles size={22} />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
                Hero Portrait & Avatar
              </h2>
              <p className="text-xs text-slate-400">
                Personalize your adventurer identity across the entire realm
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Live Preview Area */}
        <div className="p-6 bg-black/25 border-b border-white/10 flex items-center justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-4">
            <UserAvatar
              avatarUrl={selectedAvatar}
              name={user.name}
              size="xl"
              equippedAvatar={equippedAvatarItem}
              borderClass={frameClass}
            />
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-arcane bg-arcane/15 px-2 py-0.5 rounded-full border border-arcane/30">
                Live Preview
              </span>
              <h3 className="font-display font-semibold text-lg text-white mt-1">{user.name}</h3>
              <p className="text-xs text-slate-400">
                Level {user.level} Adventurer • {frameItem ? frameItem.name : "Standard Frame"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedAvatar && (
              <button
                type="button"
                onClick={() => {
                  setSelectedAvatar(null);
                  playClickSound();
                  toast.push("Portrait reset to default initial/item.", "info");
                }}
                className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5 text-red-300 hover:bg-red-500/15"
                title="Reset to default"
              >
                <Trash2 size={14} /> Reset
              </button>
            )}
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-white/10 bg-surface/50 px-6 pt-3 gap-2">
          <button
            onClick={() => {
              setActiveTab("presets");
              playClickSound();
            }}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === "presets"
                ? "border-gold text-gold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Shield size={15} /> RPG Hero Presets
          </button>
          <button
            onClick={() => {
              setActiveTab("upload");
              playClickSound();
            }}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === "upload"
                ? "border-gold text-gold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Upload size={15} /> Upload Photo
          </button>
          <button
            onClick={() => {
              setActiveTab("url");
              playClickSound();
            }}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === "url"
                ? "border-gold text-gold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <LinkIcon size={15} /> Image URL
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-[340px] overflow-y-auto space-y-4">
          {activeTab === "presets" && (
            <div className="space-y-3">
              {/* Category Filter */}
              <div className="flex gap-1.5 flex-wrap">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                      selectedCategory === cat
                        ? "bg-gold/20 text-gold border border-gold/40"
                        : "bg-white/5 text-slate-400 hover:bg-white/10"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Grid of Presets */}
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 pt-2">
                {filteredPresets.map((preset) => {
                  const isSelected = selectedAvatar === preset.icon;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setSelectedAvatar(preset.icon);
                        playClickSound();
                      }}
                      className={`group flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition relative ${
                        isSelected
                          ? "border-gold bg-gold/15 shadow-[0_0_15px_rgba(232,182,79,0.3)]"
                          : "border-white/10 bg-black/20 hover:border-arcane/40 hover:bg-white/5"
                      }`}
                    >
                      <span className="text-3xl mb-1.5 transform group-hover:scale-110 transition-transform">
                        {preset.icon}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-300 leading-tight truncate w-full">
                        {preset.label}
                      </span>
                      {isSelected && (
                        <span className="absolute -top-1 -right-1 bg-gold text-black rounded-full p-0.5">
                          <Check size={10} strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "upload" && (
            <div className="space-y-4 text-center py-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/20 hover:border-gold/60 bg-black/20 hover:bg-white/5 rounded-2xl p-8 cursor-pointer transition flex flex-col items-center justify-center space-y-3"
              >
                <div className="w-14 h-14 rounded-2xl bg-gold/10 border border-gold/30 flex items-center justify-center text-gold">
                  <Upload size={26} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    Click or drop an image file here
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports PNG, JPG, WEBP, or GIF (max 2.5 MB)
                  </p>
                </div>
              </div>

              {selectedAvatar?.startsWith("data:image/") && (
                <p className="text-xs text-emerald-400 flex items-center justify-center gap-1.5 font-medium">
                  <Check size={14} /> File loaded and ready to save
                </p>
              )}
            </div>
          )}

          {activeTab === "url" && (
            <div className="space-y-4 py-2">
              <p className="text-xs text-slate-400">
                Paste any web image URL (e.g. from Discord, Unsplash, Imgur, or Gravatar):
              </p>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="input flex-1 text-xs"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="btn-secondary text-xs px-4 flex items-center gap-1"
                >
                  <ImageIcon size={14} /> Preview
                </button>
              </div>

              <div className="p-3 rounded-xl bg-black/20 border border-white/5 text-xs text-slate-400">
                💡 Tip: Make sure the URL points directly to an image file (.png, .jpg, .webp) with HTTPS.
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/10 bg-surface/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="btn-secondary text-xs px-4 py-2.5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-primary text-xs px-6 py-2.5 flex items-center gap-2"
          >
            {saving ? (
              <>
                <RefreshCw size={14} className="animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Check size={15} /> Save Portrait
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
