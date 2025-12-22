/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { CheckCircle, ShieldCheck, Video, Image as ImageIcon } from "lucide-react";

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
        <div className="aspect-[3/4] w-full bg-gray-100">
          <img
            src={activePhotoUrl}
            alt="profile"
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Photo dots */}
        {mergedPhotos.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
            {mergedPhotos.slice(0, 8).map((p, idx) => (
              <button
                key={p.id}
                onClick={() => setActivePhotoIndex(idx)}
                className={`h-2 w-2 rounded-full ${
                  idx === activePhotoIndex ? "bg-white" : "bg-white/50"
                }`}
                aria-label={`Photo ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {profile.verified_badge && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-emerald-700 border">
              <CheckCircle className="h-4 w-4" />
              Verified
            </span>
          )}
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
              <Button variant="outline" onClick={onLike}>
                Like
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
