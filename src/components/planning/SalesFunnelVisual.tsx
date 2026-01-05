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
        <div className="flex flex-col items-center">
          {stages.map((item, index) => {
            const widthPercent = 100 - (index * 12);
            const isFirst = index === 0;
            
            return (
              <div key={item.stage} className="flex items-center w-full max-w-2xl mb-2">
                {/* Conversion percentage on the left */}
                <div className="w-16 text-right pr-3">
                  {!isFirst && (
                    <Badge variant="outline" className="text-xs">
                      {stages[index - 1].percent !== "-" ? item.percent : "-"}
                    </Badge>
                  )}
                </div>
                
                {/* Funnel bar */}
                <div 
                  className="relative py-3 text-center transition-all duration-300 hover:scale-105 cursor-default"
                  style={{ 
                    width: `${widthPercent}%`,
                    background: `linear-gradient(135deg, ${color}, ${color}99)`,
                    borderRadius: '6px',
                    marginLeft: 'auto',
                    marginRight: 'auto'
                  }}
                >
                  <p className="font-display font-bold text-primary-foreground text-sm">
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
