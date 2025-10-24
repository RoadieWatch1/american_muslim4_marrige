import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, HeartHandshake, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface MatchSuccessRateProps {
  likesSent: number;
  likesReceived: number;
  matches: number;
  rejections: number;
  successRate: number;
}

export function MatchSuccessRate({ 
  likesSent, 
  likesReceived, 
  matches, 
  rejections, 
  successRate 
}: MatchSuccessRateProps) {
  const acceptanceRate = likesSent > 0 ? (matches / likesSent) * 100 : 0;
  const reciprocationRate = likesReceived > 0 ? (matches / likesReceived) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HeartHandshake className="h-5 w-5" />
          Match Success Rate
        </CardTitle>
        <CardDescription>Your matching performance metrics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Success Rate</span>
            <span className="font-bold">{successRate.toFixed(1)}%</span>
          </div>
          <Progress value={successRate} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-pink-500" />
              <span className="text-sm text-muted-foreground">Likes Sent</span>
            </div>
            <p className="text-2xl font-bold">{likesSent}</p>
            <p className="text-xs text-muted-foreground">
              {acceptanceRate.toFixed(1)}% accepted
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Likes Received</span>
            </div>
            <p className="text-2xl font-bold">{likesReceived}</p>
            <p className="text-xs text-muted-foreground">
              {reciprocationRate.toFixed(1)}% reciprocated
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <HeartHandshake className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Matches</span>
            </div>
            <p className="text-2xl font-bold text-primary">{matches}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <X className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Rejections</span>
            </div>
            <p className="text-2xl font-bold text-red-500">{rejections}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}