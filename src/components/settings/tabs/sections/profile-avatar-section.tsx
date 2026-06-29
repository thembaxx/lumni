"use client";

import Camera01Icon from "@hugeicons/core-free-icons/Camera01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getRandomName } from "@/lib/utils/random-name";

interface ProfileAvatarSectionProps {
  avatarUrl?: string;
  name: string;
  email?: string;
  emailVerified?: boolean;
  uploading: boolean;
  onVerifyEmail: () => void;
  onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ProfileAvatarSection({
  avatarUrl,
  name,
  email,
  emailVerified,
  uploading,
  onVerifyEmail,
  onAvatarUpload,
}: ProfileAvatarSectionProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      <div className="group relative">
        <label htmlFor="avatar-upload" className="block cursor-pointer">
          <Avatar className="size-24 border-[6px] border-system-surface shadow-level-3 transition-transform duration-300">
            <AvatarImage
              src={
                avatarUrl ??
                `https://api.dicebear.com/9.x/fun-emoji/svg?backgroundColor=ecad80,d1d4f9,b6e3f4,c0aede,ffdfbf&seed=${getRandomName()}`
              }
              alt={name || "User"}
            />
            <AvatarFallback className="bg-system-accent font-extrabold text-3xl text-white">
              {name?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-black/10" />
          <div className="absolute -right-1 -bottom-1 flex size-9 items-center justify-center rounded-full border-[3px] border-system-surface bg-system-accent text-white shadow-level-2 transition-transform">
            {uploading ? (
              <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <HugeiconsIcon icon={Camera01Icon} className="size-4" />
            )}
          </div>
        </label>
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onAvatarUpload}
          aria-label="Upload avatar image"
        />
      </div>
      <div className="flex flex-col gap-1 text-center">
        <h2 className="text-(length:--fs-title-2) font-semibold text-foreground">
          {name || "User"}
        </h2>
        {email && (
          <p className="text-(length:--fs-subhead) font-medium text-muted-foreground">
            {email}
            {!emailVerified && (
              <button
                type="button"
                onClick={onVerifyEmail}
                className="ml-2 font-semibold text-system-accent text-xs hover:underline"
              >
                Verify
              </button>
            )}
            {emailVerified && (
              <span className="ml-2 font-semibold text-success text-xs">Verified</span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
