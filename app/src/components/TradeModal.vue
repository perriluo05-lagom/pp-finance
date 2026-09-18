<script setup>
import { ref, computed } from 'vue'
import { byId } from '../data/assets'
import { usePortfolioStore } from '../stores/portfolio'

const props = defineProps({ assetId: String })
const emit = defineEmits(['close', 'first-buy'])
const portfolio = usePortfolioStore()
const asset = byId(props.assetId)

const mode = ref('buy') // buy | sell
const amount = ref('')
const sellShares = ref('')
const quickRedeem = ref(false)
const result = ref(null) // { order } | { error }

const holding = computed(() => portfolio.holdings[props.assetId])
const maxSellShares = computed(() => holding.value?.shares ?? 0)

const feePreview = computed(() => {
  const v = parseFloat(amount.value)
  if (isNaN(v) || v <= 0) return null
  return v * asset.trade.buyFee
})

const sellFeePreview = computed(() => {
  const s = parseFloat(sellShares.value)
  if (isNaN(s) || s <= 0 || !holding.value) return null
  const holdDays = portfolio.day - holding.value.buyDay
  const gross = s * portfolio.nav[asset.id]
  let rate = 0
  if (holdDays < 7) rate = 0.015
  else if (asset.category === 'bond' && holdDays < 30) rate = 0.005
  else if (asset.category === 'equity') rate = 0.0005
  return { gross, fee: gross * rate, holdDays, rate }
})

const submit = () => {
  if (mode.value === 'buy') {
    const v = parseFloat(amount.value)
    if (isNaN(v) || v <= 0) { result.value = { error: '请输入有效金额' }; return }
    const r = portfolio.submitBuy(asset.id, v)
    result.value = r
    if (r.order) {
      const seen = JSON.parse(localStorage.getItem('seen-first-buy') ?? '[]')
      if (!seen.includes(asset.id)) {
        seen.push(asset.id)
        localStorage.setItem('seen-first-buy', JSON.stringify(seen))
        emit('first-buy', asset)
      }
    }
  } else {
    const s = parseFloat(sellShares.value)
    if (isNaN(s) || s <= 0) { result.value = { error: '请输入有效份额' }; return }
    result.value = portfolio.submitSell(asset.id, s, quickRedeem.value)
  }
}

const fmt = (v, d = 2) => Number(v).toFixed(d)
</script>

<template>
  <div class="modal-mask" @click.self="emit('close')">
    <div class="modal card">
      <div class="modal-head">
        <span class="title">{{ mode === 'buy' ? '买入' : '卖出' }} · {{ asset.name }}</span>
        <button class="close" @click="emit('close')">✕</button>
      </div>

      <template v-if="!result || result.error">
        <div class="tabs">
          <button :class="{ active: mode === 'buy' }" @click="mode = 'buy'">买入</button>
          <button :class="{ active: mode === 'sell' }" @click="mode = 'sell'" :disabled="!holding">卖出</button>
        </div>

        <div class="info-row">
          <span>可用资金 <b class="num">¥{{ fmt(portfolio.cash) }}</b></span>
          <span v-if="holding">持有 <b class="num">{{ fmt(holding.shares, 4) }}</b> 份</span>
        </div>

        <template v-if="mode === 'buy'">
          <label class="label">买入金额（元）</label>
          <input v-model="amount" type="number" :min="asset.trade.minAmount" step="0.01" class="input num" placeholder="0.00">
          <p v-if="feePreview !== null" class="hint">申购费 ¥{{ fmt(feePreview) }}（费率{{ (asset.trade.buyFee * 100).toFixed(3) }}%）</p>
          <p class="hint">{{ asset.trade.confirmDays === 1 ? '今日下单按今日净值，T+1确认份额' : `QDII基金确认较慢，T+${asset.trade.confirmDays}确认` }}</p>
        </template>

        <template v-else>
          <label class="label">卖出份额</label>
          <input v-model="sellShares" type="number" :max="maxSellShares" step="0.0001" class="input num" placeholder="0.0000">
          <div class="btn-row">
            <button class="mini" @click="sellShares = maxSellShares.toFixed(4)">全部</button>
          </div>
          <label v-if="asset.id === 'fund-cash-01'" class="check-row">
            <input v-model="quickRedeem" type="checkbox">
            <span>快赎（T+0到账，今日剩余额度 ¥{{ fmt(10000 - portfolio.quickRedeemUsedToday, 0) }}）</span>
          </label>
          <p v-if="sellFeePreview" class="hint"
             :class="{ warn: sellFeePreview.rate >= 0.015 }">
            持有{{ sellFeePreview.holdDays }}天 · 赎回费 ¥{{ fmt(sellFeePreview.fee) }}（{{ (sellFeePreview.rate * 100).toFixed(2) }}%）
            <template v-if="sellFeePreview.rate >= 0.015">—— 持有不足7天，惩罚性费率！</template>
          </p>
        </template>

        <p v-if="result?.error" class="error">{{ result.error }}</p>
        <button class="cta" @click="submit">{{ mode === 'buy' ? '确认买入' : '确认卖出' }}</button>
      </template>

      <template v-else>
        <div class="success">
          <div class="ok">✓ {{ result.order.type === 'buy' ? '买入' : '卖出' }}申请已提交</div>
          <p v-if="result.order.status === 'pending'">预计第 {{ result.order.confirmDay }} 个交易日确认，确认后可在持仓页查看</p>
          <p v-else>快赎即时到账，资金已回到可用余额</p>
          <button class="cta" @click="emit('close')">好的</button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.modal-mask { position: fixed; inset: 0; background: rgba(125, 107, 143, 0.25); display: flex; align-items: center; justify-content: center; z-index: 100; padding: var(--space-4); }
.modal { width: 100%; max-width: 440px; padding: var(--space-6) var(--space-6) var(--space-6); }
.modal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-5); padding-bottom: var(--space-3); border-bottom: 1px solid var(--border-default); }
.title { font-size: var(--text-xl); font-weight: var(--font-semibold); }
.close { border: none; background: none; cursor: pointer; color: var(--text-tertiary); font-size: var(--text-lg); padding: var(--space-1); border-radius: var(--radius-sm); }
.close:hover { background: var(--bg-hover); }
.tabs { display: flex; gap: var(--space-2); margin-bottom: var(--space-5); }
.tabs button { flex: 1; padding: var(--space-3); border-radius: var(--radius-md); border: 1px solid var(--border-default); background: var(--bg-card); color: var(--text-secondary); cursor: pointer; font-size: var(--text-sm); font-weight: var(--font-medium); }
.tabs button.active { background: var(--brand-accent); color: var(--text-on-color); border-color: var(--brand-accent); }
.tabs button:disabled { opacity: 0.4; cursor: not-allowed; }
.info-row { display: flex; justify-content: space-between; color: var(--text-secondary); font-size: var(--text-sm); margin-bottom: var(--space-5); padding: var(--space-3) var(--space-4); background: var(--bg-subtle); border-radius: var(--radius-md); }
.label { font-size: var(--text-sm); color: var(--text-secondary); display: block; margin-bottom: var(--space-3); font-weight: var(--font-medium); }
.input { width: 100%; padding: var(--space-4); border: 1px solid var(--border-default); border-radius: var(--radius-md); font-size: var(--text-lg); outline: none; box-sizing: border-box; }
.input:focus { border-color: var(--brand-accent); box-shadow: 0 0 0 3px rgba(125, 107, 143, 0.12); }
.hint { color: var(--text-tertiary); font-size: var(--text-xs); margin-top: var(--space-3); line-height: var(--leading-normal); }
.hint.warn { color: var(--warning); font-weight: var(--font-medium); }
.btn-row { display: flex; justify-content: flex-end; margin: var(--space-2) 0; }
.mini { border: 1px solid var(--border-default); background: var(--bg-subtle); border-radius: var(--radius-sm); padding: 4px 12px; font-size: var(--text-xs); color: var(--text-secondary); cursor: pointer; }
.mini:hover { border-color: var(--brand-accent); color: var(--brand-accent); }
.check-row { display: flex; align-items: center; gap: var(--space-2); font-size: var(--text-sm); color: var(--text-secondary); margin: var(--space-4) 0; }
.error { color: var(--negative); font-size: var(--text-sm); margin: var(--space-3) 0; padding: var(--space-2) var(--space-3); background: var(--negative-bg); border-radius: var(--radius-sm); }
.cta { width: 100%; margin-top: var(--space-5); background: var(--brand-accent); color: var(--text-on-color); border: none; padding: var(--space-4); border-radius: var(--radius-md); font-size: var(--text-base); font-weight: var(--font-semibold); cursor: pointer; }
.cta:hover { opacity: 0.9; }
.success { text-align: center; padding: var(--space-6) 0; }
.ok { font-size: var(--text-xl); color: var(--positive); font-weight: var(--font-semibold); margin-bottom: var(--space-4); }
.success p { color: var(--text-secondary); font-size: var(--text-sm); margin-bottom: var(--space-5); line-height: var(--leading-normal); }
</style>
