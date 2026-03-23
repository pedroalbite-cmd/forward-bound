import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { CfoPerformance } from '@/hooks/useNpsData';

function getNpsColor(nps: number) {
  if (nps >= 75) return 'text-green-600 dark:text-green-400';
  if (nps >= 50) return 'text-green-500 dark:text-green-500';
  if (nps > 0) return 'text-amber-600 dark:text-amber-400';
  if (nps === 0) return 'text-muted-foreground';
  return 'text-red-600 dark:text-red-400';
}

interface Props {
  data: CfoPerformance[];
}

export function CfoPerformanceTable({ data }: Props) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <span className="w-6 h-0.5 bg-primary rounded" />
        Métricas por CFO
      </h2>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Performance por CFO</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CFO</TableHead>
                <TableHead className="text-center">Enviados</TableHead>
                <TableHead className="text-center">Respostas</TableHead>
                <TableHead className="text-center">Taxa Resposta</TableHead>
                <TableHead className="text-center">NPS</TableHead>
                <TableHead className="text-center">CSAT</TableHead>
                <TableHead className="text-center">Sean Ellis</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(cfo => (
                <TableRow key={cfo.name}>
                  <TableCell className="font-medium text-sm">{cfo.name}</TableCell>
                  <TableCell className="text-center">{cfo.enviados}</TableCell>
                  <TableCell className="text-center">{cfo.respostas}</TableCell>
                  <TableCell className="text-center">{cfo.taxaResposta}%</TableCell>
                  <TableCell className={`text-center font-semibold ${getNpsColor(cfo.nps)}`}>{cfo.nps}</TableCell>
                  <TableCell className="text-center">{cfo.csat}%</TableCell>
                  <TableCell className="text-center">{cfo.seanEllis !== null ? `${cfo.seanEllis}%` : 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
