import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type SuccessStoryRow = {
  id: string;
  created_at: string;
  title: string | null;
  story: string | null;
  published: boolean;

  // new columns you added
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

const FALLBACK_TESTIMONIALS: UiTestimonial[] = [
  // {
  //   key: 'fallback-1',
  //   name: 'Fatima & Ahmed',
  //   location: 'New York, NY',
  //   text: 'We found each other through AM4M and got married 6 months later. The wali feature gave my family peace of mind throughout the process.',
  //   image:
  //     'https://d64gsuwffb70l.cloudfront.net/68efeec24861a2554564bed1_1760554748703_7b9c3fd6.webp',
  //   rating: 5,
  // },
  // {
  //   key: 'fallback-2',
  //   name: 'Sarah & Omar',
  //   location: 'Los Angeles, CA',
  //   text: 'Finally, a platform that respects Islamic values! The chaperoned chat feature helped us get to know each other while maintaining adab.',
  //   image:
  //     'https://d64gsuwffb70l.cloudfront.net/68efeec24861a2554564bed1_1760554750476_f2180b40.webp',
  //   rating: 5,
  // },
  // {
  //   key: 'fallback-3',
  //   name: 'Zainab & Yusuf',
  //   location: 'Chicago, IL',
  //   text: 'The verification process made us feel safe. We appreciated that everyone here has serious marriage intentions. Alhamdulillah!',
  //   image:
  //     'https://d64gsuwffb70l.cloudfront.net/68efeec24861a2554564bed1_1760554752197_e2e689b8.webp',
  //   rating: 5,
  // },
];

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

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900">Success Stories</h2>
          <p className="mt-4 text-xl text-gray-600">Real couples, real marriages</p>
        </div>

        {loading && (
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="bg-gradient-to-br from-teal-50 to-white rounded-2xl p-6 shadow-lg"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 w-40 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-3 w-28 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
                <div className="h-16 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          {items.map((t) => (
            <div
              key={t.key}
              className="bg-gradient-to-br from-teal-50 to-white rounded-2xl p-6 shadow-lg"
            >
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={t.image}
                  alt={t.name}
                  className="w-16 h-16 rounded-full object-cover"
                  loading="lazy"
                />
                <div>
                  <h4 className="font-semibold text-gray-900">{t.name}</h4>
                  {t.location ? (
                    <p className="text-sm text-gray-600">{t.location}</p>
                  ) : null}
                </div>
              </div>

              <p className="text-gray-700 italic">"{t.text}"</p>

              <div className="mt-4 flex gap-1 text-amber-500">
                {'★'.repeat(t.rating)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
