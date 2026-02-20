import { useEffect } from 'react';
import { FinancialStatements } from './components/FinancialStatements';
import { HeaderOwnershipMini } from './components/HeaderOwnershipMini';
import { NewsPanel } from './components/NewsPanel';
import { OrderBook } from './components/OrderBook';
import { PriceTicker } from './components/PriceTicker';
import { ValuationPanel } from './components/ValuationPanel';
import { sampleTriangular, sampleTruncatedNormal } from './lib/random';
import { useAppStore } from './store/AppStore';

const macroNewsPool = [
  'Euro Bölgesi hizmet PMI verisi beklentilere yakın açıklandı.',
  "Türkiye'de tüketici güven endeksi sınırlı toparlanma gösterdi.",
  'ABD 10 yıllık tahvil getirileri gün içinde dar bantta seyretti.',
  'Petrol fiyatları düşük hacimle yatay kapanışa yöneldi.',
  'Altın fiyatlarında küresel risk iştahına bağlı hafif geri çekilme izlendi.',
  "Türkiye'de kapasite kullanım oranı geçen aya göre sınırlı değişti.",
  'Asya piyasalarında teknoloji hisseleri karışık görünüm sergiledi.',
  'Avrupa borsalarında banka hisselerinde hafif pozitif ayrışma görüldü.',
  "TCMB haftalık verilerinde rezervlerde sınırlı artış kaydedildi.",
  "Türkiye'nin 5 yıllık CDS primi dar bir aralıkta dalgalandı.",
  'Küresel navlun endeksleri haftalık bazda hafif geriledi.',
  'ABD haftalık işsizlik başvuruları piyasa tahminlerine yakın geldi.',
  'Gelişmekte olan ülke para birimleri dolar karşısında karışık kapattı.',
  'Türkiye iç borçlanma ihalesinde talep dengeli gerçekleşti.',
  'Küresel imalat siparişlerinde ivme kaybı sinyalleri sınırlı kaldı.',
  'Doğal gaz fiyatları mevsim normalleri etkisiyle sakin seyretti.'
];

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

  useEffect(() => {
    let timeoutId: number | undefined;

    const scheduleMacroNews = () => {
      const delayMs = Math.round(sampleTriangular(60_000, 120_000, 240_000));
      timeoutId = window.setTimeout(() => {
        const index = Math.floor(Math.random() * macroNewsPool.length);
        dispatch({ type: 'ADD_NEWS', headline: macroNewsPool[index] });
        scheduleMacroNews();
      }, delayMs);
    };

    scheduleMacroNews();

    return () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-cyan-50 to-indigo-100 px-4 py-4 text-slate-900 transition-colors dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 dark:text-slate-100">
      <div className="mx-auto mb-4 max-w-[1800px] rounded-2xl bg-white/70 px-4 py-3 shadow-panel backdrop-blur dark:bg-slate-900/80">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">M&A Simulasyonu</p>
            <h1 className="text-xl font-bold">Astorium Finansal Gösterge Paneli</h1>
          </div>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_THEME' })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            {state.darkMode ? 'Açık Tema' : 'Koyu Tema'}
          </button>
        </div>
        <div className="mt-2">
          <HeaderOwnershipMini />
        </div>
      </div>

      <ValuationPanel compact />

      <div className="mx-auto grid max-w-[1900px] grid-cols-1 gap-4 xl:grid-cols-[260px_0.9fr_1.3fr]">
        <NewsPanel />

        <main className="space-y-4">
          <PriceTicker />
          <OrderBook />
        </main>

        <FinancialStatements />
      </div>

      <div className="mx-auto mt-4 flex max-w-[1900px] justify-end">
        <button
          onClick={() => dispatch({ type: 'RESET_STATE' })}
          className="rounded-lg border border-rose-300 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/40"
        >
          Değerleri Sıfırla
        </button>
      </div>
    </div>
  );
}

export default App;
