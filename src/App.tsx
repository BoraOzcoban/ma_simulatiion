import { useEffect } from 'react';
import { FinancialStatements } from './components/FinancialStatements';
import { HeaderOwnershipMini } from './components/HeaderOwnershipMini';
import { NewsPanel } from './components/NewsPanel';
import { OrderBook } from './components/OrderBook';
import { PriceTicker } from './components/PriceTicker';
import { ValuationPanel } from './components/ValuationPanel';
import { sampleTruncatedNormal } from './lib/random';
import { useAppStore } from './store/AppStore';

function App() {
  const { state, dispatch } = useAppStore();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', state.darkMode);
  }, [state.darkMode]);

  useEffect(() => {
    if (state.autoPaused) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      const pctMove = sampleTruncatedNormal(0, 1.2, -5, 5);
      const nextPrice = state.price * (1 + pctMove / 100);
      dispatch({ type: 'SET_PRICE', price: nextPrice });
    }, 30000);

    return () => window.clearInterval(interval);
  }, [state.autoPaused, state.price, dispatch]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-cyan-50 to-indigo-100 px-4 py-4 text-slate-900 transition-colors dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 dark:text-slate-100">
      <div className="mx-auto mb-4 max-w-[1800px] rounded-2xl bg-white/70 px-4 py-3 shadow-panel backdrop-blur dark:bg-slate-900/80">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">M&A Simulation</p>
            <h1 className="text-xl font-bold">Astorium Financial Dashboard</h1>
          </div>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_THEME' })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            {state.darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
        <div className="mt-2">
          <HeaderOwnershipMini />
        </div>
      </div>

      <div className="mx-auto grid max-w-[1900px] grid-cols-1 gap-4 xl:grid-cols-[260px_0.9fr_1.3fr]">
        <NewsPanel />

        <main className="space-y-4">
          <PriceTicker />
          <OrderBook />
          <ValuationPanel />
        </main>

        <FinancialStatements />
      </div>

      <div className="mx-auto mt-4 flex max-w-[1900px] justify-end">
        <button
          onClick={() => dispatch({ type: 'RESET_STATE' })}
          className="rounded-lg border border-rose-300 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/40"
        >
          Reset Values
        </button>
      </div>
    </div>
  );
}

export default App;
