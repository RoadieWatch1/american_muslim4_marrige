import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Circle, Award } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export type ProfileCompletionField = {
  name: string;
  filled: boolean;
};

interface ProfileCompletionProps {
  fields: ProfileCompletionField[];
  percentage: number;
}

export function ProfileCompletion({ fields, percentage }: ProfileCompletionProps) {
  const filledCount = fields.filter((f) => f.filled).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Profile Completion
        </CardTitle>
        <CardDescription>
          More complete profiles get more matches. {filledCount} of {fields.length} sections filled in.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Overall</span>
          <span className="text-sm font-bold">{percentage}%</span>
        </div>
        <Progress value={percentage} className="h-2" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
          {fields.map((field) => (
            <div
              key={field.name}
              className="flex items-center gap-2 text-sm"
            >
              {field.filled ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
              )}
              <span
                className={
                  field.filled
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                }
              >
                {field.name}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
