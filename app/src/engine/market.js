// T4 · 行情引擎：随机游走 + 联动矩阵（主因子简化模型）
// 与 02-数据设计/资产池设定.md 行为参数一致
//
// 模型：每个交易日，
//   1) 生成一个市场主因子 m（标准正态，代表"大盘今天的心情"）
//   2) 各资产日收益 r_i = drift_i + beta_i * m * vol_i + 特质噪声 * vol_i
//      其中 beta 由 correlation 字段决定
//   3) 夹在 dailyLimit 单日涨跌幅限制内
// 货币基金单独走"万份收益累积"逻辑（每日固定+微随机）

import { ASSETS } from '../data/assets.js'

// --- 可复现的伪随机数（mulberry32），保证同一seed同一行情 ---
export function makeRng(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Box-Muller: 均匀随机 → 标准正态
function normal(rng) {
  const u = Math.max(rng(), 1e-9), v = rng()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

const TRADING_DAYS_PER_YEAR = 244

// 生成一个交易日的全资产收益率（%）
// rng: 随机源 | shock: 市场冲击（剧本事件用，如-0.05=大盘单日-5%）
export function generateDailyReturns(rng, shock = 0) {
  const market = normal(rng) + shock * 10 // 主因子：事件冲击以"多少个标准差"注入
  const out = {}
  for (const a of ASSETS) {
    // 货币基金：万份收益累积
    if (a.settleMode === 'daily-accumulate') {
      out[a.id] = a.special.per10kDaily / 10000 * (0.9 + rng() * 0.2) // ±10%浮动
      continue
    }
    // 漂移项：年化收益均摊到日
    const drift = a.retRate / TRADING_DAYS_PER_YEAR
    // 波动项：年化波动换算到日 + 联动
    const dailyVol = a.volatility / Math.sqrt(TRADING_DAYS_PER_YEAR)
    const idio = normal(rng) * Math.sqrt(Math.max(0, 1 - a.correlation ** 2))
    let r = drift + (a.correlation * market + idio) * dailyVol
    // 二级债：80%债券（自身小波动）+ 20%股票（锚的收益贡献）
    if (a.navMix) {
      const anchorRet = out['fund-index-01'] ?? 0
      const bondRet = drift * 0.8 + normal(rng) * 0.003
      r = bondRet + 0.2 * anchorRet
    }
    // 单日限制
    const [up, down] = a.dailyLimit
    out[a.id] = Math.min(up, Math.max(down, r))
  }
  return out
}

// 生成一段历史（用于详情页走势图 & 自由模式预热）
export function generateHistory(seed, days) {
  const rng = makeRng(seed)
  const nav = {} // 每资产净值序列，起始1.0
  for (const a of ASSETS) nav[a.id] = [1]
  for (let d = 0; d < days; d++) {
    const rets = generateDailyReturns(rng)
    for (const a of ASSETS) {
      const prev = nav[a.id][nav[a.id].length - 1]
      nav[a.id].push(prev * (1 + rets[a.id]))
    }
  }
  return nav
}

// 统计校验（验收用）：年化收益/波动是否落在设定区间
export function auditHistory(seed, days = 500) {
  const nav = generateHistory(seed, days)
  const report = {}
  for (const a of ASSETS) {
    const s = nav[a.id]
    const totalRet = s[s.length - 1] / s[0] - 1
    const annRet = Math.pow(1 + totalRet, TRADING_DAYS_PER_YEAR / days) - 1
    const rets = []
    for (let i = 1; i < s.length; i++) rets.push(s[i] / s[i - 1] - 1)
    const mean = rets.reduce((x, y) => x + y, 0) / rets.length
    const vol = Math.sqrt(rets.reduce((x, y) => x + (y - mean) ** 2, 0) / rets.length) * Math.sqrt(TRADING_DAYS_PER_YEAR)
    report[a.id] = {
      name: a.name,
      目标年化: (a.retRate * 100).toFixed(1) + '%',
      实测年化: (annRet * 100).toFixed(1) + '%',
      目标波动: (a.volatility * 100).toFixed(1) + '%',
      实测波动: (vol * 100).toFixed(1) + '%',
      区间内: Math.abs(annRet - a.retRate) < 0.05 && Math.abs(vol - a.volatility) < 0.06,
    }
  }
  return report
}

// 相关系数校验（黄金与沪深300应为负）
export function auditCorrelation(seed, days = 500) {
  const nav = generateHistory(seed, days)
  const rets = (id) => nav[id].slice(1).map((v, i) => v / nav[id][i] - 1)
  const corr = (x, y) => {
    const mx = x.reduce((a, b) => a + b, 0) / x.length
    const my = y.reduce((a, b) => a + b, 0) / y.length
    const cov = x.reduce((s, v, i) => s + (v - mx) * (y[i] - my), 0)
    const sx = Math.sqrt(x.reduce((s, v) => s + (v - mx) ** 2, 0))
    const sy = Math.sqrt(y.reduce((s, v) => s + (v - my) ** 2, 0))
    return cov / (sx * sy)
  }
  const anchor = rets('fund-index-01')
  return {
    黄金vs沪深300: corr(anchor, rets('fund-gold-01')).toFixed(2),
    中证500vs沪深300: corr(anchor, rets('fund-index-02')).toFixed(2),
    环球科技vs沪深300: corr(anchor, rets('fund-qdii-01')).toFixed(2),
  }
}
