import { useMemo } from "react";
import { Trophy, TrendingUp, FileText, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AttributionCard } from "./types";

interface TcvHeroBannerProps {
  attributionCards: AttributionCard[];
}

export function TcvHeroBanner({ attributionCards }: TcvHeroBannerProps) {
  const stats = useMemo(() => {
    const vendasCards = attributionCards.filter(c => c.fase === 'Contrato assinado');
    const totalMrrAnual = vendasCards.reduce((s, c) => s + (c.valorMRR || 0) * 12, 0);
    const totalSetup = vendasCards.reduce((s, c) => s + (c.valorSetup || 0), 0);
    const totalPontual = vendasCards.reduce((s, c) => s + (c.valorPontual || 0), 0);
    const tcv = totalMrrAnual + totalSetup + totalPontual;
    const ticketMedio = vendasCards.length > 0 ? tcv / vendasCards.length : 0;
    return { tcv, totalMrrAnual, totalSetup, totalPontual, count: vendasCards.length, ticketMedio };
  }, [attributionCards]);

  if (stats.count === 0) return null;

  const fmt = (v: number) =>
    v >= 1_000_000
      ? `R$ ${(v / 1_000_000).toFixed(2).replace('.', ',')}M`
      : v >= 1_000
        ? `R$ ${(v / 1_000).toFixed(1).replace('.', ',')}k`
        : `R$ ${v.toFixed(0)}`;

  const breakdownItems = [
    { label: "MRR Anualizado", value: stats.totalMrrAnual, icon: TrendingUp },
    { label: "Setup", value: stats.totalSetup, icon: FileText },
    { label: "Pontual", value: stats.totalPontual, icon: Zap },
  ];

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-[1px]">
      {/* Inner card */}
      <div className="relative rounded-[11px] bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 px-6 py-5 overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />

        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8">
          {/* Left: Main TCV */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20">
              <Trophy className="h-7 w-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 mb-0.5">
                <span className="text-sm font-medium text-white/80 tracking-wide uppercase">TCV Gerado</span>
                <Badge className="bg-white/20 text-white border-white/30 text-[10px] font-semibold hover:bg-white/25">
                  {stats.count} {stats.count === 1 ? 'contrato' : 'contratos'}
                </Badge>
              </div>
              <span className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                {fmt(stats.tcv)}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px h-16 bg-white/20" />

          {/* Right: Breakdown */}
          <div className="flex flex-wrap gap-3 flex-1">
            {breakdownItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 px-4 py-3 min-w-[150px] flex-1"
              >
                <item.icon className="h-4.5 w-4.5 text-white/70 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[11px] text-white/60 font-medium uppercase tracking-wider">{item.label}</span>
                  <span className="text-base font-bold text-white">{fmt(item.value)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Far right: Ticket Médio */}
          <div className="flex flex-col items-end text-right flex-shrink-0 hidden lg:flex">
            <span className="text-[11px] text-white/60 font-medium uppercase tracking-wider">Ticket Médio</span>
            <span className="text-xl font-bold text-white">{fmt(stats.ticketMedio)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
