import { cn } from "@/lib/utils";

export interface BarChartDataItem {
  label: string;
  value: number;
  highlight?: 'success' | 'warning' | 'danger' | 'neutral';
}

interface DrillDownBarChartProps {
  title: string;
  data: BarChartDataItem[];
  formatValue?: (value: number) => string;
  maxItems?: number;
}

export function DrillDownBarChart({ 
  title, 
  data, 
  formatValue = String, 
  maxItems = 5 
}: DrillDownBarChartProps) {
  if (!data || data.length === 0) return null;
  
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const displayData = data.slice(0, maxItems);

  return (
    <div className="space-y-3 flex-1 min-w-[200px]">
      <h4 className="text-sm font-medium text-foreground">{title}</h4>
      <div className="space-y-2">
        {displayData.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground w-24 truncate" title={item.label}>
              {item.label}
            </span>
            <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded transition-all duration-300",
                  item.highlight === 'success' ? 'bg-green-500' :
                  item.highlight === 'danger' ? 'bg-red-500' :
                  item.highlight === 'warning' ? 'bg-amber-500' :
                  'bg-primary'
                )}
                style={{ width: `${Math.max((item.value / maxValue) * 100, 2)}%` }}
              />
            </div>
            <span className="text-sm font-medium w-24 text-right text-foreground">
              {formatValue(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
