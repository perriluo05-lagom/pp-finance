<script setup>
import { computed, ref, onMounted, watch, nextTick } from 'vue'
import { usePortfolioStore } from '../stores/portfolio'
import { generateHistory } from '../engine/market.js'
import * as echarts from 'echarts'

const portfolio = usePortfolioStore()
const chartEl = ref(null)
let chart = null

const fmt = (v) => v.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const pct = (v) => (v >= 0 ? '+' : '') + (v * 100).toFixed(2) + '%'

const isFresh = computed(() => portfolio.initialCapital === 0 || (portfolio.day === 0 && !portfolio.trades.length))

// 总资产历史（day0=本金，之后每天总资产）
const totalSeries = computed(() => {
  const pts = [portfolio.initialCapital]
  const hist = portfolio.navHistory
  const snapshot = Object.entries(portfolio.holdings).filter(([, h]) => h.shares > 1e-6)
  if (!snapshot.length) return pts
  const len = getHistLen()
  for (let d = 1; d <= len; d++) {
    let total = 0
    let hasNav = false
    for (const [id, h] of snapshot) {
      const s = hist[id]
      if (s && s[d] !== undefined) { total += h.shares * s[d]; hasNav = true }
    }
    if (!hasNav) continue
    // 现金部分：本金 - 累计买入成本 + 累计卖出回款（用cost近似）
    pts.push(total + Math.max(0, portfolio.totalValue - totalSeries0(snapshot)))
  }
  return pts
})
// 近似：非持仓部分现金 = 总资产 - 当前持仓市值（简化回放）
function totalSeries0(snapshot) {
  let v = 0
  for (const [id, h] of snapshot) v += h.shares * (portfolio.nav[id] ?? 1)
  return v
}
function getHistLen() {
  const s = Object.values(portfolio.navHistory)[0]
  return s ? s.length - 1 : 0
}

// ECharts 总资产走势
function renderChart() {
  if (!chartEl.value || totalSeries.value.length < 2) return
  chart ??= echarts.init(chartEl.value)
  const s = totalSeries.value
  const up = s[s.length - 1] >= s[0]
  const color = up ? '#3e9a4f' : '#d9536f'
  chart.setOption({
    grid: { left: 8, right: 8, top: 10, bottom: 20, containLabel: false },
    xAxis: {
      type: 'category', show: false, boundaryGap: false,
      data: s.map((_, i) => `第${i}日`),
    },
    yAxis: {
      type: 'value', show: false, scale: true,
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params) => `第${params[0].dataIndex}日 · ¥${fmt(params[0].value)}`,
      backgroundColor: '#fff', borderColor: '#e8e2ee',
      textStyle: { color: '#211a2b', fontSize: 12 },
      confine: true,
    },
    series: [{
      type: 'line', data: s, smooth: true, symbol: 'none',
      lineStyle: { color, width: 2.5 },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [
        { offset: 0, color: up ? 'rgba(62,154,79,.18)' : 'rgba(217,83,111,.18)' },
        { offset: 1, color: 'rgba(0,0,0,0)' },
      ] } },
      markLine: {
        silent: true, symbol: 'none',
        lineStyle: { color: '#c4bacd', type: 'dashed', width: 1 },
        label: { show: false },
        data: [{ yAxis: portfolio.initialCapital }],
      },
    }],
  })
}

onMounted(() => nextTick(renderChart))
watch(totalSeries, () => nextTick(renderChart), { deep: false })
// 容器尺寸变化（响应式断点切换）时重绘
onMounted(() => {
  const ro = new ResizeObserver(() => {
    if (chart) { chart.resize(); }
  })
  if (chartEl.value) ro.observe(chartEl.value)
})

const todayChange = computed(() => portfolio.holdingsDetail.reduce((s, h) => s + h.todayChange, 0))
const invested = computed(() => portfolio.holdingsDetail.reduce((s, h) => s + h.value, 0))
const cashRatio = computed(() => portfolio.totalValue > 0 ? portfolio.cash / portfolio.totalValue : 1)
const cashRatioPct = computed(() => (cashRatio.value * 100).toFixed(1))

// 六阶段进度（学习页状态）
const learnState = ref(JSON.parse(localStorage.getItem('sim-learn-v1') ?? 'null') || { selfTest: null, quizDone: false, done: {} })
const learnProgress = computed(() => {
  const d = learnState.value.done ?? {}
  let n = 0
  if (learnState.value.selfTest) n++
  if (learnState.value.quizDone) n++
  for (const k of ['s1', 's2', 's4', 's5', 's6']) if (d[k]) n++
  return n
})

const topHoldings = computed(() =>
  [...portfolio.holdingsDetail].sort((x, y) => y.value - x.value).slice(0, 4)
)
</script>

<template>
  <!-- 新用户：开通账户 -->
  <div v-if="isFresh" class="welcome">
    <div class="wl-hero">
      <h1>用 10 万虚拟本金，<br>练出真认知。</h1>
      <p class="wl-sub">亏的是假钱，攒的是判断。牛熊剧本任你经历，随时重开。</p>
      <div class="wl-actions">
        <button class="cta" @click="portfolio.openAccount()">开通账户 · 送 ¥100,000 虚拟本金</button>
        <span class="wl-note">纯模拟盘 · 不涉及任何真实资金</span>
      </div>
    </div>
    <div class="wl-row">
      <div class="wl-item"><span class="wl-ic">¥</span><b>10 只虚拟资产</b><em>货币 · 债券 · 指数 · 行业 · 海外 · 黄金</em></div>
      <div class="wl-item"><span class="wl-ic">T+1</span><b>T+1 真实规则</b><em>申赎费率 · 快赎限额，和真实基金一致</em></div>
      <div class="wl-item"><span class="wl-ic">5</span><b>5 个历史剧本</b><em>牛市 · 股灾 · 横盘 · 疫情 · 毕业大考</em></div>
      <router-link to="/scenario" class="wl-item wl-look"><span class="wl-ic">›</span><b>先逛逛剧本 ›</b><em>不开户也能看行情长什么样</em></router-link>
    </div>
  </div>

  <!-- 老用户：满宽数据看板 -->
  <div v-else class="dash">
    <div class="hero card">
      <div class="hero-left">
        <span class="hero-label">总资产（元）</span>
        <span class="hero-num num">{{ fmt(portfolio.totalValue) }}</span>
        <span class="hero-sub">
          <span class="num" :class="portfolio.totalPnl >= 0 ? 'positive' : 'negative'">
            {{ portfolio.totalPnl >= 0 ? '+' : '' }}{{ fmt(portfolio.totalPnl) }}（{{ pct(portfolio.totalPnl / portfolio.initialCapital) }}）
          </span>
          <template v-if="todayChange"> · 今日 <span class="num" :class="todayChange >= 0 ? 'positive' : 'negative'">{{ todayChange >= 0 ? '+' : '' }}{{ fmt(todayChange) }}</span></template>
        </span>
      </div>
      <div class="hero-right">
        <div v-if="totalSeries.length > 1" ref="chartEl" class="hero-chart"></div>
        <div v-else class="hero-placeholder">开始交易后，这里会显示你的总资产走势</div>
      </div>
    </div>

    <div class="kpis">
      <div class="card kpi">
        <span class="kpi-label">持仓市值</span>
        <span class="kpi-num num">{{ fmt(invested) }}</span>
        <span class="kpi-sub">{{ portfolio.holdingsDetail.length }} 只在持仓</span>
      </div>
      <div class="card kpi">
        <span class="kpi-label">可用资金</span>
        <span class="kpi-num num">{{ fmt(portfolio.cash) }}</span>
        <span class="kpi-sub">占总资产 {{ cashRatioPct }}%</span>
      </div>
      <div class="card kpi">
        <span class="kpi-label">累计收益</span>
        <span class="kpi-num num" :class="portfolio.totalPnl >= 0 ? 'positive' : 'negative'">{{ portfolio.totalPnl >= 0 ? '+' : '' }}{{ fmt(portfolio.totalPnl) }}</span>
        <span class="kpi-sub">本金 ¥{{ fmt(portfolio.initialCapital, 0) }}</span>
      </div>
      <div class="card kpi">
        <span class="kpi-label">交易日</span>
        <span class="kpi-num num">{{ portfolio.day }}</span>
        <span class="kpi-sub">{{ portfolio.pendingTrades.length ? portfolio.pendingTrades.length + ' 笔待确认' : '无在途交易' }}</span>
      </div>
    </div>

    <div class="learn-bar card">
      <div class="lb-left">
        <b>学习进度</b>
        <div class="lb-track"><div class="lb-fill" :style="{ width: (learnProgress / 7 * 100) + '%' }"></div></div>
      </div>
      <span class="lb-num num">{{ learnProgress }} / 7</span>
      <router-link to="/learn" class="lb-link">继续学习 ›</router-link>
    </div>

    <div class="mid-grid">
      <div class="card panel">
        <div class="panel-head">
          <h3>持仓明细</h3>
          <router-link to="/portfolio" class="panel-link">全部 ›</router-link>
        </div>
        <div v-if="topHoldings.length" class="holdings-mini">
          <router-link v-for="h in topHoldings" :key="h.id" :to="`/asset/${h.id}`" class="h-row">
            <span class="cat-bar" :style="{ background: `var(${h.asset.colorVar})` }"></span>
            <div class="h-main">
              <span class="h-name">{{ h.asset.name }}</span>
              <span class="h-sub">{{ fmt(h.shares, 0) }} 份 · {{ h.holdDays }} 天</span>
            </div>
            <div class="h-nums">
              <span class="num h-val">¥{{ fmt(h.value) }}</span>
              <span class="num" :class="h.pnl >= 0 ? 'positive' : 'negative'">{{ h.pnl >= 0 ? '+' : '' }}{{ fmt(h.pnl) }}</span>
            </div>
          </router-link>
        </div>
        <div v-else class="empty-wrap">
          <p class="empty">空仓中 · 第一笔投资从低风险的开始</p>
          <router-link to="/market" class="empty-cta">去市场看看</router-link>
        </div>
      </div>

      <div class="card panel">
        <div class="panel-head">
          <h3>快捷操作</h3>
        </div>
        <div class="quick-grid">
          <router-link to="/market" class="quick"><b>市场</b><span>10只资产 · 从稳的开始</span></router-link>
          <router-link to="/scenario" class="quick"><b>剧本</b><span>体验牛市 / 股灾 / 横盘</span></router-link>
          <router-link to="/learn" class="quick"><b>学习</b><span>六阶段 · 零基础到毕业</span></router-link>
          <router-link to="/settings" class="quick"><b>设置</b><span>重置账户</span></router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 欢迎页——上下流式：hero+四卖点行 */
.welcome { display: flex; flex-direction: column; gap: var(--space-8); margin: var(--space-8) 0; }
.wl-hero { display: flex; flex-direction: column; align-items: flex-start; padding: var(--space-12) var(--space-4) 0; }
.wl-hero h1 { font-size: var(--text-hero); font-weight: var(--font-black); margin: 0 0 var(--space-4); line-height: 1.3; color: var(--text-primary); letter-spacing: -0.01em; }
.wl-sub { color: var(--text-secondary); font-size: var(--text-lg); margin: 0 0 var(--space-8); line-height: var(--leading-normal); }
.wl-actions { display: flex; align-items: center; gap: var(--space-4); }
.wl-note { font-size: var(--text-xs); color: var(--text-tertiary); }
.wl-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4); }
.wl-item { background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-lg); padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-3); text-decoration: none; }
.wl-ic { font-family: var(--font-mono); font-size: var(--text-xl); font-weight: var(--font-bold); color: var(--brand-accent); line-height: 1.2; }
.wl-item b { font-size: var(--text-base); font-weight: var(--font-bold); color: var(--text-primary); }
.wl-item em { font-style: normal; font-size: var(--text-xs); color: var(--text-tertiary); line-height: var(--leading-normal); }
.wl-look { border-color: var(--border-strong); background: var(--brand-primary); }
.wl-look b { color: var(--brand-accent-hover); }
.cta { background: var(--brand-accent); color: var(--text-on-color); border: none; padding: var(--space-4) var(--space-8); border-radius: var(--radius-md); font-size: var(--text-lg); cursor: pointer; font-weight: var(--font-bold); letter-spacing: .01em; }
.cta:hover { background: var(--brand-accent-hover); }
@media (max-width: 900px) { .wl-row { grid-template-columns: repeat(2, 1fr); } .wl-hero h1 { font-size: var(--text-2xl); } }
@media (max-width: 560px) { .wl-row { grid-template-columns: 1fr; } }

.dash { display: flex; flex-direction: column; gap: var(--space-6); }
.learn-bar { display: flex; align-items: center; gap: var(--space-6); padding: var(--space-5) var(--space-6); }
.lb-left { flex: 1; display: flex; align-items: center; gap: var(--space-4); }
.lb-left b { font-size: var(--text-base); white-space: nowrap; }
.lb-track { flex: 1; height: 8px; background: var(--bg-subtle); border-radius: var(--radius-sm); overflow: hidden; }
.lb-fill { height: 100%; background: var(--brand-accent); transition: width .3s; }
.lb-num { font-size: var(--text-sm); color: var(--text-secondary); white-space: nowrap; }
.lb-link { color: var(--brand-accent); text-decoration: none; font-size: var(--text-sm); font-weight: var(--font-medium); white-space: nowrap; }
.hero { display: flex; align-items: center; justify-content: space-between; gap: var(--space-8); padding: var(--space-6) var(--space-8); }
.hero-left { display: flex; flex-direction: column; gap: var(--space-2); }
.hero-label { color: var(--text-secondary); font-size: var(--text-sm); }
.hero-num { font-size: var(--text-hero); font-weight: var(--font-bold); letter-spacing: -0.02em; }
.hero-sub { color: var(--text-secondary); font-size: var(--text-sm); }
.hero-right { flex: 1; max-width: 560px; display: flex; flex-direction: column; gap: var(--space-2); }
.hero-chart { width: 100%; height: 150px; }
.hero-placeholder { height: 150px; display: flex; align-items: center; justify-content: center; color: var(--text-tertiary); font-size: var(--text-sm); background: var(--bg-subtle); border-radius: var(--radius-md); }
.kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4); }
.kpi { display: flex; flex-direction: column; gap: var(--space-2); padding: var(--space-5) var(--space-6); }
.kpi-label { color: var(--text-tertiary); font-size: var(--text-sm); }
.kpi-num { font-size: var(--text-xl); font-weight: var(--font-bold); }
.kpi-sub { color: var(--text-tertiary); font-size: var(--text-xs); }
.mid-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: var(--space-4); }
.panel { padding: var(--space-5) var(--space-6); }
.panel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3); }
.panel-head h3 { font-size: var(--text-lg); font-weight: var(--font-bold); }
.panel-link { color: var(--text-tertiary); text-decoration: none; font-size: var(--text-sm); }
.panel-link:hover { color: var(--text-primary); }
.holdings-mini { display: flex; flex-direction: column; }
.h-row { display: flex; align-items: center; gap: var(--space-4); padding: var(--space-3) var(--space-2); border-radius: var(--radius-md); text-decoration: none; color: inherit; position: relative; overflow: hidden; transition: background .12s; }
.h-row:hover { background: var(--bg-subtle); }
.cat-bar { position: absolute; left: 0; top: 8px; bottom: 8px; width: 3px; border-radius: 2px; }
.h-main { flex: 1; display: flex; flex-direction: column; gap: 2px; padding-left: var(--space-2); }
.h-name { font-size: var(--text-base); font-weight: var(--font-semibold); }
.h-sub { font-size: var(--text-xs); color: var(--text-tertiary); }
.h-nums { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
.h-val { font-size: var(--text-base); font-weight: var(--font-semibold); }
.h-nums .num:last-child { font-size: var(--text-xs); }
.empty-wrap { display: flex; flex-direction: column; align-items: center; gap: var(--space-3); padding: var(--space-8) 0; }
.empty { color: var(--text-tertiary); font-size: var(--text-sm); margin: 0; }
.empty-cta { color: var(--brand-accent); font-size: var(--text-sm); text-decoration: none; border: 1px solid var(--brand-accent); padding: var(--space-2) var(--space-6); border-radius: var(--radius-md); }
.empty-cta:hover { background: var(--brand-primary); }
.quick-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }
.quick { display: flex; flex-direction: column; gap: var(--space-1); padding: var(--space-5) var(--space-6); border-radius: var(--radius-md); text-decoration: none; color: inherit; background: var(--bg-subtle); transition: background .12s; }
.quick:hover { background: var(--bg-hover); }
.quick b { font-size: var(--text-base); font-weight: var(--font-semibold); }
.quick span { font-size: var(--text-xs); color: var(--text-tertiary); }

@media (max-width: 900px) {
  .kpis { grid-template-columns: repeat(2, 1fr); }
  .mid-grid { grid-template-columns: 1fr; }
  .hero { flex-direction: column; align-items: flex-start; }
  .hero-chart { width: 100%; max-width: none; }
}
</style>
