import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import './styles/tokens.css'

const routes = [
  { path: '/', name: 'overview', component: () => import('./views/Overview.vue'), meta: { title: '总览' } },
  { path: '/market', name: 'market', component: () => import('./views/Market.vue'), meta: { title: '市场' } },
  { path: '/asset/:id', name: 'asset-detail', component: () => import('./views/AssetDetail.vue'), meta: { title: '资产详情' } },
  { path: '/portfolio', name: 'portfolio', component: () => import('./views/Portfolio.vue'), meta: { title: '持仓' } },
  { path: '/learn', name: 'learn', component: () => import('./views/Learn.vue'), meta: { title: '学习' } },
  { path: '/scenario', name: 'scenario', component: () => import('./views/Scenario.vue'), meta: { title: '剧本' } },
  { path: '/graduation', name: 'graduation', component: () => import('./views/Graduation.vue'), meta: { title: '毕业出口' } },
  { path: '/settings', name: 'settings', component: () => import('./views/Settings.vue'), meta: { title: '设置' } },
]

const router = createRouter({ history: createWebHashHistory(), routes })

createApp(App).use(createPinia()).use(router).mount('#app')
