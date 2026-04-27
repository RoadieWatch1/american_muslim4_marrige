import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { loadGooglePlaces } from '@/lib/googleMaps';

interface ProfileFormProps {
  gender: 'male' | 'female';
  onSubmit: (data: any) => void;
  onBack: () => void;
  initialData?: any;
}

// ✅ MUST match DB constraint exactly:
// CHECK (nikah_timeline = ANY (ARRAY['asap','3-6mo','6-12mo','>12mo']))
const NIKAH_TIMELINE_OPTIONS = [
  { value: 'asap', label: 'As soon as possible' },
  { value: '3-6mo', label: '3–6 months' },
  { value: '6-12mo', label: '6–12 months' },
  { value: '>12mo', label: 'More than 12 months' },
];

export const ProfileForm: React.FC<ProfileFormProps> = ({
  gender,
  onSubmit,
  onBack,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    dob: '',
    city: '',
    state: '',
    country: '',
    marital_status: '',
    nikah_timeline: '',
    has_children: false,
    education: '',
    occupation: '',
    employment_status: '',
    annual_income_range: '',
    bio: '',
    latitude: null as number | null,
    longitude: null as number | null,
  });

  const cityInputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteAttachedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadGooglePlaces();
        if (cancelled || !cityInputRef.current || autocompleteAttachedRef.current) return;

        const ac = new (window as any).google.maps.places.Autocomplete(
          cityInputRef.current,
          {
            types: ['(cities)'],
            fields: ['address_components', 'geometry', 'name'],
          }
        );
        autocompleteAttachedRef.current = true;

        ac.addListener('place_changed', () => {
          const place = ac.getPlace();
          if (!place) return;

          let city = '';
          let state = '';
          let country = '';
          const components = place.address_components || [];
          for (const c of components) {
            const types: string[] = c.types || [];
            if (types.includes('locality')) city = c.long_name;
            else if (!city && types.includes('postal_town')) city = c.long_name;
            else if (!city && types.includes('administrative_area_level_2')) city = c.long_name;
            if (types.includes('administrative_area_level_1')) state = c.short_name;
            if (types.includes('country')) country = c.long_name;
          }
          if (!city) city = place.name || '';

          const lat =
            typeof place.geometry?.location?.lat === 'function'
              ? place.geometry.location.lat()
              : null;
          const lng =
            typeof place.geometry?.location?.lng === 'function'
              ? place.geometry.location.lng()
              : null;

          setFormData((prev) => ({
            ...prev,
            city: city || prev.city,
            state: state || prev.state,
            country: country || prev.country,
            latitude: typeof lat === 'number' ? lat : prev.latitude,
            longitude: typeof lng === 'number' ? lng : prev.longitude,
          }));
        });
      } catch (err) {
        console.error('Google Places failed to load:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Prefill from initialData when it changes
  useEffect(() => {
    if (!initialData) return;

    let dob = initialData.dob || '';
    if (dob && typeof dob === 'string' && dob.length > 10) {
      dob = dob.slice(0, 10);
    }

    setFormData((prev) => ({
      ...prev,
      first_name: initialData.first_name || '',
      last_name: initialData.last_name || '',
      dob: dob || '',
      city: initialData.city || '',
      state: initialData.state || '',
      country: initialData.country || '',
      marital_status: initialData.marital_status || '',
      nikah_timeline: initialData.nikah_timeline || '',
      has_children:
        typeof initialData.has_children === 'boolean'
          ? initialData.has_children
          : false,
      education: initialData.education || '',
      occupation: initialData.occupation || '',
      employment_status:
        initialData.employment_status ||
        initialData.lifestyle_choices?.employment_status ||
        '',
      annual_income_range:
        initialData.annual_income_range ||
        initialData.lifestyle_choices?.annual_income_range ||
        '',
      bio: initialData.bio || '',
      latitude:
        typeof initialData.latitude === 'number'
          ? initialData.latitude
          : initialData.latitude
          ? Number(initialData.latitude)
          : null,
      longitude:
        typeof initialData.longitude === 'number'
          ? initialData.longitude
          : initialData.longitude
          ? Number(initialData.longitude)
          : null,
    }));
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nikah_timeline) {
      alert('Please select your Nikah timeline.');
      return;
    }
    if (!formData.marital_status) {
      alert('Please select your marital status.');
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create Your Profile</CardTitle>
          <p className="text-gray-600">Tell us about yourself</p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="dob">Date of Birth *</Label>
              <Input
                id="dob"
                type="date"
                value={formData.dob}
                onChange={(e) =>
                  setFormData({ ...formData, dob: e.target.value })
                }
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  ref={cityInputRef}
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      city: e.target.value,
                      latitude: null,
                      longitude: null,
                    })
                  }
                  placeholder="Start typing your city…"
                  autoComplete="off"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Pick a city from suggestions so distance-based matching can
                  work.
                  {formData.latitude != null && formData.longitude != null && (
                    <span className="ml-1 text-emerald-600">Location set ✓</span>
                  )}
                </p>
              </div>

              <div>
                <Label htmlFor="state">State / Region *</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                  placeholder="e.g., IL"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) =>
                  setFormData({ ...formData, country: e.target.value })
                }
                placeholder="e.g., United States"
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="text-base font-semibold text-gray-900">
                Employment & Education
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                Income details are optional. You can skip or select "Prefer not
                to say."
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="education">Education</Label>
                  <Input
                    id="education"
                    value={formData.education}
                    onChange={(e) =>
                      setFormData({ ...formData, education: e.target.value })
                    }
                    placeholder="e.g., Bachelor's, Master's..."
                  />
                </div>
                <div>
                  <Label htmlFor="occupation">Occupation</Label>
                  <Input
                    id="occupation"
                    value={formData.occupation}
                    onChange={(e) =>
                      setFormData({ ...formData, occupation: e.target.value })
                    }
                    placeholder="e.g., Software Engineer..."
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="employment_status">Employment Status</Label>
                  <Select
                    value={formData.employment_status}
                    onValueChange={(v) =>
                      setFormData({ ...formData, employment_status: v })
                    }
                  >
                    <SelectTrigger id="employment_status">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employed">Employed</SelectItem>
                      <SelectItem value="self_employed">Self-employed</SelectItem>
                      <SelectItem value="business_owner">Business owner</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="homemaker">Homemaker</SelectItem>
                      <SelectItem value="between_jobs">Between jobs</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                      <SelectItem value="prefer_not_to_say">
                        Prefer not to say
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="annual_income_range">
                    Annual Income (optional)
                  </Label>
                  <Select
                    value={formData.annual_income_range}
                    onValueChange={(v) =>
                      setFormData({ ...formData, annual_income_range: v })
                    }
                  >
                    <SelectTrigger id="annual_income_range">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10k_100k">$10,000 – $100,000</SelectItem>
                      <SelectItem value="100k_plus">$100,000+</SelectItem>
                      <SelectItem value="200k_plus">$200,000+</SelectItem>
                      <SelectItem value="300k_plus">$300,000+</SelectItem>
                      <SelectItem value="400k_plus">$400,000+</SelectItem>
                      <SelectItem value="500k_plus">$500,000+</SelectItem>
                      <SelectItem value="prefer_not_to_disclose">
                        Prefer not to disclose
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="marital_status">Marital Status *</Label>
              <Select
                value={formData.marital_status}
                onValueChange={(v) =>
                  setFormData({ ...formData, marital_status: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="divorced">Divorced</SelectItem>
                  <SelectItem value="widowed">Widowed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Nikah Timeline *</Label>
              <Select
                value={formData.nikah_timeline}
                onValueChange={(v) =>
                  setFormData({ ...formData, nikah_timeline: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {NIKAH_TIMELINE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                This helps us match you with people on a similar timeline.
              </p>
            </div>

            <div>
              <Label htmlFor="bio">About Me *</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                rows={4}
                required
              />
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onBack}
              >
                Back
              </Button>
              <Button type="submit" className="flex-1">
                Continue
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
