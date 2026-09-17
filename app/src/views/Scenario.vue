<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { SCENARIOS, byScenarioId, buildScenarioSeries } from '../engine/scenario.js'
import { usePortfolioStore } from '../stores/portfolio'
import * as echarts from 'echarts'

const portfolio = usePortfolioStore()

// ---- 剧本状态（localStorage）----
const SS_KEY = 'sim-scenario-state'
const state = ref(JSON.parse(localStorage.getItem(SS_KEY) ?? 'null') || { activeId: null, day: 0, done: {} })
const save = () => localStorage.setItem(SS_KEY, JSON.stringify(state.value))

const active = computed(() => state.value.activeId ? byScenarioId(state.value.activeId) : null)
const activeDay = computed(() => state.value.day)
const series = computed(() => active.value ? buildScenarioSeries(active.value) : null)

// 当日事件
const currentEvent = computed(() => {
  if (!active.value) return null
  return active.value.events.find((e) => e.day === activeDay.value) ?? null
})
const showEvent = ref(true) // 事件弹窗开关（用户点掉后不再弹同一天）

// 开始剧本
const start = (id) => {
  state.value.activeId = id
  state.value.day = 0
  save()
  showEvent.value = true
}
const quit = () => {
  state.value.activeId = null
  state.value.day = 0
  save()
}

// 推进一天：剧本日收益率喂给portfolio
const advance = (step = 1) => {
  for (let i = 0; i < step && activeDay.value < active.value.days; i++) {
    advanceOne()
  }
}
const dayReturns = computed(() => {
  if (!series.value || activeDay.value === 0) return {}
  const out = {}
  for (const key in series.value.series) out[key] = series.value.series[key][activeDay.value - 1] ?? 0
  return out
})
const advanceOne = () => {
  if (activeDay.value >= active.value.days) return
  state.value.day += 1
  showEvent.value = true
  portfolio.advanceDay(dayReturns.value)
  save()
}
const autoPlay = ref(null)
const toggleAuto = () => {
  if (autoPlay.value) { clearInterval(autoPlay.value); autoPlay.value = null }
  else autoPlay.value = setInterval(() => {
    if (activeDay.value >= active.value.days) { toggleAuto(); return }
    advanceOne()
  }, 500)
}

// 结束/复盘
const finished = computed(() => active.value && activeDay.value >= active.value.days)
const finish = () => {
  state.value.done[active.value.id] = true
  state.value.activeId = null
  state.value.day = 0
  save()
}

// 剧情走势图（剧本设计线）
const chartEl = ref(null)
let chart = null
onMounted(renderChart)
watch([active, activeDay], () => nextTick(renderChart))
function renderChart() {
  if (!chartEl.value || !series.value) return
  chart ??= echarts.init(chartEl.value)
  const cum = series.value.cum['fund-index-01']
  const data = cum.slice(0, Math.max(1, activeDay.value)).map((v) => +(v * 100).toFixed(2))
  if (data.length === 1) data.push(data[0])
  chart.setOption({
    grid: { left: 44, right: 12, top: 12, bottom: 24 },
    xAxis: { type: 'category', boundaryGap: false, data: data.map((_, i) => i), axisLabel: { color: '#948aa3', fontSize: 10 }, axisLine: { lineStyle: { color: '#e8e2ee' } } },
    yAxis: { type: 'value', axisLabel: { color: '#948aa3', fontSize: 10, formatter: '{value}%' }, splitLine: { lineStyle: { color: '#f0ebf5' } } },
    tooltip: { trigger: 'axis', formatter: (ps) => `第${ps[0].dataIndex}日 · ${ps[0].value}%`, confine: true },
    series: [{ type: 'line', data, smooth: true, symbol: 'none', lineStyle: { color: '#4a3a5c', width: 2.5 },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [
        { offset: 0, color: 'rgba(74,58,92,.15)' }, { offset: 1, color: 'rgba(0,0,0,0)' }] } } }],
  })
}

const fmt = (v) => v.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const pct = (v) => (v >= 0 ? '+' : '') + (v * 100).toFixed(1) + '%'
const periodPnl = computed(() => {
  if (!active.value || activeDay.value === 0) return 0
  // 剧本期间盈亏 = 当前总资产 - 剧本开始时资产（简化：用初始本金近似起点）
  return portfolio.totalValue - portfolio.initialCapital
})
</script>

<template>
  <div>
    <!-- 无剧本进行中：选剧本 -->
    <div v-if="!active">
      <div class="page-head">
        <h1>剧本</h1>
        <p class="page-sub">真实历史的模拟重演 · 每个剧本都是一次完整的行情体验</p>
      </div>
      <div class="sc-list">
        <button v-for="sc in SCENARIOS" :key="sc.id" class="card sc-card" :class="{ done: state.done[sc.id] }" @click="start(sc.id)">
          <div class="sc-head">
            <b>{{ sc.name }}</b>
            <span v-if="state.done[sc.id]" class="done-tag">✓ 已通关</span>
          </div>
          <p class="sc-desc">{{ sc.prototype }}重演 · {{ sc.emotion }}</p>
          <div class="sc-meta">
            <span>{{ sc.days }}个交易日</span>
            <span class="unlock">{{ sc.unlock }}</span>
            <span class="go">{{ state.done[sc.id] ? '重玩' : '进入' }} ›</span>
          </div>
        </button>
      </div>
    </div>

    <!-- 剧本进行中 -->
    <div v-else class="playing">
      <div class="play-head">
        <div>
          <b class="sc-title">{{ active.name }}</b>
          <span class="day-count num">第 {{ activeDay }} / {{ active.days }} 交易日</span>
        </div>
        <button class="quit" @click="quit">退出</button>
      </div>

      <div class="play-grid">
        <div class="card chart-card">
          <div class="chart-head">
            <span>剧本行情 · 沪深300累计涨幅</span>
            <span class="num" :class="(series.cum['fund-index-01'][activeDay] ?? 0) >= 0 ? 'positive' : 'negative'">
              {{ pct(series.cum['fund-index-01'][activeDay] ?? 0) }}
            </span>
          </div>
          <div ref="chartEl" class="sc-chart"></div>
          <div class="play-ctrl">
            <button class="ctl" @click="advanceOne" :disabled="finished">⏩ 推进一天</button>
            <button class="ctl" @click="advance(5)" :disabled="finished">⏩⏩ +5天</button>
            <button class="ctl auto" @click="toggleAuto">{{ autoPlay ? '⏸ 暂停' : '▶ 自动播放' }}</button>
          </div>
        </div>

        <div class="side">
          <div class="card stat">
            <span class="stat-label">我的总资产</span>
            <span class="stat-num num">{{ fmt(portfolio.totalValue) }}</span>
            <span class="stat-sub num" :class="periodPnl >= 0 ? 'positive' : 'negative'">{{ periodPnl >= 0 ? '+' : '' }}{{ fmt(periodPnl) }}（全程）</span>
          </div>
          <div class="card stat" v-if="portfolio.holdingsDetail.length">
            <span class="stat-label">持仓概览</span>
            <div v-for="h in portfolio.holdingsDetail" :key="h.id" class="mini-h">
              <span>{{ h.asset.name }}</span>
              <span class="num" :class="h.pnl >= 0 ? 'positive' : 'negative'">{{ pct(h.pnlRate) }}</span>
            </div>
          </div>
          <div class="card stat empty-hint" v-else>
            <span class="stat-label">空仓中</span>
            <router-link to="/market" class="buy-link">先去买入资产再推进剧情 ›</router-link>
          </div>
        </div>
      </div>

      <!-- 事件弹窗 -->
      <div v-if="currentEvent && showEvent && !finished" class="modal-mask" @click.self="showEvent = false">
        <div class="modal card event" :class="currentEvent.type">
          <span class="ev-type">{{ { news: '📰 市场消息', shock: '⚡ 剧烈波动', teach: '🎓 教学时刻', tempt: '😈 诱惑测试' }[currentEvent.type] }}</span>
          <p class="ev-text">{{ currentEvent.text }}</p>
          <button class="cta" @click="showEvent = false">知道了，继续</button>
        </div>
      </div>

      <!-- 剧终复盘 -->
      <div v-if="finished" class="modal-mask">
        <div class="modal card review">
          <h2>剧本结束 · {{ active.name }}</h2>
          <div class="rv-nums">
            <div class="rv"><span>你的全程收益</span><b class="num" :class="periodPnl >= 0 ? 'positive' : 'negative'">{{ pct(periodPnl / portfolio.initialCapital) }}</b></div>
            <div class="rv"><span>沪深300同期</span><b class="num">{{ pct(series.cum['fund-index-01'][active.days]) }}</b></div>
            <div class="rv"><span>交易笔数</span><b class="num">{{ portfolio.trades.length }}</b></div>
          </div>
          <p class="rv-text">复盘要点：</p>
          <ul class="rv-list">
            <li v-for="f in active.review.focus" :key="f">{{ f }}</li>
          </ul>
          <div class="rv-btns">
            <button class="cta ghost" @click="quit">重玩这个剧本</button>
            <button class="cta" @click="finish">完成，返回剧本列表</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-head { display: flex; align-items: baseline; gap: var(--space-4); margin-bottom: var(--space-6); }
h1 { font-size: var(--text-3xl); font-weight: var(--font-bold); letter-spacing: .02em; }
.page-sub { color: var(--text-tertiary); font-size: var(--text-sm); }
.sc-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--space-3); }
.sc-card { text-align: left; cursor: pointer; border: 1px solid var(--border-default); padding: var(--space-5) var(--space-6); display: flex; flex-direction: column; gap: var(--space-2); transition: box-shadow .15s, transform .15s; font: inherit; }
.sc-card:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }
.sc-card.done { border-color: var(--positive); }
.sc-head { display: flex; justify-content: space-between; align-items: center; }
.sc-head b { font-size: var(--text-xl); font-weight: var(--font-bold); color: var(--text-primary); }
.done-tag { font-size: var(--text-xs); color: var(--positive); }
.sc-desc { color: var(--text-secondary); font-size: var(--text-sm); margin: 0; line-height: var(--leading-normal); overflow-wrap: anywhere; }
.sc-meta { display: flex; gap: var(--space-4); color: var(--text-tertiary); font-size: var(--text-xs); flex-wrap: wrap; row-gap: 4px; }
.sc-meta .go { margin-left: auto; color: var(--brand-accent); font-weight: var(--font-semibold); }
.play-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-6); }
.sc-title { font-size: var(--text-2xl); font-weight: var(--font-bold); margin-right: var(--space-4); }
.day-count { color: var(--text-tertiary); font-size: var(--text-sm); }
.quit { border: 1px solid var(--border-strong); background: none; border-radius: var(--radius-md); padding: var(--space-2) var(--space-4); cursor: pointer; color: var(--text-secondary); font-size: var(--text-sm); }
.play-grid { display: grid; grid-template-columns: 1.8fr 1fr; gap: var(--space-4); align-items: start; }
.chart-card { padding: var(--space-4) var(--space-6); }
.chart-head { display: flex; justify-content: space-between; font-size: var(--text-sm); color: var(--text-secondary); padding-bottom: var(--space-2); }
.chart-head .num { font-weight: var(--font-bold); font-size: var(--text-lg); }
.sc-chart { width: 100%; height: 260px; }
.play-ctrl { display: flex; gap: var(--space-3); padding-top: var(--space-3); border-top: 1px solid var(--border-default); margin-top: var(--space-2); }
.ctl { flex: 1; background: var(--bg-subtle); border: 1px solid var(--border-default); border-radius: var(--radius-md); padding: var(--space-3); cursor: pointer; font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--text-primary); }
.ctl:hover:not(:disabled) { background: var(--bg-hover); }
.ctl:disabled { opacity: .4; cursor: not-allowed; }
.ctl.auto { background: var(--brand-accent); color: var(--text-on-color); border-color: var(--brand-accent); }
.side { display: flex; flex-direction: column; gap: var(--space-4); }
.stat { padding: var(--space-4) var(--space-6); display: flex; flex-direction: column; gap: var(--space-2); }
.stat-label { color: var(--text-tertiary); font-size: var(--text-sm); }
.stat-num { font-size: var(--text-2xl); font-weight: var(--font-bold); }
.stat-sub { font-size: var(--text-sm); }
.mini-h { display: flex; justify-content: space-between; font-size: var(--text-sm); padding: var(--space-1) 0; }
.empty-hint .buy-link { color: var(--brand-accent); text-decoration: none; font-size: var(--text-sm); font-weight: var(--font-medium); }
.modal-mask { position: fixed; inset: 0; background: rgba(43, 34, 51, 0.40); display: flex; align-items: center; justify-content: center; z-index: 100; padding: var(--space-4); }
.modal { width: 100%; max-width: 480px; padding: var(--space-8); }
.event .ev-type { font-size: var(--text-sm); color: var(--text-tertiary); display: block; margin-bottom: var(--space-3); }
.event.shock { border-color: var(--negative); }
.event.teach { border-color: var(--info); }
.event.tempt { border-color: var(--warning); }
.ev-text { font-size: var(--text-lg); line-height: var(--leading-loose); color: var(--text-primary); margin-bottom: var(--space-6); }
.cta { background: var(--brand-accent); color: var(--text-on-color); border: none; padding: var(--space-3) var(--space-8); border-radius: var(--radius-md); font-size: var(--text-base); font-weight: var(--font-semibold); cursor: pointer; }
.cta.ghost { background: none; color: var(--brand-accent); border: 1px solid var(--brand-accent); }
.review h2 { font-size: var(--text-xl); margin-bottom: var(--space-5); }
.rv-nums { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-3); margin-bottom: var(--space-5); }
.rv { display: flex; flex-direction: column; gap: var(--space-1); background: var(--bg-subtle); border-radius: var(--radius-md); padding: var(--space-3); }
.rv span { font-size: var(--text-xs); color: var(--text-tertiary); }
.rv b { font-size: var(--text-lg); }
.rv-list { margin: 0 0 var(--space-6); padding-left: var(--space-6); color: var(--text-secondary); font-size: var(--text-sm); display: flex; flex-direction: column; gap: var(--space-1); }
.rv-btns { display: flex; gap: var(--space-3); }
.rv-btns .cta { flex: 1; }
@media (max-width: 900px) { .play-grid { grid-template-columns: 1fr; } }
</style>
