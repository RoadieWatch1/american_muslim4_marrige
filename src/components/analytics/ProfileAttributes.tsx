import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Star, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ProfileAttributesProps {
  attributes: Array<{
    name: string;
    successRate: number;
    views: number;
    matches: number;
  }>;
}

export function ProfileAttributes({ attributes }: ProfileAttributesProps) {
  const sortedAttributes = [...attributes].sort((a, b) => b.successRate - a.successRate);
  const topAttributes = sortedAttributes.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Most Successful Profile Attributes
        </CardTitle>
        <CardDescription>Which aspects of your profile attract the most matches</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {topAttributes.map((attr, index) => (
          <div key={attr.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {index === 0 && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                <span className="font-medium">{attr.name}</span>
              </div>
              <span className="text-sm font-bold">{attr.successRate.toFixed(1)}%</span>
            </div>
            <Progress value={attr.successRate} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{attr.views} views</span>
              <span>{attr.matches} matches</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}