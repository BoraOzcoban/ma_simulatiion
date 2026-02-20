import type { Scenario } from '../types';
import { useAppStore } from '../store/AppStore';

const fmtM = (value: number) =>
  value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

const fmtEps = (value: number) =>
  value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const scenarios: Scenario[] = ['Very Pessimistic', 'Pessimistic', 'Neutral', 'Optimistic', 'Very Optimistic'];

function StatementTable({
  title,
  rows,
  unit = 'Million USD'
}: {
  title: string;
  rows: Array<[string, number | string]>;
  unit?: string;
}) {
  return (
    <div className="h-full rounded-2xl border border-slate-200 bg-white p-4 shadow-panel dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold">{title}</h3>
        <span className="text-xs text-slate-500">{unit}</span>
      </div>
      <div className="max-h-[62vh] space-y-1 overflow-y-auto pr-1 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-md px-2 py-1 odd:bg-slate-50 dark:odd:bg-slate-800/60">
            <span>{label}</span>
            <span className="font-medium">{typeof value === 'number' ? fmtM(value) : value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FinancialStatements() {
  const { state, dispatch } = useAppStore();
  const { income, cashFlow, balance, periodLabel } = state.financials;

  const incomeRows: Array<[string, number | string]> = [
    ['Revenue (Net Satışlar)', income.revenue],
    ['COGS', income.cogs],
    ['Gross Profit', income.grossProfit],
    ['R&D', income.rd],
    ['Marketing & Sales', income.marketingSales],
    ['G&A', income.ga],
    ['D&A', income.da],
    ['Total OpEx', income.totalOpEx],
    ['EBIT', income.ebit],
    ['Interest Income', income.interestIncome],
    ['Interest Expense', income.interestExpense],
    ['EBT', income.ebt],
    ['Tax', income.tax],
    ['Net Income', income.netIncome],
    ['One-offs', income.oneOffs],
    ['EPS (USD)', fmtEps(income.eps)]
  ];

  const cashFlowRows: Array<[string, number | string]> = [
    ['Net Income', cashFlow.netIncome],
    ['D&A', cashFlow.da],
    ['Working Capital Change', cashFlow.workingCapitalChange],
    ['CFO', cashFlow.cfo],
    ['CapEx', cashFlow.capex],
    ['M&A', cashFlow.ma],
    ['CFI', cashFlow.cfi],
    ['Debt Issued/(Repaid)', cashFlow.debtIssuedRepaid],
    ['Share Buyback', cashFlow.shareBuyback],
    ['Dividends', cashFlow.dividends],
    ['CFF', cashFlow.cff],
    ['Net Change in Cash', cashFlow.netChangeInCash],
    ['Ending Cash', cashFlow.endingCash]
  ];

  const balanceRows: Array<[string, number | string]> = [
    ['Current Assets', balance.currentAssets],
    ['Cash & Equivalents', balance.cash],
    ['Accounts Receivable', balance.accountsReceivable],
    ['Inventory', balance.inventory],
    ['Non-current Assets', balance.nonCurrentAssets],
    ['Net PP&E', balance.netPpe],
    ['Investments (Financial Assets)', balance.investments],
    ['Other Non-current Assets', balance.otherNonCurrentAssets],
    ['Total Assets', balance.totalAssets],
    ['Current Liabilities', balance.currentLiabilities],
    ['Accounts Payable', balance.accountsPayable],
    ['Short-term Debt', balance.shortTermDebt],
    ['Long-term Liabilities', balance.longTermLiabilities],
    ['Bonds/Loans', balance.bondsLoans],
    ['Other LT Liabilities', balance.otherLongTermLiabilities],
    ['Total Liabilities', balance.totalLiabilities],
    ['Equity', balance.equity],
    ['Paid-in Capital', balance.paidInCapital],
    ['Retained Earnings', balance.retainedEarnings],
    ['Total Liabilities + Equity', balance.totalLiabilitiesAndEquity]
  ];

  return (
    <aside className="space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow-panel dark:bg-slate-900">
        <h2 className="text-lg font-semibold">Financial Statements</h2>
        <p className="text-xs text-slate-500">{periodLabel}</p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select
            value={state.scenario}
            onChange={(e) => dispatch({ type: 'SET_SCENARIO', scenario: e.target.value as Scenario })}
            className="rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm dark:border-slate-700"
          >
            {scenarios.map((scenario) => (
              <option key={scenario} value={scenario}>
                {scenario}
              </option>
            ))}
          </select>
          <button
            onClick={() => dispatch({ type: 'SIMULATE_FINANCIALS' })}
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500"
          >
            Simulate Quarter / Update Financials
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <StatementTable title="Income Statement" rows={incomeRows} />
        <StatementTable title="Cash Flow Statement" rows={cashFlowRows} />
        <StatementTable title="Balance Sheet" rows={balanceRows} />
      </div>
    </aside>
  );
}
