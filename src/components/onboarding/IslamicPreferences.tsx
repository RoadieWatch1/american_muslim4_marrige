import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertCircle } from 'lucide-react';

interface IslamicPreferencesProps {
  onSubmit: (data: any) => void;
  onBack: () => void;
  initialData?: any;
}

export const IslamicPreferences: React.FC<IslamicPreferencesProps> = ({ onSubmit, onBack, initialData = {} }) => {
  const [formData, setFormData] = useState({
    prayer_frequency: initialData.prayer_frequency || '',
    quran_reading: initialData.quran_reading || '',
    islamic_education: initialData.islamic_education || '',
    fasting_regular: initialData.fasting_regular || false,
    hajj_completed: initialData.hajj_completed || false,
    halal_strict: initialData.halal_strict || '',
    mosque_attendance: initialData.mosque_attendance || '',
    islamic_finance: initialData.islamic_finance || false,
    zakat_regular: initialData.zakat_regular || false,
    convert_revert: initialData.convert_revert || false,
    madhab: initialData.madhab || '',
    hijab_preference: initialData.hijab_preference || '',
    beard_preference: initialData.beard_preference || '',
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.prayer_frequency) newErrors.prayer_frequency = 'Please select your prayer frequency';
    if (!formData.halal_strict) newErrors.halal_strict = 'Please select your halal dietary preference';
    if (!formData.mosque_attendance) newErrors.mosque_attendance = 'Please select mosque attendance frequency';
    
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
          <CardTitle className="text-2xl">Islamic Practices & Preferences</CardTitle>
          <p className="text-gray-600">Share your religious practices and preferences</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="prayer_frequency">Daily Prayer (Salah) *</Label>
              <Select value={formData.prayer_frequency} onValueChange={(v) => setFormData({...formData, prayer_frequency: v})}>
                <SelectTrigger className={errors.prayer_frequency ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5_times">All 5 prayers daily</SelectItem>
                  <SelectItem value="most">Most prayers daily</SelectItem>
                  <SelectItem value="some">Some prayers daily</SelectItem>
                  <SelectItem value="friday">Friday prayers mainly</SelectItem>
                  <SelectItem value="occasional">Occasionally</SelectItem>
                  <SelectItem value="learning">Learning to pray</SelectItem>
                </SelectContent>
              </Select>
              {errors.prayer_frequency && <p className="text-red-500 text-sm mt-1">{errors.prayer_frequency}</p>}
            </div>

            <div>
              <Label htmlFor="quran_reading">Quran Reading</Label>
              <Select value={formData.quran_reading} onValueChange={(v) => setFormData({...formData, quran_reading: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="ramadan">During Ramadan</SelectItem>
                  <SelectItem value="occasionally">Occasionally</SelectItem>
                  <SelectItem value="learning">Learning to read</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="mosque_attendance">Mosque Attendance *</Label>
              <Select value={formData.mosque_attendance} onValueChange={(v) => setFormData({...formData, mosque_attendance: v})}>
                <SelectTrigger className={errors.mosque_attendance ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly (Jummah)</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="eid">Eid prayers only</SelectItem>
                  <SelectItem value="occasionally">Occasionally</SelectItem>
                  <SelectItem value="rarely">Rarely</SelectItem>
                </SelectContent>
              </Select>
              {errors.mosque_attendance && <p className="text-red-500 text-sm mt-1">{errors.mosque_attendance}</p>}
            </div>
            <div>
              <Label htmlFor="halal_strict">Halal Dietary Practice *</Label>
              <RadioGroup value={formData.halal_strict} onValueChange={(v) => setFormData({...formData, halal_strict: v})}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="very_strict" id="very_strict" />
                  <Label htmlFor="very_strict">Very strict (halal only, no exceptions)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="strict" id="strict" />
                  <Label htmlFor="strict">Strict (halal when available)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="moderate" id="moderate" />
                  <Label htmlFor="moderate">Moderate (avoid pork/alcohol)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="flexible" id="flexible" />
                  <Label htmlFor="flexible">Flexible</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="islamic_education">Islamic Education</Label>
              <Select value={formData.islamic_education} onValueChange={(v) => setFormData({...formData, islamic_education: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scholar">Islamic Scholar/Student</SelectItem>
                  <SelectItem value="formal">Formal Islamic Education</SelectItem>
                  <SelectItem value="self_taught">Self-taught</SelectItem>
                  <SelectItem value="basic">Basic Knowledge</SelectItem>
                  <SelectItem value="learning">Currently Learning</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="madhab">School of Thought (Madhab)</Label>
              <Select value={formData.madhab} onValueChange={(v) => setFormData({...formData, madhab: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select if applicable" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hanafi">Hanafi</SelectItem>
                  <SelectItem value="maliki">Maliki</SelectItem>
                  <SelectItem value="shafi">Shafi'i</SelectItem>
                  <SelectItem value="hanbali">Hanbali</SelectItem>
                  <SelectItem value="no_specific">No specific madhab</SelectItem>
                  <SelectItem value="prefer_not">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Additional Practices</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="fasting_regular" 
                    checked={formData.fasting_regular}
                    onCheckedChange={(checked) => setFormData({...formData, fasting_regular: checked as boolean})}
                  />
                  <Label htmlFor="fasting_regular">Regular fasting outside Ramadan</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="hajj_completed" 
                    checked={formData.hajj_completed}
                    onCheckedChange={(checked) => setFormData({...formData, hajj_completed: checked as boolean})}
                  />
                  <Label htmlFor="hajj_completed">Completed Hajj</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="zakat_regular" 
                    checked={formData.zakat_regular}
                    onCheckedChange={(checked) => setFormData({...formData, zakat_regular: checked as boolean})}
                  />
                  <Label htmlFor="zakat_regular">Pay Zakat regularly</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="islamic_finance" 
                    checked={formData.islamic_finance}
                    onCheckedChange={(checked) => setFormData({...formData, islamic_finance: checked as boolean})}
                  />
                  <Label htmlFor="islamic_finance">Use Islamic banking/finance</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="convert_revert" 
                    checked={formData.convert_revert}
                    onCheckedChange={(checked) => setFormData({...formData, convert_revert: checked as boolean})}
                  />
                  <Label htmlFor="convert_revert">I am a convert/revert</Label>
                </div>
              </div>
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