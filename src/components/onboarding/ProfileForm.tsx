import React, { useEffect, useState } from 'react';
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
    marital_status: '',
    nikah_timeline: '',
    has_children: false,
    education: '',
    occupation: '',
    bio: '',
  });

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
      marital_status: initialData.marital_status || '',
      nikah_timeline: initialData.nikah_timeline || '',
      has_children:
        typeof initialData.has_children === 'boolean'
          ? initialData.has_children
          : false,
      education: initialData.education || '',
      occupation: initialData.occupation || '',
      bio: initialData.bio || '',
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
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {/* ✅ NEW: education + occupation */}
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
