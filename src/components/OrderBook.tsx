import { useState } from 'react';
import type { Side } from '../types';
import { useAppStore } from '../store/AppStore';

const fmt = (value: number) => value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function OrderBook() {
  const { state, dispatch } = useAppStore();
  const [side, setSide] = useState<Side>('bid');
  const [price, setPrice] = useState('');
  const [lots, setLots] = useState('25000');
  const [bidderId, setBidderId] = useState('aktivist-fon');

  const addOrder = () => {
    const parsedPrice = Number(price);
    const parsedLots = Number(lots);

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0 || !Number.isFinite(parsedLots) || parsedLots <= 0) {
      return;
    }

    dispatch({
      type: 'ADD_ORDER',
      order: {
        side,
        price: parsedPrice,
        lots: parsedLots,
        bidderId: side === 'bid' ? bidderId : undefined
      }
    });

    setPrice('');
    setLots('25000');
  };

  return (
    <section className="rounded-2xl bg-white p-5 shadow-panel dark:bg-slate-900">
      <h3 className="text-xl font-semibold">Emir Defteri</h3>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="mb-2 font-medium text-emerald-500">Alışlar</p>
          <div className="rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-2 border-b border-slate-200 px-3 py-2 text-xs uppercase text-slate-500 dark:border-slate-700">
              <span>Price</span>
              <span className="text-right">Lot</span>
            </div>
            <ul className="max-h-64 overflow-y-auto">
              {state.orderBook.bids.map((b) => (
                <li key={`bid-${b.price}`} className="grid grid-cols-2 px-3 py-2 odd:bg-slate-50 dark:odd:bg-slate-800/50">
                  <span>{fmt(b.price)}</span>
                  <span className="text-right">{b.lots.toLocaleString('tr-TR')}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <p className="mb-2 font-medium text-rose-500">Satışlar</p>
          <div className="rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-2 border-b border-slate-200 px-3 py-2 text-xs uppercase text-slate-500 dark:border-slate-700">
              <span>Price</span>
              <span className="text-right">Lot</span>
            </div>
            <ul className="max-h-64 overflow-y-auto">
              {state.orderBook.asks.map((a) => (
                <li key={`ask-${a.price}`} className="grid grid-cols-2 px-3 py-2 odd:bg-slate-50 dark:odd:bg-slate-800/50">
                  <span>{fmt(a.price)}</span>
                  <span className="text-right">{a.lots.toLocaleString('tr-TR')}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-5">
        <select
          value={side}
          onChange={(e) => setSide(e.target.value as Side)}
          className="rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm dark:border-slate-700"
        >
          <option value="bid">Alış</option>
          <option value="ask">Satış</option>
        </select>
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Fiyat"
          type="number"
          step="0.01"
          className="rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm dark:border-slate-700"
        />
        <input
          value={lots}
          onChange={(e) => setLots(e.target.value)}
          placeholder="Lot"
          type="number"
          step="1"
          className="rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm dark:border-slate-700"
        />
        <select
          value={bidderId}
          onChange={(e) => setBidderId(e.target.value)}
          disabled={side !== 'bid'}
          className="rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700"
        >
          {state.ownership.map((holder) => (
            <option key={holder.id} value={holder.id}>
              {holder.name}
            </option>
          ))}
        </select>
        <button onClick={addOrder} className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 dark:bg-cyan-600 dark:hover:bg-cyan-500">
          Emir Ekle
        </button>
      </div>
    </section>
  );
}
