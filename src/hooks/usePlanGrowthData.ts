import { useMemo, useEffect } from "react";
import { useMediaMetas } from "@/contexts/MediaMetasContext";

// Indicadores de 2025 (base para projeção)
const indicators2025 = {
  cpv: 6517.05,
};

const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

// Unit-based targets for each BU
const oxyHackerUnits: Record<string, number> = {
  Jan: 1, Fev: 2, Mar: 2,
  Abr: 5, Mai: 5, Jun: 5,
  Jul: 10, Ago: 10, Set: 10,
  Out: 15, Nov: 18, Dez: 17,
};
const franquiaUnits: Record<string, number> = {
  Jan: 0, Fev: 1, Mar: 1,
  Abr: 1, Mai: 1, Jun: 1,
  Jul: 2, Ago: 2, Set: 2,
  Out: 3, Nov: 3, Dez: 3,
};

// BU Indicators configuration
interface BUIndicators {
  ticketMedio: number;
  cpv: number;
  mqlToRm: number;
  rmToRr: number;
  rrToProp: number;
  propToVenda: number;
  leadToMql: number;
}

const indicadoresPorBU: Record<string, BUIndicators> = {
  modeloAtual: {
    ticketMedio: 17000,
    cpv: 6517.05,
    mqlToRm: 0.49,
    rmToRr: 0.72,
    rrToProp: 0.88,
    propToVenda: 0.24,
    leadToMql: 0.43,
  },
  o2Tax: {
    ticketMedio: 15000,
    cpv: 2500,
    mqlToRm: 0.45,
    rmToRr: 0.65,
    rrToProp: 0.80,
    propToVenda: 0.20,
    leadToMql: 0.35,
  },
  oxyHacker: {
    ticketMedio: 54000,
    cpv: 5000,
    mqlToRm: 0.40,
    rmToRr: 0.60,
    rrToProp: 0.75,
    propToVenda: 0.15,
    leadToMql: 0.25,
  },
  franquia: {
    ticketMedio: 140000,
    cpv: 12000,
    mqlToRm: 0.35,
    rmToRr: 0.55,
    rrToProp: 0.70,
    propToVenda: 0.12,
    leadToMql: 0.20,
  },
};

// Quarterly targets
const metasTrimestrais = {
  Q1: 3750000,
  Q2: 4500000,
  Q3: 6000000,
  Q4: 8000000,
};

const quarterlyTotalsOutrasBUs = {
  o2Tax: { Q1: 412224, Q2: 587220.48, Q3: 781590.46, Q4: 1040296.90 },
  oxyHacker: { Q1: 5 * 54000, Q2: 15 * 54000, Q3: 30 * 54000, Q4: 50 * 54000 },
  franquia: { Q1: 2 * 140000, Q2: 3 * 140000, Q3: 6 * 140000, Q4: 9 * 140000 },
};

// Helper functions
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

function calculateMonthlyValuesSmooth(
  quarterlyData: { Q1: number; Q2: number; Q3: number; Q4: number },
  initialValue: number
) {
  const monthlyValues: Record<string, number> = {};
  const weights = {
    Jan: 1.00, Fev: 1.02, Mar: 1.08,
    Abr: 1.14, Mai: 1.20, Jun: 1.28,
    Jul: 1.38, Ago: 1.50, Set: 1.65,
    Out: 1.82, Nov: 2.00, Dez: 1.60,
  };
  
  const rawValues: Record<string, number> = {};
  months.forEach(month => {
    rawValues[month] = initialValue * weights[month as keyof typeof weights];
  });
  
  const scaleQuarter = (quarterMonths: string[], quarterTotal: number) => {
    const rawQuarterSum = quarterMonths.reduce((sum, m) => sum + rawValues[m], 0);
    const scale = quarterTotal / rawQuarterSum;
    quarterMonths.forEach(m => {
      monthlyValues[m] = rawValues[m] * scale;
    });
  };
  
  scaleQuarter(["Jan", "Fev", "Mar"], quarterlyData.Q1);
  scaleQuarter(["Abr", "Mai", "Jun"], quarterlyData.Q2);
  scaleQuarter(["Jul", "Ago", "Set"], quarterlyData.Q3);
  scaleQuarter(["Out", "Nov", "Dez"], quarterlyData.Q4);
  
  return monthlyValues;
}

function calculateFromUnits(units: Record<string, number>, ticketValue: number): Record<string, number> {
  const result: Record<string, number> = {};
  months.forEach(month => {
    result[month] = units[month] * ticketValue;
  });
  return result;
}

function calculateMrrAndRevenueToSell(
  mrrInicial: number, 
  churnRate: number, 
  retencaoRate: number,
  metasMensais: Record<string, number>,
  ticketMedio: number,
  valorVenderInicial: number = 0
): { mrrPorMes: Record<string, number>; vendasPorMes: Record<string, number>; revenueToSell: Record<string, number> } {
  const mrrPorMes: Record<string, number> = {};
  const vendasPorMes: Record<string, number> = {};
  const revenueToSell: Record<string, number> = {};
  
  let mrrAtual = valorVenderInicial > 0 
    ? metasMensais["Jan"] - valorVenderInicial 
    : mrrInicial;
  
  let vendasMesAnterior = 0;
  
  months.forEach((month, index) => {
    if (index > 0) {
      mrrAtual = mrrAtual * (1 - churnRate);
    }
    
    const retencaoDoMesAnterior = vendasMesAnterior * ticketMedio * retencaoRate;
    mrrAtual = mrrAtual + retencaoDoMesAnterior;
    
    mrrPorMes[month] = mrrAtual;
    
    const metaDoMes = metasMensais[month];
    const aVender = Math.max(0, metaDoMes - mrrAtual);
    revenueToSell[month] = aVender;
    
    const vendasDoMes = aVender / ticketMedio;
    vendasPorMes[month] = vendasDoMes;
    vendasMesAnterior = vendasDoMes;
  });
  
  return { mrrPorMes, vendasPorMes, revenueToSell };
}

interface FunnelData {
  month: string;
  faturamentoMeta: number;
  faturamentoVender: number;
  mrrBase: number;
  vendas: number;
  propostas: number;
  rrs: number;
  rms: number;
  mqls: number;
  leads: number;
  investimento: number;
}

function calculateReverseFunnel(
  netRevenueToSell: Record<string, number>,
  metrics: BUIndicators,
  mrrComChurn: Record<string, number> | null = null,
  metasMensais: Record<string, number> | null = null,
  cpvValue: number,
  investimentoInicialJan: number = 0
): FunnelData[] {
  let investimentoAnterior = 0;
  
  const dadosOriginais = months.map(month => {
    const faturamentoVender = netRevenueToSell[month];
    const mrrBaseAtual = mrrComChurn ? mrrComChurn[month] : 0;
    const faturamentoMeta = metasMensais ? metasMensais[month] : (mrrBaseAtual + faturamentoVender);
    
    const vendas = faturamentoVender / metrics.ticketMedio;
    const propostas = vendas / metrics.propToVenda;
    const rrs = propostas / metrics.rrToProp;
    const rms = rrs / metrics.rmToRr;
    const mqls = rms / metrics.mqlToRm;
    const leads = mqls / metrics.leadToMql;
    
    const investimentoCalculado = vendas * cpvValue;
    const investimento = Math.max(investimentoCalculado, investimentoAnterior);
    investimentoAnterior = investimento;
    
    return {
      month,
      faturamentoMeta,
      faturamentoVender,
      mrrBase: mrrBaseAtual,
      vendas: Math.ceil(vendas),
      propostas: Math.ceil(propostas),
      rrs: Math.ceil(rrs),
      rms: Math.ceil(rms),
      mqls: Math.ceil(mqls),
      leads: Math.ceil(leads),
      investimento: Math.round(investimento),
    };
  });
  
  return dadosOriginais.map((dados, index) => {
    if (index === 0 && investimentoInicialJan > 0) {
      const vendasIniciais = Math.ceil(investimentoInicialJan / cpvValue);
      const propostas = Math.ceil(vendasIniciais / metrics.propToVenda);
      const rrs = Math.ceil(propostas / metrics.rrToProp);
      const rms = Math.ceil(rrs / metrics.rmToRr);
      const mqls = Math.ceil(rms / metrics.mqlToRm);
      const leads = Math.ceil(mqls / metrics.leadToMql);
      
      return { 
        ...dados, 
        investimento: investimentoInicialJan,
        vendas: vendasIniciais,
        propostas,
        rrs,
        rms,
        mqls,
        leads,
      };
    }
    
    const investimentoDeslocado = index < months.length - 1 
      ? dadosOriginais[index + 1].investimento 
      : dados.investimento;
    
    return {
      ...dados,
      investimento: investimentoDeslocado,
    };
  });
}

/**
 * Hook that calculates Plan Growth funnel data and publishes it to the MediaMetasContext.
 * This ensures the data is available on app initialization without needing to visit the Plan Growth tab.
 */
export function usePlanGrowthData() {
  const { setMetasPorBU, setFunnelData, isLoaded } = useMediaMetas();
  
  // Default values (same as MediaInvestmentTab)
  const mrrInicial = 700000;
  const valorVenderInicial = 400000;
  const churnMensal = 0.06;
  const retencaoVendas = 0.25;

  // Calculate Modelo Atual monthly targets
  const metasMensaisModeloAtual = useMemo(() => 
    distributeQuarterlyToMonthly(metasTrimestrais), 
    []
  );

  // Calculate MRR dynamics for Modelo Atual
  const mrrDynamic = useMemo(() => 
    calculateMrrAndRevenueToSell(
      mrrInicial, 
      churnMensal, 
      retencaoVendas,
      metasMensaisModeloAtual,
      indicadoresPorBU.modeloAtual.ticketMedio,
      valorVenderInicial
    ),
    [metasMensaisModeloAtual]
  );

  // Calculate monthly values for other BUs
  const o2TaxMonthly = useMemo(() => 
    calculateMonthlyValuesSmooth(quarterlyTotalsOutrasBUs.o2Tax, 120000), 
    []
  );
  const oxyHackerMonthly = useMemo(() => 
    calculateFromUnits(oxyHackerUnits, 54000), 
    []
  );
  const franquiaMonthly = useMemo(() => 
    calculateFromUnits(franquiaUnits, 140000), 
    []
  );

  // Calculate funnel data for each BU
  const modeloAtualFunnel = useMemo(() => 
    calculateReverseFunnel(
      mrrDynamic.revenueToSell, 
      indicadoresPorBU.modeloAtual, 
      mrrDynamic.mrrPorMes, 
      metasMensaisModeloAtual,
      indicadoresPorBU.modeloAtual.cpv
    ),
    [mrrDynamic, metasMensaisModeloAtual]
  );
  
  const o2TaxFunnel = useMemo(() => 
    calculateReverseFunnel(o2TaxMonthly, indicadoresPorBU.o2Tax, null, null, indicadoresPorBU.o2Tax.cpv, 10000),
    [o2TaxMonthly]
  );
  
  const oxyHackerFunnel = useMemo(() => 
    calculateReverseFunnel(oxyHackerMonthly, indicadoresPorBU.oxyHacker, null, null, indicadoresPorBU.oxyHacker.cpv, 10000),
    [oxyHackerMonthly]
  );
  
  const franquiaFunnel = useMemo(() => 
    calculateReverseFunnel(franquiaMonthly, indicadoresPorBU.franquia, null, null, indicadoresPorBU.franquia.cpv, 10000),
    [franquiaMonthly]
  );

  // Publish data to context on mount (only if not already loaded)
  useEffect(() => {
    if (isLoaded) return; // Skip if MediaInvestmentTab already loaded the data
    
    setMetasPorBU({
      modelo_atual: Object.fromEntries(
        modeloAtualFunnel.map(d => [d.month, d.faturamentoMeta])
      ),
      o2_tax: Object.fromEntries(
        o2TaxFunnel.map(d => [d.month, d.faturamentoMeta])
      ),
      oxy_hacker: Object.fromEntries(
        oxyHackerFunnel.map(d => [d.month, d.faturamentoMeta])
      ),
      franquia: Object.fromEntries(
        franquiaFunnel.map(d => [d.month, d.faturamentoMeta])
      ),
    });
    
    setFunnelData({
      modeloAtual: modeloAtualFunnel.map(d => ({
        month: d.month,
        leads: Math.round(d.leads),
        mqls: Math.round(d.mqls),
        rms: Math.round(d.rms),
        rrs: Math.round(d.rrs),
        propostas: Math.round(d.propostas),
        vendas: Math.round(d.vendas),
        investimento: Math.round(d.investimento),
      })),
      o2Tax: o2TaxFunnel.map(d => ({
        month: d.month,
        leads: Math.round(d.leads),
        mqls: Math.round(d.mqls),
        rms: Math.round(d.rms),
        rrs: Math.round(d.rrs),
        propostas: Math.round(d.propostas),
        vendas: Math.round(d.vendas),
        investimento: Math.round(d.investimento),
      })),
      oxyHacker: oxyHackerFunnel.map(d => ({
        month: d.month,
        leads: Math.round(d.leads),
        mqls: Math.round(d.mqls),
        rms: Math.round(d.rms),
        rrs: Math.round(d.rrs),
        propostas: Math.round(d.propostas),
        vendas: Math.round(d.vendas),
        investimento: Math.round(d.investimento),
      })),
      franquia: franquiaFunnel.map(d => ({
        month: d.month,
        leads: Math.round(d.leads),
        mqls: Math.round(d.mqls),
        rms: Math.round(d.rms),
        rrs: Math.round(d.rrs),
        propostas: Math.round(d.propostas),
        vendas: Math.round(d.vendas),
        investimento: Math.round(d.investimento),
      })),
    });
  }, [modeloAtualFunnel, o2TaxFunnel, oxyHackerFunnel, franquiaFunnel, setMetasPorBU, setFunnelData, isLoaded]);

  return {
    modeloAtualFunnel,
    o2TaxFunnel,
    oxyHackerFunnel,
    franquiaFunnel,
  };
}
