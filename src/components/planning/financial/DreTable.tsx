import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MONTHS, type BuType, type MonthType } from "@/hooks/useMonetaryMetas";

const BU_DRE_LABELS: Record<BuType, string> = {
  modelo_atual: 'CaaS',
  o2_tax: 'Tax',
  oxy_hacker: 'SaaS',
  franquia: 'Expansão',
};

const BUS: BuType[] = ['modelo_atual', 'o2_tax', 'oxy_hacker', 'franquia'];

function formatCurrency(value: number): string {
  if (value === 0) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
}

interface DreTableProps {
  dreByBU: Record<BuType, Record<MonthType, number>>;
  isLoading: boolean;
}

export function DreTable({ dreByBU, isLoading }: DreTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>DRE Mensal por BU</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-48 w-full" /></CardContent>
      </Card>
    );
  }

  const totals: Record<MonthType, number> = {} as any;
  MONTHS.forEach(m => {
    totals[m] = BUS.reduce((sum, bu) => sum + (dreByBU[bu]?.[m] || 0), 0);
  });
  const grandTotal = MONTHS.reduce((sum, m) => sum + totals[m], 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">DRE — Faturamento Contábil Mensal</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-background z-10 min-w-[100px]">BU</TableHead>
              {MONTHS.map(m => (
                <TableHead key={m} className="text-right min-w-[90px]">{m}</TableHead>
              ))}
              <TableHead className="text-right min-w-[110px] font-bold">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {BUS.map(bu => {
              const rowTotal = MONTHS.reduce((sum, m) => sum + (dreByBU[bu]?.[m] || 0), 0);
              return (
                <TableRow key={bu}>
                  <TableCell className="sticky left-0 bg-background z-10 font-medium">{BU_DRE_LABELS[bu]}</TableCell>
                  {MONTHS.map(m => (
                    <TableCell key={m} className="text-right tabular-nums text-sm">
                      {formatCurrency(dreByBU[bu]?.[m] || 0)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right tabular-nums font-semibold">{formatCurrency(rowTotal)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="sticky left-0 bg-muted/50 z-10 font-bold">Total</TableCell>
              {MONTHS.map(m => (
                <TableCell key={m} className="text-right tabular-nums font-bold">
                  {formatCurrency(totals[m])}
                </TableCell>
              ))}
              <TableCell className="text-right tabular-nums font-bold text-primary">
                {formatCurrency(grandTotal)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}
