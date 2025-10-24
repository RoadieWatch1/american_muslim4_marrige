import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';

interface ActivityHeatmapProps {
  data: Array<{
    day: string;
    hour: number;
    activity: number;
  }>;
}

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  const getActivityLevel = (day: string, hour: number) => {
    const item = data.find(d => d.day === day && d.hour === hour);
    return item?.activity || 0;
  };

  const getColor = (activity: number) => {
    if (activity === 0) return 'bg-muted';
    if (activity < 3) return 'bg-primary/20';
    if (activity < 6) return 'bg-primary/40';
    if (activity < 9) return 'bg-primary/60';
    return 'bg-primary';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Peak Activity Times
        </CardTitle>
        <CardDescription>When you're most active on the platform</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex gap-1 text-xs text-muted-foreground mb-2">
            <div className="w-10"></div>
            {hours.filter((_, i) => i % 3 === 0).map(hour => (
              <div key={hour} className="w-12 text-center">
                {hour === 0 ? '12am' : hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour-12}pm`}
              </div>
            ))}
          </div>
          {days.map(day => (
            <div key={day} className="flex gap-1 items-center">
              <div className="w-10 text-xs text-muted-foreground">{day}</div>
              <div className="flex gap-1">
                {hours.map(hour => (
                  <div
                    key={`${day}-${hour}`}
                    className={`w-4 h-4 rounded-sm ${getColor(getActivityLevel(day, hour))}`}
                    title={`${day} ${hour}:00 - ${getActivityLevel(day, hour)} activities`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-muted" />
            <div className="w-3 h-3 rounded-sm bg-primary/20" />
            <div className="w-3 h-3 rounded-sm bg-primary/40" />
            <div className="w-3 h-3 rounded-sm bg-primary/60" />
            <div className="w-3 h-3 rounded-sm bg-primary" />
          </div>
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
}