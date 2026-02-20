export type Side = 'bid' | 'ask';

export type Scenario =
  | 'Very Pessimistic'
  | 'Pessimistic'
  | 'Neutral'
  | 'Optimistic'
  | 'Very Optimistic';

export interface Order {
  side: Side;
  price: number;
  lots: number;
  bidderId?: string;
}

export interface OrderLevel {
  price: number;
  lots: number;
}

export interface IncomeStatement {
  revenue: number;
  cogs: number;
  grossProfit: number;
  rd: number;
  marketingSales: number;
  ga: number;
  da: number;
  totalOpEx: number;
  ebit: number;
  interestIncome: number;
  interestExpense: number;
  ebt: number;
  tax: number;
  netIncome: number;
  oneOffs: number;
  eps: number;
}

export interface CashFlowStatement {
  netIncome: number;
  da: number;
  workingCapitalChange: number;
  cfo: number;
  capex: number;
  ma: number;
  cfi: number;
  debtIssuedRepaid: number;
  shareBuyback: number;
  dividends: number;
  cff: number;
  netChangeInCash: number;
  endingCash: number;
}

export interface BalanceSheet {
  cash: number;
  accountsReceivable: number;
  inventory: number;
  currentAssets: number;
  netPpe: number;
  investments: number;
  otherNonCurrentAssets: number;
  nonCurrentAssets: number;
  totalAssets: number;
  accountsPayable: number;
  shortTermDebt: number;
  currentLiabilities: number;
  bondsLoans: number;
  otherLongTermLiabilities: number;
  longTermLiabilities: number;
  totalLiabilities: number;
  paidInCapital: number;
  retainedEarnings: number;
  equity: number;
  totalLiabilitiesAndEquity: number;
}

export interface Financials {
  income: IncomeStatement;
  cashFlow: CashFlowStatement;
  balance: BalanceSheet;
  periodLabel: string;
}

export interface ValuationMetrics {
  marketCap: number;
  bookValuePerShare: number;
  pb: number;
  ps: number;
  pe: number | null;
  netDebtOrCash: number;
}

export interface ShareholderStake {
  id: string;
  name: string;
  shares: number;
  cashUsd: number;
}

export interface AppState {
  price: number;
  lastChangePct: number;
  lastChangeAmount: number;
  priceHistory: number[];
  autoPaused: boolean;
  news: string[];
  orderBook: {
    bids: OrderLevel[];
    asks: OrderLevel[];
  };
  manualOrders: Order[];
  scenario: Scenario;
  financials: Financials;
  ownership: ShareholderStake[];
  darkMode: boolean;
}
