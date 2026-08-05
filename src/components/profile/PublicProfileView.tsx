/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  ShieldCheck,
  Video,
  Image as ImageIcon,
  Heart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import SubscriptionBadge from "@/components/profile/SubscriptionBadge";

// Above this many photos, a full row of dots stops being usable — fall
// back to the counter as the primary indicator instead.
const MAX_VISIBLE_DOTS = 8;

// Minimum horizontal drag distance to count as a swipe, and how much it
// must dominate vertical movement by, so an ordinary vertical scroll
// inside the modal never gets mistaken for a photo swipe.
const SWIPE_THRESHOLD_PX = 50;
const SWIPE_DIRECTION_RATIO = 1.5;

export type PublicProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  age: number | null;

  city: string | null;
  state: string | null;
  country: string | null;

  denomination: string | null;
  practice_level: string | null;
  prayer_regular?: string | null;

  marital_status?: string | null;
  has_children?: boolean | null;

  education?: string | null;
  occupation?: string | null;
  ethnicity?: string | null;

  bio: string | null;
  nikah_timeline: string | null;

  wali_required: boolean | null;
  verified_badge: boolean | null;

  languages_spoken?: string[] | null;
  lifestyle_choices?: any;

  // From RPC (single urls)
  profile_photo_url?: string | null;
  intro_video_url?: string | null;

  subscription_tier?: string | null;
};

type MediaItem = {
  id: string;
  type: "photo" | "video";
  url: string;
  is_primary?: boolean;
};

type Props = {
  profile: PublicProfile;

  // media fetched from `media` table (approved)
  photos?: MediaItem[];
  videos?: MediaItem[];

  onSendIntro?: () => void;
  onLike?: () => void;
  onPass?: () => void;
};

function labelize(v?: string | null) {
  if (!v) return "";
  return v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function timelineLabel(v?: string | null) {
  if (!v) return "";
  if (v === "asap") return "ASAP";
  if (v === "3-6mo") return "3–6 months";
  if (v === "6-12mo") return "6–12 months";
  if (v === ">12mo") return "12+ months";
  return v;
}

export default function PublicProfileView({
  profile,
  photos = [],
  videos = [],
  onSendIntro,
  onLike,
  onPass,
}: Props) {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [liked, setLiked] = useState(false);

  // Merge: RPC photo url + approved photos list (avoid duplicates)
  const mergedPhotos = useMemo(() => {
    const urls = new Set<string>();
    const out: { url: string; id: string }[] = [];

    const rpcUrl = (profile.profile_photo_url || "").trim();
    if (rpcUrl) {
      urls.add(rpcUrl);
      out.push({ url: rpcUrl, id: "rpc_primary" });
    }

    for (const p of photos) {
      const u = (p.url || "").trim();
      if (!u) continue;
      if (urls.has(u)) continue;
      urls.add(u);
      out.push({ url: u, id: p.id });
    }

    return out.length > 0
      ? out
      : [{ url: "https://placehold.co/900x1200?text=No+Photo", id: "placeholder" }];
  }, [photos, profile.profile_photo_url]);

  const activePhotoUrl =
    mergedPhotos[Math.min(activePhotoIndex, mergedPhotos.length - 1)]?.url;

  const photoCount = mergedPhotos.length;
  const hasMultiplePhotos = photoCount > 1;

  // Reset to the first photo whenever a different profile is shown —
  // otherwise the index (and the new "N of total" counter) could carry
  // over from a previously-viewed profile with a different photo count.
  useEffect(() => {
    setActivePhotoIndex(0);
  }, [profile.id]);

  const goToPrevPhoto = () => {
    setActivePhotoIndex((i) => (i - 1 + photoCount) % photoCount);
  };

  const goToNextPhoto = () => {
    setActivePhotoIndex((i) => (i + 1) % photoCount);
  };

  // Left/Right arrow keys navigate photos while this view is mounted
  // (i.e. while the profile modal is open), mirroring the modal's own
  // Escape-to-close listener.
  useEffect(() => {
    if (!hasMultiplePhotos) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrevPhoto();
      else if (e.key === "ArrowRight") goToNextPhoto();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMultiplePhotos, photoCount]);

  // Track touch start position (a ref, not state, so touchmove doesn't
  // trigger re-renders) to detect a horizontal swipe on touch end.
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handlePhotoTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const handlePhotoTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start || !hasMultiplePhotos) return;

    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;

    if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
    if (Math.abs(dx) < Math.abs(dy) * SWIPE_DIRECTION_RATIO) return;

    if (dx < 0) goToNextPhoto();
    else goToPrevPhoto();
  };

  const fullName = useMemo(() => {
    const fn = profile.first_name || "";
    const ln = profile.last_name || "";
    const s = `${fn} ${ln}`.trim();
    return s || "Member";
  }, [profile.first_name, profile.last_name]);

  const location = useMemo(() => {
    const parts = [profile.city, profile.state].filter(Boolean);
    return parts.join(", ");
  }, [profile.city, profile.state]);

  return (
    <div className="w-full">
      {/* Photo / Gallery */}
      <div className="relative w-full overflow-hidden rounded-2xl bg-white shadow-sm border">
        <div
          className="aspect-[3/4] w-full bg-gray-100"
          onTouchStart={handlePhotoTouchStart}
          onTouchEnd={handlePhotoTouchEnd}
        >
          <img
            src={activePhotoUrl}
            alt="profile"
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Prev/Next arrows */}
        {hasMultiplePhotos && (
          <>
            <button
              type="button"
              onClick={goToPrevPhoto}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={goToNextPhoto}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Photo counter */}
        {hasMultiplePhotos && (
          <div
            className="absolute top-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white"
            aria-live="polite"
          >
            <span aria-label={`Photo ${activePhotoIndex + 1} of ${photoCount}`}>
              {activePhotoIndex + 1} of {photoCount}
            </span>
          </div>
        )}

        {/* Photo dots — only shown for galleries small enough that a full
            row stays usable; the counter above is the primary indicator
            once a profile has more photos than that. */}
        {hasMultiplePhotos && photoCount <= MAX_VISIBLE_DOTS && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {mergedPhotos.map((p, idx) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setActivePhotoIndex(idx)}
                aria-label={`Go to photo ${idx + 1}`}
                aria-current={idx === activePhotoIndex}
                className="flex items-center justify-center rounded-full p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1"
              >
                <span
                  className={`block rounded-full transition-all ${
                    idx === activePhotoIndex ? "h-2.5 w-6 bg-white" : "h-2.5 w-2.5 bg-white/60"
                  }`}
                />
              </button>
            ))}
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <SubscriptionBadge tier={profile.subscription_tier} />
          {profile.wali_required && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gray-800 border">
              <ShieldCheck className="h-4 w-4" />
              Wali Required
            </span>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="mt-5 space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {fullName}
            {profile.age ? <span className="text-gray-500">, {profile.age}</span> : null}
          </h2>
          {location ? <p className="text-gray-600">{location}</p> : null}
        </div>

        {/* Quick chips */}
        <div className="flex flex-wrap gap-2">
          {profile.practice_level ? (
            <span className="rounded-full bg-emerald-700 text-white px-3 py-1 text-xs font-semibold">
              {labelize(profile.practice_level)}
            </span>
          ) : null}

          {profile.denomination ? (
            <span className="rounded-full bg-emerald-700 text-white px-3 py-1 text-xs font-semibold">
              {labelize(profile.denomination)}
            </span>
          ) : null}

          {profile.marital_status ? (
            <span className="rounded-full bg-gray-100 text-gray-800 px-3 py-1 text-xs font-semibold border">
              {labelize(profile.marital_status)}
            </span>
          ) : null}

          {typeof profile.has_children === "boolean" ? (
            <span className="rounded-full bg-gray-100 text-gray-800 px-3 py-1 text-xs font-semibold border">
              {profile.has_children ? "Has children" : "No children"}
            </span>
          ) : null}
        </div>

        {/* Bio */}
        {profile.bio ? (
          <div className="rounded-2xl border bg-white p-4">
            <h3 className="font-semibold text-gray-900 mb-2">About</h3>
            <p className="text-gray-700 whitespace-pre-line">{profile.bio}</p>
          </div>
        ) : null}

        {/* Info grid */}
        <div className="rounded-2xl border bg-white p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Details</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {profile.occupation ? (
              <div>
                <div className="text-gray-500">Occupation</div>
                <div className="text-gray-900 font-medium">{profile.occupation}</div>
              </div>
            ) : null}

            {profile.education ? (
              <div>
                <div className="text-gray-500">Education</div>
                <div className="text-gray-900 font-medium">{profile.education}</div>
              </div>
            ) : null}

            {profile.ethnicity ? (
              <div>
                <div className="text-gray-500">Ethnicity</div>
                <div className="text-gray-900 font-medium">{profile.ethnicity}</div>
              </div>
            ) : null}

            {profile.prayer_regular ? (
              <div>
                <div className="text-gray-500">Prayer</div>
                <div className="text-gray-900 font-medium">{labelize(profile.prayer_regular)}</div>
              </div>
            ) : null}

            {profile.languages_spoken?.length ? (
              <div className="sm:col-span-2">
                <div className="text-gray-500">Languages</div>
                <div className="text-gray-900 font-medium">
                  {profile.languages_spoken.join(", ")}
                </div>
              </div>
            ) : null}

            {profile.nikah_timeline ? (
              <div className="sm:col-span-2">
                <div className="text-gray-500">Nikah timeline</div>
                <div className="text-emerald-700 font-semibold">
                  {timelineLabel(profile.nikah_timeline)}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Videos */}
        {(profile.intro_video_url || videos.length > 0) && (
          <div className="rounded-2xl border bg-white p-4">
            <div className="flex items-center gap-2 mb-3">
              <Video className="h-5 w-5 text-gray-700" />
              <h3 className="font-semibold text-gray-900">Intro video</h3>
            </div>

            <video
              controls
              className="w-full rounded-xl bg-black"
              src={(profile.intro_video_url || videos[0]?.url) ?? undefined}
            />
          </div>
        )}

        {/* Actions */}
        {(onSendIntro || onLike || onPass) && (
          <div className="flex flex-col sm:flex-row gap-2">
            {onPass && (
              <Button variant="outline" onClick={onPass}>
                Pass
              </Button>
            )}
            {onLike && (
              <Button
                variant="outline"
                onClick={() => {
                  setLiked(true);
                  onLike();
                }}
                className={liked ? 'border-teal-500 text-teal-600 bg-teal-50' : ''}
              >
                <Heart className={`h-4 w-4 mr-1.5 ${liked ? 'fill-teal-500 text-teal-500' : ''}`} />
                {liked ? 'Liked' : 'Like'}
              </Button>
            )}
            {onSendIntro && (
              <Button onClick={onSendIntro} className="sm:ml-auto">
                Send Intro Request
              </Button>
            )}
          </div>
        )}

        {/* Small note */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <ImageIcon className="h-4 w-4" />
          Only approved media is shown here.
        </div>
      </div>
    </div>
  );
}
