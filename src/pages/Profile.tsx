import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // NOTE: age + height are UI fields; age maps to dob, height is only local
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    age: '', // derived from dob if present
    city: '',
    state: '',
    occupation: '',
    bio: '',
    practice_level: '',
    prayer_frequency: '',
    nikah_timeline: '',
    denomination: '',
    marital_status: '',
    has_children: false,
    height: '',
    education: '',
  });

  // Hydrate form from profile when available
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (profile) {
      // derive age from dob (roughly using year only)
      let age = '';
      if (profile.dob) {
        const dobDate = new Date(profile.dob);
        if (!Number.isNaN(dobDate.getTime())) {
          const now = new Date();
          age = String(now.getFullYear() - dobDate.getFullYear());
        }
      }

      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        age,
        city: profile.city || '',
        state: profile.state || '',
        occupation: profile.occupation || '',
        bio: profile.bio || '',
        practice_level: profile.practice_level || '',
        prayer_frequency: profile.prayer_frequency || '',
        nikah_timeline: profile.nikah_timeline || '',
        denomination: profile.denomination || '',
        marital_status: profile.marital_status || '',
        has_children: profile.has_children ?? false,
        height: '', // no height column in DB schema you posted
        education: profile.education || '',
      });
    }

    setLoading(false);
  }, [user, profile]);

  const handleSave = async () => {
    if (!user) return;

    if (!formData.first_name || !formData.last_name) {
      toast({
        title: 'Validation Error',
        description: 'First name and last name are required',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      // Build payload according to your profiles table schema
      const payload: any = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        city: formData.city,
        state: formData.state,
        occupation: formData.occupation,
        bio: formData.bio,
        practice_level: formData.practice_level,
        prayer_frequency: formData.prayer_frequency,
        nikah_timeline: formData.nikah_timeline,
        denomination: formData.denomination,
        marital_status: formData.marital_status,
        has_children: formData.has_children,
        education: formData.education,
        updated_at: new Date().toISOString(),
      };

      // Map age → dob (approximate: Jan 1 of birth year)
      if (formData.age) {
        const ageNum = parseInt(formData.age, 10);
        if (!Number.isNaN(ageNum)) {
          const now = new Date();
          const birthYear = now.getFullYear() - ageNum;
          const dob = new Date(birthYear, 0, 1); // Jan 1 of that year
          payload.dob = dob.toISOString().slice(0, 10); // 'YYYY-MM-DD'
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    } catch (err) {
      console.error('Error saving profile:', err);
      toast({
        title: 'Error',
        description: 'Failed to save profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Optional debug
  // console.log('profile', profile);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-teal-800">Edit Profile</h1>
          <div className="w-32" />
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Email Verification Status */}
        {profile?.email_verified ? (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-green-800">Email Verified</p>
              <p className="text-sm text-green-600">
                Verified on{' '}
                {profile.email_verified_at
                  ? new Date(profile.email_verified_at).toLocaleDateString()
                  : ''}
              </p>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-800 font-semibold mb-2">
              Email Not Verified
            </p>
            <p className="text-sm text-amber-700">
              Please verify your email to access all features.
            </p>
          </div>
        )}

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) =>
                      setFormData({ ...formData, first_name: e.target.value })
                    }
                    placeholder="Enter first name"
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
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) =>
                      setFormData({ ...formData, age: e.target.value })
                    }
                    placeholder="Enter age"
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
                    placeholder="Enter occupation"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                    placeholder="Enter state"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Islamic Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Islamic Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="practice_level">Practice Level</Label>
                  <Select
                    value={formData.practice_level}
                    onValueChange={(value) =>
                      setFormData({ ...formData, practice_level: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="learning">Learning</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="practicing">Practicing</SelectItem>
                      <SelectItem value="very_practicing">
                        Very Practicing
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="prayer_frequency">Prayer Frequency</Label>
                  <Select
                    value={formData.prayer_frequency}
                    onValueChange={(value) =>
                      setFormData({ ...formData, prayer_frequency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rare">Rarely</SelectItem>
                      <SelectItem value="sometimes">Sometimes</SelectItem>
                      <SelectItem value="mostly">Mostly</SelectItem>
                      <SelectItem value="always">Always (5x daily)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nikah_timeline">Nikah Timeline</Label>
                  <Select
                    value={formData.nikah_timeline}
                    onValueChange={(value) =>
                      setFormData({ ...formData, nikah_timeline: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timeline" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asap">As soon as possible</SelectItem>
                      <SelectItem value="3-6mo">3-6 months</SelectItem>
                      <SelectItem value="6-12mo">6-12 months</SelectItem>
                      <SelectItem value=">12mo">More than 12 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="denomination">Denomination</Label>
                  <Input
                    id="denomination"
                    value={formData.denomination}
                    onChange={(e) =>
                      setFormData({ ...formData, denomination: e.target.value })
                    }
                    placeholder="e.g., Sunni, Shia"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="marital_status">Marital Status</Label>
                  <Select
                    value={formData.marital_status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, marital_status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="divorced">Divorced</SelectItem>
                      <SelectItem value="widowed">Widowed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="has_children">Has Children</Label>
                  <Select
                    value={formData.has_children ? 'yes' : 'no'}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        has_children: value === 'yes',
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="height">Height</Label>
                  <Input
                    id="height"
                    value={formData.height}
                    onChange={(e) =>
                      setFormData({ ...formData, height: e.target.value })
                    }
                    placeholder="e.g., 5'8&quot;"
                  />
                </div>

                <div>
                  <Label htmlFor="education">Education</Label>
                  <Input
                    id="education"
                    value={formData.education}
                    onChange={(e) =>
                      setFormData({ ...formData, education: e.target.value })
                    }
                    placeholder="e.g., Bachelor's Degree"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}




// import React, { useState, useEffect } from 'react';
// import { useAuth } from '@/contexts/AuthContext';
// import { useNavigate } from 'react-router-dom';
// import { Button } from '@/components/ui/Button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Textarea } from '@/components/ui/textarea';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { supabase } from '@/lib/supabase';
// import { ArrowLeft, Save, Loader2 } from 'lucide-react';
// import { useToast } from '@/hooks/use-toast';

// export default function Profile() {
//   const { user, profile, refreshProfile } = useAuth(); // 👈 include profile
//   const navigate = useNavigate();
//   const { toast } = useToast();
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);

//   const [formData, setFormData] = useState({
//     first_name: '',
//     last_name: '',
//     age: '',
//     city: '',
//     state: '',
//     occupation: '',
//     bio: '',
//     practice_level: '',
//     prayer_frequency: '',
//     nikah_timeline: '',
//     denomination: '',
//     marital_status: '',
//     has_children: false,
//     height: '',
//     education: ''
//   });

//   useEffect(() => {
//     loadProfile();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [user]);

//   const loadProfile = async () => {
//     if (!user) {
//       setLoading(false);
//       return;
//     }

//     try {
//       const { data, error } = await supabase
//         .from('profiles')
//         .select('*')
//         .eq('id', user.id)
//         .maybeSingle(); // 👈 instead of .single()

//       if (error) throw error;

//       if (data) {
//         setFormData({
//           first_name: data.first_name || '',
//           last_name: data.last_name || '',
//           age: data.age?.toString() || '',
//           city: data.city || '',
//           state: data.state || '',
//           occupation: data.occupation || '',
//           bio: data.bio || '',
//           practice_level: data.practice_level || '',
//           prayer_frequency: data.prayer_frequency || '',
//           nikah_timeline: data.nikah_timeline || '',
//           denomination: data.denomination || '',
//           marital_status: data.marital_status || '',
//           has_children: data.has_children || false,
//           height: data.height || '',
//           education: data.education || ''
//         });
//       }
//     } catch (err) {
//       console.error('Error loading profile:', err);
//       toast({
//         title: 'Error',
//         description: 'Failed to load profile',
//         variant: 'destructive'
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSave = async () => {
//     if (!user) return;

//     if (!formData.first_name || !formData.last_name) {
//       toast({
//         title: 'Validation Error',
//         description: 'First name and last name are required',
//         variant: 'destructive'
//       });
//       return;
//     }

//     setSaving(true);

//     try {
//       const { error } = await supabase
//         .from('profiles')
//         .update({
//           first_name: formData.first_name,
//           last_name: formData.last_name,
//           age: formData.age ? parseInt(formData.age) : null,
//           city: formData.city,
//           state: formData.state,
//           occupation: formData.occupation,
//           bio: formData.bio,
//           practice_level: formData.practice_level,
//           prayer_frequency: formData.prayer_frequency,
//           nikah_timeline: formData.nikah_timeline,
//           denomination: formData.denomination,
//           marital_status: formData.marital_status,
//           has_children: formData.has_children,
//           height: formData.height,
//           education: formData.education,
//           updated_at: new Date().toISOString()
//         })
//         .eq('id', user.id);

//       if (error) throw error;

//       await refreshProfile();

//       toast({
//         title: 'Success',
//         description: 'Profile updated successfully'
//       });
//     } catch (err) {
//       console.error('Error saving profile:', err);
//       toast({
//         title: 'Error',
//         description: 'Failed to save profile',
//         variant: 'destructive'
//       });
//     } finally {
//       setSaving(false);
//     }
//   };

//   console.log('profile', profile)

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50">
//       <nav className="bg-white shadow-sm border-b">
//         <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
//           <Button variant="ghost" onClick={() => navigate('/dashboard')}>
//             <ArrowLeft className="w-4 h-4 mr-2" />
//             Back to Dashboard
//           </Button>
//           <h1 className="text-2xl font-bold text-teal-800">Edit Profile</h1>
//           <div className="w-32" />
//         </div>
//       </nav>

//       <div className="max-w-4xl mx-auto px-4 py-8">
//         {/* Email Verification Status */}
//         {profile?.email_verified ? (
//           <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
//             <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
//               <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//               </svg>
//             </div>
//             <div>
//               <p className="font-semibold text-green-800">Email Verified</p>
//               <p className="text-sm text-green-600">
//                 Verified on {profile.email_verified_at ? new Date(profile.email_verified_at).toLocaleDateString() : ''}
//               </p>
//             </div>
//           </div>
//         ) : (
//           <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
//             <p className="text-amber-800 font-semibold mb-2">Email Not Verified</p>
//             <p className="text-sm text-amber-700">Please verify your email to access all features.</p>
//           </div>
//         )}

//         <div className="space-y-6">
          
//           {/* Basic Information */}
//           <Card>
//             <CardHeader>
//               <CardTitle>Basic Information</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="grid md:grid-cols-2 gap-4">
//                 <div>
//                   <Label htmlFor="first_name">First Name *</Label>
//                   <Input
//                     id="first_name"
//                     value={formData.first_name}
//                     onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
//                     placeholder="Enter first name"
//                   />
//                 </div>
//                 <div>
//                   <Label htmlFor="last_name">Last Name *</Label>
//                   <Input
//                     id="last_name"
//                     value={formData.last_name}
//                     onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
//                     placeholder="Enter last name"
//                   />
//                 </div>
//               </div>

//               <div className="grid md:grid-cols-2 gap-4">
//                 <div>
//                   <Label htmlFor="age">Age</Label>
//                   <Input
//                     id="age"
//                     type="number"
//                     value={formData.age}
//                     onChange={(e) => setFormData({ ...formData, age: e.target.value })}
//                     placeholder="Enter age"
//                   />
//                 </div>
//                 <div>
//                   <Label htmlFor="occupation">Occupation</Label>
//                   <Input
//                     id="occupation"
//                     value={formData.occupation}
//                     onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
//                     placeholder="Enter occupation"
//                   />
//                 </div>
//               </div>

//               <div>
//                 <Label htmlFor="bio">Bio</Label>
//                 <Textarea
//                   id="bio"
//                   value={formData.bio}
//                   onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
//                   placeholder="Tell us about yourself..."
//                   rows={4}
//                 />
//               </div>
//             </CardContent>
//           </Card>

//           {/* Location */}
//           <Card>
//             <CardHeader>
//               <CardTitle>Location</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="grid md:grid-cols-2 gap-4">
//                 <div>
//                   <Label htmlFor="city">City</Label>
//                   <Input
//                     id="city"
//                     value={formData.city}
//                     onChange={(e) => setFormData({ ...formData, city: e.target.value })}
//                     placeholder="Enter city"
//                   />
//                 </div>
//                 <div>
//                   <Label htmlFor="state">State/Province</Label>
//                   <Input
//                     id="state"
//                     value={formData.state}
//                     onChange={(e) => setFormData({ ...formData, state: e.target.value })}
//                     placeholder="Enter state"
//                   />
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           {/* Islamic Preferences */}
//           <Card>
//             <CardHeader>
//               <CardTitle>Islamic Preferences</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="grid md:grid-cols-2 gap-4">
//                 <div>
//                   <Label htmlFor="practice_level">Practice Level</Label>
//                   <Select
//                     value={formData.practice_level}
//                     onValueChange={(value) => setFormData({ ...formData, practice_level: value })}
//                   >
//                     <SelectTrigger>
//                       <SelectValue placeholder="Select level" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="learning">Learning</SelectItem>
//                       <SelectItem value="moderate">Moderate</SelectItem>
//                       <SelectItem value="practicing">Practicing</SelectItem>
//                       <SelectItem value="very_practicing">Very Practicing</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>

//                 <div>
//                   <Label htmlFor="prayer_frequency">Prayer Frequency</Label>
//                   <Select
//                     value={formData.prayer_frequency}
//                     onValueChange={(value) => setFormData({ ...formData, prayer_frequency: value })}
//                   >
//                     <SelectTrigger>
//                       <SelectValue placeholder="Select frequency" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="rare">Rarely</SelectItem>
//                       <SelectItem value="sometimes">Sometimes</SelectItem>
//                       <SelectItem value="mostly">Mostly</SelectItem>
//                       <SelectItem value="always">Always (5x daily)</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </div>

//               <div className="grid md:grid-cols-2 gap-4">
//                 <div>
//                   <Label htmlFor="nikah_timeline">Nikah Timeline</Label>
//                   <Select
//                     value={formData.nikah_timeline}
//                     onValueChange={(value) => setFormData({ ...formData, nikah_timeline: value })}
//                   >
//                     <SelectTrigger>
//                       <SelectValue placeholder="Select timeline" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="asap">As soon as possible</SelectItem>
//                       <SelectItem value="3-6mo">3-6 months</SelectItem>
//                       <SelectItem value="6-12mo">6-12 months</SelectItem>
//                       <SelectItem value=">12mo">More than 12 months</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>

//                 <div>
//                   <Label htmlFor="denomination">Denomination</Label>
//                   <Input
//                     id="denomination"
//                     value={formData.denomination}
//                     onChange={(e) => setFormData({ ...formData, denomination: e.target.value })}
//                     placeholder="e.g., Sunni, Shia"
//                   />
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           {/* Additional Details */}
//           <Card>
//             <CardHeader>
//               <CardTitle>Additional Details</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="grid md:grid-cols-2 gap-4">
//                 <div>
//                   <Label htmlFor="marital_status">Marital Status</Label>
//                   <Select
//                     value={formData.marital_status}
//                     onValueChange={(value) => setFormData({ ...formData, marital_status: value })}
//                   >
//                     <SelectTrigger>
//                       <SelectValue placeholder="Select status" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="single">Single</SelectItem>
//                       <SelectItem value="divorced">Divorced</SelectItem>
//                       <SelectItem value="widowed">Widowed</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>

//                 <div>
//                   <Label htmlFor="has_children">Has Children</Label>
//                   <Select
//                     value={formData.has_children ? 'yes' : 'no'}
//                     onValueChange={(value) => setFormData({ ...formData, has_children: value === 'yes' })}
//                   >
//                     <SelectTrigger>
//                       <SelectValue placeholder="Select" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="no">No</SelectItem>
//                       <SelectItem value="yes">Yes</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </div>

//               <div className="grid md:grid-cols-2 gap-4">
//                 <div>
//                   <Label htmlFor="height">Height</Label>
//                   <Input
//                     id="height"
//                     value={formData.height}
//                     onChange={(e) => setFormData({ ...formData, height: e.target.value })}
//                     placeholder="e.g., 5'8&quot;"
//                   />
//                 </div>

//                 <div>
//                   <Label htmlFor="education">Education</Label>
//                   <Input
//                     id="education"
//                     value={formData.education}
//                     onChange={(e) => setFormData({ ...formData, education: e.target.value })}
//                     placeholder="e.g., Bachelor's Degree"
//                   />
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           {/* Save Button */}
//           <div className="flex justify-end gap-4">
//             <Button variant="outline" onClick={() => navigate('/dashboard')}>
//               Cancel
//             </Button>
//             <Button onClick={handleSave} disabled={saving}>
//               {saving ? (
//                 <>
//                   <Loader2 className="w-4 h-4 mr-2 animate-spin" />
//                   Saving...
//                 </>
//               ) : (
//                 <>
//                   <Save className="w-4 h-4 mr-2" />
//                   Save Changes
//                 </>
//               )}
//             </Button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
