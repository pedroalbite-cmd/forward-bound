import { ChurnDossierCard } from '@/hooks/useOperationsData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PipefyCardLink, PIPEFY_PIPES } from './PipefyCardLink';

function formatCurrency(value: number) {
  if (!value) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
}

const MOTIVO_COLORS: Record<string, string> = {
  'Financeiro': 'border-amber-500 text-amber-700 dark:text-amber-400',
  'Atendimento': 'border-blue-500 text-blue-700 dark:text-blue-400',
  'Problema na Oxy': 'border-red-500 text-red-700 dark:text-red-400',
  'Mudança de gestão': 'border-purple-500 text-purple-700 dark:text-purple-400',
  'Não viu valor': 'border-orange-500 text-orange-700 dark:text-orange-400',
};

interface Props {
  data: ChurnDossierCard[];
}

export function ChurnDossierSection({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Nenhum registro de churn encontrado.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          Dossiê de Churn
          <Badge variant="secondary" className="text-xs">{data.length} registros</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto max-h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Mês do Churn</TableHead>
                <TableHead className="whitespace-nowrap">Cliente</TableHead>
                <TableHead className="whitespace-nowrap text-right">Setup (R$)</TableHead>
                <TableHead className="whitespace-nowrap text-right">MRR (R$)</TableHead>
                <TableHead className="whitespace-nowrap">Motivo Principal</TableHead>
                <TableHead className="whitespace-nowrap">Motivos cancelamento</TableHead>
                <TableHead className="whitespace-nowrap">CFO</TableHead>
                <TableHead className="whitespace-nowrap">Produto</TableHead>
                <TableHead className="whitespace-nowrap">Fase atual</TableHead>
                <TableHead className="whitespace-nowrap">Data assinatura</TableHead>
                <TableHead className="whitespace-nowrap">Data encerramento</TableHead>
                <TableHead className="whitespace-nowrap text-right">LT (meses)</TableHead>
                <TableHead className="whitespace-nowrap">Problemas com a Oxy</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap text-xs">{row.mesChurn || '—'}</TableCell>
                  <TableCell className="font-medium whitespace-nowrap">{row.cliente}</TableCell>
                  <TableCell className="text-right whitespace-nowrap font-mono text-xs">{formatCurrency(row.setup)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap font-mono text-xs">{formatCurrency(row.mrr)}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {row.motivoPrincipal ? (
                      <Badge variant="outline" className={MOTIVO_COLORS[row.motivoPrincipal] || ''}>
                        {row.motivoPrincipal}
                      </Badge>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate" title={row.motivosCancelamento}>
                    {row.motivosCancelamento || '—'}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs">{row.cfo || '—'}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs">{row.produto || '—'}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{row.faseAtual}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs">{row.dataAssinatura || '—'}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs">{row.dataEncerramento || '—'}</TableCell>
                  <TableCell className="text-right whitespace-nowrap font-mono text-xs">{row.ltMeses || '—'}</TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate" title={row.problemasOxy}>
                    {row.problemasOxy || '—'}
                  </TableCell>
                  <TableCell>
                    <PipefyCardLink pipeId={PIPEFY_PIPES.CENTRAL_PROJETOS} cardId={row.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
