import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, TrendingUp, Camera, MessageSquare, Clock, Heart } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface Tip {
  id: string;
  category: string;
  text: string;
  priority: number;
  icon: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface PersonalizedTipsProps {
  tips: Tip[];
}

export function PersonalizedTips({ tips }: PersonalizedTipsProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'profile_improvement':
        return <Camera className="h-4 w-4" />;
      case 'activity_timing':
        return <Clock className="h-4 w-4" />;
      case 'engagement':
        return <MessageSquare className="h-4 w-4" />;
      case 'matching':
        return <Heart className="h-4 w-4" />;
      default:
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  const sortedTips = [...tips].sort((a, b) => b.priority - a.priority).slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Personalized Tips
        </CardTitle>
        <CardDescription>Recommendations to improve your match rate</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedTips.map((tip) => (
          <Alert key={tip.id} className="border-l-4 border-l-primary">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{tip.icon || getCategoryIcon(tip.category)}</div>
              <div className="flex-1 space-y-2">
                <AlertDescription>{tip.text}</AlertDescription>
                {tip.action && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={tip.action.onClick}
                  >
                    {tip.action.label}
                  </Button>
                )}
              </div>
            </div>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
}