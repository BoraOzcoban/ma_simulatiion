import { useMemo, useState } from 'react';
import { useAppStore } from '../store/AppStore';

const formatPrice = (value: number) =>
  new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);

export function PriceTicker() {
  const { state, dispatch } = useAppStore();
  const [manualPrice, setManualPrice] = useState('');

  const color = state.lastChangeAmount >= 0 ? 'text-emerald-500' : 'text-rose-500';

  const sparkline = useMemo(() => {
    const width = 280;
    const height = 64;
    const values = state.priceHistory;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const points = values
      .map((v, i) => {
        const x = (i / (values.length - 1 || 1)) * width;
        const y = height - ((v - min) / range) * (height - 8) - 4;
        return `${x},${y}`;
      })
      .join(' ');

    return { points, width, height };
  }, [state.priceHistory]);

  const setPrice = () => {
    const parsed = Number(manualPrice);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return;
    }
    dispatch({ type: 'SET_PRICE', price: parsed });
    setManualPrice('');
  };

  return (
    <section className="rounded-2xl bg-white p-5 shadow-panel dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Astorium</p>
          <h1 className="mt-2 text-4xl font-bold">{formatPrice(state.price)}</h1>
          <p className={`mt-2 text-sm font-medium ${color}`}>
            {state.lastChangeAmount >= 0 ? '+' : ''}
            {formatPrice(state.lastChangeAmount)} ({state.lastChangePct >= 0 ? '+' : ''}
            {state.lastChangePct.toFixed(2)}%)
          </p>
        </div>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_AUTO' })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          {state.autoPaused ? 'Otomatik Değişimleri Başlat' : 'Otomatik Değişimleri Durdur'}
        </button>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-800/70">
        <svg viewBox={`0 0 ${sparkline.width} ${sparkline.height}`} className="h-16 w-full">
          <polyline fill="none" stroke="currentColor" strokeWidth="2" points={sparkline.points} className={color} />
        </svg>
      </div>

      <div className="mt-4 flex gap-2">
        <input
          value={manualPrice}
          onChange={(e) => setManualPrice(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setPrice();
            }
          }}
          placeholder="Fiyat belirle"
          type="number"
          min="0"
          step="0.01"
          className="w-full rounded-lg border border-slate-300 bg-transparent px-2.5 py-1.5 text-sm outline-none ring-cyan-500 focus:ring dark:border-slate-700"
        />
        <button onClick={setPrice} className="rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-cyan-500">
          Fiyatı Ayarla
        </button>
      </div>
    </section>
  );
}
