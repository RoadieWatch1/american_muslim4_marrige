import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Clock, CheckCheck, TrendingUp } from 'lucide-react';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MessageStatsProps {
  totalMessages: number;
  averageResponseTime: number;
  responseRate: number;
  weeklyData: Array<{
    day: string;
    sent: number;
    received: number;
  }>;
}

export function MessageStats({ 
  totalMessages, 
  averageResponseTime, 
  responseRate, 
  weeklyData 
}: MessageStatsProps) {
  const formatResponseTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    if (minutes < 1440) return `${Math.round(minutes / 60)} hrs`;
    return `${Math.round(minutes / 1440)} days`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Message Analytics
        </CardTitle>
        <CardDescription>Your messaging performance and engagement</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              <span>Total</span>
            </div>
            <p className="text-xl font-bold">{totalMessages}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Avg Response</span>
            </div>
            <p className="text-xl font-bold">{formatResponseTime(averageResponseTime)}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <CheckCheck className="h-3 w-3" />
              <span>Response Rate</span>
            </div>
            <p className="text-xl font-bold">{responseRate}%</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="day" 
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
            <Bar dataKey="sent" fill="hsl(var(--primary))" name="Sent" />
            <Bar dataKey="received" fill="hsl(var(--muted-foreground))" name="Received" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}