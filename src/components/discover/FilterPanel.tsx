import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button'; // <- lowercase
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { SlidersHorizontal, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { DiscoverFilters, PracticeLevel } from '@/types';

interface FilterPanelProps {
  filters: DiscoverFilters;
  onFiltersChange: (filters: DiscoverFilters) => void;
}

type WithTier = { subscription_tier?: 'free' | 'premium' | 'elite' };

export function FilterPanel({ filters, onFiltersChange }: FilterPanelProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [localFilters, setLocalFilters] = useState(filters);

  // Read subscription_tier safely without changing global types
  const tier = (profile as unknown as WithTier | undefined)?.subscription_tier;
  const isPremiumOrElite = tier === 'premium' || tier === 'elite';

  const practiceLevels: { value: PracticeLevel; label: string }[] = [
    { value: 'learning', label: 'Learning' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'practicing', label: 'Practicing' },
    { value: 'very_practicing', label: 'Very Practicing' },
  ];

  const handleApply = () => {
    onFiltersChange(localFilters);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <SlidersHorizontal className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          <div>
            <Label>
              Age Range: {localFilters.minAge} - {localFilters.maxAge}
            </Label>
            <Slider
              min={18}
              max={60}
              step={1}
              value={[localFilters.minAge, localFilters.maxAge]}
              onValueChange={([min, max]) =>
                setLocalFilters({ ...localFilters, minAge: min, maxAge: max })
              }
              className="mt-2"
            />
          </div>

          <div>
            <Label>Location Radius: {localFilters.locationRadius} miles</Label>
            <Slider
              min={5}
              max={500}
              step={5}
              value={[localFilters.locationRadius]}
              onValueChange={([radius]) =>
                setLocalFilters({ ...localFilters, locationRadius: radius })
              }
              className="mt-2"
            />
          </div>

          <div>
            <Label>Denomination</Label>
            <Select
              value={localFilters.denomination || 'any'}
              onValueChange={(value) =>
                setLocalFilters({
                  ...localFilters,
                  denomination: value === 'any' ? undefined : value,
                })
              }
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="sunni">Sunni</SelectItem>
                <SelectItem value="shia">Shia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-3 block">Practice Level</Label>
            <div className="space-y-2">
              {practiceLevels.map((level) => (
                <div key={level.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={level.value}
                    checked={localFilters.practiceLevel?.includes(level.value)}
                    onCheckedChange={(checked) => {
                      const current = localFilters.practiceLevel || [];
                      setLocalFilters({
                        ...localFilters,
                        practiceLevel: checked
                          ? [...current, level.value]
                          : current.filter((l) => l !== level.value),
                      });
                    }}
                  />
                  <label htmlFor={level.value} className="text-sm cursor-pointer">
                    {level.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Advanced Filters - Premium/Elite Only */}
          <div className={!isPremiumOrElite ? 'opacity-50' : ''}>
            <Label className="mb-3 block flex items-center gap-2">
              Advanced Filters
              {!isPremiumOrElite && <Lock className="h-4 w-4" />}
            </Label>

            {!isPremiumOrElite ? (
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Unlock advanced filters with Premium
                </p>
                <Button size="sm" onClick={() => navigate('/pricing')}>
                  Upgrade Now
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="verified"
                    checked={localFilters.verifiedOnly}
                    onCheckedChange={(checked) =>
                      setLocalFilters({
                        ...localFilters,
                        verifiedOnly: !!checked,
                      })
                    }
                  />
                  <label htmlFor="verified" className="text-sm cursor-pointer">
                    Verified profiles only
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasPhoto"
                    checked={localFilters.hasPhoto}
                    onCheckedChange={(checked) =>
                      setLocalFilters({
                        ...localFilters,
                        hasPhoto: !!checked,
                      })
                    }
                  />
                  <label htmlFor="hasPhoto" className="text-sm cursor-pointer">
                    Has profile photo
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="recentlyActive"
                    checked={localFilters.recentlyActive}
                    onCheckedChange={(checked) =>
                      setLocalFilters({
                        ...localFilters,
                        recentlyActive: !!checked,
                      })
                    }
                  />
                  <label htmlFor="recentlyActive" className="text-sm cursor-pointer">
                    Recently active (last 7 days)
                  </label>
                </div>
              </div>
            )}
          </div>

          <Button onClick={handleApply} className="w-full">
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
