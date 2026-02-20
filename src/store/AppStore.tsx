import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import type { AppState, Order, OrderLevel, Scenario, ShareholderStake } from '../types';
import { createBaselineFinancials, estimatePriceMovePct, getSharesOutstanding, simulateQuarter } from '../lib/finance';

const seedNews = [
  'Astorium yönetimi stratejik birleşme alternatiflerini değerlendiriyor.',
  'Aktivist yatırımcılar daha sıkı nakit disiplini talep ediyor.',
  'Sektör şirketleri kurumsal donanım talebinde karışık seyir bildiriyor.',
  'Kredi derecelendirme kuruluşu Astorium borcunu negatif izlemeye aldı.',
  'İki özel sermaye konsorsiyumunun teklif hazırlığında olduğu konuşuluyor.'
];

const round2 = (value: number) => Math.round(value * 100) / 100;
const round4 = (value: number) => Math.round(value * 10_000) / 10_000;
const LOT_SIZE_SHARES = 100;
const ORDERBOOK_DEPTH = 20;
const ORDERBOOK_RENDER_DEPTH = 24;
const MIN_LEVEL_LOTS = 20_000;
const MAX_LEVEL_LOTS = 260_000;
const APP_STATE_STORAGE_KEY = 'ma-stock-dashboard.app-state.v1';

function generateBaseOrderBook(mid: number): { bids: OrderLevel[]; asks: OrderLevel[] } {
  const step = Math.random() > 0.5 ? 0.05 : 0.1;
  const bids: OrderLevel[] = [];
  const asks: OrderLevel[] = [];

  for (let i = 1; i <= ORDERBOOK_DEPTH; i += 1) {
    const depthFactor = 1 - (i - 1) / ORDERBOOK_DEPTH;
    const baseLots =
      MIN_LEVEL_LOTS + Math.floor((MAX_LEVEL_LOTS - MIN_LEVEL_LOTS) * (0.35 + 0.65 * depthFactor) * Math.random());

    bids.push({
      price: round2(Math.max(0.01, mid - step * i)),
      lots: baseLots
    });
    asks.push({
      price: round2(mid + step * i),
      lots: baseLots
    });
  }

  return { bids, asks };
}

function mergeOrders(baseBook: { bids: OrderLevel[]; asks: OrderLevel[] }, manualOrders: Order[]) {
  const bidMap = new Map<number, number>();
  const askMap = new Map<number, number>();

  for (const level of baseBook.bids) {
    bidMap.set(level.price, (bidMap.get(level.price) ?? 0) + level.lots);
  }
  for (const level of baseBook.asks) {
    askMap.set(level.price, (askMap.get(level.price) ?? 0) + level.lots);
  }

  for (const order of manualOrders) {
    if (order.side === 'bid') {
      bidMap.set(order.price, (bidMap.get(order.price) ?? 0) + order.lots);
    } else {
      askMap.set(order.price, (askMap.get(order.price) ?? 0) + order.lots);
    }
  }

  const bids = Array.from(bidMap.entries())
    .map(([price, lots]) => ({ price, lots }))
    .sort((a, b) => b.price - a.price)
    .slice(0, ORDERBOOK_RENDER_DEPTH);

  const asks = Array.from(askMap.entries())
    .map(([price, lots]) => ({ price, lots }))
    .sort((a, b) => a.price - b.price)
    .slice(0, ORDERBOOK_RENDER_DEPTH);

  return { bids, asks };
}

function matchBidAgainstAsks(asks: OrderLevel[], bidPrice: number, bidLots: number) {
  const nextAsks = asks
    .map((level) => ({ ...level }))
    .sort((a, b) => a.price - b.price);
  const fills: Array<{ price: number; lots: number }> = [];
  let remainingLots = bidLots;

  for (const level of nextAsks) {
    if (remainingLots <= 0 || level.price > bidPrice) {
      break;
    }

    const fillLots = Math.min(level.lots, remainingLots);
    if (fillLots <= 0) {
      continue;
    }

    level.lots -= fillLots;
    remainingLots -= fillLots;
    fills.push({ price: level.price, lots: fillLots });
  }

  return {
    fills,
    remainingLots,
    asks: nextAsks.filter((level) => level.lots > 0)
  };
}

function matchAskAgainstBids(bids: OrderLevel[], askPrice: number, askLots: number) {
  const nextBids = bids
    .map((level) => ({ ...level }))
    .sort((a, b) => b.price - a.price);
  const fills: Array<{ price: number; lots: number }> = [];
  let remainingLots = askLots;

  for (const level of nextBids) {
    if (remainingLots <= 0 || level.price < askPrice) {
      break;
    }

    const fillLots = Math.min(level.lots, remainingLots);
    if (fillLots <= 0) {
      continue;
    }

    level.lots -= fillLots;
    remainingLots -= fillLots;
    fills.push({ price: level.price, lots: fillLots });
  }

  return {
    fills,
    remainingLots,
    bids: nextBids.filter((level) => level.lots > 0)
  };
}

function transferOwnershipFromRetail(
  ownership: ShareholderStake[],
  bidderId: string | undefined,
  fills: Array<{ price: number; lots: number }>
) {
  if (!bidderId || bidderId === 'retail' || fills.length === 0) {
    return { ownership, transferredPct: 0, cashSpentUsd: 0 };
  }

  const sharesOutstanding = getSharesOutstanding();
  let transferredPct = 0;
  let cashSpentUsd = 0;

  for (const fill of fills) {
    const sharesFilled = fill.lots * LOT_SIZE_SHARES;
    const notional = sharesFilled * fill.price;
    transferredPct += (sharesFilled / sharesOutstanding) * 100;
    cashSpentUsd += notional;
  }

  const retail = ownership.find((holder) => holder.id === 'retail');
  const bidder = ownership.find((holder) => holder.id === bidderId);
  if (!retail || !bidder) {
    return { ownership, transferredPct: 0, cashSpentUsd: 0 };
  }

  const transfer = Math.min(transferredPct, retail.shares);
  if (transfer <= 0) {
    return { ownership, transferredPct: 0, cashSpentUsd: 0 };
  }

  const transferRatio = transferredPct > 0 ? transfer / transferredPct : 0;
  const effectiveCashTransfer = round2(cashSpentUsd * transferRatio);

  return {
    transferredPct: round4(transfer),
    cashSpentUsd: effectiveCashTransfer,
    ownership: ownership.map((holder) => {
      if (holder.id === 'retail') {
        return {
          ...holder,
          shares: round4(holder.shares - transfer),
          cashUsd: round2(holder.cashUsd + effectiveCashTransfer)
        };
      }
      if (holder.id === bidderId) {
        return {
          ...holder,
          shares: round4(holder.shares + transfer),
          cashUsd: round2(holder.cashUsd - effectiveCashTransfer)
        };
      }
      return holder;
    })
  };
}

function transferByManualOwnershipEdit(
  ownership: ShareholderStake[],
  holderId: string,
  targetShares: number,
  price: number
) {
  const roundedTarget = round4(Math.max(0, targetShares));
  if (holderId === 'retail') {
    return {
      ownership: ownership.map((holder) => (holder.id === 'retail' ? { ...holder, shares: roundedTarget } : holder)),
      transferredPct: 0,
      cashUsd: 0
    };
  }

  const retail = ownership.find((holder) => holder.id === 'retail');
  const holder = ownership.find((item) => item.id === holderId);
  if (!retail || !holder) {
    return { ownership, transferredPct: 0, cashUsd: 0 };
  }

  const marketCap = price * getSharesOutstanding();
  const delta = round4(roundedTarget - holder.shares);
  if (delta === 0) {
    return { ownership, transferredPct: 0, cashUsd: 0 };
  }

  if (delta > 0) {
    const maxPctByRetail = retail.shares;
    const maxPctByCash = marketCap > 0 ? (holder.cashUsd / marketCap) * 100 : 0;
    const transferPct = round4(Math.min(delta, maxPctByRetail, maxPctByCash));
    const cash = round2((transferPct / 100) * marketCap);

    return {
      transferredPct: transferPct,
      cashUsd: cash,
      ownership: ownership.map((item) => {
        if (item.id === 'retail') {
          return { ...item, shares: round4(item.shares - transferPct), cashUsd: round2(item.cashUsd + cash) };
        }
        if (item.id === holderId) {
          return { ...item, shares: round4(item.shares + transferPct), cashUsd: round2(Math.max(0, item.cashUsd - cash)) };
        }
        return item;
      })
    };
  }

  const requestedSellPct = Math.abs(delta);
  const maxPctByRetailCash = marketCap > 0 ? (retail.cashUsd / marketCap) * 100 : 0;
  const transferPct = round4(Math.min(requestedSellPct, holder.shares, maxPctByRetailCash));
  const cash = round2((transferPct / 100) * marketCap);

  return {
    transferredPct: transferPct,
    cashUsd: cash,
    ownership: ownership.map((item) => {
      if (item.id === 'retail') {
        return { ...item, shares: round4(item.shares + transferPct), cashUsd: round2(Math.max(0, item.cashUsd - cash)) };
      }
      if (item.id === holderId) {
        return { ...item, shares: round4(item.shares - transferPct), cashUsd: round2(item.cashUsd + cash) };
      }
      return item;
    })
  };
}

function resolveRestingOrdersAfterPriceMove(
  baseBook: { bids: OrderLevel[]; asks: OrderLevel[] },
  manualOrders: Order[],
  ownership: ShareholderStake[]
) {
  let bids = baseBook.bids.map((level) => ({ ...level }));
  let asks = baseBook.asks.map((level) => ({ ...level }));
  let nextOwnership = ownership;
  let lastTradePrice: number | null = null;
  const nextManualOrders: Order[] = [];
  const transferNews: string[] = [];

  for (const order of manualOrders) {
    if (order.side !== 'bid') {
      const match = matchAskAgainstBids(bids, order.price, order.lots);
      bids = match.bids;

      const fillLots = order.lots - match.remainingLots;
      if (fillLots > 0) {
        const latestFill = match.fills[match.fills.length - 1];
        if (latestFill) {
          lastTradePrice = latestFill.price;
        }
        transferNews.push(`${fillLots.toLocaleString('tr-TR')} lotluk satış emri gerçekleşti.`);
      }

      if (match.remainingLots > 0) {
        nextManualOrders.push({ ...order, lots: match.remainingLots });
      }
      continue;
    }

    const match = matchBidAgainstAsks(asks, order.price, order.lots);
    asks = match.asks;

    const fillLots = order.lots - match.remainingLots;
    if (fillLots > 0) {
      const latestFill = match.fills[match.fills.length - 1];
      if (latestFill) {
        lastTradePrice = latestFill.price;
      }
      const { ownership: updatedOwnership, transferredPct, cashSpentUsd } = transferOwnershipFromRetail(
        nextOwnership,
        order.bidderId,
        match.fills
      );
      nextOwnership = updatedOwnership;

      const bidderName = nextOwnership.find((holder) => holder.id === order.bidderId)?.name ?? order.bidderId ?? 'Bilinmeyen';
      if (transferredPct > 0) {
        transferNews.push(
          `${bidderName}, ${fillLots.toLocaleString('tr-TR')} lotluk alış emri gerçekleştirdi; Bireysel'den %${transferredPct.toFixed(
            4
          )} pay aldı, harcanan tutar: $${cashSpentUsd.toLocaleString('tr-TR')}.`
        );
      }
    }

    if (match.remainingLots > 0) {
      nextManualOrders.push({ ...order, lots: match.remainingLots });
    }
  }

  const orderBook = mergeOrders(
    {
      bids,
      asks
    },
    nextManualOrders
  );

  return {
    orderBook,
    manualOrders: nextManualOrders,
    ownership: nextOwnership,
    transferNews,
    lastTradePrice
  };
}

function buildFinancialsNews(prev: AppState['financials'], next: AppState['financials'], scenario: Scenario): string {
  const revenueDeltaPct = prev.income.revenue !== 0 ? ((next.income.revenue - prev.income.revenue) / prev.income.revenue) * 100 : 0;
  const netIncomeDelta = next.income.netIncome - prev.income.netIncome;
  const cashDelta = next.cashFlow.endingCash - prev.cashFlow.endingCash;

  const scenarioLabel: Record<Scenario, string> = {
    'Very Pessimistic': 'Çok Kötümser',
    Pessimistic: 'Kötümser',
    Neutral: 'Nötr',
    Optimistic: 'İyimser',
    'Very Optimistic': 'Çok İyimser'
  };

  return `Finansal güncelleme (${scenarioLabel[scenario]}): Gelir %${round2(revenueDeltaPct).toLocaleString(
    'tr-TR'
  )} değişti, net kâr ${round2(netIncomeDelta).toLocaleString('tr-TR')} Mn USD, dönem sonu nakit ${round2(cashDelta).toLocaleString(
    'tr-TR'
  )} Mn USD değişti.`;
}

const initialPrice = 12.4;
const baselineFinancials = createBaselineFinancials();
const initialOwnership: ShareholderStake[] = [
  { id: 'retail', name: 'Bireysel (Küçük Yatırımcı Bloku)', shares: 40, cashUsd: 0 },
  { id: 'aktivist-fon', name: 'C Bank Serbest Fon', shares: 2, cashUsd: 1_500_000_000 },
  { id: 'harvard-endowment', name: 'Harvard Vakfı', shares: 5, cashUsd: 50_000_000_000 },
  { id: 'turkiye-varlik-fonu', name: 'Türkiye Varlık Fonu', shares: 10, cashUsd: 250_000_000_000 },
  { id: 'katar-varlik-fonu', name: 'Katar Varlık Fonu', shares: 7, cashUsd: 475_000_000_000 },
  { id: 'norvec-varlik-fonu', name: 'Norveç Varlık Fonu', shares: 5, cashUsd: 1_500_000_000_000 },
  { id: 'astorium-yonetim-kurulu', name: 'Astorium', shares: 11, cashUsd: 1_200_000_000 },
  { id: 'titan-capital', name: 'Titan Sermaye', shares: 2, cashUsd: 8_000_000_000 },
  { id: 'aurora-group', name: 'Aurora Grup', shares: 0, cashUsd: 6_000_000_000 }
];

const initialState: AppState = {
  price: initialPrice,
  lastChangePct: 0,
  lastChangeAmount: 0,
  priceHistory: Array.from({ length: 24 }, () => initialPrice),
  autoPaused: false,
  news: seedNews,
  manualOrders: [],
  orderBook: generateBaseOrderBook(initialPrice),
  scenario: 'Neutral',
  financials: baselineFinancials,
  ownership: initialOwnership,
  darkMode: true
};

function cloneState(state: AppState): AppState {
  return {
    ...state,
    priceHistory: [...state.priceHistory],
    news: [...state.news],
    manualOrders: state.manualOrders.map((order) => ({ ...order })),
    orderBook: {
      bids: state.orderBook.bids.map((level) => ({ ...level })),
      asks: state.orderBook.asks.map((level) => ({ ...level }))
    },
    financials: {
      income: { ...state.financials.income },
      cashFlow: { ...state.financials.cashFlow },
      balance: { ...state.financials.balance },
      periodLabel: state.financials.periodLabel
    },
    ownership: state.ownership.map((holder) => ({ ...holder }))
  };
}

function loadInitialState(): AppState {
  if (typeof window === 'undefined') {
    return cloneState(initialState);
  }

  const cached = window.localStorage.getItem(APP_STATE_STORAGE_KEY);
  if (!cached) {
    return cloneState(initialState);
  }

  try {
    const parsed = JSON.parse(cached) as AppState;
    if (!parsed || typeof parsed !== 'object') {
      return cloneState(initialState);
    }

    return {
      ...cloneState(initialState),
      ...parsed
    };
  } catch {
    return cloneState(initialState);
  }
}

type Action =
  | { type: 'SET_PRICE'; price: number }
  | { type: 'ADD_NEWS'; headline: string }
  | { type: 'TOGGLE_AUTO' }
  | { type: 'ADD_ORDER'; order: Order }
  | { type: 'SET_SCENARIO'; scenario: Scenario }
  | { type: 'SIMULATE_FINANCIALS' }
  | { type: 'SET_OWNERSHIP_SHARES'; id: string; shares: number }
  | { type: 'TOGGLE_THEME' }
  | { type: 'RESET_STATE' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_PRICE': {
      const prev = state.price;
      const next = round2(Math.max(0.01, action.price));
      const baseBook = generateBaseOrderBook(next);
      const resolved = resolveRestingOrdersAfterPriceMove(baseBook, state.manualOrders, state.ownership);
      const finalPrice = round2(resolved.lastTradePrice ?? next);
      const diff = round2(finalPrice - prev);
      const pct = prev !== 0 ? round2((diff / prev) * 100) : 0;
      const orderBook = mergeOrders(generateBaseOrderBook(finalPrice), resolved.manualOrders);

      return {
        ...state,
        price: finalPrice,
        lastChangeAmount: diff,
        lastChangePct: pct,
        priceHistory: [...state.priceHistory.slice(-59), finalPrice],
        orderBook,
        manualOrders: resolved.manualOrders,
        ownership: resolved.ownership,
        news: [...resolved.transferNews, ...state.news]
      };
    }
    case 'ADD_NEWS': {
      const headline = action.headline.trim();
      if (!headline) {
        return state;
      }

      return {
        ...state,
        news: [headline, ...state.news]
      };
    }
    case 'TOGGLE_AUTO':
      return {
        ...state,
        autoPaused: !state.autoPaused
      };
    case 'ADD_ORDER': {
      const order = {
        ...action.order,
        price: round2(action.order.price),
        lots: Math.max(1, Math.floor(action.order.lots))
      };
      if (order.side === 'bid') {
        const match = matchBidAgainstAsks(state.orderBook.asks, order.price, order.lots);
        const { ownership, transferredPct, cashSpentUsd } = transferOwnershipFromRetail(state.ownership, order.bidderId, match.fills);

        const remainingBidLots = match.remainingLots;
        const manualOrders =
          remainingBidLots > 0
            ? [...state.manualOrders, { ...order, lots: remainingBidLots }]
            : [...state.manualOrders];

        const bidsMap = new Map<number, number>();
        for (const level of state.orderBook.bids) {
          bidsMap.set(level.price, (bidsMap.get(level.price) ?? 0) + level.lots);
        }
        if (remainingBidLots > 0) {
          bidsMap.set(order.price, (bidsMap.get(order.price) ?? 0) + remainingBidLots);
        }
        const bids = Array.from(bidsMap.entries())
          .map(([price, lots]) => ({ price, lots }))
          .sort((a, b) => b.price - a.price)
          .slice(0, ORDERBOOK_RENDER_DEPTH);

        const fillLots = order.lots - remainingBidLots;
        const bidderName = state.ownership.find((holder) => holder.id === order.bidderId)?.name ?? order.bidderId ?? 'Bilinmeyen';
        const transferNews =
          fillLots > 0 && transferredPct > 0
            ? [
                `${bidderName}, ${fillLots.toLocaleString('tr-TR')} lotluk alış emri gerçekleştirdi; Bireysel'den %${transferredPct.toFixed(
                  4
                )} pay aldı, harcanan tutar: $${cashSpentUsd.toLocaleString('tr-TR')}.`
              ]
            : [];

        const lastFill = match.fills[match.fills.length - 1];
        const tradePrice = round2(lastFill?.price ?? state.price);
        const priceDiff = round2(tradePrice - state.price);
        const pricePct = state.price !== 0 ? round2((priceDiff / state.price) * 100) : 0;
        const priceHistory = lastFill ? [...state.priceHistory.slice(-59), tradePrice] : state.priceHistory;

        return {
          ...state,
          price: tradePrice,
          lastChangeAmount: priceDiff,
          lastChangePct: pricePct,
          priceHistory,
          manualOrders,
          ownership,
          news: [...transferNews, ...state.news],
          orderBook: {
            bids,
            asks: match.asks.slice(0, ORDERBOOK_RENDER_DEPTH)
          }
        };
      }

      const match = matchAskAgainstBids(state.orderBook.bids, order.price, order.lots);
      const remainingAskLots = match.remainingLots;
      const manualOrders =
        remainingAskLots > 0
          ? [...state.manualOrders, { ...order, lots: remainingAskLots }]
          : [...state.manualOrders];
      const fillLots = order.lots - remainingAskLots;
      const tradeNews = fillLots > 0 ? [`${fillLots.toLocaleString('tr-TR')} lotluk satış emri gerçekleşti.`] : [];

      const asksMap = new Map<number, number>();
      for (const level of state.orderBook.asks) {
        asksMap.set(level.price, (asksMap.get(level.price) ?? 0) + level.lots);
      }
      if (remainingAskLots > 0) {
        asksMap.set(order.price, (asksMap.get(order.price) ?? 0) + remainingAskLots);
      }
      const asks = Array.from(asksMap.entries())
        .map(([price, lots]) => ({ price, lots }))
        .sort((a, b) => a.price - b.price)
        .slice(0, ORDERBOOK_RENDER_DEPTH);

      const lastFill = match.fills[match.fills.length - 1];
      const tradePrice = round2(lastFill?.price ?? state.price);
      const priceDiff = round2(tradePrice - state.price);
      const pricePct = state.price !== 0 ? round2((priceDiff / state.price) * 100) : 0;
      const priceHistory = lastFill ? [...state.priceHistory.slice(-59), tradePrice] : state.priceHistory;

      return {
        ...state,
        price: tradePrice,
        lastChangeAmount: priceDiff,
        lastChangePct: pricePct,
        priceHistory,
        manualOrders,
        news: [...tradeNews, ...state.news],
        orderBook: {
          bids: match.bids.slice(0, ORDERBOOK_RENDER_DEPTH),
          asks
        }
      };
    }
    case 'SET_SCENARIO':
      return {
        ...state,
        scenario: action.scenario
      };
    case 'SIMULATE_FINANCIALS':
      {
        const prevFinancials = state.financials;
        const nextFinancials = simulateQuarter(state.financials, state.scenario);
        const financialsNews = buildFinancialsNews(prevFinancials, nextFinancials, state.scenario);
        const movePct = estimatePriceMovePct(state.financials, nextFinancials, state.scenario);
        const prev = state.price;
        const next = round2(Math.max(0.01, prev * (1 + movePct / 100)));
        const resolved = resolveRestingOrdersAfterPriceMove(generateBaseOrderBook(next), state.manualOrders, state.ownership);
        const finalPrice = round2(resolved.lastTradePrice ?? next);
        const diff = round2(finalPrice - prev);
        const pct = prev !== 0 ? round2((diff / prev) * 100) : 0;
        const orderBook = mergeOrders(generateBaseOrderBook(finalPrice), resolved.manualOrders);

        return {
          ...state,
          financials: nextFinancials,
          price: finalPrice,
          lastChangeAmount: diff,
          lastChangePct: pct,
          priceHistory: [...state.priceHistory.slice(-59), finalPrice],
          orderBook,
          manualOrders: resolved.manualOrders,
          ownership: resolved.ownership,
          news: [financialsNews, ...resolved.transferNews, ...state.news]
        };
      }
    case 'SET_OWNERSHIP_SHARES': {
      const { ownership } = transferByManualOwnershipEdit(state.ownership, action.id, action.shares, state.price);
      return {
        ...state,
        ownership
      };
    }
    case 'TOGGLE_THEME':
      return {
        ...state,
        darkMode: !state.darkMode
      };
    case 'RESET_STATE':
      return cloneState(initialState);
    default:
      return state;
  }
}

const AppStoreContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | undefined>(undefined);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState, loadInitialState);

  useEffect(() => {
    window.localStorage.setItem(APP_STATE_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const context = useContext(AppStoreContext);
  if (!context) {
    throw new Error('useAppStore must be used within AppStoreProvider');
  }
  return context;
}
