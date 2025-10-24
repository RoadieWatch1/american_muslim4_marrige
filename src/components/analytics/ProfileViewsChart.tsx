import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, TrendingUp, Users } from 'lucide-react';
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ProfileViewsChartProps {
  data: Array<{
    date: string;
    views: number;
    uniqueViewers: number;
  }>;
  totalViews: number;
  weeklyGrowth: number;
}

export function ProfileViewsChart({ data, totalViews, weeklyGrowth }: ProfileViewsChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Profile Views
        </CardTitle>
        <CardDescription>Track who's viewing your profile over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Views</p>
            <p className="text-2xl font-bold">{totalViews.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Weekly Growth</p>
            <p className="text-2xl font-bold flex items-center gap-1">
              {weeklyGrowth > 0 ? '+' : ''}{weeklyGrowth}%
              {weeklyGrowth > 0 && <TrendingUp className="h-4 w-4 text-green-500" />}
            </p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="views" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              name="Total Views"
            />
            <Line 
              type="monotone" 
              dataKey="uniqueViewers" 
              stroke="hsl(var(--muted-foreground))" 
              strokeWidth={2}
              name="Unique Viewers"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}