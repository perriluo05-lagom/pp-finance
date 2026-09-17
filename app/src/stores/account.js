import { defineStore } from 'pinia'

// 账户与持久化（T7扩展为完整持仓/交易；T1先做骨架）
const STORAGE_KEY = 'sim-account-v1'

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) } catch { return null }
}

export const useAccountStore = defineStore('account', {
  state: () => {
    const saved = load()
    return {
      initialized: saved?.initialized ?? false,
      cash: saved?.cash ?? 0,
      initialCapital: saved?.initialCapital ?? 0,
      // T6/T7 扩展: holdings, trades, day
      day: saved?.day ?? 0,
    }
  },
  actions: {
    persist() {
      const { initialized, cash, initialCapital, day } = this
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ initialized, cash, initialCapital, day }))
    },
    openAccount() {
      this.initialized = true
      this.cash = 100000
      this.initialCapital = 100000
      this.day = 0
      this.persist()
    },
    reset() {
      localStorage.removeItem(STORAGE_KEY)
      this.$reset()
    },
  },
})
