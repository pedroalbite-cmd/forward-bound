import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { UserX } from "lucide-react";

interface NoShowWidgetProps {
  buKey: string;
}

// Mock data - will be replaced with real data fetching
const mockTrendData = [
  { day: 1, value: 2 },
  { day: 2, value: 1 },
  { day: 3, value: 3 },
  { day: 4, value: 2 },
  { day: 5, value: 1 },
  { day: 6, value: 2 },
  { day: 7, value: 1 },
];

export function NoShowWidget({ buKey }: NoShowWidgetProps) {
  const noShows = 8;
  const totalMeetings = 67;
  const noShowRate = Math.round((noShows / totalMeetings) * 100);

  return (
    <Card className="bg-card border-border h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
          <UserX className="h-4 w-4 text-destructive" />
          No Shows
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">{noShows}</span>
              <span className="text-sm text-muted-foreground">ausências</span>
            </div>
            <div className="mt-1">
              <span className="text-lg font-semibold text-destructive">{noShowRate}%</span>
              <span className="text-sm text-muted-foreground ml-1">das RMs</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Reuniões que não aconteceram
            </p>
          </div>
          <div className="w-20 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockTrendData}>
                <defs>
                  <linearGradient id="noShowGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--destructive))" 
                  strokeWidth={2}
                  fill="url(#noShowGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
