<script setup>
import { ref, computed } from 'vue'
import { usePortfolioStore } from '../stores/portfolio'

const portfolio = usePortfolioStore()

// 用户画像（从 localStorage 读取）
const LS_QUIZ_KEY = 'sim-learn-v1'
const quizData = ref(JSON.parse(localStorage.getItem(LS_QUIZ_KEY) ?? 'null'))

const profile = computed(() => {
  if (!quizData.value?.quizDone) return null
  // 重新计算画像（与 Learn.vue 逻辑一致）
  const answers = quizData.value.quizAnswers ?? []
  const quiz = [
    { scores: [3, 2, 1] },
    { scores: [1, 2, 3, 4] },
    { scores: [2, 2, 2, 3] },
    { scores: [3, 2, 1] },
    { scores: [1, 2, 3, 4] },
    { scores: [1, 2, 3, 4] },
    { scores: [1, 2, 3, 4] },
    { scores: [1, 2, 3, 4] },
    { scores: [1, 2, 3, 4] },
    { scores: [1, 2, 3, 4] },
  ]
  const total = answers.reduce((s, a, i) => (a === null ? s : s + quiz[i].scores[a]), 0)
  if (total <= 14) return { name: '保守型', level: 'R1-R2' }
  if (total <= 20) return { name: '稳健型', level: 'R2-R3' }
  if (total <= 27) return { name: '平衡型', level: 'R3' }
  if (total <= 33) return { name: '成长型', level: 'R3-R4' }
  return { name: '激进型', level: 'R4' }
})

// 剧本E通关状态
const scenarioState = ref(JSON.parse(localStorage.getItem('sim-scenario-state') ?? 'null'))
const scenarioEDone = computed(() => scenarioState.value?.done?.E === true)

// 开户渠道对比
const channels = [
  {
    name: '支付宝 / 蚂蚁财富',
    pros: ['零门槛，1元起投', '申购费1折', '界面友好，适合新手', '货币基金直接当余额'],
    cons: ['只能买场外基金', '没有股票/ETF', '部分产品费率不透明'],
    suitable: '只买基金、不想开证券账户',
    fee: '申购费0.1%-0.15%（1折后）',
  },
  {
    name: '天天基金',
    pros: ['产品最全（8000+只）', '申购费1折', '数据详细，对比方便', '支持定投'],
    cons: ['只能买场外基金', '界面信息密度高，新手可能晕'],
    suitable: '想认真选基金、做对比',
    fee: '申购费0.12%-0.15%（1折后）',
  },
  {
    name: '券商App（如华泰、中信、东方财富）',
    pros: ['能买场内ETF（费率更低）', '能买股票、可转债', '专业工具多', '部分券商佣金可谈'],
    cons: ['开户流程稍复杂（身份证+视频认证）', '界面专业度高，学习成本'],
    suitable: '想买ETF、股票，或追求更低费率',
    fee: 'ETF佣金万0.5-万2.5（可谈）；股票万2.5起',
  },
]

// 品类选择标准
const categoryGuide = [
  {
    category: '货币基金',
    criteria: ['规模>100亿（流动性好）', '7日年化接近同类平均', '支持快赎（T+0到账1万）'],
    examples: ['余额宝（天弘）', '微信零钱通（多家）'],
    note: '示例非推荐，请自行对比',
  },
  {
    category: '纯债基金',
    criteria: ['成立>3年', '最大回撤<-3%', '规模20-200亿', '机构持有比例<50%'],
    examples: ['易方达纯债债券A', '招商产业债A'],
    note: '示例非推荐，请自行对比',
  },
  {
    category: '宽基指数（沪深300/中证500）',
    criteria: ['费率最低（管理费<0.5%）', '规模>50亿', '跟踪误差<0.35%', '成立>3年'],
    examples: ['华夏沪深300ETF联接A', '易方达沪深300ETF联接A'],
    note: '示例非推荐，请自行对比',
  },
  {
    category: 'QDII（纳斯达克100）',
    criteria: ['费率<1%', '规模>20亿', '额度充足（不限购）', '跟踪误差<1%'],
    examples: ['易方达纳斯达克100ETF联接A', '华夏纳斯达克100ETF'],
    note: '示例非推荐，请自行对比',
  },
  {
    category: '黄金ETF联接',
    criteria: ['费率<0.6%', '规模>50亿', '跟踪误差<0.5%', '支持定投'],
    examples: ['华安黄金ETF联接A', '博时黄金ETF联接A'],
    note: '示例非推荐，请自行对比',
  },
]

// 画像对应配置
const profileAllocation = {
  '保守型': {
    desc: '你的底线是本金安全。货币+纯债为主，几乎不碰股票。',
    allocation: [
      { type: '货币基金', ratio: 70, purpose: '活钱管理，随时能用' },
      { type: '纯债基金', ratio: 30, purpose: '比货币收益高一点，波动可控' },
    ],
  },
  '稳健型': {
    desc: '债券打底，少量股票增厚收益。回撤控制在你能睡着的范围。',
    allocation: [
      { type: '货币基金', ratio: 30, purpose: '应急资金' },
      { type: '纯债基金', ratio: 30, purpose: '稳定底仓' },
      { type: '二级债基', ratio: 20, purpose: '稳中带冲' },
      { type: '沪深300指数', ratio: 15, purpose: '少量股票增厚' },
      { type: '黄金', ratio: 5, purpose: '分散风险' },
    ],
  },
  '平衡型': {
    desc: '股债均衡，涨时能跟上，跌时扛得住。',
    allocation: [
      { type: '货币基金', ratio: 15, purpose: '应急资金' },
      { type: '纯债基金', ratio: 20, purpose: '稳定底仓' },
      { type: '二级债基', ratio: 15, purpose: '增强收益' },
      { type: '沪深300指数', ratio: 30, purpose: '主力仓位' },
      { type: '中证500', ratio: 10, purpose: '中盘增强' },
      { type: '黄金', ratio: 10, purpose: '分散风险' },
    ],
  },
  '成长型': {
    desc: '以宽基指数为主力，愿意用波动换长期收益。',
    allocation: [
      { type: '货币基金', ratio: 10, purpose: '应急资金' },
      { type: '纯债基金', ratio: 10, purpose: '少量稳定' },
      { type: '沪深300指数', ratio: 35, purpose: '主力仓位' },
      { type: '中证500', ratio: 15, purpose: '中盘增强' },
      { type: '创业板指数', ratio: 10, purpose: '成长风格' },
      { type: 'QDII（纳斯达克）', ratio: 10, purpose: '跨市场分散' },
      { type: '黄金', ratio: 10, purpose: '分散风险' },
    ],
  },
  '激进型': {
    desc: '股票为主甚至行业基金、QDII。高收益的门票是高波动。',
    allocation: [
      { type: '货币基金', ratio: 5, purpose: '应急资金' },
      { type: '沪深300指数', ratio: 30, purpose: '主力仓位' },
      { type: '中证500', ratio: 15, purpose: '中盘增强' },
      { type: '创业板指数', ratio: 15, purpose: '成长风格' },
      { type: '行业基金（消费/医药）', ratio: 15, purpose: '行业集中' },
      { type: 'QDII（纳斯达克）', ratio: 15, purpose: '跨市场分散' },
      { type: '黄金', ratio: 5, purpose: '少量分散' },
    ],
  },
}

const currentAllocation = computed(() => {
  if (!profile.value) return null
  return profileAllocation[profile.value.name]
})

// 定投计划模板
const dcaTemplate = [
  { step: '选产品', detail: '从你的画像配置里选1-2只宽基指数（如沪深300+中证500）' },
  { step: '定金额', detail: '每月生活费结余的30-50%，建议500-2000元起' },
  { step: '设周期', detail: '每月固定日期（如发薪日后3天），遇节假日顺延' },
  { step: '设止盈', detail: '累计收益达20-30%时，赎回一半锁定利润，剩余继续' },
  { step: '坚持', detail: '至少坚持2年，横盘期是定投的朋友、梭哈的敌人' },
]

// 第一笔买入清单
const firstBuyChecklist = [
  '金额≤你能承受全亏的数（建议先投1000元试水）',
  '产品和模拟盘里玩过的是同类（别买没理解的东西）',
  '15:00前下单（否则按下一交易日净值）',
  '截图记录买入理由（一年后回来对答案）',
  '设置定投，别一次性梭哈',
]
</script>

<template>
  <div class="graduation">
    <div class="page-head">
      <h1>毕业出口</h1>
      <p class="page-sub">从模拟到真实 · 你已经准备好了</p>
    </div>

    <!-- 毕业证书 -->
    <div v-if="scenarioEDone" class="card certificate">
      <div class="cert-badge">🎓</div>
      <h2>毕业证书</h2>
      <p class="cert-text">你已经比70%的真实投资者更能管住手。</p>
      <p class="cert-sub">接下来，用真钱但小钱开始——第一笔，建议从货币基金或定投宽基指数开始。</p>
    </div>
    <div v-else class="card cert-hint">
      <p>⚠️ 你还没有通关剧本E「毕业大考」。</p>
      <router-link to="/scenario" class="link">去通关 →</router-link>
    </div>

    <!-- 你的画像 -->
    <div v-if="profile" class="card profile-card">
      <h3>你的风险画像</h3>
      <div class="profile-tag">{{ profile.name }}（{{ profile.level }}）</div>
      <p class="profile-desc">{{ currentAllocation?.desc }}</p>
      <div class="allocation-list">
        <div v-for="item in currentAllocation?.allocation" :key="item.type" class="alloc-item">
          <span class="alloc-type">{{ item.type }}</span>
          <span class="alloc-ratio num">{{ item.ratio }}%</span>
          <span class="alloc-purpose">{{ item.purpose }}</span>
        </div>
      </div>
    </div>
    <div v-else class="card profile-hint">
      <p>⚠️ 你还没有完成风险测评。</p>
      <router-link to="/learn" class="link">去完成阶段3 →</router-link>
    </div>

    <!-- 开户渠道对比 -->
    <div class="section">
      <h3>开户渠道怎么选</h3>
      <div class="channel-grid">
        <div v-for="ch in channels" :key="ch.name" class="card channel-card">
          <h4>{{ ch.name }}</h4>
          <div class="ch-section">
            <span class="ch-label">✅ 优点</span>
            <ul>
              <li v-for="p in ch.pros" :key="p">{{ p }}</li>
            </ul>
          </div>
          <div class="ch-section">
            <span class="ch-label">⚠️ 缺点</span>
            <ul>
              <li v-for="c in ch.cons" :key="c">{{ c }}</li>
            </ul>
          </div>
          <div class="ch-section">
            <span class="ch-label">💰 费率</span>
            <p>{{ ch.fee }}</p>
          </div>
          <div class="ch-suitable">
            <span class="ch-label">适合</span>
            <p>{{ ch.suitable }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 品类选择标准 -->
    <div class="section">
      <h3>每类产品怎么挑</h3>
      <div class="category-list">
        <div v-for="cat in categoryGuide" :key="cat.category" class="card category-card">
          <h4>{{ cat.category }}</h4>
          <div class="cat-section">
            <span class="cat-label">选择标准</span>
            <ul>
              <li v-for="c in cat.criteria" :key="c">{{ c }}</li>
            </ul>
          </div>
          <div class="cat-section">
            <span class="cat-label">市面常见产品（仅为示例，非推荐）</span>
            <p class="cat-examples">{{ cat.examples.join('、') }}</p>
          </div>
          <p class="cat-note">⚠️ {{ cat.note }}。请在真实App里对比费率、规模、跟踪误差后自行决定。</p>
        </div>
      </div>
    </div>

    <!-- 定投计划模板 -->
    <div class="section">
      <h3>定投计划模板</h3>
      <div class="card dca-card">
        <div class="dca-steps">
          <div v-for="(step, i) in dcaTemplate" :key="i" class="dca-step">
            <span class="dca-no num">{{ i + 1 }}</span>
            <div class="dca-content">
              <b>{{ step.step }}</b>
              <p>{{ step.detail }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 第一笔真实买入清单 -->
    <div class="section">
      <h3>第一笔真实买入前，先过一遍这个清单</h3>
      <div class="card checklist-card">
        <ul class="checklist">
          <li v-for="item in firstBuyChecklist" :key="item">
            <input type="checkbox" :id="'chk-' + item" />
            <label :for="'chk-' + item">{{ item }}</label>
          </li>
        </ul>
      </div>
    </div>

    <!-- 防割指南 -->
    <div class="card warning-card">
      <h3>🛡️ 防割指南</h3>
      <ul>
        <li><b>内幕消息 = 陷阱</b>。真有内幕的人不会告诉你。</li>
        <li><b>年化超15%的宣传 = 警惕</b>。长期稳定15%已经是顶级水平。</li>
        <li><b>借钱投资 = 永不触碰</b>。杠杆把风险乘以N，一次归零就全完了。</li>
        <li><b>「这次不一样」= 最贵的四个字</b>。每次泡沫破裂前，都有人说这次不一样。</li>
      </ul>
    </div>

    <!-- 免责声明 -->
    <div class="disclaimer">
      <p>本页面所有内容仅供教学参考，不构成任何投资建议。</p>
      <p>提及的具体产品名称仅为示例，非推荐。投资有风险，入市需谨慎。</p>
      <p>请在真实App里自行对比、独立决策。</p>
    </div>
  </div>
</template>

<style scoped>
.graduation { display: flex; flex-direction: column; gap: var(--space-6); max-width: 900px; margin: 0 auto; }
.page-head { display: flex; align-items: baseline; gap: var(--space-4); }
h1 { font-size: var(--text-3xl); font-weight: var(--font-bold); letter-spacing: .02em; }
.page-sub { color: var(--text-tertiary); font-size: var(--text-sm); }
h3 { font-size: var(--text-xl); font-weight: var(--font-bold); margin-bottom: var(--space-4); }

/* 毕业证书 */
.certificate { text-align: center; padding: var(--space-12) var(--space-8); background: linear-gradient(135deg, var(--brand-primary) 0%, #fff 100%); }
.cert-badge { font-size: 48px; margin-bottom: var(--space-4); }
.certificate h2 { font-size: var(--text-2xl); margin-bottom: var(--space-4); }
.cert-text { font-size: var(--text-lg); font-weight: var(--font-medium); margin-bottom: var(--space-2); }
.cert-sub { color: var(--text-secondary); font-size: var(--text-sm); }
.cert-hint { text-align: center; padding: var(--space-8); }
.cert-hint p { margin-bottom: var(--space-4); }
.link { color: var(--brand-accent); font-weight: var(--font-semibold); }

/* 画像 */
.profile-card { padding: var(--space-6) var(--space-8); }
.profile-tag { display: inline-block; background: var(--brand-accent); color: var(--text-on-color); font-weight: var(--font-bold); padding: var(--space-2) var(--space-6); border-radius: var(--radius-md); font-size: var(--text-lg); margin-bottom: var(--space-3); }
.profile-desc { color: var(--text-secondary); font-size: var(--text-sm); margin-bottom: var(--space-4); }
.allocation-list { display: flex; flex-direction: column; gap: var(--space-2); }
.alloc-item { display: grid; grid-template-columns: 1fr auto 2fr; gap: var(--space-3); align-items: center; padding: var(--space-2) 0; border-bottom: 1px solid var(--border-default); }
.alloc-item:last-child { border-bottom: none; }
.alloc-type { font-weight: var(--font-medium); }
.alloc-ratio { font-weight: var(--font-bold); color: var(--brand-accent); }
.alloc-purpose { color: var(--text-secondary); font-size: var(--text-sm); }
.profile-hint { text-align: center; padding: var(--space-8); }
.profile-hint p { margin-bottom: var(--space-4); }

/* 渠道对比 */
.section { display: flex; flex-direction: column; gap: var(--space-4); }
.channel-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--space-4); }
.channel-card { padding: var(--space-6); }
.channel-card h4 { font-size: var(--text-lg); font-weight: var(--font-bold); margin-bottom: var(--space-4); }
.ch-section { margin-bottom: var(--space-3); }
.ch-label { font-size: var(--text-xs); color: var(--text-tertiary); display: block; margin-bottom: var(--space-1); }
.ch-section ul { margin: 0; padding-left: var(--space-5); color: var(--text-secondary); font-size: var(--text-sm); }
.ch-section p { margin: 0; color: var(--text-secondary); font-size: var(--text-sm); }
.ch-suitable { background: var(--bg-subtle); border-radius: var(--radius-md); padding: var(--space-3); margin-top: var(--space-3); }

/* 品类选择 */
.category-list { display: flex; flex-direction: column; gap: var(--space-4); }
.category-card { padding: var(--space-6); }
.category-card h4 { font-size: var(--text-lg); font-weight: var(--font-bold); margin-bottom: var(--space-4); }
.cat-section { margin-bottom: var(--space-3); }
.cat-label { font-size: var(--text-xs); color: var(--text-tertiary); display: block; margin-bottom: var(--space-1); }
.cat-section ul { margin: 0; padding-left: var(--space-5); color: var(--text-secondary); font-size: var(--text-sm); }
.cat-examples { color: var(--text-secondary); font-size: var(--text-sm); margin: 0; }
.cat-note { color: var(--warning); font-size: var(--text-xs); margin: var(--space-3) 0 0; padding: var(--space-2); background: var(--warning-bg); border-radius: var(--radius-sm); }

/* 定投模板 */
.dca-card { padding: var(--space-6) var(--space-8); }
.dca-steps { display: flex; flex-direction: column; gap: var(--space-4); }
.dca-step { display: flex; gap: var(--space-4); align-items: flex-start; }
.dca-no { width: 28px; height: 28px; border-radius: 50%; background: var(--brand-accent); color: var(--text-on-color); font-weight: var(--font-bold); display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: var(--text-sm); }
.dca-content b { display: block; margin-bottom: var(--space-1); }
.dca-content p { margin: 0; color: var(--text-secondary); font-size: var(--text-sm); }

/* 清单 */
.checklist-card { padding: var(--space-6) var(--space-8); }
.checklist { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--space-3); }
.checklist li { display: flex; align-items: center; gap: var(--space-3); }
.checklist input[type="checkbox"] { width: 18px; height: 18px; accent-color: var(--brand-accent); }
.checklist label { color: var(--text-primary); font-size: var(--text-sm); cursor: pointer; }

/* 防割指南 */
.warning-card { padding: var(--space-6) var(--space-8); background: var(--warning-bg); border: 1px solid var(--warning); }
.warning-card h3 { color: var(--warning); }
.warning-card ul { margin: 0; padding-left: var(--space-6); color: var(--text-primary); font-size: var(--text-sm); display: flex; flex-direction: column; gap: var(--space-2); }
.warning-card li { line-height: var(--leading-loose); }

/* 免责声明 */
.disclaimer { text-align: center; color: var(--text-tertiary); font-size: var(--text-xs); padding: var(--space-6); border-top: 1px solid var(--border-default); margin-top: var(--space-8); }
.disclaimer p { margin: var(--space-1) 0; }

@media (max-width: 760px) {
  .channel-grid { grid-template-columns: 1fr; }
  .alloc-item { grid-template-columns: 1fr auto; }
  .alloc-purpose { grid-column: 1 / -1; }
}
</style>
