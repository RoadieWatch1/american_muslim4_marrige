import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface Props {
  volumeData: { date: string; daily: number; weekly: number; instant: number }[];
  typeData: { name: string; value: number }[];
  successRate: number;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export function DigestAnalytics({ volumeData, typeData, successRate }: Props) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Email Volume Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={volumeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="daily" fill="#3b82f6" name="Daily Digests" />
              <Bar dataKey="weekly" fill="#10b981" name="Weekly Digests" />
              <Bar dataKey="instant" fill="#f59e0b" name="Instant" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={typeData} cx="50%" cy="50%" labelLine={false} label={(entry) => entry.name} outerRadius={80} fill="#8884d8" dataKey="value">
                {typeData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delivery Success Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-center">
              <div className="text-6xl font-bold text-green-600">{successRate}%</div>
              <p className="text-gray-600 mt-2">Successfully Delivered</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
