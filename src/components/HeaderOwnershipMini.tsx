import { useAppStore } from '../store/AppStore';

const shortNames: Record<string, string> = {
  retail: 'Retail',
  'aktivist-fon': 'C Bank',
  'harvard-endowment': 'Harvard',
  'turkiye-varlik-fonu': 'TR VF',
  'katar-varlik-fonu': 'Qatar VF',
  'norvec-varlik-fonu': 'Norway VF',
  'astorium-yonetim-kurulu': 'Astorium',
  'titan-capital': 'Titan',
  'aurora-group': 'Aurora'
};

const holdingsLabelIds = new Set([
  'harvard-endowment',
  'turkiye-varlik-fonu',
  'katar-varlik-fonu',
  'norvec-varlik-fonu'
]);

const fmtCashCompact = (value: number) =>
  new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2
  }).format(value);

export function HeaderOwnershipMini() {
  const { state, dispatch } = useAppStore();

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {state.ownership.map((holder) => (
        <div
          key={holder.id}
          className="shrink-0 rounded-md border border-slate-200 bg-white/80 px-2 py-1 text-[11px] dark:border-slate-700 dark:bg-slate-900/70"
        >
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-300">{shortNames[holder.id] ?? holder.name}</span>
            <input
              type="number"
              min={0}
              step={0.01}
              value={holder.shares}
              onChange={(e) => {
                const parsed = Number(e.target.value);
                dispatch({
                  type: 'SET_OWNERSHIP_SHARES',
                  id: holder.id,
                  shares: Number.isFinite(parsed) ? parsed : 0
                });
              }}
              className="w-14 rounded border border-slate-300 bg-transparent px-1.5 py-0.5 text-right text-[11px] outline-none ring-cyan-500 focus:ring dark:border-slate-700"
            />
            <span className="text-slate-400">%</span>
          </div>
          <p className="mt-1 text-[10px] text-slate-400">
            {holdingsLabelIds.has(holder.id) ? 'Holdings' : 'Cash'}: ${fmtCashCompact(holder.cashUsd)}
          </p>
        </div>
      ))}
    </div>
  );
}
