<script setup>
import { ref, computed } from 'vue'
import { usePortfolioStore } from '../stores/portfolio'
import { byId } from '../data/assets'

const portfolio = usePortfolioStore()
const tab = ref('holding') // holding | trades
const fmt = (v, d = 2) => Number(v).toFixed(d)
const pct = (v) => (v >= 0 ? '+' : '') + (v * 100).toFixed(2) + '%'

const detail = computed(() => portfolio.holdingsDetail)
const tradeRows = computed(() =>
  portfolio.trades.map((t) => ({ ...t, asset: byId(t.assetId) }))
)
</script>

<template>
  <div>
    <h1>持仓</h1>

    <div v-if="portfolio.pendingTrades.length" class="pending-bar">
      ⏳ 你有 {{ portfolio.pendingTrades.length }} 笔交易待确认，将按对应净值成交（T+1规则）
    </div>

    <div class="tabs">
      <button :class="{ active: tab === 'holding' }" @click="tab = 'holding'">持仓（{{ detail.length }}）</button>
      <button :class="{ active: tab === 'trades' }" @click="tab = 'trades'">交易记录（{{ portfolio.trades.length }}）</button>
    </div>

    <div v-if="tab === 'holding'">
      <p v-if="!detail.length" class="empty">还没有持仓。去市场页看看，从风险低的开始。</p>
      <div v-for="h in detail" :key="h.id" class="card holding-row">
        <span class="cat-bar" :style="{ background: `var(${h.asset.colorVar})` }"></span>
        <div class="main">
          <span class="name">{{ h.asset.name }} <span class="risk">{{ h.asset.risk }}</span></span>
          <span class="sub">持有 {{ fmt(h.shares, 4) }} 份 · {{ h.holdDays }} 天</span>
        </div>
        <div class="nums">
          <span class="num value">¥{{ fmt(h.value) }}</span>
          <span class="num" :class="h.pnl >= 0 ? 'positive' : 'negative'">{{ h.pnl >= 0 ? '+' : '' }}{{ fmt(h.pnl) }}（{{ pct(h.pnlRate) }}）</span>
        </div>
        <router-link :to="`/asset/${h.id}`" class="op">交易</router-link>
      </div>
    </div>

    <div v-else>
      <p v-if="!tradeRows.length" class="empty">暂无交易记录</p>
      <div v-for="t in tradeRows" :key="t.id" class="card trade-row">
        <span class="type" :class="t.type">{{ t.type === 'buy' ? '买入' : '卖出' }}</span>
        <div class="main">
          <span class="name">{{ t.asset?.name }}</span>
          <span class="sub">第 {{ t.day }} 日下单 · 净值 {{ fmt(t.navAtConfirm, 4) }}<template v-if="t.fee"> · 费用 ¥{{ fmt(t.fee) }}</template></span>
        </div>
        <div class="nums">
          <span v-if="t.type === 'buy'" class="num">¥{{ fmt(t.amount) }}</span>
          <span v-else class="num">{{ fmt(t.shares, 4) }} 份</span>
          <span class="status" :class="t.status">{{ t.status === 'pending' ? '待确认' : '已确认' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
h1 { font-size: var(--text-3xl); font-weight: var(--font-bold); margin-bottom: var(--space-6); letter-spacing: .02em; }
.pending-bar { background: var(--warning-bg); color: var(--warning); border-radius: var(--radius-md); padding: var(--space-3) var(--space-4); font-size: var(--text-sm); margin-bottom: var(--space-4); }
.tabs { display: flex; gap: var(--space-2); margin-bottom: var(--space-4); }
.tabs button { padding: var(--space-2) var(--space-4); border-radius: var(--radius-sm); border: 1px solid var(--border-default); background: var(--bg-card); color: var(--text-secondary); cursor: pointer; font-size: var(--text-sm); }
.tabs button.active { background: var(--brand-accent); color: var(--text-on-color); border-color: var(--brand-accent); }
.empty { color: var(--text-tertiary); text-align: center; padding: var(--space-16); }
.holding-row, .trade-row { display: flex; align-items: center; gap: var(--space-4); margin-bottom: var(--space-3); position: relative; overflow: hidden; padding: var(--space-5) var(--space-6); }
.cat-bar { position: absolute; left: 0; top: 0; bottom: 0; width: 5px; }
.main { flex: 1; display: flex; flex-direction: column; gap: var(--space-1); }
.name { font-weight: var(--font-semibold); font-size: var(--text-lg); }
.risk { font-size: var(--text-xs); background: var(--warning-bg); color: var(--warning); padding: 3px 8px; border-radius: var(--radius-sm); vertical-align: middle; }
.sub { color: var(--text-tertiary); font-size: var(--text-xs); }
.nums { display: flex; flex-direction: column; align-items: flex-end; gap: var(--space-1); }
.value { font-weight: var(--font-semibold); }
.op { background: var(--brand-accent); color: var(--text-on-color); padding: var(--space-2) var(--space-4); border-radius: var(--radius-sm); text-decoration: none; font-size: var(--text-sm); }
.type { font-size: var(--text-sm); font-weight: var(--font-medium); width: 3em; }
.type.buy { color: var(--positive); }
.type.sell { color: var(--negative); }
.status { font-size: var(--text-xs); padding: 3px 8px; border-radius: var(--radius-sm); }
.status.pending { background: var(--warning-bg); color: var(--warning); }
.status.confirmed { background: var(--positive-bg); color: var(--positive); }
</style>
