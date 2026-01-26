import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink } from "lucide-react";

export interface DetailItem {
  id: string;
  name: string;
  company?: string;
  phase?: string;
  date?: string;
  value?: number;
  reason?: string;
  revenueRange?: string;
  responsible?: string;
  duration?: number; // Duration in seconds (from "Duração (s)" column)
  product?: string; // CaaS, O2 TAX, Oxy Hacker, Franquia
}

interface DetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  items: DetailItem[];
  columns: {
    key: keyof DetailItem;
    label: string;
    format?: (value: any) => React.ReactNode;
  }[];
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);

export function DetailSheet({ open, onOpenChange, title, description, items, columns }: DetailSheetProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] w-[90vw] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        <div className="flex-1 overflow-hidden flex flex-col mt-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">
              {items.length} {items.length === 1 ? 'registro' : 'registros'}
            </span>
          </div>
          <ScrollArea className="h-[calc(90vh-180px)]">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((col) => (
                    <TableHead key={col.key}>{col.label}</TableHead>
                  ))}
                  <TableHead className="w-[60px] text-center">Pipefy</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length + 1} className="text-center text-muted-foreground py-8">
                      Nenhum registro encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      {columns.map((col) => (
                        <TableCell key={col.key}>
                          {col.format 
                            ? col.format(item[col.key]) 
                            : item[col.key] ?? '-'
                          }
                        </TableCell>
                      ))}
                      <TableCell className="text-center">
                        <a
                          href={`https://app.pipefy.com/open-cards/${item.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center p-2 rounded-md hover:bg-muted transition-colors"
                          title="Abrir no Pipefy"
                        >
                          <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </a>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Pre-configured column formatters
export const columnFormatters = {
  currency: (value: number) => value ? formatCurrency(value) : '-',
  date: (value: string) => value ? new Date(value).toLocaleDateString('pt-BR') : '-',
  phase: (value: string) => value ? (
    <Badge variant="outline" className="font-normal">{value}</Badge>
  ) : '-',
  reason: (value: string) => value ? (
    <Badge variant="secondary" className="font-normal">{value}</Badge>
  ) : '-',
  duration: (seconds: number) => {
    if (!seconds || seconds <= 0) return '-';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    return `${hours}h`;
  },
  product: (value: string) => {
    if (!value) return '-';
    
    const colorMap: Record<string, string> = {
      'CaaS': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'O2 TAX': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
      'Oxy Hacker': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Franquia': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    };
    
    const colorClass = colorMap[value] || 'bg-gray-100 text-gray-800';
    
    return (
      <Badge className={`font-normal ${colorClass}`}>
        {value}
      </Badge>
    );
  },
};
