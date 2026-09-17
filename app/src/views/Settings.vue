<script setup>
import { ref } from 'vue'
import { usePortfolioStore } from '../stores/portfolio'

const portfolio = usePortfolioStore()
const showConfirm = ref(false)
const resetDone = ref(false)

const reset = () => {
  portfolio.reset()
  localStorage.removeItem('sim-scenario-state')
  localStorage.removeItem('seen-first-buy')
  showConfirm.value = false
  resetDone.value = true
  setTimeout(() => location.reload(), 800)
}
</script>

<template>
  <div class="settings">
    <h1>设置</h1>

    <div class="card sec">
      <b>账户数据</b>
      <p class="desc">你的账户、持仓、交易记录、学习进度都存在这台设备的浏览器里（localStorage），不上传任何服务器。清除浏览器数据 = 全部清零。</p>
    </div>

    <div class="card sec">
      <b>重置账户</b>
      <p class="desc">清空所有数据，从「开通账户送10万」重新开始。剧本通关记录也会一并清除。</p>
      <button class="danger" @click="showConfirm = true">重置全部数据</button>
    </div>

    <div class="card sec">
      <b>关于</b>
      <p class="desc">PP理财·模拟盘 —— 给理财小白的虚拟练手场。10只模拟资产、真实基金交易规则、5个历史剧本。所有数据均为虚拟，不构成任何投资建议。</p>
    </div>

    <div v-if="showConfirm" class="modal-mask" @click.self="showConfirm = false">
      <div class="modal card">
        <h3>确定重置？</h3>
        <p class="desc">这一步不可撤销：持仓、交易记录、学习进度、剧本通关记录全部清空。</p>
        <div class="btns">
          <button class="ghost" @click="showConfirm = false">取消</button>
          <button class="danger" @click="reset">确认重置</button>
        </div>
      </div>
    </div>
    <div v-if="resetDone" class="toast">已重置，即将刷新…</div>
  </div>
</template>

<style scoped>
.settings { max-width: 640px; display: flex; flex-direction: column; gap: var(--space-4); }
h1 { font-size: var(--text-3xl); font-weight: var(--font-bold); margin-bottom: var(--space-2); letter-spacing: .02em; }
.sec { padding: var(--space-5) var(--space-6); display: flex; flex-direction: column; gap: var(--space-2); }
.sec b { font-size: var(--text-lg); }
.desc { color: var(--text-secondary); font-size: var(--text-sm); line-height: var(--leading-normal); margin: 0; }
.danger { align-self: flex-start; background: var(--negative); color: #fff; border: none; padding: var(--space-2) var(--space-6); border-radius: var(--radius-md); font-size: var(--text-sm); font-weight: var(--font-semibold); cursor: pointer; }
.ghost { background: none; border: 1px solid var(--border-strong); color: var(--text-secondary); padding: var(--space-2) var(--space-6); border-radius: var(--radius-md); cursor: pointer; font-size: var(--text-sm); }
.modal-mask { position: fixed; inset: 0; background: rgba(33,26,43,.35); display: flex; align-items: center; justify-content: center; z-index: 100; padding: var(--space-4); }
.modal { max-width: 400px; padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-4); }
.modal h3 { font-size: var(--text-lg); }
.btns { display: flex; gap: var(--space-3); justify-content: flex-end; }
.toast { position: fixed; bottom: var(--space-8); left: 50%; transform: translateX(-50%); background: var(--brand-accent); color: #fff; padding: var(--space-3) var(--space-6); border-radius: var(--radius-sm); font-size: var(--text-sm); }
</style>
