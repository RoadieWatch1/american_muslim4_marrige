import React from 'react';
import { X, MapPin, Briefcase, Book, Heart, Home } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  AdvancedSearchFilters,
  EDUCATION_LEVELS,
  CAREER_FIELDS,
  PRAYER_FREQUENCIES,
  QURAN_MEMORIZATION,
  ISLAMIC_EDUCATION,
  FAMILY_PREFERENCES,
  LIFESTYLE_CHOICES
} from '@/types/search';

interface Props {
  filters: AdvancedSearchFilters;
  onFiltersChange: (filters: AdvancedSearchFilters) => void;
  onClose: () => void;
  onSaveSearch?: () => void;
}

export default function AdvancedSearchFiltersComponent({ 
  filters, 
  onFiltersChange, 
  onClose,
  onSaveSearch 
}: Props) {
  const handleMultiSelect = (field: keyof AdvancedSearchFilters, value: string) => {
    const currentValues = (filters[field] as string[]) || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    onFiltersChange({ ...filters, [field]: newValues });
  };

  const activeFiltersCount = Object.keys(filters).filter(key => {
    const value = filters[key as keyof AdvancedSearchFilters];
    return value !== undefined && value !== null && 
           (Array.isArray(value) ? value.length > 0 : true);
  }).length;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Advanced Search</h2>
            {activeFiltersCount > 0 && (
              <Badge className="mt-2">{activeFiltersCount} filters active</Badge>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-8">
          {/* Age Range */}
          <div>
            <Label className="text-base font-semibold mb-4 flex items-center gap-2">
              Age Range
            </Label>
            <div className="flex items-center gap-4">
              <span>{filters.minAge || 18}</span>
              <Slider
                value={[filters.minAge || 18, filters.maxAge || 60]}
                onValueChange={([min, max]) => 
                  onFiltersChange({ ...filters, minAge: min, maxAge: max })
                }
                min={18}
                max={60}
                step={1}
                className="flex-1"
              />
              <span>{filters.maxAge || 60}</span>
            </div>
          </div>

          {/* Location */}
          <div>
            <Label className="text-base font-semibold mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="City"
                value={filters.city || ''}
                onChange={(e) => onFiltersChange({ ...filters, city: e.target.value })}
              />
              <Input
                placeholder="Country"
                value={filters.country || ''}
                onChange={(e) => onFiltersChange({ ...filters, country: e.target.value })}
              />
              <div className="col-span-2">
                <Label>Search radius (km)</Label>
                <Slider
                  value={[filters.locationRadius || 50]}
                  onValueChange={([radius]) => 
                    onFiltersChange({ ...filters, locationRadius: radius })
                  }
                  min={5}
                  max={500}
                  step={5}
                  className="mt-2"
                />
                <span className="text-sm text-gray-600">
                  {filters.locationRadius || 50} km
                </span>
              </div>
            </div>
          </div>

          {/* Education & Career */}
          <div>
            <Label className="text-base font-semibold mb-4 flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Education & Career
            </Label>
            <div className="space-y-4">
              <div>
                <Label className="text-sm">Education Level</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {EDUCATION_LEVELS.map(level => (
                    <label key={level} className="flex items-center gap-2">
                      <Checkbox
                        checked={filters.educationLevel?.includes(level)}
                        onCheckedChange={() => handleMultiSelect('educationLevel', level)}
                      />
                      <span className="text-sm">{level}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Religious Practices */}
          <div>
            <Label className="text-base font-semibold mb-4 flex items-center gap-2">
              <Book className="h-4 w-4" />
              Religious Practices
            </Label>
            <div className="space-y-4">
              <div>
                <Label className="text-sm">Prayer Frequency</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {PRAYER_FREQUENCIES.map(freq => (
                    <label key={freq} className="flex items-center gap-2">
                      <Checkbox
                        checked={filters.prayerFrequency?.includes(freq)}
                        onCheckedChange={() => handleMultiSelect('prayerFrequency', freq)}
                      />
                      <span className="text-sm">{freq}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Family Preferences */}
          <div>
            <Label className="text-base font-semibold mb-4 flex items-center gap-2">
              <Home className="h-4 w-4" />
              Family Preferences
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={filters.wantsChildren}
                  onCheckedChange={(checked) => 
                    onFiltersChange({ ...filters, wantsChildren: !!checked })
                  }
                />
                <span className="text-sm">Wants Children</span>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={filters.hasChildren}
                  onCheckedChange={(checked) => 
                    onFiltersChange({ ...filters, hasChildren: !!checked })
                  }
                />
                <span className="text-sm">Has Children</span>
              </label>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t p-6 flex justify-between">
          <Button
            variant="outline"
            onClick={() => onFiltersChange({})}
          >
            Clear All
          </Button>
          <div className="flex gap-2">
            {onSaveSearch && (
              <Button variant="outline" onClick={onSaveSearch}>
                Save Search
              </Button>
            )}
            <Button onClick={onClose}>Apply Filters</Button>
          </div>
        </div>
      </div>
    </div>
  );
}