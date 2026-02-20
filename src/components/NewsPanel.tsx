import { useState } from 'react';
import { useAppStore } from '../store/AppStore';

export function NewsPanel() {
  const { state, dispatch } = useAppStore();
  const [headline, setHeadline] = useState('');

  const addHeadline = () => {
    if (!headline.trim()) {
      return;
    }
    dispatch({ type: 'ADD_NEWS', headline });
    setHeadline('');
  };

  return (
    <aside className="rounded-2xl bg-white p-4 shadow-panel dark:bg-slate-900">
      <h2 className="text-lg font-semibold">Haberler</h2>
      <div className="mt-3 flex gap-2">
        <input
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              addHeadline();
            }
          }}
          placeholder="Haber başlığı ekle"
          className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm outline-none ring-cyan-500 focus:ring dark:border-slate-700"
        />
        <button
          onClick={addHeadline}
          className="rounded-lg bg-cyan-600 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-500"
        >
          Ekle
        </button>
      </div>
      <ul className="mt-4 max-h-[70vh] space-y-2 overflow-y-auto pr-2">
        {state.news.map((item, idx) => (
          <li
            key={`${item}-${idx}`}
            className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-800/70"
          >
            {item}
          </li>
        ))}
      </ul>
    </aside>
  );
}
