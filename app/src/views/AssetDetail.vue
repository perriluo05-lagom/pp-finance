<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { byId } from '../data/assets'
import { usePortfolioStore } from '../stores/portfolio'
import { makeRng, generateDailyReturns, generateHistory } from '../engine/market.js'
import * as echarts from 'echarts'
import TradeModal from '../components/TradeModal.vue'

const route = useRoute()
const portfolio = usePortfolioStore()
const asset = byId(route.params.id)

const showTrade = ref(false)
const firstBuyTip = ref(null)

const fmt = (v, d = 2) => Number(v).toFixed(d)
const pct = (v) => (v >= 0 ? '+' : '') + (v * 100).toFixed(2) + '%'
const holding = computed(() => portfolio.holdings[asset.id])
const holdingPnl = computed(() => holding.value ? holding.value.shares * portfolio.nav[asset.id] - holding.value.cost : 0)
const holdingPnlRate = computed(() => holding.value && holding.value.cost ? holdingPnl.value / holding.value.cost : 0)

// 阶段涨幅（基于引擎历史）
const stageReturns = computed(() => {
  const hist = generateHistory(20260917, 120)[asset.id]
  const last = hist[hist.length - 1]
  const at = (days) => last / hist[hist.length - 1 - days] - 1
  return [
    { label: '近1月', v: at(21) },
    { label: '近3月', v: at(63) },
    { label: '近6月', v: at(120) },
    { label: '今年以来', v: at(120) },
  ]
})

// 历史净值 = 引擎生成的120日历史 + 本会话已走出的净值（拼接）
const fullNav = computed(() => {
  const hist = generateHistory(20260917, 120)[asset.id] // 与市场页同seed
  const live = portfolio.navHistory[asset.id] ?? []
  // hist最后一点≈live起点，去重拼接
  return [...hist.slice(0, -1), ...live]
})

// ECharts 走势图
const chartEl = ref(null)
onMounted(() => {
  const s = fullNav.value
  const min = Math.min(...s), max = Math.max(...s)
  const up = s[s.length - 1] >= s[0]
  const color = up ? getComputedStyle(document.documentElement).getPropertyValue('--positive').trim() || '#3e9a4f' : getComputedStyle(document.documentElement).getPropertyValue('--negative').trim() || '#d9536f'
  echarts.init(chartEl.value).setOption({
    grid: { left: 50, right: 12, top: 12, bottom: 24 },
    xAxis: {
      type: 'category', boundaryGap: false,
      data: s.map((_, i) => i),
      axisLabel: { show: false }, axisTick: { show: false },
      axisLine: { lineStyle: { color: '#e8e2ee' } },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value', min: (min * 0.998).toFixed(4), max: (max * 1.002).toFixed(4),
      axisLabel: { color: '#948aa3', fontSize: 11, formatter: (v) => v.toFixed(3) },
      splitLine: { lineStyle: { color: '#f0ebf5' } },
    },
    tooltip: {
      trigger: 'axis',
      formatter: (ps) => `第${ps[0].dataIndex}日 · 净值 ${Number(ps[0].value).toFixed(4)}`,
      confine: true,
    },
    series: [{
      type: 'line', data: s.map((v) => Number(v.toFixed(6))), smooth: true, symbol: 'none',
      lineStyle: { color, width: 2.5 },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [
        { offset: 0, color: up ? 'rgba(47,158,87,.18)' : 'rgba(224,68,122,.18)' },
        { offset: 1, color: 'rgba(0,0,0,0)' },
      ] } },
    }],
  })
})

// 临时：手动推进一天（自由模式正式入口在剧本页，T8后接入）
const seed = ref(12345)
const advanceDay = () => {
  const rng = makeRng(seed.value++)
  const rets = generateDailyReturns(rng)
  portfolio.advanceDay(rets)
}
</script>

<template>
  <div v-if="asset">
    <h1 class="title">{{ asset.name }} <span class="risk">{{ asset.risk }}</span></h1>
    <p class="intro">{{ asset.intro }}</p>

    <div class="row">
      <div class="card price-card">
        <span class="label">最新净值</span>
        <span class="num big">{{ fmt(portfolio.nav[asset.id], 4) }}</span>
        <span class="sub">第 {{ portfolio.day }} 个交易日</span>
      </div>
      <div class="card price-card" v-if="holding">
        <span class="label">我的持有</span>
        <span class="num big">{{ fmt(holding.shares, 4) }} 份</span>
        <span class="sub">
          成本 ¥{{ fmt(holding.cost) }} ·
          <span class="num" :class="holdingPnl >= 0 ? 'positive' : 'negative'">{{ holdingPnl >= 0 ? '+' : '' }}{{ fmt(holdingPnl) }}（{{ pct(holdingPnlRate) }}）</span>
        </span>
      </div>
    </div>

    <div class="stage-row">
      <div class="card stage" v-for="s in stageReturns" :key="s.label">
        <span class="stage-label">{{ s.label }}</span>
        <span class="num" :class="s.v >= 0 ? 'positive' : 'negative'">{{ pct(s.v) }}</span>
      </div>
    </div>

    <div class="chart-block card">
      <div class="chart-head">
        <span>净值走势 · 近120日 + 持有期</span>
        <span class="chart-now num">当前 {{ fmt(portfolio.nav[asset.id], 4) }}</span>
      </div>
      <div ref="chartEl" class="nav-chart"></div>
    </div>

    <div class="actions">
      <button class="cta" @click="showTrade = true">买入</button>
      <button class="cta secondary" v-if="holding" @click="showTrade = true">卖出 / 查看持仓</button>
      <button class="day-btn" @click="advanceDay" title="临时调试：推进一个交易日">⏩ +1天</button>
    </div>

    <details class="card rules">
      <summary>交易规则</summary>
      <ul>
        <li>申购费率 {{ (asset.trade.buyFee * 100).toFixed(3) }}%</li>
        <li>赎回费：{{ asset.trade.sellFee }}</li>
        <li>确认 T+{{ asset.trade.confirmDays }}，到账 T+{{ asset.trade.redeemDays }}</li>
        <li>起投 {{ asset.trade.minAmount }} 元</li>
      </ul>
    </details>
    <details class="card rules">
      <summary>运作费用（每天从净值里扣，你不用另付）</summary>
      <ul>
        <li>管理费 {{ (asset.fees.mgmt * 100).toFixed(2) }}%/年 · 托管费 {{ (asset.fees.custody * 100).toFixed(2) }}%/年<template v-if="asset.fees.sales"> · 销售服务费 {{ (asset.fees.sales * 100).toFixed(2) }}%/年</template></li>
      </ul>
    </details>
    <details class="card rules">
      <summary>基金档案</summary>
      <ul>
        <li>成立 {{ asset.info.founded }} · 规模 {{ asset.info.size }}</li>
        <li>基金经理：{{ asset.info.manager }}</li>
        <li>对比基准：{{ asset.info.benchmark }}</li>
      </ul>
    </details>

    <p class="real-ref">现实中同类产品：{{ asset.realRef }}。本页数据为模拟数据，不构成投资建议。</p>

    <!-- 市场解读教学 -->
    <div class="card insight">
      <h3>📖 如何看懂这只基金</h3>
      <div class="insight-grid">
        <div class="insight-item">
          <b>波动率意味着什么</b>
          <p>年化波动 {{ (asset.volatility * 100).toFixed(0) }}% 意味着：在极端行情下，单日可能涨跌 {{ (asset.dailyLimit[0] * 100).toFixed(1) }}%。如果你无法承受这个波动，就不应该买。</p>
        </div>
        <div class="insight-item">
          <b>与大盘的关联度</b>
          <p>与沪深300的相关系数 {{ asset.correlation }}。{{ asset.correlation > 0.5 ? '高度联动，大盘涨它大概率涨，大盘跌它也难独善其身。' : asset.correlation < 0 ? '负相关，大盘跌时它可能逆势上涨，是组合中的"稳定器"。' : '低相关，走势相对独立，可以分散风险。' }}</p>
        </div>
        <div class="insight-item">
          <b>历史表现参考</b>
          <p>参考年化 {{ (asset.retRate * 100).toFixed(1) }}%，但历史不代表未来。注意：高收益必然伴随高波动，宣称"高收益低风险"的都是骗局。</p>
        </div>
        <div class="insight-item">
          <b>适合什么场景</b>
          <p>{{ asset.category === 'cash' ? '随时要用的钱，放这里比银行卡活期强。' : asset.category === 'bond' ? '1-3年内要用的钱，比货币基金收益高，但要能承受短期小幅亏损。' : asset.category === 'equity' ? '3年以上不用的闲钱，用时间消化波动，长期正收益概率高。' : asset.category === 'industry' ? '看好某个行业的长期发展，但要接受行业政策风险和集中度风险。' : asset.category === 'overseas' ? '分散A股单一市场风险，但确认和到账更慢，汇率也有影响。' : '避险资产，不生息但能在恐慌时保值，适合配置5-10%。' }}</p>
        </div>
      </div>
    </div>

    <TradeModal v-if="showTrade" :asset-id="asset.id" @close="showTrade = false"
      @first-buy="(a) => (firstBuyTip = a)" />
    <div v-if="firstBuyTip" class="modal-mask" @click.self="firstBuyTip = null">
      <div class="modal card teach">
        <h3>第一次买入 {{ firstBuyTip.name }}</h3>
        <p>{{ firstBuyTip.firstBuyTip }}</p>
        <button class="cta" @click="firstBuyTip = null">我知道了</button>
      </div>
    </div>
  </div>
  <div v-else class="placeholder card">未找到该资产</div>
</template>

<style scoped>
.title { font-size: var(--text-3xl); font-weight: var(--font-bold); letter-spacing: -0.01em; margin-bottom: var(--space-2); }
.risk { font-size: var(--text-sm); background: var(--warning-bg); color: var(--warning); padding: 4px 10px; border-radius: var(--radius-sm); vertical-align: middle; margin-left: var(--space-2); }
.intro { color: var(--text-secondary); margin: 0 0 var(--space-6); line-height: var(--leading-normal); }
.row { display: flex; gap: var(--space-4); margin-bottom: var(--space-4); flex-wrap: wrap; }
.stage-row { display: flex; gap: var(--space-3); margin-bottom: var(--space-4); }
.stage { flex: 1; display: flex; flex-direction: column; gap: var(--space-1); padding: var(--space-4) var(--space-5); }
.stage-label { color: var(--text-tertiary); font-size: var(--text-xs); }
.stage .num { font-size: var(--text-base); font-weight: var(--font-semibold); }
.price-card { flex: 1; min-width: 160px; display: flex; flex-direction: column; gap: var(--space-2); padding: var(--space-5) var(--space-6); }
.label { color: var(--text-secondary); font-size: var(--text-sm); }
.big { font-size: var(--text-2xl); font-weight: var(--font-bold); }
.sub { color: var(--text-tertiary); font-size: var(--text-xs); }
.placeholder { color: var(--text-tertiary); text-align: center; padding: var(--space-12); margin-bottom: var(--space-4); }
.chart-block { margin-bottom: var(--space-4); padding: var(--space-6); }
.chart-head { display: flex; justify-content: space-between; align-items: center; font-size: var(--text-sm); color: var(--text-secondary); padding: 0 0 var(--space-3); }
.chart-now { font-weight: var(--font-semibold); color: var(--text-primary); }
.nav-chart { width: 100%; height: 240px; }
.actions { display: flex; gap: var(--space-3); margin: var(--space-6) 0; align-items: center; }
.cta { background: var(--brand-accent); color: var(--text-on-color); border: none; padding: var(--space-3) var(--space-8); border-radius: var(--radius-md); font-size: var(--text-base); font-weight: var(--font-medium); cursor: pointer; }
.cta:hover { opacity: 0.9; }
.cta.secondary { background: var(--bg-card); color: var(--brand-accent); border: 1px solid var(--brand-accent); }
.day-btn { margin-left: auto; border: 1px dashed var(--border-strong); background: none; color: var(--text-tertiary); border-radius: var(--radius-md); padding: var(--space-2) var(--space-4); cursor: pointer; font-size: var(--text-sm); }
.rules { margin-bottom: var(--space-3); color: var(--text-secondary); font-size: var(--text-sm); padding: var(--space-4) var(--space-6); }
.rules summary { cursor: pointer; font-weight: var(--font-semibold); color: var(--text-primary); padding: var(--space-2) 0; }
.rules ul { margin: var(--space-3) 0 var(--space-2); padding-left: var(--space-6); display: flex; flex-direction: column; gap: var(--space-2); }
.real-ref { color: var(--text-tertiary); font-size: var(--text-sm); margin-top: var(--space-8); line-height: var(--leading-normal); }

/* 市场解读教学 */
.insight { margin-top: var(--space-4); padding: var(--space-6); }
.insight h3 { font-size: var(--text-lg); font-weight: var(--font-bold); margin-bottom: var(--space-4); }
.insight-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: var(--space-4); }
.insight-item { background: var(--bg-subtle); border-radius: var(--radius-md); padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-2); }
.insight-item b { font-size: var(--text-sm); color: var(--text-primary); }
.insight-item p { font-size: var(--text-xs); color: var(--text-secondary); line-height: var(--leading-relaxed); margin: 0; }
.modal-mask { position: fixed; inset: 0; background: rgba(125, 107, 143, 0.25); display: flex; align-items: center; justify-content: center; z-index: 100; padding: var(--space-4); }
.teach { max-width: 420px; padding: var(--space-6); }
.teach h3 { margin-bottom: var(--space-4); font-size: var(--text-lg); }
.teach p { color: var(--text-secondary); font-size: var(--text-sm); line-height: var(--leading-loose); margin-bottom: var(--space-5); white-space: pre-line; }
</style>
