import type {
  BalanceSheet,
  CashFlowStatement,
  Financials,
  IncomeStatement,
  Scenario,
  ValuationMetrics
} from '../types';
import { randomBetween, sampleTriangular } from './random';

const SHARES_OUTSTANDING = 1_000_000_000;

const round2 = (value: number) => Math.round(value * 100) / 100;

function recomputeIncome(base: Omit<IncomeStatement, 'grossProfit' | 'totalOpEx' | 'ebit' | 'ebt' | 'tax' | 'netIncome' | 'eps'>): IncomeStatement {
  const grossProfit = round2(base.revenue + base.cogs);
  const totalOpEx = round2(base.rd + base.marketingSales + base.ga + base.da);
  const ebit = round2(grossProfit + totalOpEx);
  const ebt = round2(ebit + base.interestIncome + base.interestExpense);
  const tax = ebt > 0 ? round2(-0.15 * ebt) : 0;
  const netIncome = round2(ebt + tax);
  const eps = round2(netIncome / 1000);

  return {
    ...base,
    grossProfit,
    totalOpEx,
    ebit,
    ebt,
    tax,
    netIncome,
    eps
  };
}

function recomputeCashFlow(
  base: Omit<CashFlowStatement, 'cfo' | 'cfi' | 'cff' | 'netChangeInCash'>
): CashFlowStatement {
  const cfo = round2(base.netIncome + base.da + base.workingCapitalChange);
  const cfi = round2(base.capex + base.ma);
  const cff = round2(base.debtIssuedRepaid + base.shareBuyback + base.dividends);
  const netChangeInCash = round2(cfo + cfi + cff);

  return {
    ...base,
    cfo,
    cfi,
    cff,
    netChangeInCash
  };
}

function recomputeBalance(
  base: Omit<BalanceSheet, 'currentAssets' | 'nonCurrentAssets' | 'totalAssets' | 'currentLiabilities' | 'longTermLiabilities' | 'totalLiabilities' | 'equity' | 'totalLiabilitiesAndEquity'>
): BalanceSheet {
  const currentAssets = round2(base.cash + base.accountsReceivable + base.inventory);
  const nonCurrentAssets = round2(base.netPpe + base.investments + base.otherNonCurrentAssets);
  const totalAssets = round2(currentAssets + nonCurrentAssets);

  const currentLiabilities = round2(base.accountsPayable + base.shortTermDebt);
  const longTermLiabilities = round2(base.bondsLoans + base.otherLongTermLiabilities);
  const totalLiabilities = round2(currentLiabilities + longTermLiabilities);

  const equity = round2(base.paidInCapital + base.retainedEarnings);
  const totalLiabilitiesAndEquity = round2(totalLiabilities + equity);

  return {
    ...base,
    currentAssets,
    nonCurrentAssets,
    totalAssets,
    currentLiabilities,
    longTermLiabilities,
    totalLiabilities,
    equity,
    totalLiabilitiesAndEquity
  };
}

function forceBalance(balanceInput: Omit<BalanceSheet, 'currentAssets' | 'nonCurrentAssets' | 'totalAssets' | 'currentLiabilities' | 'longTermLiabilities' | 'totalLiabilities' | 'equity' | 'totalLiabilitiesAndEquity'>): BalanceSheet {
  const preBalance = recomputeBalance(balanceInput);
  const delta = round2(preBalance.totalLiabilitiesAndEquity - preBalance.totalAssets);

  return recomputeBalance({
    ...balanceInput,
    investments: round2(balanceInput.investments + delta)
  });
}

export function createBaselineFinancials(): Financials {
  const income = recomputeIncome({
    revenue: 7200,
    cogs: -4900,
    rd: -800,
    marketingSales: -680,
    ga: -770,
    da: -380,
    interestIncome: 40,
    interestExpense: -520,
    oneOffs: -200
  });

  const cashFlow = recomputeCashFlow({
    netIncome: income.netIncome,
    da: 380,
    workingCapitalChange: 200,
    capex: -600,
    ma: -100,
    debtIssuedRepaid: 800,
    shareBuyback: 0,
    dividends: -50,
    endingCash: -435
  });

  const balance = forceBalance({
    cash: 400,
    accountsReceivable: 1100,
    inventory: 1700,
    netPpe: 3800,
    investments: 2500,
    otherNonCurrentAssets: 2500,
    accountsPayable: 1600,
    shortTermDebt: 2600,
    bondsLoans: 4000,
    otherLongTermLiabilities: 1400,
    paidInCapital: 3000,
    retainedEarnings: -600
  });

  return {
    income,
    cashFlow,
    balance,
    periodLabel: '2025 Baz Dönem'
  };
}

export function calculateValuation(price: number, financials: Financials): ValuationMetrics {
  const marketCap = price * SHARES_OUTSTANDING;
  const bookValuePerShare = (financials.balance.equity * 1_000_000) / SHARES_OUTSTANDING;
  const pb = bookValuePerShare !== 0 ? price / bookValuePerShare : 0;
  const ps = marketCap / (financials.income.revenue * 1_000_000);
  const pe = financials.income.eps > 0 ? price / financials.income.eps : null;

  const totalDebt = financials.balance.shortTermDebt + financials.balance.bondsLoans;
  const netDebtOrCash = totalDebt - financials.balance.cash;

  return {
    marketCap,
    bookValuePerShare,
    pb,
    ps,
    pe,
    netDebtOrCash
  };
}

function scenarioShift(scenario: Scenario): number {
  switch (scenario) {
    case 'Very Pessimistic':
      return -2;
    case 'Pessimistic':
      return -1;
    case 'Neutral':
      return 0;
    case 'Optimistic':
      return 1;
    case 'Very Optimistic':
      return 2;
    default:
      return 0;
  }
}

export function simulateQuarter(current: Financials, scenario: Scenario): Financials {
  const shift = scenarioShift(scenario);
  const shiftPct = shift * 0.01;

  const revenueGrowth = sampleTriangular(-0.04 + shiftPct, 0.005 + shiftPct, 0.05 + shiftPct);
  const revenue = round2(Math.max(3000, current.income.revenue * (1 + revenueGrowth)));

  const prevCogsRatio = Math.abs(current.income.cogs) / current.income.revenue;
  const cogsRatio = Math.min(0.9, Math.max(0.55, prevCogsRatio - shift * 0.01 + randomBetween(-0.01, 0.01)));
  const cogs = round2(-revenue * cogsRatio);

  const rdRatio = Math.max(0.06, Math.min(0.2, Math.abs(current.income.rd) / current.income.revenue - shift * 0.004));
  const mktRatio = Math.max(0.05, Math.min(0.16, Math.abs(current.income.marketingSales) / current.income.revenue - shift * 0.003));
  const gaRatio = Math.max(0.05, Math.min(0.15, Math.abs(current.income.ga) / current.income.revenue - shift * 0.002));

  const rd = round2(-revenue * rdRatio);
  const marketingSales = round2(-revenue * mktRatio);
  const ga = round2(-revenue * gaRatio);
  const da = round2(-Math.max(250, Math.abs(current.income.da) * (1 + randomBetween(-0.03, 0.04))));

  const interestIncome = round2(Math.max(0, current.income.interestIncome * (1 + shift * 0.05 + randomBetween(-0.06, 0.06))));
  const interestExpense = round2(-Math.max(120, Math.abs(current.income.interestExpense) * (1 - shift * 0.05 + randomBetween(-0.05, 0.08))));
  const oneOffs = round2(current.income.oneOffs + randomBetween(-80, 80));

  const income = recomputeIncome({
    revenue,
    cogs,
    rd,
    marketingSales,
    ga,
    da,
    interestIncome,
    interestExpense,
    oneOffs
  });

  const workingCapitalChange = round2(current.cashFlow.workingCapitalChange + randomBetween(-120, 120) + shift * 25);
  const capex = round2(current.cashFlow.capex * (1 + randomBetween(-0.12, 0.12) + shift * 0.03));
  const ma = round2(current.cashFlow.ma + randomBetween(-70, 70) + shift * 15);
  const debtIssuedRepaid = round2(current.cashFlow.debtIssuedRepaid + randomBetween(-180, 180) - shift * 90);
  const shareBuyback = round2(Math.min(0, current.cashFlow.shareBuyback - Math.max(0, shift) * randomBetween(10, 65)));
  const dividends = round2(current.cashFlow.dividends - Math.max(0, shift) * randomBetween(2, 15));

  const prevEndingCash = current.cashFlow.endingCash;
  const cashFlow = recomputeCashFlow({
    netIncome: income.netIncome,
    da: Math.abs(income.da),
    workingCapitalChange,
    capex,
    ma,
    debtIssuedRepaid,
    shareBuyback,
    dividends,
    endingCash: 0
  });

  cashFlow.endingCash = round2(prevEndingCash + cashFlow.netChangeInCash);

  const retainedEarnings = round2(current.balance.retainedEarnings + income.netIncome);

  const accountsReceivable = round2(
    Math.max(300, current.balance.accountsReceivable * (1 + revenueGrowth * 0.7 + randomBetween(-0.02, 0.02)))
  );
  const inventory = round2(
    Math.max(400, current.balance.inventory * (1 + revenueGrowth * 0.5 + randomBetween(-0.03, 0.03)))
  );

  const capexAbs = Math.abs(capex);
  const netPpe = round2(Math.max(1200, current.balance.netPpe + capexAbs * 0.55 - Math.abs(income.da) * 0.9));

  const debtDelta = debtIssuedRepaid;
  const shortTermDebt = round2(Math.max(200, current.balance.shortTermDebt + debtDelta * 0.35));
  const bondsLoans = round2(Math.max(500, current.balance.bondsLoans + debtDelta * 0.65));

  const accountsPayable = round2(
    Math.max(300, current.balance.accountsPayable * (1 + (Math.abs(cogs) / Math.abs(current.income.cogs) - 1) * 0.5))
  );

  const baseBalance = {
    cash: cashFlow.endingCash,
    accountsReceivable,
    inventory,
    netPpe,
    investments: current.balance.investments,
    otherNonCurrentAssets: current.balance.otherNonCurrentAssets,
    accountsPayable,
    shortTermDebt,
    bondsLoans,
    otherLongTermLiabilities: current.balance.otherLongTermLiabilities,
    paidInCapital: current.balance.paidInCapital,
    retainedEarnings
  };

  const balance = forceBalance(baseBalance);

  return {
    income,
    cashFlow,
    balance,
    periodLabel: 'Güncel (Simüle)'
  };
}

export function getSharesOutstanding(): number {
  return SHARES_OUTSTANDING;
}

export function statementConsistencyDelta(financials: Financials) {
  const income = financials.income;
  const cashFlow = financials.cashFlow;
  const balance = financials.balance;

  return {
    grossProfitDelta: round2(income.grossProfit - (income.revenue + income.cogs)),
    totalOpExDelta: round2(income.totalOpEx - (income.rd + income.marketingSales + income.ga + income.da)),
    ebitDelta: round2(income.ebit - (income.grossProfit + income.totalOpEx)),
    ebtDelta: round2(income.ebt - (income.ebit + income.interestIncome + income.interestExpense)),
    netIncomeDelta: round2(income.netIncome - (income.ebt + income.tax)),
    cfoDelta: round2(cashFlow.cfo - (cashFlow.netIncome + cashFlow.da + cashFlow.workingCapitalChange)),
    cfiDelta: round2(cashFlow.cfi - (cashFlow.capex + cashFlow.ma)),
    cffDelta: round2(cashFlow.cff - (cashFlow.debtIssuedRepaid + cashFlow.shareBuyback + cashFlow.dividends)),
    cashDelta: round2(cashFlow.netChangeInCash - (cashFlow.cfo + cashFlow.cfi + cashFlow.cff)),
    balanceDelta: round2(balance.totalAssets - balance.totalLiabilitiesAndEquity)
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function estimatePriceMovePct(prev: Financials, next: Financials, scenario: Scenario): number {
  const scenarioBase: Record<Scenario, number> = {
    'Very Pessimistic': -8,
    Pessimistic: -4,
    Neutral: 0,
    Optimistic: 4,
    'Very Optimistic': 8
  };

  const ranges: Record<Scenario, { min: number; max: number }> = {
    'Very Pessimistic': { min: -22, max: -6 },
    Pessimistic: { min: -12, max: -2 },
    Neutral: { min: -6, max: 6 },
    Optimistic: { min: 2, max: 12 },
    'Very Optimistic': { min: 6, max: 22 }
  };

  const prevRevenue = Math.max(1, prev.income.revenue);
  const nextRevenue = Math.max(1, next.income.revenue);

  const revGrowth = (nextRevenue - prevRevenue) / prevRevenue;
  const prevEbitMargin = prev.income.ebit / prevRevenue;
  const nextEbitMargin = next.income.ebit / nextRevenue;
  const ebitMarginChange = nextEbitMargin - prevEbitMargin;

  const netIncomeDeltaPct =
    (next.income.netIncome - prev.income.netIncome) / Math.max(300, Math.abs(prev.income.netIncome));
  const cashDeltaScaled = (next.cashFlow.endingCash - prev.cashFlow.endingCash) / 2000;
  const prevDebt = prev.balance.shortTermDebt + prev.balance.bondsLoans;
  const nextDebt = next.balance.shortTermDebt + next.balance.bondsLoans;
  const debtDeltaScaled = (nextDebt - prevDebt) / 5000;
  const epsDelta = next.income.eps - prev.income.eps;

  const fundamentalScore =
    revGrowth * 120 +
    ebitMarginChange * 180 +
    netIncomeDeltaPct * 35 +
    cashDeltaScaled * 12 +
    epsDelta * 8 -
    debtDeltaScaled * 10;

  const noise = sampleTriangular(-1.5, 0, 1.5);
  const rawMove = scenarioBase[scenario] + fundamentalScore + noise;
  const { min, max } = ranges[scenario];

  return round2(clamp(rawMove, min, max));
}
