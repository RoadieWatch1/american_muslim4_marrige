import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { User, Users } from 'lucide-react';

interface RoleSelectionProps {
  onSelect: (gender: 'male' | 'female') => void;
}

export const RoleSelection: React.FC<RoleSelectionProps> = ({ onSelect }) => {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-teal-800 mb-2">Welcome to AM4M</h2>
        <p className="text-gray-600">Let's start by telling us a bit about yourself</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-teal-500" onClick={() => onSelect('male')}>
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-teal-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">I'm a Brother</h3>
            <p className="text-gray-600 text-sm">Looking for a righteous spouse</p>
            <Button className="mt-4 w-full" onClick={() => onSelect('male')}>Continue as Brother</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-teal-500" onClick={() => onSelect('female')}>
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-pink-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">I'm a Sister</h3>
            <p className="text-gray-600 text-sm">Looking for a righteous spouse</p>
            <Button className="mt-4 w-full bg-pink-600 hover:bg-pink-700" onClick={() => onSelect('female')}>Continue as Sister</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
