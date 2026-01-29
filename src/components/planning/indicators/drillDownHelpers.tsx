import React from "react";
import { Badge } from "@/components/ui/badge";
import { DetailItem } from "./DetailSheet";

// Format compact currency (R$ 1.2M, R$ 510k)
export const formatCompactCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(0)}k`;
  }
  return `R$ ${Math.round(value)}`;
};

// Format duration in hours/minutes
export const formatDuration = (minutes: number): string => {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${Math.round(minutes)}m`;
};

// Format days with aging alert colors
export const formatAgingWithAlert = (days: number | undefined): React.ReactNode => {
  if (days === undefined || days === null) return '-';
  if (days > 30) return <span className="text-destructive font-medium">{days}d 🔴</span>;
  if (days > 14) return <span className="text-amber-600 dark:text-amber-400">{days}d ⚠️</span>;
  return <span className="text-chart-2">{days}d ✅</span>;
};

// Format SLA status with visual badge
export const formatSlaStatus = (minutes: number | undefined): React.ReactNode => {
  if (minutes === undefined || minutes === null) return '-';
  
  if (minutes <= 30) {
    return (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 font-normal">
        ✅ {Math.round(minutes)}m
      </Badge>
    );
  }
  if (minutes <= 60) {
    return (
      <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 font-normal">
        ⚠️ {Math.round(minutes)}m
      </Badge>
    );
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return (
    <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 font-normal">
      🔴 {hours}h{mins > 0 ? ` ${mins}m` : ''}
    </Badge>
  );
};

// Format percentage of total
export const formatPercentual = (value: number | undefined): React.ReactNode => {
  if (value === undefined || value === null) return '-';
  return `${value.toFixed(1)}%`;
};

// Check if revenue range is "premium" (>R$50k monthly)
export const isPremiumFaixa = (faixa: string | undefined): boolean => {
  if (!faixa) return false;
  const premiumPatterns = [
    'acima de 50',
    '50 a 100',
    '100 a 500',
    'acima de 500',
    '50.000',
    '100.000',
    '500.000',
    '1.000.000',
    'mais de 50',
    'mais de 100',
  ];
  const lowerFaixa = faixa.toLowerCase();
  return premiumPatterns.some(pattern => lowerFaixa.includes(pattern));
};

// Find top performer by field (count-based)
export const findTopPerformer = (items: DetailItem[], field: 'responsible' | 'closer'): { name: string; count: number } => {
  const counts: Record<string, number> = {};
  
  items.forEach(item => {
    const value = field === 'responsible' ? item.responsible : item.closer;
    if (value && value.trim()) {
      const key = value.trim();
      counts[key] = (counts[key] || 0) + 1;
    }
  });
  
  let topName = '-';
  let topCount = 0;
  
  Object.entries(counts).forEach(([name, count]) => {
    if (count > topCount) {
      topName = name;
      topCount = count;
    }
  });
  
  return { name: topName, count: topCount };
};

// Find top performer by revenue (value-based)
export const findTopPerformerByRevenue = (items: DetailItem[], field: 'responsible' | 'closer'): { name: string; value: number } => {
  const values: Record<string, number> = {};
  
  items.forEach(item => {
    const key = field === 'responsible' ? item.responsible : item.closer;
    if (key && key.trim()) {
      const name = key.trim();
      values[name] = (values[name] || 0) + (item.value || 0);
    }
  });
  
  let topName = '-';
  let topValue = 0;
  
  Object.entries(values).forEach(([name, value]) => {
    if (value > topValue) {
      topName = name;
      topValue = value;
    }
  });
  
  return { name: topName, value: topValue };
};

// Find oldest deal (most days in phase)
export const findOldestDeal = (items: DetailItem[]): { company: string; days: number } => {
  let oldest = { company: '-', days: 0 };
  
  items.forEach(item => {
    const days = item.diasEmProposta || item.duration ? Math.floor((item.duration || 0) / 86400) : 0;
    if (days > oldest.days) {
      oldest = {
        company: item.company || item.name || '-',
        days,
      };
    }
  });
  
  return oldest;
};

// Find item with highest value for a specific field
export const findMaxItem = (items: DetailItem[], field: 'mrr' | 'setup' | 'pontual' | 'value' | 'sla'): { company: string; value: number } => {
  let max = { company: '-', value: 0 };
  
  items.forEach(item => {
    const val = item[field] as number | undefined;
    if (val && val > max.value) {
      max = {
        company: item.company || item.name || '-',
        value: val,
      };
    }
  });
  
  return max;
};

// Calculate average for a numeric field
export const calcAverage = (items: DetailItem[], field: keyof DetailItem): number => {
  const values = items.map(item => item[field] as number).filter(v => typeof v === 'number' && !isNaN(v));
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
};

// Calculate median for a numeric field
export const calcMedian = (items: DetailItem[], field: keyof DetailItem): number => {
  const values = items.map(item => item[field] as number).filter(v => typeof v === 'number' && !isNaN(v)).sort((a, b) => a - b);
  if (values.length === 0) return 0;
  const mid = Math.floor(values.length / 2);
  return values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
};

// Calculate count within threshold (for SLA)
export const calcWithinThreshold = (items: DetailItem[], field: keyof DetailItem, threshold: number): { count: number; percentage: number } => {
  const values = items.map(item => item[field] as number).filter(v => typeof v === 'number' && !isNaN(v));
  if (values.length === 0) return { count: 0, percentage: 0 };
  const within = values.filter(v => v <= threshold).length;
  return {
    count: within,
    percentage: Math.round((within / values.length) * 100),
  };
};

// Add calculated fields to items (enrich items for drill-down)
export const enrichItemsWithCalculatedFields = (
  items: DetailItem[],
  indicatorKey: string,
  allItems?: { mql?: DetailItem[]; rm?: DetailItem[]; proposta?: DetailItem[]; venda?: DetailItem[] }
): DetailItem[] => {
  const now = new Date();
  
  return items.map(item => {
    const enriched = { ...item };
    
    // Calculate days since entry for aging
    if (item.date) {
      const entryDate = new Date(item.date);
      const diffDays = Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (indicatorKey) {
        case 'mql':
          enriched.diasAteQualificar = diffDays;
          break;
        case 'rm':
          enriched.diasComoMQL = diffDays;
          break;
        case 'proposta':
          enriched.diasEmProposta = diffDays;
          break;
        case 'venda':
          // For sales, calculate full cycle if we have creation date
          enriched.cicloVenda = diffDays;
          break;
      }
    }
    
    // Calculate percentual of total for monetary indicators
    if (indicatorKey === 'faturamento' || indicatorKey === 'mrr' || indicatorKey === 'setup' || indicatorKey === 'pontual') {
      const total = items.reduce((sum, i) => sum + (i.value || 0), 0);
      if (total > 0 && item.value) {
        enriched.percentualTotal = (item.value / total) * 100;
      }
    }
    
    return enriched;
  });
};

// Get short name (first name only) for display
export const getShortName = (fullName: string | undefined): string => {
  if (!fullName) return '-';
  const parts = fullName.trim().split(' ');
  return parts[0] || '-';
};
