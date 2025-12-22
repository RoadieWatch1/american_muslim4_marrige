/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { X } from "lucide-react";

import PublicProfileView, { PublicProfile } from "./PublicProfileView";

type MediaItem = {
  id: string;
  type: "photo" | "video";
  url: string;
  is_primary?: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;

  profile: PublicProfile | null;

  // Optional: if you want CTA actions from modal
  onSendIntro?: () => void;
  onLike?: () => void;
  onPass?: () => void;
};

export default function PublicProfileModal({
  open,
  onClose,
  profile,
  onSendIntro,
  onLike,
  onPass,
}: Props) {
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [photos, setPhotos] = useState<MediaItem[]>([]);
  const [videos, setVideos] = useState<MediaItem[]>([]);

  const profileId = profile?.id ?? null;

  useEffect(() => {
    if (!open || !profileId) return;

    let cancelled = false;
    (async () => {
      setLoadingMedia(true);
      try {
        // Only approved media; do not expose pending/rejected
        const { data, error } = await supabase
          .from("media")
          .select("id, type, url, is_primary, created_at")
          .eq("user_id", profileId)
          .eq("status", "approved")
          .order("is_primary", { ascending: false })
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Failed to load media:", error);
          if (!cancelled) {
            setPhotos([]);
            setVideos([]);
          }
          return;
        }

        const rows = (data ?? []) as any[];
        const p: MediaItem[] = [];
        const v: MediaItem[] = [];

        for (const r of rows) {
          if (r.type === "photo") p.push(r);
          if (r.type === "video") v.push(r);
        }

        if (!cancelled) {
          setPhotos(p);
          setVideos(v);
        }
      } finally {
        if (!cancelled) setLoadingMedia(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, profileId]);

  const title = useMemo(() => {
    if (!profile) return "Profile";
    const name = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || "Member";
    return profile.age ? `${name}, ${profile.age}` : name;
  }, [profile]);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !profile) return null;

  return (
    <div className="fixed inset-0 z-[999]">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* modal */}
      <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-6">
        <div className="w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-2xl bg-white shadow-xl border">
          {/* header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="min-w-0">
              <div className="font-semibold text-gray-900 truncate">{title}</div>
              <div className="text-xs text-gray-500">
                {loadingMedia ? "Loading media..." : " "}
              </div>
            </div>

            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* body */}
          <div className="px-4 py-4 overflow-y-auto max-h-[calc(92vh-56px)]">
            <PublicProfileView
              profile={profile}
              photos={photos}
              videos={videos}
              onSendIntro={onSendIntro}
              onLike={onLike}
              onPass={onPass}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
