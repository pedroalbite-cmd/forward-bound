import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MultiSelect } from '@/components/ui/multi-select';
import { CalendarIcon, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

interface NpsFiltersProps {
  produtos: string[];
  cfos: string[];
  selectedProdutos: string[];
  selectedCfos: string[];
  selectedPeriod: string;
  dateRange: DateRange | undefined;
  onProdutosChange: (val: string[]) => void;
  onCfosChange: (val: string[]) => void;
  onPeriodChange: (period: string, range?: DateRange) => void;
  onClear: () => void;
}

const PERIOD_PRESETS = [
  { label: 'Todos', value: 'all' },
  { label: 'Q1', value: 'q1', months: [0, 1, 2] },
  { label: 'Q2', value: 'q2', months: [3, 4, 5] },
  { label: 'Q3', value: 'q3', months: [6, 7, 8] },
  { label: 'Q4', value: 'q4', months: [9, 10, 11] },
];

export function NpsFilters({
  produtos,
  cfos,
  selectedProdutos,
  selectedCfos,
  selectedPeriod,
  dateRange,
  onProdutosChange,
  onCfosChange,
  onPeriodChange,
  onClear,
}: NpsFiltersProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const hasFilters = selectedProdutos.length > 0 || selectedCfos.length > 0 || selectedPeriod !== 'all';

  const produtoOptions = produtos.map(p => ({ label: p, value: p }));
  const cfoOptions = cfos.map(c => ({ label: c, value: c }));

  const handlePeriodClick = (value: string) => {
    if (value === 'all') {
      onPeriodChange('all', undefined);
      return;
    }
    const year = new Date().getFullYear();
    const preset = PERIOD_PRESETS.find(p => p.value === value);
    if (preset?.months) {
      const from = new Date(year, preset.months[0], 1);
      const to = new Date(year, preset.months[2] + 1, 0);
      onPeriodChange(value, { from, to });
    }
  };

  const handleCustomRange = (range: DateRange | undefined) => {
    onPeriodChange('custom', range);
    if (range?.from && range?.to) {
      setCalendarOpen(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/30 rounded-lg border border-border">
      <Filter className="h-4 w-4 text-muted-foreground" />

      {/* Produto filter */}
      <div className="min-w-[180px]">
        <MultiSelect
          options={produtoOptions}
          onSelectionChange={onProdutosChange}
          selected={selectedProdutos}
          placeholder="Produto"
        />
      </div>

      {/* CFO filter */}
      <div className="min-w-[180px]">
        <MultiSelect
          options={cfoOptions}
          onSelectionChange={onCfosChange}
          selected={selectedCfos}
          placeholder="CFO"
        />
      </div>

      {/* Period presets */}
      <div className="flex items-center gap-1">
        {PERIOD_PRESETS.map(p => (
          <Button
            key={p.value}
            variant={selectedPeriod === p.value ? 'default' : 'outline'}
            size="sm"
            className="h-8 text-xs"
            onClick={() => handlePeriodClick(p.value)}
          >
            {p.label}
          </Button>
        ))}

        {/* Custom date range */}
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={selectedPeriod === 'custom' ? 'default' : 'outline'}
              size="sm"
              className="h-8 text-xs gap-1"
            >
              <CalendarIcon className="h-3 w-3" />
              {selectedPeriod === 'custom' && dateRange?.from && dateRange?.to
                ? `${format(dateRange.from, 'dd/MM', { locale: ptBR })} - ${format(dateRange.to, 'dd/MM', { locale: ptBR })}`
                : 'Período'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={handleCustomRange}
              numberOfMonths={2}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Clear filters */}
      {hasFilters && (
        <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={onClear}>
          <X className="h-3 w-3" />
          Limpar
        </Button>
      )}

      {/* Active filter badges */}
      {hasFilters && (
        <div className="flex flex-wrap gap-1 ml-auto">
          {selectedProdutos.map(p => (
            <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
          ))}
          {selectedCfos.map(c => (
            <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
          ))}
          {selectedPeriod !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              {selectedPeriod === 'custom' ? 'Período personalizado' : selectedPeriod.toUpperCase()}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
