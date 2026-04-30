import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Star } from 'lucide-react';

type SuccessStoryRow = {
  id: string;
  created_at: string;
  title: string | null;
  story: string | null;
  published: boolean;

  couple_name: string | null;
  location: string | null;
  image_url: string | null;
  rating: number;
  featured: boolean;
  sort_order: number;
  published_at: string | null;
};

type UiTestimonial = {
  key: string;
  name: string;
  location: string;
  text: string;
  image: string;
  rating: number;
};

const FALLBACK_TESTIMONIALS: UiTestimonial[] = [];

function clampRating(n: any) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 5;
  return Math.max(1, Math.min(5, v));
}

export const Testimonials: React.FC = () => {
  const [items, setItems] = useState<UiTestimonial[]>(FALLBACK_TESTIMONIALS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from('success_stories')
          .select(
            'id, created_at, title, story, published, couple_name, location, image_url, rating, featured, sort_order, published_at'
          )
          .eq('published', true)
          .order('featured', { ascending: false })
          .order('sort_order', { ascending: true })
          .order('published_at', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(6);

        if (error) {
          console.error('Failed to load success stories:', error);
          return;
        }

        const rows = (data ?? []) as SuccessStoryRow[];

        const mapped: UiTestimonial[] = rows
          .filter((r) => (r.couple_name || r.title) && r.story)
          .map((r) => ({
            key: r.id,
            name: (r.couple_name || r.title || 'Success Story') as string,
            location: (r.location || '') as string,
            text: (r.story || '') as string,
            image: (r.image_url || 'https://placehold.co/128x128?text=AM4M') as string,
            rating: clampRating(r.rating),
          }));

        if (!cancelled) {
          setItems(mapped.length ? mapped : FALLBACK_TESTIMONIALS);
        }
      } catch (e) {
        console.error('Failed to load success stories:', e);
        if (!cancelled) setItems(FALLBACK_TESTIMONIALS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loading && items.length === 0) return null;

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground">Success Stories</h2>
          <p className="mt-4 text-xl text-foreground/60">Real couples, real marriages</p>
        </div>

        {loading && (
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="relative rounded-2xl p-6 bg-background border border-border/60 shadow-sm"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 w-40 bg-muted rounded animate-pulse mb-2" />
                    <div className="h-3 w-28 bg-muted rounded animate-pulse" />
                  </div>
                </div>
                <div className="h-16 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          {items.map((t) => (
            <div
              key={t.key}
              className="relative rounded-2xl p-6 bg-background border border-border/60 shadow-sm hover:shadow-md hover:border-teal-300/50 transition-all duration-300"
            >
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-teal-400/50 to-transparent rounded-full" />
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={t.image}
                  alt={t.name}
                  className="w-16 h-16 rounded-full object-cover"
                  loading="lazy"
                />
                <div>
                  <h4 className="font-semibold text-foreground">{t.name}</h4>
                  {t.location ? (
                    <p className="text-sm text-foreground/60">{t.location}</p>
                  ) : null}
                </div>
              </div>

              <p className="text-foreground/80 italic leading-relaxed">"{t.text}"</p>

              <div className="mt-4 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < t.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300 fill-slate-300'}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
