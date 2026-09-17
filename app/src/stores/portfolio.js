import { defineStore } from 'pinia'
import { ASSETS, byId } from '../data/assets'

// T6/T7 · 交易系统 + 持仓账户
// 交易规则（资产池设定.md）：
//   - 15:00前下单按当日净值（模拟盘：剧本日当日）；确认T+1（QDII T+2）
//   - 赎回费：持有<7天1.5%（惩罚性）；债基7-30天0.5%；指数>7天0.05%
//   - 货币基金快赎单日1万额度
//   - 净值：每个"市场日"更新（剧本模式=剧本日；自由模式=手动推进日）

const STORAGE_KEY = 'sim-portfolio-v1'
const EPS = 1e-6

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) } catch { return null }
}

// 赎回费率（按持有天数）
function sellFeeRate(asset, holdDays) {
  if (asset.id === 'fund-cash-01') return 0
  if (holdDays < 7) return 0.015
  if (asset.category === 'bond' && holdDays < 30) return 0.005
  if (asset.category === 'equity' && holdDays >= 7) return 0.0005
  return 0 // industry/overseas/gold >7天
}

export const usePortfolioStore = defineStore('portfolio', {
  state: () => {
    const saved = load()
    return {
      cash: saved?.cash ?? 100000,
      initialCapital: saved?.initialCapital ?? 0,
      // nav: { assetId: 最新净值 }（初始1.0，随市场日更新）
      nav: saved?.nav ?? Object.fromEntries(ASSETS.map((a) => [a.id, 1])),
      navHistory: saved?.navHistory ?? {},
      // holdings: { assetId: { shares, cost, buyDay } }
      holdings: saved?.holdings ?? {},
      // trades: [{ id, type, assetId, amount/shares, nav, day, status, confirmDay, fee }]
      trades: saved?.trades ?? [],
      day: saved?.day ?? 0,
      quickRedeemUsedToday: saved?.quickRedeemUsedToday ?? 0,
      currentDayReturns: saved?.currentDayReturns ?? null, // 当日各资产收益率（快照）
    }
  },

  getters: {
    holdingsDetail(state) {
      return Object.entries(state.holdings)
        .filter(([, h]) => h.shares > EPS)
        .map(([id, h]) => {
          const a = byId(id)
          const value = h.shares * state.nav[id]
          const pnl = value - h.cost
          return {
            id, asset: a, shares: h.shares, cost: h.cost,
            value, pnl, pnlRate: h.cost > 0 ? pnl / h.cost : 0,
            holdDays: state.day - h.buyDay,
            todayChange: state.currentDayReturns ? h.shares * state.nav[id] * (state.currentDayReturns[id] ?? 0) : 0,
          }
        })
    },
    totalValue(state) {
      return state.cash + this.holdingsDetail.reduce((s, h) => s + h.value, 0)
    },
    totalPnl() { return this.totalValue - this.initialCapital },
    pendingTrades(state) {
      return state.trades.filter((t) => t.status === 'pending')
    },
  },

  actions: {
    persist() {
      const { cash, initialCapital, nav, navHistory, holdings, trades, day, quickRedeemUsedToday, currentDayReturns } = this
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ cash, initialCapital, nav, navHistory, holdings, trades, day, quickRedeemUsedToday, currentDayReturns }))
    },

    // ---- 市场日推进（剧本模式由剧本驱动；自由模式用随机引擎）----
    advanceDay(dailyReturns) {
      this.day += 1
      this.quickRedeemUsedToday = 0
      // 更新净值
      for (const id in this.nav) {
        this.nav[id] *= 1 + (dailyReturns[id] ?? 0)
        if (!this.navHistory[id]) this.navHistory[id] = [1]
        this.navHistory[id].push(this.nav[id])
      }
      this.currentDayReturns = { ...dailyReturns }
      // 确认到期的在途交易
      for (const t of this.trades) {
        if (t.status !== 'pending') continue
        if (this.day >= t.confirmDay) {
          if (t.type === 'buy') {
            const shares = (t.amount - t.fee) / t.navAtConfirm
            this.holdings[t.assetId] ??= { shares: 0, cost: 0, buyDay: this.day }
            this.holdings[t.assetId].shares += shares
            this.holdings[t.assetId].cost += t.amount - t.fee
            this.holdings[t.assetId].buyDay = this.day // 简化：加权成本，按最近买入日计持有天数
            t.status = 'confirmed'
            t.shares = shares
          } else {
            // 卖出：份额减少、扣赎回费、现金到账（赎回费按持有天数）
            const h = this.holdings[t.assetId]
            if (h && h.shares >= t.shares - EPS) {
              const gross = t.shares * t.navAtConfirm
              const feeRate = sellFeeRate(byId(t.assetId), this.day - h.buyDay)
              const fee = gross * feeRate
              h.shares -= t.shares
              h.cost *= t.shares > EPS ? Math.max(0, 1 - t.shares / (t.shares + h.shares)) : 0
              this.cash += gross - fee
              t.status = 'confirmed'
              t.fee = fee
            }
          }
        }
      }
      this.persist()
    },

    // ---- 下单 ----
    // amount: 买入金额 | 返回订单或错误信息
    submitBuy(assetId, amount) {
      const a = byId(assetId)
      if (amount < a.trade.minAmount) return { error: `最低买入${a.trade.minAmount}元` }
      if (amount > this.cash) return { error: '可用资金不足' }
      const fee = amount * a.trade.buyFee
      this.cash -= amount
      const order = {
        id: 'T' + Date.now(), type: 'buy', assetId, amount, fee,
        navAtConfirm: this.nav[assetId], // 15:00前下单按当日净值
        day: this.day, confirmDay: this.day + a.trade.confirmDays,
        status: 'pending',
      }
      this.trades.unshift(order)
      this.persist()
      return { order }
    },

    // shares: 卖出份额
    submitSell(assetId, shares, quick = false) {
      const a = byId(assetId)
      const h = this.holdings[assetId]
      if (!h || h.shares < shares - EPS) return { error: '持有份额不足' }
      // 货币基金快赎额度
      if (quick && a.id === 'fund-cash-01') {
        const value = shares * this.nav[assetId]
        if (this.quickRedeemUsedToday + value > a.special.quickRedeemLimit) {
          return { error: `今日快赎额度已不足（剩余${(a.special.quickRedeemLimit - this.quickRedeemUsedToday).toFixed(0)}元），请走普通赎回` }
        }
      }
      const order = {
        id: 'T' + Date.now(), type: 'sell', assetId, shares, quick,
        navAtConfirm: this.nav[assetId],
        day: this.day,
        confirmDay: quick ? this.day : this.day + a.trade.redeemDays,
        status: 'pending',
      }
      if (quick && a.id === 'fund-cash-01') {
        // 快赎：直接锁份额，当日现金到账
        h.shares -= shares
        const gross = shares * this.nav[assetId]
        this.quickRedeemUsedToday += gross
        this.cash += gross
        order.status = 'confirmed'
        order.fee = 0
      }
      this.trades.unshift(order)
      this.persist()
      return { order }
    },

    openAccount() {
      this.cash = 100000
      this.initialCapital = 100000
      this.persist()
    },

    reset() {
      localStorage.removeItem(STORAGE_KEY)
      this.$reset()
    },
  },
})
