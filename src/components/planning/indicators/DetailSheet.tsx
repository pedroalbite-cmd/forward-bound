import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="text-xl">{title}</SheetTitle>
          {description && (
            <SheetDescription>{description}</SheetDescription>
          )}
        </SheetHeader>
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">
              {items.length} {items.length === 1 ? 'registro' : 'registros'}
            </span>
          </div>
          <ScrollArea className="h-[calc(100vh-200px)]">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((col) => (
                    <TableHead key={col.key}>{col.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center text-muted-foreground py-8">
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
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
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
};
