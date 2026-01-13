import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Database, Table, Eye } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SchemaColumn {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

interface SchemaResult {
  action: string;
  table: string;
  columns: SchemaColumn[];
}

interface PreviewResult {
  action: string;
  table: string;
  totalRows: number;
  previewRows: number;
  data: Record<string, unknown>[];
}

export function ExternalDbExplorer() {
  const [selectedTable, setSelectedTable] = useState<string>("pipefy_cards");
  const [loading, setLoading] = useState(false);
  const [schema, setSchema] = useState<SchemaResult | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);

  const tables = [
    { value: "pipefy_cards", label: "pipefy_cards" },
    { value: "pipefy_cards_expansao", label: "pipefy_cards_expansao" },
  ];

  const fetchSchema = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("query-external-db", {
        body: { table: selectedTable, action: "schema" },
      });

      if (error) throw error;
      setSchema(data);
      setPreview(null);
      toast.success(`Schema carregado para ${selectedTable}`);
    } catch (error) {
      console.error("Error fetching schema:", error);
      toast.error("Erro ao carregar schema");
    } finally {
      setLoading(false);
    }
  };

  const fetchPreview = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("query-external-db", {
        body: { table: selectedTable, action: "preview", limit: 50 },
      });

      if (error) throw error;
      setPreview(data);
      setSchema(null);
      toast.success(`Preview carregado: ${data.previewRows} de ${data.totalRows} registros`);
    } catch (error) {
      console.error("Error fetching preview:", error);
      toast.error("Erro ao carregar preview");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Database className="h-5 w-5 text-primary" />
          Explorador de Banco Externo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Select value={selectedTable} onValueChange={setSelectedTable}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Selecione uma tabela" />
            </SelectTrigger>
            <SelectContent>
              {tables.map((table) => (
                <SelectItem key={table.value} value={table.value}>
                  {table.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={fetchSchema} disabled={loading} variant="outline" className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Table className="h-4 w-4" />}
            Ver Schema
          </Button>

          <Button onClick={fetchPreview} disabled={loading} variant="outline" className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
            Ver Dados
          </Button>
        </div>

        {schema && (
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">
              Schema: {schema.table} ({schema.columns.length} colunas)
            </h3>
            <ScrollArea className="h-[400px] rounded-md border border-border/50 bg-background/50 p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left p-2 font-medium">Coluna</th>
                    <th className="text-left p-2 font-medium">Tipo</th>
                    <th className="text-left p-2 font-medium">Nullable</th>
                    <th className="text-left p-2 font-medium">Default</th>
                  </tr>
                </thead>
                <tbody>
                  {schema.columns.map((col, idx) => (
                    <tr key={idx} className="border-b border-border/30 hover:bg-muted/20">
                      <td className="p-2 font-mono text-primary">{col.column_name}</td>
                      <td className="p-2 font-mono text-muted-foreground">{col.data_type}</td>
                      <td className="p-2">{col.is_nullable}</td>
                      <td className="p-2 font-mono text-xs text-muted-foreground">
                        {col.column_default || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </div>
        )}

        {preview && (
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">
              Preview: {preview.table} ({preview.previewRows} de {preview.totalRows} registros)
            </h3>
            <ScrollArea className="h-[400px] rounded-md border border-border/50 bg-background/50 p-4">
              <pre className="text-xs font-mono whitespace-pre-wrap text-muted-foreground">
                {JSON.stringify(preview.data, null, 2)}
              </pre>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
