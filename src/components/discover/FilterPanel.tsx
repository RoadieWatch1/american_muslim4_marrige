import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
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

type Tier = 'free' | 'silver' | 'gold';
type WithTier = { subscription_tier?: Tier | null };

// Your profiles table now has latitude/longitude
type WithCoords = { latitude?: number | null; longitude?: number | null };

export function FilterPanel({ filters, onFiltersChange }: FilterPanelProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [localFilters, setLocalFilters] = useState(filters);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const tier = ((profile as unknown as WithTier | undefined)?.subscription_tier ??
    'free') as Tier;

  const canUseSilver = tier === 'silver' || tier === 'gold';
  const canUseGold = tier === 'gold';

  const practiceLevels: { value: PracticeLevel; label: string }[] = [
    { value: 'learning', label: 'Learning' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'practicing', label: 'Practicing' },
    { value: 'very_practicing', label: 'Very Practicing' },
  ];

  const lockedText = useMemo(() => {
    if (tier === 'free') return 'Unlock advanced filters with Silver';
    if (tier === 'silver') return 'Unlock more advanced filters with Gold';
    return '';
  }, [tier]);

  const myLat = (profile as unknown as WithCoords | undefined)?.latitude ?? null;
  const myLng = (profile as unknown as WithCoords | undefined)?.longitude ?? null;
  const hasMyCoords = typeof myLat === 'number' && typeof myLng === 'number';

  const distanceMiles =
    (localFilters as any).maxDistanceMiles ??
    50; // default if not set (miles)

  const handleApply = () => {
    onFiltersChange({ ...(localFilters as any) });
    setOpen(false); // ✅ close sheet after apply
  };

  const handleReset = () => {
    // keep only base defaults
    const reset: DiscoverFilters = {
      minAge: 22,
      maxAge: 35,
    };
    setLocalFilters(reset);
    onFiltersChange(reset);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <SlidersHorizontal className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent className="p-4 max-h-screen overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Age */}
          <div>
            <Label>
              Age Range: {localFilters.minAge} - {localFilters.maxAge}
            </Label>
            <Slider
              min={18}
              max={99}
              step={1}
              value={[localFilters.minAge, localFilters.maxAge]}
              onValueChange={([min, max]) =>
                setLocalFilters({ ...localFilters, minAge: min, maxAge: max })
              }
              className="mt-2"
            />
          </div>

          {/* ✅ Distance (Location-based) */}
          <div className={!hasMyCoords ? 'opacity-60' : ''}>
            <Label>Distance from me</Label>
            {!hasMyCoords ? (
              <div className="mt-2 p-3 rounded-lg bg-gray-50 text-sm text-gray-600">
                Your location is not set yet. Please select your city from suggestions
                in Profile so we can store latitude/longitude.
              </div>
            ) : (
              <>
                <div className="text-sm text-gray-600 mt-1">
                  Up to <span className="font-semibold">{distanceMiles}</span> miles
                </div>
                <Slider
                  min={5}
                  max={500}
                  step={5}
                  value={[distanceMiles]}
                  onValueChange={([v]) =>
                    setLocalFilters({ ...(localFilters as any), maxDistanceMiles: v })
                  }
                  className="mt-2"
                />
                <div className="mt-2 flex items-center space-x-2">
                  <Checkbox
                    id="sortByDistance"
                    checked={!!(localFilters as any).sortByDistance}
                    onCheckedChange={(checked) =>
                      setLocalFilters({
                        ...(localFilters as any),
                        sortByDistance: !!checked,
                      })
                    }
                  />
                  <label htmlFor="sortByDistance" className="text-sm cursor-pointer">
                    Sort results by nearest first
                  </label>
                </div>
              </>
            )}
          </div>

          {/* Denomination */}
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

          {/* Practice level */}
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

          {/* Advanced (Silver/Gold) */}
          <div className={!canUseSilver ? 'opacity-50' : ''}>
            <Label className="mb-3 block flex items-center gap-2">
              Advanced Filters
              {!canUseSilver && <Lock className="h-4 w-4" />}
            </Label>

            {!canUseSilver ? (
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-600 mb-2">{lockedText}</p>
                <Button size="sm" onClick={() => navigate('/pricing')}>
                  Upgrade Now
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Silver+ */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="verified"
                    checked={!!localFilters.verifiedOnly}
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

                {/* Gold-only block */}
                <div className={!canUseGold ? 'opacity-50' : ''}>
                  {!canUseGold && (
                    <div className="mb-2 text-xs text-gray-600 flex items-center gap-2">
                      <Lock className="h-3.5 w-3.5" />
                      Gold only
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hasPhoto"
                        disabled={!canUseGold}
                        checked={!!localFilters.hasPhoto}
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
                        disabled={!canUseGold}
                        checked={!!localFilters.recentlyActive}
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

                    {/* ✅ Gold Islamic filters */}
                    <div className="pt-2 space-y-4">
                      <div>
                        <Label>School of Thought (Madhab)</Label>
                        <Select
                          value={(localFilters as any).madhab || 'any'}
                          onValueChange={(v) =>
                            setLocalFilters({
                              ...(localFilters as any),
                              madhab: v === 'any' ? undefined : v,
                            })
                          }
                          disabled={!canUseGold}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Any</SelectItem>
                            <SelectItem value="hanafi">Hanafi</SelectItem>
                            <SelectItem value="maliki">Maliki</SelectItem>
                            <SelectItem value="shafi">Shafi&apos;i</SelectItem>
                            <SelectItem value="hanbali">Hanbali</SelectItem>
                            <SelectItem value="no_specific">No specific madhab</SelectItem>
                            <SelectItem value="prefer_not">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Prayer Frequency</Label>
                        <Select
                          value={(localFilters as any).prayerFrequency || 'any'}
                          onValueChange={(v) =>
                            setLocalFilters({
                              ...(localFilters as any),
                              prayerFrequency: v === 'any' ? undefined : v,
                            })
                          }
                          disabled={!canUseGold}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Any</SelectItem>
                            <SelectItem value="5_times">All 5 prayers daily</SelectItem>
                            <SelectItem value="most">Most prayers daily</SelectItem>
                            <SelectItem value="some">Some prayers daily</SelectItem>
                            <SelectItem value="friday">Friday prayers mainly</SelectItem>
                            <SelectItem value="occasional">Occasionally</SelectItem>
                            <SelectItem value="learning">Learning to pray</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Mosque Attendance</Label>
                        <Select
                          value={(localFilters as any).mosqueAttendance || 'any'}
                          onValueChange={(v) =>
                            setLocalFilters({
                              ...(localFilters as any),
                              mosqueAttendance: v === 'any' ? undefined : v,
                            })
                          }
                          disabled={!canUseGold}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Any</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly (Jummah)</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="eid">Eid prayers only</SelectItem>
                            <SelectItem value="occasionally">Occasionally</SelectItem>
                            <SelectItem value="rarely">Rarely</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Halal Dietary Practice</Label>
                        <Select
                          value={(localFilters as any).halalStrict || 'any'}
                          onValueChange={(v) =>
                            setLocalFilters({
                              ...(localFilters as any),
                              halalStrict: v === 'any' ? undefined : v,
                            })
                          }
                          disabled={!canUseGold}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Any</SelectItem>
                            <SelectItem value="very_strict">Very strict</SelectItem>
                            <SelectItem value="strict">Strict</SelectItem>
                            <SelectItem value="moderate">Moderate</SelectItem>
                            <SelectItem value="flexible">Flexible</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {!canUseGold && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg text-center">
                      <p className="text-sm text-gray-600 mb-2">
                        Unlock full advanced filters with Gold
                      </p>
                      <Button size="sm" onClick={() => navigate('/pricing')}>
                        Upgrade Now
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} className="w-full">
              Reset
            </Button>
            <Button onClick={handleApply} className="w-full">
              Apply
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
