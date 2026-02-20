import type { Scenario } from '../types';
import { useAppStore } from '../store/AppStore';

const fmtM = (value: number) =>
  value.toLocaleString('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

const fmtEps = (value: number) =>
  value.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const scenarios: Scenario[] = ['Very Pessimistic', 'Pessimistic', 'Neutral', 'Optimistic', 'Very Optimistic'];
const scenarioLabels: Record<Scenario, string> = {
  'Very Pessimistic': 'Çok Kötümser',
  Pessimistic: 'Kötümser',
  Neutral: 'Nötr',
  Optimistic: 'İyimser',
  'Very Optimistic': 'Çok İyimser'
};

function StatementTable({
  title,
  rows,
  unit = 'Milyon USD'
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
    ['Gelir (Net Satışlar)', income.revenue],
    ['Satışların Maliyeti', income.cogs],
    ['Brüt Kar', income.grossProfit],
    ['Ar-Ge', income.rd],
    ['Pazarlama ve Satış', income.marketingSales],
    ['Genel Yönetim', income.ga],
    ['Amortisman', income.da],
    ['Toplam Faaliyet Gideri', income.totalOpEx],
    ['EBIT', income.ebit],
    ['Faiz Geliri', income.interestIncome],
    ['Faiz Gideri', income.interestExpense],
    ['EBT', income.ebt],
    ['Vergi', income.tax],
    ['Net Kar', income.netIncome],
    ['Tek Seferlik Kalemler', income.oneOffs],
    ['Hisse Başına Kar (USD)', fmtEps(income.eps)]
  ];

  const cashFlowRows: Array<[string, number | string]> = [
    ['Net Kar', cashFlow.netIncome],
    ['Amortisman', cashFlow.da],
    ['İşletme Sermayesi Değişimi', cashFlow.workingCapitalChange],
    ['CFO', cashFlow.cfo],
    ['Yatırım Harcaması', cashFlow.capex],
    ['M&A', cashFlow.ma],
    ['CFI', cashFlow.cfi],
    ['Borçlanma/(Geri Ödeme)', cashFlow.debtIssuedRepaid],
    ['Hisse Geri Alımı', cashFlow.shareBuyback],
    ['Temettü', cashFlow.dividends],
    ['CFF', cashFlow.cff],
    ['Nakitte Net Değişim', cashFlow.netChangeInCash],
    ['Dönem Sonu Nakit', cashFlow.endingCash]
  ];

  const balanceRows: Array<[string, number | string]> = [
    ['Dönen Varlıklar', balance.currentAssets],
    ['Nakit ve Benzerleri', balance.cash],
    ['Ticari Alacaklar', balance.accountsReceivable],
    ['Stoklar', balance.inventory],
    ['Duran Varlıklar', balance.nonCurrentAssets],
    ['Net Maddi Duran Varlıklar', balance.netPpe],
    ['Yatırımlar (Finansal Varlıklar)', balance.investments],
    ['Diğer Duran Varlıklar', balance.otherNonCurrentAssets],
    ['Toplam Varlıklar', balance.totalAssets],
    ['Kısa Vadeli Yükümlülükler', balance.currentLiabilities],
    ['Ticari Borçlar', balance.accountsPayable],
    ['Kısa Vadeli Borç', balance.shortTermDebt],
    ['Uzun Vadeli Yükümlülükler', balance.longTermLiabilities],
    ['Tahvil/Krediler', balance.bondsLoans],
    ['Diğer UV Yükümlülükler', balance.otherLongTermLiabilities],
    ['Toplam Yükümlülükler', balance.totalLiabilities],
    ['Özkaynak', balance.equity],
    ['Ödenmiş Sermaye', balance.paidInCapital],
    ['Geçmiş Yıl Karları', balance.retainedEarnings],
    ['Toplam Yükümlülük + Özkaynak', balance.totalLiabilitiesAndEquity]
  ];

  return (
    <aside className="space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow-panel dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Finansal Tablolar</h2>
            <p className="text-xs text-slate-500">{periodLabel}</p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <select
              value={state.scenario}
              onChange={(e) => dispatch({ type: 'SET_SCENARIO', scenario: e.target.value as Scenario })}
              className="rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm dark:border-slate-700"
            >
              {scenarios.map((scenario) => (
                <option key={scenario} value={scenario}>
                  {scenarioLabels[scenario]}
                </option>
              ))}
            </select>
            <button
              onClick={() => dispatch({ type: 'SIMULATE_FINANCIALS' })}
              className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500"
            >
              Çeyrek Simüle Et / Finansalları Güncelle
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <StatementTable title="Gelir Tablosu" rows={incomeRows} />
        <StatementTable title="Nakit Akış Tablosu" rows={cashFlowRows} />
        <StatementTable title="Bilanço" rows={balanceRows} />
      </div>
    </aside>
  );
}
