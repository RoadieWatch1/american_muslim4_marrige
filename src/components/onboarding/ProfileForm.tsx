import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProfileFormProps {
  gender: 'male' | 'female';
  onSubmit: (data: any) => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ gender, onSubmit }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    dob: '',
    city: '',
    state: '',
    marital_status: '',
    has_children: false,
    education: '',
    occupation: '',
    bio: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
                <Input id="first_name" value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} required />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name *</Label>
                <Input id="last_name" value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} required />
              </div>
            </div>
            <div>
              <Label htmlFor="dob">Date of Birth *</Label>
              <Input id="dob" type="date" value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})} required />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input id="city" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} required />
              </div>
              <div>
                <Label htmlFor="state">State *</Label>
                <Input id="state" value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} required />
              </div>
            </div>
            <div>
              <Label htmlFor="marital_status">Marital Status *</Label>
              <Select value={formData.marital_status} onValueChange={(v) => setFormData({...formData, marital_status: v})}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="divorced">Divorced</SelectItem>
                  <SelectItem value="widowed">Widowed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="bio">About Me *</Label>
              <Textarea id="bio" value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} rows={4} required />
            </div>
            <Button type="submit" className="w-full">Continue</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
