import React, { useState } from 'react';
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

interface PersonalDetailsProps {
  onSubmit: (data: any) => void;
  onBack: () => void;
  initialData?: any;
}

function parseHeight(lifestyleHeight: any) {
  // Old data: number in cm
  if (typeof lifestyleHeight === 'number' && !Number.isNaN(lifestyleHeight)) {
    const totalInches = Math.round(lifestyleHeight / 2.54);
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    return {
      feet: Math.min(Math.max(feet, 4), 7), // clamp between 4 and 7
      inches: Math.min(Math.max(inches, 0), 11),
    };
  }

  // New data: string like "5' 7\"" or "5'7"
  if (typeof lifestyleHeight === 'string' && lifestyleHeight.trim() !== '') {
    const match = lifestyleHeight.match(/(\d+)\s*'\s*(\d+)?/);
    if (match) {
      const feet = parseInt(match[1], 10);
      const inches = match[2] ? parseInt(match[2], 10) : 0;
      return {
        feet: Math.min(Math.max(feet, 4), 7),
        inches: Math.min(Math.max(inches, 0), 11),
      };
    }
  }

  // Default height if nothing set
  return { feet: 5, inches: 6 };
}

export const PersonalDetails: React.FC<PersonalDetailsProps> = ({
  onSubmit,
  onBack,
  initialData = {},
}) => {
  const lifestyle = (initialData.lifestyle_choices || {}) as any;

  const initialLanguagesString: string =
    typeof initialData.languages === 'string'
      ? initialData.languages
      : Array.isArray(initialData.languages_spoken)
      ? initialData.languages_spoken.join(', ')
      : '';

  const { feet: initialFeet, inches: initialInches } = parseHeight(
    lifestyle.height
  );

  const [formData, setFormData] = useState({
    height_feet: initialFeet,
    height_inches: initialInches,
    ethnicity: initialData.ethnicity || '',
    languages: initialLanguagesString,
    hobbies: lifestyle.hobbies || '',
    personality_traits: lifestyle.personality_traits || '',
    life_goals: lifestyle.life_goals || '',
    dealbreakers: lifestyle.dealbreakers || '',
    looking_for: lifestyle.looking_for || '',
    family_plans: lifestyle.family_plans || '',
    relocation_willing: lifestyle.relocation_willing || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.ethnicity) newErrors.ethnicity = 'Please select your ethnicity';
    if (!formData.languages) newErrors.languages = 'Please enter languages you speak';
    if (!formData.personality_traits)
      newErrors.personality_traits = 'Please describe your personality';
    if (!formData.looking_for)
      newErrors.looking_for = 'Please describe what you are looking for';
    if (!formData.family_plans)
      newErrors.family_plans = 'Please select your family plans';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const { height_feet, height_inches, ...rest } = formData;

    const heightString = `${height_feet}' ${height_inches}"`;

    onSubmit({
      ...rest,
      height: heightString, // ✅ store as "5' 7"
    });
  };

  const feetOptions = [4, 5, 6, 7];
  const inchesOptions = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Personal Details</CardTitle>
          <p className="text-gray-600">Help us understand you better</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* HEIGHT: feet + inches dropdowns */}
            <div>
              <Label>Height</Label>
              <div className="mt-2 flex gap-3">
                <div className="flex-1">
                  <Label className="text-xs text-gray-500 block mb-1">
                    Feet
                  </Label>
                  <Select
                    value={String(formData.height_feet)}
                    onValueChange={(v) =>
                      setFormData((prev) => ({
                        ...prev,
                        height_feet: parseInt(v, 10),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Feet" />
                    </SelectTrigger>
                    <SelectContent>
                      {feetOptions.map((f) => (
                        <SelectItem key={f} value={String(f)}>
                          {f} ft
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Label className="text-xs text-gray-500 block mb-1">
                    Inches
                  </Label>
                  <Select
                    value={String(formData.height_inches)}
                    onValueChange={(v) =>
                      setFormData((prev) => ({
                        ...prev,
                        height_inches: parseInt(v, 10),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Inches" />
                    </SelectTrigger>
                    <SelectContent>
                      {inchesOptions.map((inch) => (
                        <SelectItem key={inch} value={String(inch)}>
                          {inch}"
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Selected: {formData.height_feet}' {formData.height_inches}"
              </p>
            </div>

            <div>
              <Label htmlFor="ethnicity">Ethnicity *</Label>
              <Select
                value={formData.ethnicity}
                onValueChange={(v) =>
                  setFormData({ ...formData, ethnicity: v })
                }
              >
                <SelectTrigger
                  className={errors.ethnicity ? 'border-red-500' : ''}
                >
                  <SelectValue placeholder="Select your ethnicity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="arab">Arab</SelectItem>
                  <SelectItem value="south_asian">South Asian</SelectItem>
                  <SelectItem value="african">African</SelectItem>
                  <SelectItem value="european">European</SelectItem>
                  <SelectItem value="east_asian">East Asian</SelectItem>
                  <SelectItem value="latino">Latino/Hispanic</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.ethnicity && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.ethnicity}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="languages">Languages Spoken *</Label>
              <Input
                id="languages"
                value={formData.languages}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    languages: e.target.value,
                  })
                }
                placeholder="e.g., English, Arabic, Urdu"
                className={errors.languages ? 'border-red-500' : ''}
              />
              {errors.languages && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.languages}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="personality_traits">
                Describe Your Personality *
              </Label>
              <Textarea
                id="personality_traits"
                value={formData.personality_traits}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    personality_traits: e.target.value,
                  })
                }
                placeholder="e.g., Caring, ambitious, family-oriented, humorous..."
                rows={3}
                className={errors.personality_traits ? 'border-red-500' : ''}
              />
              {errors.personality_traits && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.personality_traits}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="looking_for">What Are You Looking For? *</Label>
              <Textarea
                id="looking_for"
                value={formData.looking_for}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    looking_for: e.target.value,
                  })
                }
                placeholder="Describe the qualities you seek in a spouse..."
                rows={3}
                className={errors.looking_for ? 'border-red-500' : ''}
              />
              {errors.looking_for && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.looking_for}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="family_plans">Family Plans *</Label>
              <Select
                value={formData.family_plans}
                onValueChange={(v) =>
                  setFormData({ ...formData, family_plans: v })
                }
              >
                <SelectTrigger
                  className={errors.family_plans ? 'border-red-500' : ''}
                >
                  <SelectValue placeholder="Select your preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="want_soon">
                    Want children soon
                  </SelectItem>
                  <SelectItem value="want_someday">
                    Want children someday
                  </SelectItem>
                  <SelectItem value="dont_want">
                    Don't want children
                  </SelectItem>
                  <SelectItem value="have_want_more">
                    Have children, want more
                  </SelectItem>
                  <SelectItem value="have_dont_want_more">
                    Have children, don't want more
                  </SelectItem>
                  <SelectItem value="undecided">
                    Undecided
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.family_plans && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.family_plans}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="relocation_willing">
                Willing to Relocate?
              </Label>
              <Select
                value={formData.relocation_willing}
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    relocation_willing: v,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">
                    Yes, willing to relocate
                  </SelectItem>
                  <SelectItem value="no">
                    No, not willing to relocate
                  </SelectItem>
                  <SelectItem value="maybe">
                    Maybe, depends on circumstances
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="hobbies">Hobbies &amp; Interests</Label>
              <Textarea
                id="hobbies"
                value={formData.hobbies}
                onChange={(e) =>
                  setFormData({ ...formData, hobbies: e.target.value })
                }
                placeholder="What do you enjoy doing in your free time?"
                rows={2}
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="flex-1"
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
