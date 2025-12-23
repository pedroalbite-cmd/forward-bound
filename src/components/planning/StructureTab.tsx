import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { 
  Users, 
  Wrench, 
  Megaphone, 
  TrendingUp, 
  Building2, 
  UserCheck, 
  UserPlus,
  Target,
  MessageSquare,
  Palette,
  BarChart3,
  Workflow,
  HeartHandshake,
  Pencil,
  DollarSign,
  Calendar
} from "lucide-react";

// ============ TYPES ============

interface TeamMember {
  role: string;
  responsibilities: string[];
  status: "contratado" | "a contratar";
  person?: string;
  quantity?: number;
  salary: number;
  area: "marketing" | "vendas" | "expansao";
  hiringMonth?: string;
}

// ============ FUNNEL CALCULATION CONSTANTS ============

const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

// Capacidades de cada cargo
const CLOSER_CAPACITY = 14; // vendas por mês
const SDR_CAPACITY = 80;    // reuniões realizadas (RRs) por mês

// Dados do Modelo Atual (BU principal) - mesmo que no MediaInvestmentTab
const modeloAtualQuarterlyMetas = { Q1: 3750000, Q2: 4950000, Q3: 6400000, Q4: 8000000 };
const modeloAtualTicket = 17000;
const modeloAtualMrrBase = 2700000;
const modeloAtualChurn = 0.06;
const modeloAtualRetencao = 0.25;

// Taxas de conversão do funil (Modelo Atual)
const modeloAtualMetrics = {
  leadToMql: 0.35,
  mqlToRm: 0.60,
  rmToRr: 0.70,
  rrToProp: 0.75,
  propToVenda: 0.60,
};

// Distribui metas trimestrais em mensais
function distributeQuarterlyToMonthly(
  quarterlyData: { Q1: number; Q2: number; Q3: number; Q4: number }
): Record<string, number> {
  const monthlyMetas: Record<string, number> = {};
  const quarterWeights = {
    Q1: { Jan: 0.30, Fev: 0.33, Mar: 0.37 },
    Q2: { Abr: 0.30, Mai: 0.33, Jun: 0.37 },
    Q3: { Jul: 0.30, Ago: 0.33, Set: 0.37 },
    Q4: { Out: 0.33, Nov: 0.37, Dez: 0.30 },
  };
  
  monthlyMetas["Jan"] = quarterlyData.Q1 * quarterWeights.Q1.Jan;
  monthlyMetas["Fev"] = quarterlyData.Q1 * quarterWeights.Q1.Fev;
  monthlyMetas["Mar"] = quarterlyData.Q1 * quarterWeights.Q1.Mar;
  monthlyMetas["Abr"] = quarterlyData.Q2 * quarterWeights.Q2.Abr;
  monthlyMetas["Mai"] = quarterlyData.Q2 * quarterWeights.Q2.Mai;
  monthlyMetas["Jun"] = quarterlyData.Q2 * quarterWeights.Q2.Jun;
  monthlyMetas["Jul"] = quarterlyData.Q3 * quarterWeights.Q3.Jul;
  monthlyMetas["Ago"] = quarterlyData.Q3 * quarterWeights.Q3.Ago;
  monthlyMetas["Set"] = quarterlyData.Q3 * quarterWeights.Q3.Set;
  monthlyMetas["Out"] = quarterlyData.Q4 * quarterWeights.Q4.Out;
  monthlyMetas["Nov"] = quarterlyData.Q4 * quarterWeights.Q4.Nov;
  monthlyMetas["Dez"] = quarterlyData.Q4 * quarterWeights.Q4.Dez;
  
  return monthlyMetas;
}

// Calcula MRR dinâmico e vendas necessárias
function calculateMrrAndRevenueToSell(
  mrrInicial: number, 
  churnRate: number, 
  retencaoRate: number,
  metasMensais: Record<string, number>,
  ticketMedio: number
): { vendasPorMes: Record<string, number>; revenueToSell: Record<string, number> } {
  const vendasPorMes: Record<string, number> = {};
  const revenueToSell: Record<string, number> = {};
  
  let mrrAtual = mrrInicial;
  let vendasMesAnterior = 0;
  
  months.forEach((month, index) => {
    if (index > 0) {
      mrrAtual = mrrAtual * (1 - churnRate);
    }
    const retencaoDoMesAnterior = vendasMesAnterior * ticketMedio * retencaoRate;
    mrrAtual = mrrAtual + retencaoDoMesAnterior;
    
    const metaDoMes = metasMensais[month];
    const aVender = Math.max(0, metaDoMes - mrrAtual);
    revenueToSell[month] = aVender;
    
    const vendasDoMes = aVender / ticketMedio;
    vendasPorMes[month] = vendasDoMes;
    vendasMesAnterior = vendasDoMes;
  });
  
  return { vendasPorMes, revenueToSell };
}

// Calcula funil reverso para obter RRs
function calculateReverseFunnel(
  vendasPorMes: Record<string, number>,
  metrics: typeof modeloAtualMetrics
): Record<string, { vendas: number; rrs: number }> {
  const funnelData: Record<string, { vendas: number; rrs: number }> = {};
  
  months.forEach(month => {
    const vendas = Math.ceil(vendasPorMes[month]);
    const propostas = vendas / metrics.propToVenda;
    const rrs = Math.ceil(propostas / metrics.rrToProp);
    
    funnelData[month] = { vendas, rrs };
  });
  
  return funnelData;
}

// Calcula meses de contratação para Closers e SDRs
function calculateHiringMonths(): { closerMonths: string[]; sdrMonths: string[] } {
  const metasMensais = distributeQuarterlyToMonthly(modeloAtualQuarterlyMetas);
  const { vendasPorMes } = calculateMrrAndRevenueToSell(
    modeloAtualMrrBase,
    modeloAtualChurn,
    modeloAtualRetencao,
    metasMensais,
    modeloAtualTicket
  );
  const funnelData = calculateReverseFunnel(vendasPorMes, modeloAtualMetrics);
  
  // Estado atual: 0 Closers contratados, 2 SDRs contratados
  let currentClosers = 0;
  let currentSDRs = 2;
  
  const closerMonths: string[] = [];
  const sdrMonths: string[] = [];
  
  months.forEach(month => {
    const { vendas, rrs } = funnelData[month];
    
    // Quantos Closers são necessários para as vendas do mês
    const closersNeeded = Math.ceil(vendas / CLOSER_CAPACITY);
    // Quantos SDRs são necessários para os RRs do mês
    const sdrsNeeded = Math.ceil(rrs / SDR_CAPACITY);
    
    // Contratar Closers se necessário
    while (currentClosers < closersNeeded) {
      closerMonths.push(month);
      currentClosers++;
    }
    
    // Contratar SDRs se necessário
    while (currentSDRs < sdrsNeeded) {
      sdrMonths.push(month);
      currentSDRs++;
    }
  });
  
  return { closerMonths, sdrMonths };
}

// ============ INITIAL DATA ============

// Pré-calcula os meses de contratação
const { closerMonths, sdrMonths } = calculateHiringMonths();

const initialMarketingTeam: TeamMember[] = [
  {
    role: "Head de Marketing",
    responsibilities: ["Estratégia geral", "Gestão do time", "Budget", "Alinhamento com vendas"],
    status: "contratado",
    person: "Contratado",
    salary: 0,
    area: "marketing"
  },
  {
    role: "Social Media",
    responsibilities: ["Calendário de posts", "Engajamento", "Comunidade", "Tendências"],
    status: "contratado",
    person: "Contratado",
    salary: 0,
    area: "marketing"
  },
  {
    role: "Designer",
    responsibilities: ["Criativos para ads", "Social media", "Materiais ricos", "Branding"],
    status: "contratado",
    person: "Contratado",
    salary: 0,
    area: "marketing"
  }
];

const initialSalesTeam: TeamMember[] = [
  {
    role: "Head Comercial",
    responsibilities: ["Estratégia de vendas", "Gestão do pipeline", "Metas", "Treinamento"],
    status: "contratado",
    person: "Contratado",
    salary: 0,
    area: "vendas"
  },
  {
    role: "SDR (Sales Development)",
    responsibilities: ["Qualificação de leads", "Agendamento de reuniões", "Follow-up", "CRM"],
    status: "contratado",
    quantity: 2,
    salary: 0,
    area: "vendas"
  },
  // Closers a contratar (com mês calculado)
  ...closerMonths.map((month, index) => ({
    role: "Closer",
    responsibilities: ["Reuniões de venda", "Negociação", "Fechamento", "Onboarding inicial"],
    status: "a contratar" as const,
    quantity: 1,
    salary: 0,
    area: "vendas" as const,
    hiringMonth: month
  })),
  // SDRs a contratar (com mês calculado)
  ...sdrMonths.map((month, index) => ({
    role: "SDR (Sales Development)",
    responsibilities: ["Qualificação de leads", "Agendamento de reuniões", "Follow-up", "CRM"],
    status: "a contratar" as const,
    quantity: 1,
    salary: 0,
    area: "vendas" as const,
    hiringMonth: month
  }))
];

const initialExpansionTeam: TeamMember[] = [
  {
    role: "Gestor de Comunidade",
    responsibilities: ["Engajamento de franqueados", "Relacionamento", "Suporte", "Eventos"],
    status: "a contratar",
    quantity: 1,
    salary: 0,
    area: "expansao"
  }
];

// ============ FERRAMENTAS DATA ============

const toolCategories = [
  {
    category: "CRM & Vendas",
    icon: Target,
    color: "from-blue-500 to-cyan-500",
    tools: [
      { name: "Pipedrive", description: "Gestão de pipeline e oportunidades", status: "ativo" },
      { name: "RD Station CRM", description: "Alternativa/integração com marketing", status: "avaliando" },
      { name: "Calendly", description: "Agendamento de reuniões", status: "ativo" }
    ]
  },
  {
    category: "Marketing & Automação",
    icon: Megaphone,
    color: "from-green-500 to-emerald-500",
    tools: [
      { name: "RD Station Marketing", description: "Automação e nutrição de leads", status: "ativo" },
      { name: "Meta Business Suite", description: "Gestão de Meta Ads", status: "ativo" },
      { name: "Google Ads", description: "Campanhas de busca e display", status: "ativo" },
      { name: "mLabs", description: "Agendamento de posts", status: "avaliando" }
    ]
  },
  {
    category: "Design & Conteúdo",
    icon: Palette,
    color: "from-purple-500 to-pink-500",
    tools: [
      { name: "Canva Pro", description: "Criação de artes e materiais", status: "ativo" },
      { name: "Figma", description: "Design de interfaces e protótipos", status: "ativo" },
      { name: "CapCut", description: "Edição de vídeos para social", status: "ativo" }
    ]
  },
  {
    category: "Comunicação",
    icon: MessageSquare,
    color: "from-amber-500 to-orange-500",
    tools: [
      { name: "Slack", description: "Comunicação interna do time", status: "ativo" },
      { name: "Google Meet", description: "Videoconferências", status: "ativo" },
      { name: "WhatsApp Business", description: "Atendimento ao cliente", status: "ativo" }
    ]
  },
  {
    category: "Dados & Analytics",
    icon: BarChart3,
    color: "from-rose-500 to-red-500",
    tools: [
      { name: "Google Analytics 4", description: "Análise de tráfego web", status: "ativo" },
      { name: "Looker Studio", description: "Dashboards e relatórios", status: "ativo" },
      { name: "Hotjar", description: "Mapas de calor e gravações", status: "avaliando" }
    ]
  },
  {
    category: "Operação & Produtividade",
    icon: Workflow,
    color: "from-indigo-500 to-violet-500",
    tools: [
      { name: "Notion", description: "Documentação e gestão de projetos", status: "ativo" },
      { name: "Google Workspace", description: "E-mail, Drive, Docs", status: "ativo" },
      { name: "Asana/Monday", description: "Gestão de tarefas", status: "avaliando" }
    ]
  }
];

// ============ HELPER FUNCTIONS ============

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const getAreaLabel = (area: string) => {
  switch (area) {
    case "marketing": return "Marketing";
    case "vendas": return "Vendas";
    case "expansao": return "Expansão";
    default: return area;
  }
};

const getAreaColor = (area: string) => {
  switch (area) {
    case "marketing": return "text-green-500";
    case "vendas": return "text-blue-500";
    case "expansao": return "text-purple-500";
    default: return "text-foreground";
  }
};

// ============ COMPONENTS ============

const TeamMemberCard = ({ member, color }: { member: TeamMember; color: string }) => (
  <div className="flex items-start gap-3 p-4 rounded-lg bg-background/50 border border-border/30 hover:border-border/50 transition-all">
    <div className={`p-2 rounded-lg bg-gradient-to-br ${color} text-white shrink-0`}>
      {member.status === "contratado" ? (
        <UserCheck className="h-4 w-4" />
      ) : (
        <UserPlus className="h-4 w-4" />
      )}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <h4 className="font-semibold text-sm">{member.role}</h4>
        {member.quantity && (
          <Badge variant="outline" className="text-xs">
            x{member.quantity}
          </Badge>
        )}
        <Badge 
          variant={member.status === "contratado" ? "default" : "secondary"}
          className={`text-xs ${member.status === "contratado" ? "bg-green-500/20 text-green-500 border-green-500/30" : "bg-amber-500/20 text-amber-500 border-amber-500/30"}`}
        >
          {member.status === "contratado" ? "Contratado" : "A contratar"}
        </Badge>
      </div>
      <div className="flex flex-wrap gap-1">
        {member.responsibilities.map((resp: string, i: number) => (
          <Badge key={i} variant="outline" className="text-xs font-normal bg-background/80">
            {resp}
          </Badge>
        ))}
      </div>
    </div>
  </div>
);

const EmptyTeamMessage = () => (
  <div className="flex flex-col items-center justify-center p-8 text-center">
    <UserPlus className="h-12 w-12 text-muted-foreground/30 mb-3" />
    <p className="text-muted-foreground text-sm">Nenhum cargo definido ainda</p>
  </div>
);

const TeamSection = ({ 
  title, 
  icon: Icon, 
  team, 
  color,
  bgColor 
}: { 
  title: string; 
  icon: any; 
  team: TeamMember[];
  color: string;
  bgColor: string;
}) => {
  const contratados = team.filter(m => m.status === "contratado").reduce((acc, m) => acc + (m.quantity || 1), 0);
  const aContratar = team.filter(m => m.status === "a contratar").reduce((acc, m) => acc + (m.quantity || 1), 0);
  
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-gradient-to-br ${color} text-white`}>
              <Icon className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/30">
              {contratados} contratados
            </Badge>
            <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-500 border-amber-500/30">
              {aContratar} a contratar
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {team.length === 0 ? (
          <EmptyTeamMessage />
        ) : (
          team.map((member, index) => (
            <TeamMemberCard key={index} member={member} color={color} />
          ))
        )}
      </CardContent>
    </Card>
  );
};

const ToolCard = ({ tool }: { tool: any }) => (
  <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/30 hover:border-border/50 transition-all">
    <div>
      <h4 className="font-medium text-sm">{tool.name}</h4>
      <p className="text-xs text-muted-foreground">{tool.description}</p>
    </div>
    <Badge 
      variant="outline"
      className={`text-xs shrink-0 ${
        tool.status === "ativo" 
          ? "bg-green-500/10 text-green-500 border-green-500/30" 
          : "bg-blue-500/10 text-blue-500 border-blue-500/30"
      }`}
    >
      {tool.status === "ativo" ? "Ativo" : "Avaliando"}
    </Badge>
  </div>
);

const ToolCategoryCard = ({ category }: { category: typeof toolCategories[0] }) => {
  const Icon = category.icon;
  const activeCount = category.tools.filter(t => t.status === "ativo").length;
  
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
      <div className={`h-1 bg-gradient-to-r ${category.color}`} />
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${category.color} text-white`}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-base">{category.category}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {activeCount} de {category.tools.length} ativos
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {category.tools.map((tool, index) => (
          <ToolCard key={index} tool={tool} />
        ))}
      </CardContent>
    </Card>
  );
};

// ============ SALARY TABLE COMPONENT ============

interface SalaryTableProps {
  allTeamData: TeamMember[];
  onEdit: (member: TeamMember, index: number) => void;
}

const SalaryTable = ({ allTeamData, onEdit }: SalaryTableProps) => {
  const contratados = allTeamData.filter(m => m.status === "contratado");
  const aContratar = allTeamData.filter(m => m.status === "a contratar");
  
  const totalContratados = contratados.reduce((acc, m) => acc + (m.salary * (m.quantity || 1)), 0);
  const totalAContratar = aContratar.reduce((acc, m) => acc + (m.salary * (m.quantity || 1)), 0);
  const totalGeral = totalContratados + totalAContratar;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Tabela de Remuneração</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Valores mensais por cargo
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[100px]">Área</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead className="text-center w-[60px]">Qtd</TableHead>
                <TableHead className="text-center w-[120px]">
                  <div className="flex items-center justify-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Mês Contratação
                  </div>
                </TableHead>
                <TableHead className="text-right w-[140px]">Remuneração</TableHead>
                <TableHead className="text-right w-[140px]">Total</TableHead>
                <TableHead className="text-center w-[80px]">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allTeamData.map((member, index) => (
                <TableRow key={`${member.area}-${member.role}-${index}`} className="hover:bg-muted/20">
                  <TableCell>
                    <Badge 
                      variant="outline"
                      className={`text-xs ${
                        member.status === "contratado" 
                          ? "bg-green-500/10 text-green-500 border-green-500/30" 
                          : "bg-amber-500/10 text-amber-500 border-amber-500/30"
                      }`}
                    >
                      {member.status === "contratado" ? "Contratado" : "A contratar"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={`font-medium ${getAreaColor(member.area)}`}>
                      {getAreaLabel(member.area)}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{member.role}</TableCell>
                  <TableCell className="text-center">{member.quantity || 1}</TableCell>
                  <TableCell className="text-center">
                    {member.status === "contratado" ? (
                      <span className="text-muted-foreground">—</span>
                    ) : member.hiringMonth ? (
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                        {member.hiringMonth}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">A definir</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(member.salary)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {formatCurrency(member.salary * (member.quantity || 1))}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(member, index)}
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-green-500/5">
                <TableCell colSpan={6} className="font-semibold text-green-500">
                  Total Contratados
                </TableCell>
                <TableCell className="text-right font-mono font-bold text-green-500">
                  {formatCurrency(totalContratados)}
                </TableCell>
                <TableCell />
              </TableRow>
              <TableRow className="bg-amber-500/5">
                <TableCell colSpan={6} className="font-semibold text-amber-500">
                  Total A Contratar
                </TableCell>
                <TableCell className="text-right font-mono font-bold text-amber-500">
                  {formatCurrency(totalAContratar)}
                </TableCell>
                <TableCell />
              </TableRow>
              <TableRow className="bg-primary/5">
                <TableCell colSpan={6} className="font-bold text-primary">
                  Total Geral (Mensal)
                </TableCell>
                <TableCell className="text-right font-mono font-bold text-primary text-lg">
                  {formatCurrency(totalGeral)}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

// ============ MAIN COMPONENT ============

export const StructureTab = () => {
  const [marketingData, setMarketingData] = useState<TeamMember[]>(initialMarketingTeam);
  const [salesData, setSalesData] = useState<TeamMember[]>(initialSalesTeam);
  const [expansionData, setExpansionData] = useState<TeamMember[]>(initialExpansionTeam);
  
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [editingSalary, setEditingSalary] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const allTeamData = [...marketingData, ...salesData, ...expansionData];

  const handleEdit = (member: TeamMember, globalIndex: number) => {
    setEditingMember(member);
    setEditingIndex(globalIndex);
    setEditingSalary(member.salary.toString());
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingMember) return;
    
    const newSalary = parseFloat(editingSalary) || 0;
    
    const updateTeam = (team: TeamMember[], setTeam: React.Dispatch<React.SetStateAction<TeamMember[]>>) => {
      const index = team.findIndex(m => 
        m.role === editingMember.role && 
        m.status === editingMember.status && 
        m.area === editingMember.area
      );
      if (index !== -1) {
        const updated = [...team];
        updated[index] = { ...updated[index], salary: newSalary };
        setTeam(updated);
        return true;
      }
      return false;
    };
    
    if (editingMember.area === "marketing") {
      updateTeam(marketingData, setMarketingData);
    } else if (editingMember.area === "vendas") {
      updateTeam(salesData, setSalesData);
    } else if (editingMember.area === "expansao") {
      updateTeam(expansionData, setExpansionData);
    }
    
    setIsDialogOpen(false);
    setEditingMember(null);
    setEditingIndex(-1);
  };

  const totalPeople = allTeamData.reduce((acc, m) => acc + (m.quantity || 1), 0);
  const totalTools = toolCategories.reduce((acc, cat) => acc + cat.tools.length, 0);
  const activeTools = toolCategories.reduce((acc, cat) => acc + cat.tools.filter(t => t.status === "ativo").length, 0);
  
  const totalContratados = allTeamData
    .filter(m => m.status === "contratado")
    .reduce((acc, m) => acc + (m.quantity || 1), 0);
  
  const totalAContratar = allTeamData
    .filter(m => m.status === "a contratar")
    .reduce((acc, m) => acc + (m.quantity || 1), 0);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-background border border-primary/20 p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <Badge className="bg-primary/20 text-primary border-primary/30 text-sm px-3 py-1">
              O2N
            </Badge>
            <Badge variant="outline" className="text-sm">
              Estrutura 2026
            </Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Estrutura de Time e Ferramentas
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Visão completa do time de Marketing, Vendas e Expansão, além das ferramentas utilizadas para operação.
          </p>
          <div className="flex flex-wrap gap-4 mt-6">
            <div className="flex items-center gap-2 bg-background/50 rounded-lg px-4 py-2 border border-border/50">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Total de Pessoas</p>
                <p className="text-lg font-bold">{totalPeople}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-background/50 rounded-lg px-4 py-2 border border-border/50">
              <UserCheck className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Contratados</p>
                <p className="text-lg font-bold">{totalContratados}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-background/50 rounded-lg px-4 py-2 border border-border/50">
              <UserPlus className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-xs text-muted-foreground">A Contratar</p>
                <p className="text-lg font-bold">{totalAContratar}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-background/50 rounded-lg px-4 py-2 border border-border/50">
              <Wrench className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Ferramentas</p>
                <p className="text-lg font-bold">{activeTools}/{totalTools}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Time Section */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Users className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Estrutura do Time</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <TeamSection 
            title="Marketing" 
            icon={Megaphone} 
            team={marketingData}
            color="from-green-500 to-emerald-500"
            bgColor="bg-green-500/10"
          />
          <TeamSection 
            title="Vendas" 
            icon={TrendingUp} 
            team={salesData}
            color="from-blue-500 to-cyan-500"
            bgColor="bg-blue-500/10"
          />
          <TeamSection 
            title="Expansão" 
            icon={Building2} 
            team={expansionData}
            color="from-purple-500 to-pink-500"
            bgColor="bg-purple-500/10"
          />
        </div>
      </div>

      {/* Salary Table Section */}
      <SalaryTable allTeamData={allTeamData} onEdit={handleEdit} />

      {/* Ferramentas Section */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Wrench className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Ferramentas</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {toolCategories.map((category, index) => (
            <ToolCategoryCard key={index} category={category} />
          ))}
        </div>
      </div>

      {/* Summary Card */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HeartHandshake className="h-5 w-5 text-primary" />
            Resumo de Investimento em Estrutura
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Megaphone className="h-4 w-4 text-green-500" />
                <h4 className="font-semibold text-green-500">Marketing</h4>
              </div>
              <p className="text-2xl font-bold">{marketingData.length}</p>
              <p className="text-sm text-muted-foreground">posições no time</p>
            </div>
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <h4 className="font-semibold text-blue-500">Vendas</h4>
              </div>
              <p className="text-2xl font-bold">{salesData.reduce((acc, m) => acc + (m.quantity || 1), 0)}</p>
              <p className="text-sm text-muted-foreground">posições no time</p>
            </div>
            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-purple-500" />
                <h4 className="font-semibold text-purple-500">Expansão</h4>
              </div>
              <p className="text-2xl font-bold">{expansionData.reduce((acc, m) => acc + (m.quantity || 1), 0)}</p>
              <p className="text-sm text-muted-foreground">posições no time</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Salary Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Remuneração</DialogTitle>
          </DialogHeader>
          {editingMember && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getAreaColor(editingMember.area)}>
                    {getAreaLabel(editingMember.area)}
                  </Badge>
                  <Badge 
                    variant="outline"
                    className={`text-xs ${
                      editingMember.status === "contratado" 
                        ? "bg-green-500/10 text-green-500 border-green-500/30" 
                        : "bg-amber-500/10 text-amber-500 border-amber-500/30"
                    }`}
                  >
                    {editingMember.status === "contratado" ? "Contratado" : "A contratar"}
                  </Badge>
                </div>
                <p className="font-semibold text-lg">{editingMember.role}</p>
                {editingMember.quantity && editingMember.quantity > 1 && (
                  <p className="text-sm text-muted-foreground">
                    Quantidade: {editingMember.quantity} pessoas
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary">Remuneração Mensal (R$)</Label>
                <Input
                  id="salary"
                  type="number"
                  value={editingSalary}
                  onChange={(e) => setEditingSalary(e.target.value)}
                  placeholder="0"
                  className="font-mono"
                />
                {editingMember.quantity && editingMember.quantity > 1 && (
                  <p className="text-sm text-muted-foreground">
                    Total para {editingMember.quantity} pessoas: {formatCurrency((parseFloat(editingSalary) || 0) * editingMember.quantity)}
                  </p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
