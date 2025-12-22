import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Context2025Tab } from "@/components/planning/Context2025Tab";
import { Goals2026Tab } from "@/components/planning/Goals2026Tab";
import { MonthlyRevenueTab } from "@/components/planning/MonthlyRevenueTab";
import { MediaInvestmentTab } from "@/components/planning/MediaInvestmentTab";
import { Calendar, BarChart3, LineChart, Megaphone } from "lucide-react";

export default function Planning2026() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <h1 className="font-display text-xl font-bold text-gradient">
            Planejamento Estratégico
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <Tabs defaultValue="context" className="w-full">
          <TabsList className="grid w-full max-w-3xl grid-cols-4 mb-8">
            <TabsTrigger value="context" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Contexto 2025
            </TabsTrigger>
            <TabsTrigger value="goals" className="gap-2">
              <Calendar className="h-4 w-4" />
              Metas 2026
            </TabsTrigger>
            <TabsTrigger value="monthly" className="gap-2">
              <LineChart className="h-4 w-4" />
              Faturamento Mensal
            </TabsTrigger>
            <TabsTrigger value="media" className="gap-2">
              <Megaphone className="h-4 w-4" />
              Investimento Mídia
            </TabsTrigger>
          </TabsList>

          <TabsContent value="context" className="mt-0">
            <Context2025Tab />
          </TabsContent>

          <TabsContent value="goals" className="mt-0">
            <Goals2026Tab />
          </TabsContent>

          <TabsContent value="monthly" className="mt-0">
            <MonthlyRevenueTab />
          </TabsContent>

          <TabsContent value="media" className="mt-0">
            <MediaInvestmentTab />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 mt-12">
        <div className="container flex flex-col items-center justify-center gap-2">
          <p className="text-sm text-muted-foreground">
            Planejamento Estratégico 2026
          </p>
        </div>
      </footer>
    </div>
  );
}