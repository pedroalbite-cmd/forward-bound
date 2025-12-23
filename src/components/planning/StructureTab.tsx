import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Mail,
  Calendar,
  Video,
  FileText,
  Database,
  Workflow,
  Phone,
  Globe,
  LineChart,
  PieChart,
  Briefcase,
  HeartHandshake
} from "lucide-react";

// ============ TIME DATA ============

const marketingTeam = [
  {
    role: "Head de Marketing",
    responsibilities: ["Estratégia geral", "Gestão do time", "Budget", "Alinhamento com vendas"],
    status: "contratado",
    person: "A definir"
  },
  {
    role: "Gestor de Tráfego",
    responsibilities: ["Meta Ads", "Google Ads", "Análise de performance", "Otimização de campanhas"],
    status: "contratado",
    person: "A definir"
  },
  {
    role: "Social Media",
    responsibilities: ["Calendário de posts", "Engajamento", "Comunidade", "Tendências"],
    status: "a contratar",
    person: null
  },
  {
    role: "Designer",
    responsibilities: ["Criativos para ads", "Social media", "Materiais ricos", "Branding"],
    status: "a contratar",
    person: null
  },
  {
    role: "Redator/Copywriter",
    responsibilities: ["Copy de anúncios", "E-mails", "Landing pages", "Conteúdo blog"],
    status: "a contratar",
    person: null
  }
];

const salesTeam = [
  {
    role: "Head Comercial",
    responsibilities: ["Estratégia de vendas", "Gestão do pipeline", "Metas", "Treinamento"],
    status: "contratado",
    person: "A definir"
  },
  {
    role: "SDR (Sales Development)",
    responsibilities: ["Qualificação de leads", "Agendamento de reuniões", "Follow-up", "CRM"],
    status: "a contratar",
    quantity: 2
  },
  {
    role: "Closer",
    responsibilities: ["Reuniões de venda", "Negociação", "Fechamento", "Onboarding inicial"],
    status: "contratado",
    person: "A definir"
  }
];

const expansionTeam = [
  {
    role: "Gerente de Expansão",
    responsibilities: ["Estratégia de franquias", "Prospecção de franqueados", "Análise de mercado"],
    status: "contratado",
    person: "A definir"
  },
  {
    role: "Suporte ao Franqueado",
    responsibilities: ["Onboarding", "Acompanhamento mensal", "Resolução de problemas", "Treinamento"],
    status: "a contratar",
    quantity: 2
  },
  {
    role: "Analista de Performance",
    responsibilities: ["KPIs de franquias", "Relatórios", "Benchmarking", "Planos de ação"],
    status: "a contratar",
    person: null
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

// ============ COMPONENTS ============

const TeamMemberCard = ({ member, color }: { member: any; color: string }) => (
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

const TeamSection = ({ 
  title, 
  icon: Icon, 
  team, 
  color,
  bgColor 
}: { 
  title: string; 
  icon: any; 
  team: any[]; 
  color: string;
  bgColor: string;
}) => {
  const contratados = team.filter(m => m.status === "contratado").length;
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
        {team.map((member, index) => (
          <TeamMemberCard key={index} member={member} color={color} />
        ))}
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

// ============ MAIN COMPONENT ============

export const StructureTab = () => {
  const totalPeople = [
    ...marketingTeam.map((m: any) => m.quantity || 1),
    ...salesTeam.map((m: any) => m.quantity || 1),
    ...expansionTeam.map((m: any) => m.quantity || 1)
  ].reduce((a, b) => a + b, 0);
  
  const totalTools = toolCategories.reduce((acc, cat) => acc + cat.tools.length, 0);
  const activeTools = toolCategories.reduce((acc, cat) => acc + cat.tools.filter(t => t.status === "ativo").length, 0);
  
  const totalContratados = [
    ...marketingTeam.filter(m => m.status === "contratado"),
    ...salesTeam.filter(m => m.status === "contratado"),
    ...expansionTeam.filter(m => m.status === "contratado")
  ].length;
  
  const totalAContratar = [
    ...marketingTeam.filter(m => m.status === "a contratar").map((m: any) => m.quantity || 1),
    ...salesTeam.filter(m => m.status === "a contratar").map((m: any) => m.quantity || 1),
    ...expansionTeam.filter(m => m.status === "a contratar").map((m: any) => m.quantity || 1)
  ].reduce((a, b) => a + b, 0);

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
            team={marketingTeam}
            color="from-green-500 to-emerald-500"
            bgColor="bg-green-500/10"
          />
          <TeamSection 
            title="Vendas" 
            icon={TrendingUp} 
            team={salesTeam}
            color="from-blue-500 to-cyan-500"
            bgColor="bg-blue-500/10"
          />
          <TeamSection 
            title="Expansão" 
            icon={Building2} 
            team={expansionTeam}
            color="from-purple-500 to-pink-500"
            bgColor="bg-purple-500/10"
          />
        </div>
      </div>

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
              <p className="text-2xl font-bold">{marketingTeam.length}</p>
              <p className="text-sm text-muted-foreground">posições no time</p>
            </div>
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <h4 className="font-semibold text-blue-500">Vendas</h4>
              </div>
              <p className="text-2xl font-bold">{salesTeam.reduce((acc, m: any) => acc + (m.quantity || 1), 0)}</p>
              <p className="text-sm text-muted-foreground">posições no time</p>
            </div>
            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-purple-500" />
                <h4 className="font-semibold text-purple-500">Expansão</h4>
              </div>
              <p className="text-2xl font-bold">{expansionTeam.reduce((acc, m: any) => acc + (m.quantity || 1), 0)}</p>
              <p className="text-sm text-muted-foreground">posições no time</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
