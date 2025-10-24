import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PersonalDetailsProps {
  onSubmit: (data: any) => void;
  onBack: () => void;
  initialData?: any;
}

export const PersonalDetails: React.FC<PersonalDetailsProps> = ({ onSubmit, onBack, initialData = {} }) => {
  const [formData, setFormData] = useState({
    height: initialData.height || 170,
    ethnicity: initialData.ethnicity || '',
    languages: initialData.languages || '',
    hobbies: initialData.hobbies || '',
    personality_traits: initialData.personality_traits || '',
    life_goals: initialData.life_goals || '',
    dealbreakers: initialData.dealbreakers || '',
    looking_for: initialData.looking_for || '',
    family_plans: initialData.family_plans || '',
    relocation_willing: initialData.relocation_willing || '',
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.ethnicity) newErrors.ethnicity = 'Please select your ethnicity';
    if (!formData.languages) newErrors.languages = 'Please enter languages you speak';
    if (!formData.personality_traits) newErrors.personality_traits = 'Please describe your personality';
    if (!formData.looking_for) newErrors.looking_for = 'Please describe what you are looking for';
    if (!formData.family_plans) newErrors.family_plans = 'Please select your family plans';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Personal Details</CardTitle>
          <p className="text-gray-600">Help us understand you better</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="height">Height (cm): {formData.height}</Label>
              <Slider
                id="height"
                min={140}
                max={220}
                step={1}
                value={[formData.height]}
                onValueChange={(v) => setFormData({...formData, height: v[0]})}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="ethnicity">Ethnicity *</Label>
              <Select value={formData.ethnicity} onValueChange={(v) => setFormData({...formData, ethnicity: v})}>
                <SelectTrigger className={errors.ethnicity ? 'border-red-500' : ''}>
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
              {errors.ethnicity && <p className="text-red-500 text-sm mt-1">{errors.ethnicity}</p>}
            </div>

            <div>
              <Label htmlFor="languages">Languages Spoken *</Label>
              <Input 
                id="languages" 
                value={formData.languages} 
                onChange={(e) => setFormData({...formData, languages: e.target.value})}
                placeholder="e.g., English, Arabic, Urdu"
                className={errors.languages ? 'border-red-500' : ''}
              />
              {errors.languages && <p className="text-red-500 text-sm mt-1">{errors.languages}</p>}
            </div>

            <div>
              <Label htmlFor="personality_traits">Describe Your Personality *</Label>
              <Textarea 
                id="personality_traits" 
                value={formData.personality_traits} 
                onChange={(e) => setFormData({...formData, personality_traits: e.target.value})}
                placeholder="e.g., Caring, ambitious, family-oriented, humorous..."
                rows={3}
                className={errors.personality_traits ? 'border-red-500' : ''}
              />
              {errors.personality_traits && <p className="text-red-500 text-sm mt-1">{errors.personality_traits}</p>}
            </div>

            <div>
              <Label htmlFor="looking_for">What Are You Looking For? *</Label>
              <Textarea 
                id="looking_for" 
                value={formData.looking_for} 
                onChange={(e) => setFormData({...formData, looking_for: e.target.value})}
                placeholder="Describe the qualities you seek in a spouse..."
                rows={3}
                className={errors.looking_for ? 'border-red-500' : ''}
              />
              {errors.looking_for && <p className="text-red-500 text-sm mt-1">{errors.looking_for}</p>}
            </div>

            <div>
              <Label htmlFor="family_plans">Family Plans *</Label>
              <Select value={formData.family_plans} onValueChange={(v) => setFormData({...formData, family_plans: v})}>
                <SelectTrigger className={errors.family_plans ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select your preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="want_soon">Want children soon</SelectItem>
                  <SelectItem value="want_someday">Want children someday</SelectItem>
                  <SelectItem value="dont_want">Don't want children</SelectItem>
                  <SelectItem value="have_want_more">Have children, want more</SelectItem>
                  <SelectItem value="have_dont_want_more">Have children, don't want more</SelectItem>
                  <SelectItem value="undecided">Undecided</SelectItem>
                </SelectContent>
              </Select>
              {errors.family_plans && <p className="text-red-500 text-sm mt-1">{errors.family_plans}</p>}
            </div>

            <div>
              <Label htmlFor="relocation_willing">Willing to Relocate?</Label>
              <Select value={formData.relocation_willing} onValueChange={(v) => setFormData({...formData, relocation_willing: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes, willing to relocate</SelectItem>
                  <SelectItem value="no">No, not willing to relocate</SelectItem>
                  <SelectItem value="maybe">Maybe, depends on circumstances</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="hobbies">Hobbies & Interests</Label>
              <Textarea 
                id="hobbies" 
                value={formData.hobbies} 
                onChange={(e) => setFormData({...formData, hobbies: e.target.value})}
                placeholder="What do you enjoy doing in your free time?"
                rows={2}
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={onBack} className="flex-1">
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