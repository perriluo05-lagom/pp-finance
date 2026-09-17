<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { usePortfolioStore } from './stores/portfolio'

const route = useRoute()
const account = usePortfolioStore()

const navs = [
  { path: '/', label: '总览' },
  { path: '/market', label: '市场' },
  { path: '/portfolio', label: '持仓' },
  { path: '/scenario', label: '剧本' },
  { path: '/learn', label: '学习' },
  { path: '/graduation', label: '毕业' },
]

const fmt = (v) => v.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <router-link to="/" class="logo">
        <span class="logo-mark">PP</span>
        <span class="logo-name">PP理财</span>
        <span class="logo-tag">模拟盘</span>
      </router-link>
      <nav class="nav">
        <router-link
          v-for="n in navs" :key="n.path" :to="n.path"
          class="nav-item" :class="{ active: route.path === n.path }"
        >{{ n.label }}</router-link>
      </nav>
      <div class="balance num" v-if="account.cash > 0 || account.trades.length">
        <span class="balance-label">可用</span>¥{{ fmt(account.cash) }}
      </div>
    </header>
    <main class="page">
      <router-view />
    </main>
    <footer class="disclaimer">
      本页面为教学模拟产品，所有资产、行情与数据均为虚拟，不构成任何投资建议。
    </footer>
  </div>
</template>

<style scoped>
.app-shell { min-height: 100vh; display: flex; flex-direction: column; }
.topbar {
  position: sticky; top: 0; z-index: 10;
  display: flex; align-items: center; gap: var(--space-8);
  background: rgba(255, 255, 255, 0.88); backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border-default);
  padding: var(--space-3) var(--space-8);
}
.logo { display: flex; align-items: center; gap: var(--space-2); text-decoration: none; }
.logo-mark {
  width: 26px; height: 26px; border-radius: var(--radius-sm);
  background: var(--brand-accent); color: var(--text-on-color);
  font-weight: var(--font-bold); font-size: var(--text-xs);
  display: inline-flex; align-items: center; justify-content: center;
  letter-spacing: -0.03em;
}
.logo-name { font-weight: var(--font-bold); color: var(--text-primary); font-size: var(--text-lg); letter-spacing: -0.01em; }
.logo-tag {
  font-size: var(--text-xs); color: var(--text-tertiary);
  border: 1px solid var(--border-strong); border-radius: var(--radius-sm);
  padding: 0 5px; line-height: 18px;
}
.nav { display: flex; gap: var(--space-1); flex: 1; }
.nav-item {
  padding: var(--space-2) var(--space-3); border-radius: var(--radius-md);
  text-decoration: none; color: var(--text-secondary); font-size: var(--text-base);
  font-weight: var(--font-medium);
  transition: all .12s;
}
.nav-item:hover { background: var(--bg-hover); color: var(--text-primary); }
.nav-item.active { color: var(--brand-accent); background: var(--brand-primary); font-weight: var(--font-bold); }
.balance { font-family: var(--font-mono); font-size: var(--text-xl); font-weight: var(--font-bold); color: var(--text-primary); display: flex; align-items: baseline; gap: 6px; }

.balance-label { font-size: var(--text-xs); color: var(--text-tertiary); font-weight: var(--font-regular); }
.disclaimer { text-align: center; color: var(--text-tertiary); font-size: var(--text-xs); padding: var(--space-6); border-top: 1px solid var(--border-default); }

@media (max-width: 760px) {
  .topbar { gap: var(--space-3); padding: var(--space-2) var(--space-4); overflow-x: auto; }
  .logo-name { font-size: var(--text-base); }
  .logo-tag { display: none; }
  .balance { font-size: var(--text-sm); }
}
</style>
