import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FunnelStage {
  stage: string;
  value: number;
  percent: string;
}

interface SalesFunnelVisualProps {
  title: string;
  icon: React.ReactNode;
  stages: FunnelStage[];
  mqlToVenda: number;
  leadToVenda: number;
  color: string;
}

// Cores gradientes para cada etapa do funil
const stageColors = [
  'from-orange-400 to-orange-500',   // Leads
  'from-emerald-400 to-cyan-500',    // MQL
  'from-cyan-500 to-blue-500',       // RM
  'from-blue-500 to-blue-600',       // RR
  'from-blue-600 to-slate-500',      // Proposta
  'from-slate-500 to-slate-600',     // Venda
];

export function SalesFunnelVisual({ 
  title, 
  icon, 
  stages, 
  mqlToVenda, 
  leadToVenda, 
  color 
}: SalesFunnelVisualProps) {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="font-display flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-1">
          {stages.map((item, index) => {
            const widthPercent = 100 - (index * 10);
            const isFirst = index === 0;
            const colorClass = stageColors[index] || stageColors[stageColors.length - 1];
            
            return (
              <div key={item.stage} className="flex items-center w-full max-w-2xl">
                {/* Conversion percentage on the left */}
                <div className="w-16 text-right pr-3">
                  {!isFirst && (
                    <Badge variant="outline" className="text-xs">
                      {item.percent !== "-" ? item.percent : "-"}
                    </Badge>
                  )}
                </div>
                
                {/* Funnel bar with gradient */}
                <div 
                  className={`relative h-10 bg-gradient-to-r ${colorClass} rounded-sm transition-all duration-300 flex items-center justify-center`}
                  style={{ 
                    width: `${widthPercent}%`,
                    marginLeft: 'auto',
                    marginRight: 'auto'
                  }}
                >
                  <p className="font-display font-bold text-white text-sm">
                    {item.stage}
                  </p>
                </div>
                
                {/* Absolute value on the right */}
                <div className="w-20 text-left pl-3">
                  <Badge className="bg-primary/20 text-primary border-primary/30 font-mono text-xs">
                    {item.value.toLocaleString('pt-BR')}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Overall conversion badges */}
        <div className="flex justify-center gap-3 mt-6 flex-wrap">
          <Badge className="bg-primary/20 text-primary border-primary/30">
            Conversão MQL → Venda: {(mqlToVenda * 100).toFixed(1)}%
          </Badge>
          <Badge className="bg-primary/20 text-primary border-primary/30">
            Conversão Lead → Venda: {(leadToVenda * 100).toFixed(1)}%
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
