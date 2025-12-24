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

export function FilterPanel({ filters, onFiltersChange }: FilterPanelProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [localFilters, setLocalFilters] = useState(filters);

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

  const handleApply = () => {
    onFiltersChange({ ...localFilters });
  };

  return (
    <Sheet>
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
                          value={localFilters.madhab || 'any'}
                          onValueChange={(v) =>
                            setLocalFilters({
                              ...localFilters,
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
                            <SelectItem value="shafi">Shafi'i</SelectItem>
                            <SelectItem value="hanbali">Hanbali</SelectItem>
                            <SelectItem value="no_specific">No specific madhab</SelectItem>
                            <SelectItem value="prefer_not">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Prayer Frequency</Label>
                        <Select
                          value={localFilters.prayerFrequency || 'any'}
                          onValueChange={(v) =>
                            setLocalFilters({
                              ...localFilters,
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
                          value={localFilters.mosqueAttendance || 'any'}
                          onValueChange={(v) =>
                            setLocalFilters({
                              ...localFilters,
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
                          value={localFilters.halalStrict || 'any'}
                          onValueChange={(v) =>
                            setLocalFilters({
                              ...localFilters,
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

          <Button onClick={handleApply} className="w-full">
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}




// import { useEffect, useMemo, useState } from 'react';
// import { useAuth } from '@/contexts/AuthContext';
// import { Button } from '@/components/ui/Button';
// import { Label } from '@/components/ui/label';
// import { Slider } from '@/components/ui/slider';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import { Checkbox } from '@/components/ui/checkbox';
// import {
//   Sheet,
//   SheetContent,
//   SheetHeader,
//   SheetTitle,
//   SheetTrigger,
// } from '@/components/ui/sheet';
// import { SlidersHorizontal, Lock } from 'lucide-react';
// import { useNavigate } from 'react-router-dom';
// import type { DiscoverFilters, PracticeLevel } from '@/types';

// interface FilterPanelProps {
//   filters: DiscoverFilters;
//   onFiltersChange: (filters: DiscoverFilters) => void;
// }

// type Tier = 'free' | 'silver' | 'gold';
// type WithTier = { subscription_tier?: Tier | null };

// export function FilterPanel({ filters, onFiltersChange }: FilterPanelProps) {
//   const { profile } = useAuth();
//   const navigate = useNavigate();
//   const [localFilters, setLocalFilters] = useState(filters);

//   // keep local in sync if parent changes externally
//   useEffect(() => {
//     setLocalFilters(filters);
//   }, [filters]);

//   const tier = ((profile as unknown as WithTier | undefined)?.subscription_tier ??
//     'free') as Tier;

//   const canUseSilver = tier === 'silver' || tier === 'gold';
//   const canUseGold = tier === 'gold';

//   const practiceLevels: { value: PracticeLevel; label: string }[] = [
//     { value: 'learning', label: 'Learning' },
//     { value: 'moderate', label: 'Moderate' },
//     { value: 'practicing', label: 'Practicing' },
//     { value: 'very_practicing', label: 'Very Practicing' },
//   ];

//   const handleApply = () => {
//     // If radius is 0 => treat as Any Location (don’t filter by distance)
//     const normalized: DiscoverFilters = {
//       ...localFilters,
//       locationRadius:
//         (localFilters.locationRadius ?? 0) <= 0 ? 0 : localFilters.locationRadius,
//     };

//     onFiltersChange(normalized);
//   };

//   const lockedText = useMemo(() => {
//     if (tier === 'free') return 'Unlock advanced filters with Silver';
//     if (tier === 'silver') return 'Unlock more advanced filters with Gold';
//     return '';
//   }, [tier]);

//   return (
//     <Sheet>
//       <SheetTrigger asChild>
//         <Button variant="outline" size="icon">
//           <SlidersHorizontal className="h-5 w-5" />
//         </Button>
//       </SheetTrigger>

//       <SheetContent className="p-4">
//         <SheetHeader>
//           <SheetTitle>Filters</SheetTitle>
//         </SheetHeader>

//         <div className="space-y-6 mt-6">
//           {/* Age */}
//           <div>
//             <Label>
//               Age Range: {localFilters.minAge} - {localFilters.maxAge}
//             </Label>
//             <Slider
//               min={18}
//               max={99} // ✅ allow up to 99
//               step={1}
//               value={[localFilters.minAge, localFilters.maxAge]}
//               onValueChange={([min, max]) =>
//                 setLocalFilters({ ...localFilters, minAge: min, maxAge: max })
//               }
//               className="mt-2"
//             />
//           </div>

//           {/* Location radius */}
//           <div>
//             <Label>
//               Location Radius:{' '}
//               {(localFilters.locationRadius ?? 0) <= 0
//                 ? 'Any'
//                 : `${localFilters.locationRadius} miles`}
//             </Label>
//             <Slider
//               min={0} // ✅ 0 means ANY location
//               max={500}
//               step={5}
//               value={[localFilters.locationRadius ?? 0]}
//               onValueChange={([radius]) =>
//                 setLocalFilters({ ...localFilters, locationRadius: radius })
//               }
//               className="mt-2"
//             />
//           </div>

//           {/* Denomination (DB: profiles.denomination is text nullable) */}
//           <div>
//             <Label>Denomination</Label>
//             <Select
//               value={localFilters.denomination || 'any'}
//               onValueChange={(value) =>
//                 setLocalFilters({
//                   ...localFilters,
//                   denomination: value === 'any' ? undefined : value,
//                 })
//               }
//             >
//               <SelectTrigger className="mt-2">
//                 <SelectValue />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="any">Any</SelectItem>
//                 {/* use whatever values you store in profiles.denomination */}
//                 <SelectItem value="sunni">Sunni</SelectItem>
//                 <SelectItem value="shia">Shia</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>

//           {/* Practice level (DB constraint uses: learning/moderate/practicing/very_practicing) */}
//           <div>
//             <Label className="mb-3 block">Practice Level</Label>
//             <div className="space-y-2">
//               {practiceLevels.map((level) => (
//                 <div key={level.value} className="flex items-center space-x-2">
//                   <Checkbox
//                     id={level.value}
//                     checked={localFilters.practiceLevel?.includes(level.value)}
//                     onCheckedChange={(checked) => {
//                       const current = localFilters.practiceLevel || [];
//                       setLocalFilters({
//                         ...localFilters,
//                         practiceLevel: checked
//                           ? [...current, level.value]
//                           : current.filter((l) => l !== level.value),
//                       });
//                     }}
//                   />
//                   <label htmlFor={level.value} className="text-sm cursor-pointer">
//                     {level.label}
//                   </label>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* Advanced Filters tiers:
//               free  -> locked
//               silver-> only Verified
//               gold  -> Verified + Has photo + Recently active
//           */}
//           <div className={!canUseSilver ? 'opacity-50' : ''}>
//             <Label className="mb-3 block flex items-center gap-2">
//               Advanced Filters
//               {!canUseSilver && <Lock className="h-4 w-4" />}
//             </Label>

//             {!canUseSilver ? (
//               <div className="p-4 bg-gray-50 rounded-lg text-center">
//                 <p className="text-sm text-gray-600 mb-2">{lockedText}</p>
//                 <Button size="sm" onClick={() => navigate('/pricing')}>
//                   Upgrade Now
//                 </Button>
//               </div>
//             ) : (
//               <div className="space-y-3">
//                 {/* Silver + Gold */}
//                 <div className="flex items-center space-x-2">
//                   <Checkbox
//                     id="verified"
//                     checked={localFilters.verifiedOnly}
//                     onCheckedChange={(checked) =>
//                       setLocalFilters({
//                         ...localFilters,
//                         verifiedOnly: !!checked,
//                       })
//                     }
//                   />
//                   <label htmlFor="verified" className="text-sm cursor-pointer">
//                     Verified profiles only
//                   </label>
//                 </div>

//                 {/* Gold-only (locked UI inside silver) */}
//                 <div className={!canUseGold ? 'opacity-50' : ''}>
//                   {!canUseGold && (
//                     <div className="mb-2 text-xs text-gray-600 flex items-center gap-2">
//                       <Lock className="h-3.5 w-3.5" />
//                       Gold only
//                     </div>
//                   )}

//                   <div className="space-y-3">
//                     <div className="flex items-center space-x-2">
//                       <Checkbox
//                         id="hasPhoto"
//                         disabled={!canUseGold}
//                         checked={localFilters.hasPhoto}
//                         onCheckedChange={(checked) =>
//                           setLocalFilters({
//                             ...localFilters,
//                             hasPhoto: !!checked,
//                           })
//                         }
//                       />
//                       <label htmlFor="hasPhoto" className="text-sm cursor-pointer">
//                         Has profile photo
//                       </label>
//                     </div>

//                     <div className="flex items-center space-x-2">
//                       <Checkbox
//                         id="recentlyActive"
//                         disabled={!canUseGold}
//                         checked={localFilters.recentlyActive}
//                         onCheckedChange={(checked) =>
//                           setLocalFilters({
//                             ...localFilters,
//                             recentlyActive: !!checked,
//                           })
//                         }
//                       />
//                       <label
//                         htmlFor="recentlyActive"
//                         className="text-sm cursor-pointer"
//                       >
//                         Recently active (last 7 days)
//                       </label>
//                     </div>
//                   </div>

//                   {!canUseGold && (
//                     <div className="mt-3 p-3 bg-gray-50 rounded-lg text-center">
//                       <p className="text-sm text-gray-600 mb-2">
//                         Unlock full advanced filters with Gold
//                       </p>
//                       <Button size="sm" onClick={() => navigate('/pricing')}>
//                         Upgrade Now
//                       </Button>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             )}
//           </div>

//           <Button onClick={handleApply} className="w-full">
//             Apply Filters
//           </Button>
//         </div>
//       </SheetContent>
//     </Sheet>
//   );
// }
