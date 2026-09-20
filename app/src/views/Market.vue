<script setup>
import { ref, computed, onMounted } from 'vue'
import { ASSETS, CATEGORY_TABS } from '../data/assets'
import { generateHistory } from '../engine/market.js'
import { usePortfolioStore } from '../stores/portfolio'

const portfolio = usePortfolioStore()
const tab = ref('all')
const chartReady = ref(false)
let navHistory = null

onMounted(() => {
  // 固定seed生成"历史走势"——同一会话内所有用户看到同一段历史
  navHistory = generateHistory(20260917, 120)
  chartReady.value = true
})

// 各资产近1月/近1年涨幅（从历史序列算）
function periodReturn(id, days) {
  if (!navHistory) return 0
  const s = navHistory[id]
  const prev = s[Math.max(0, s.length - 1 - days)]
  return s[s.length - 1] / prev - 1
}

const shown = computed(() =>
  CATEGORY_TABS.find((t) => t.key === tab.value).match
    ? ASSETS.filter((a) => CATEGORY_TABS.find((t) => t.key === tab.value).match(a))
    : ASSETS
)

const fmt = (v) => Number(v).toFixed(2)
const pct = (v) => (v >= 0 ? '+' : '') + (v * 100).toFixed(2) + '%'

// 迷你走势图：120日净值 → SVG path（80x28）
function sparkline(id) {
  if (!navHistory) return ''
  const s = navHistory[id].slice(-120)
  const min = Math.min(...s), max = Math.max(...s), span = max - min || 1
  const pts = s.map((v, i) => {
    const x = (i / (s.length - 1)) * 80
    const y = 26 - ((v - min) / span) * 24
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  return 'M' + pts.join(' L')
}
const sparkColor = (id) => (periodReturn(id, 120) >= 0 ? 'var(--positive)' : 'var(--negative)')

const holdingOf = (id) => portfolio.holdings[id]
const pendingBuyOf = (id) => portfolio.pendingTrades.find((t) => t.type === 'buy' && t.assetId === id)
</script>

<template>
  <div>
    <div class="page-head">
      <h1>市场</h1>
      <p class="page-sub">全部为模拟资产 · 规则与费率参照中国公募基金市场</p>
    </div>

    <!-- 市场解读教学卡片 -->
    <div class="card market-insight">
      <h3>📊 如何看懂市场数据</h3>
      <div class="insight-grid">
        <div class="insight-item">
          <b> 走势图怎么看</b>
          <p>迷你走势图显示近120日净值变化。<b>持续向上</b>说明趋势向好，<b>剧烈波动</b>说明风险较高，<b>横盘不动</b>说明市场在等待方向。不要只看涨跌，要看趋势的稳定性。</p>
        </div>
        <div class="insight-item">
          <b>📉 近1月 vs 近1年</b>
          <p>近1月涨幅反映<b>短期情绪</b>，近1年涨幅反映<b>长期趋势</b>。如果近1月大涨但近1年亏损，说明刚经历暴跌后的反弹——别被短期涨幅迷惑。反之，近1月小跌但近1年大涨，可能是健康的回调。</p>
        </div>
        <div class="insight-item">
          <b>⚖️ 费率的影响</b>
          <p>申购费看似只有0.12%，但频繁买卖会累积成巨大成本。假设每月买卖一次，一年下来摩擦成本可能吃掉1-2%的收益。<b>长期持有是降低费率影响的最佳方式。</b></p>
        </div>
        <div class="insight-item">
          <b>🎯 小白选基三原则</b>
          <p>① <b>先选类别再选产品</b>：先决定买货币/债券/股票，再在同类中比较；② <b>看规模</b>：规模太小有清盘风险，太大可能灵活性差；③ <b>看成立年限</b>：至少成立1年以上，有完整牛熊周期数据。</p>
        </div>
      </div>
    </div>

    <div class="tabs">
      <button v-for="t in CATEGORY_TABS" :key="t.key"
        :class="{ active: tab === t.key }" @click="tab = t.key">{{ t.label }}</button>
    </div>

    <div class="market-list">
      <router-link v-for="a in shown" :key="a.id" :to="`/asset/${a.id}`" class="card asset-row">
        <div class="asset-id">
          <span class="asset-tag" :style="{ background: `var(${a.colorVar})` }">{{ a.categoryName }}</span>
          <span class="asset-name">{{ a.name }}</span>
          <span class="risk">{{ a.risk }}</span>
          <span v-if="holdingOf(a.id)" class="held">持有中</span>
          <span v-else-if="pendingBuyOf(a.id)" class="held pending-held">待确认</span>
        </div>
        <p class="asset-intro">{{ a.intro }}</p>
        <div class="asset-data">
          <svg v-if="chartReady" class="spark" :viewBox="'0 0 80 28'" preserveAspectRatio="none">
            <path :d="sparkline(a.id)" fill="none" :stroke="sparkColor(a.id)" stroke-width="1.5" />
          </svg>
          <div class="rets">
            <div class="ret-group">
              <span class="ret-label">近1月</span>
              <span class="num" :class="periodReturn(a.id, 21) >= 0 ? 'positive' : 'negative'">{{ pct(periodReturn(a.id, 21)) }}</span>
            </div>
            <div class="ret-group">
              <span class="ret-label">近1年</span>
              <span class="num" :class="periodReturn(a.id, 120) >= 0 ? 'positive' : 'negative'">{{ pct(periodReturn(a.id, 120)) }}</span>
            </div>
            <div class="ret-group">
              <span class="ret-label">费率</span>
              <span class="num fee">{{ (a.trade.buyFee * 100).toFixed(2) }}%</span>
            </div>
          </div>
        </div>
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.page-head { display: flex; align-items: baseline; gap: var(--space-4); margin-bottom: var(--space-6); }
h1 { font-size: var(--text-3xl); font-weight: var(--font-bold); letter-spacing: .02em; }
.page-sub { color: var(--text-tertiary); font-size: var(--text-sm); }
.tabs { display: flex; gap: var(--space-2); margin-bottom: var(--space-6); border-bottom: 1px solid var(--border-default); padding-bottom: var(--space-3); }
.tabs button {
  padding: var(--space-2) var(--space-4); border-radius: var(--radius-md);
  border: 1px solid transparent; background: none; cursor: pointer;
  color: var(--text-secondary); font-size: var(--text-sm); font-weight: var(--font-medium);
  transition: all .12s;
}
.tabs button:hover { color: var(--text-primary); background: var(--bg-hover); }
.tabs button.active { background: var(--brand-accent); color: var(--text-on-color); }
.market-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: var(--space-4); }
.asset-row { display: flex; flex-direction: column; gap: var(--space-3); padding: var(--space-6); text-decoration: none; color: inherit; transition: box-shadow .15s, transform .15s; }
.asset-row:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }
.asset-id { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; }
.asset-tag { font-size: var(--text-xs); padding: 3px 8px; border-radius: var(--radius-sm); color: var(--text-secondary); white-space: nowrap; }
.asset-name { font-size: var(--text-lg); font-weight: var(--font-bold); color: var(--text-primary); }
.risk { font-size: var(--text-xs); background: var(--bg-subtle); color: var(--text-secondary); padding: 3px 8px; border-radius: var(--radius-sm); font-weight: var(--font-medium); }
.held { font-size: var(--text-xs); color: var(--brand-accent); border: 1px solid var(--brand-accent); padding: 3px 8px; border-radius: var(--radius-sm); }
.pending-held { color: var(--warning); border-color: var(--warning); }
.asset-intro { color: var(--text-secondary); font-size: var(--text-sm); line-height: var(--leading-normal); margin: 0; }
.asset-data { display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); margin-top: var(--space-2); padding-top: var(--space-3); border-top: 1px dashed var(--border-default); }
.spark { width: 120px; height: 32px; flex-shrink: 0; }
.rets { display: flex; gap: var(--space-4); }
.ret-group { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
.ret-label { font-size: var(--text-xs); color: var(--text-tertiary); }
.ret-group .num { font-size: var(--text-sm); font-weight: var(--font-semibold); }
.fee { color: var(--text-secondary); }

/* 市场解读教学 */
.market-insight { margin-bottom: var(--space-6); padding: var(--space-6); }
.market-insight h3 { font-size: var(--text-lg); font-weight: var(--font-bold); margin-bottom: var(--space-4); }
.market-insight .insight-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: var(--space-4); }
.market-insight .insight-item { background: var(--bg-subtle); border-radius: var(--radius-md); padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-2); }
.market-insight .insight-item b { font-size: var(--text-sm); color: var(--text-primary); }
.market-insight .insight-item p { font-size: var(--text-xs); color: var(--text-secondary); line-height: var(--leading-relaxed); margin: 0; }
</style>
