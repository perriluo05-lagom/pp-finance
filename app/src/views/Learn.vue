<script setup>
import { ref, computed, watch } from 'vue'
import { usePortfolioStore } from '../stores/portfolio'

const portfolio = usePortfolioStore()

// 学习状态持久化
const LS_KEY = 'sim-learn-v1'
const loadLS = () => { try { return JSON.parse(localStorage.getItem(LS_KEY)) } catch { return null } }
const saved = loadLS() ?? { selfTest: null, quizDone: false, done: {} }
const persistLS = () => localStorage.setItem(LS_KEY, JSON.stringify({
  selfTest: selfTestDone.value ? selfTest.value : null,
  quizDone: quizDone.value,
  quizAnswers: quizAnswers.value,
}))

// ---- 阶段0 自测 ----
const selfTest = ref(saved.selfTest ?? { savings: null, monthly: null, horizon: null })
const savingsOpts = ['0', '1000以下', '1000-5000', '5000-2万', '2万以上']
const monthlyOpts = ['基本存不下', '500以内', '500-2000', '2000以上']
const horizonOpts = [
  { v: 'anytime', label: '随时要用' },
  { v: 'half-year', label: '半年内' },
  { v: '1-3y', label: '1-3年' },
  { v: '3y+', label: '3年以上' },
]
const selfTestDone = computed(() => selfTest.value.savings !== null && selfTest.value.monthly !== null && selfTest.value.horizon !== null)
watch(selfTestDone, () => persistLS())
const horizonAdvice = computed(() => {
  if (!selfTestDone.value) return ''
  const h = selfTest.value.horizon
  if (h === 'anytime') return '随时要用的钱：货币基金是唯一答案，其他任何基金都不该买。'
  if (h === 'half-year') return '半年内要用的钱：也只适合货币基金。债券基金都可能亏，别拿它赌。'
  if (h === '1-3y') return '1-3年：货币+债券的组合可以了。股票类基金建议只占小头。'
  return '3年以上：可以认真考虑配置股票类基金了——时间是你消化波动的最大武器。'
})

// ---- 阶段3 风险测评 ----
const showQuiz = ref(false)
const quizAnswers = ref(saved.quizAnswers ?? Array(10).fill(null))
const quizDone = ref(saved.quizDone ?? false)
const quiz = [
  { q: '你的年龄？', opts: ['18-24', '25-30', '30以上'], scores: [3, 2, 1] },
  { q: '预计投资金额占你总资产的比例？', opts: ['10%以内', '10-30%', '30-50%', '50%以上'], scores: [1, 2, 3, 4] },
  { q: '主要收入来源？', opts: ['父母生活费结余', '兼职收入', '奖学金', '已有存款'], scores: [2, 2, 2, 3] },
  { q: '半年内要用的钱，占总投资的比例？', opts: ['10%以内', '10-30%', '30%以上'], scores: [3, 2, 1] },
  { q: '以下哪种描述最像你？', opts: ['求稳，不亏就行', '稳中求进', '愿意接受波动换收益', '追求高收益，不怕大亏'], scores: [1, 2, 3, 4] },
  { q: '如果账面亏损10%，你会？', opts: ['立刻卖出', '减少持有', '不动', '加仓'], scores: [1, 2, 3, 4] },
  { q: '如果账面亏损20%，你会？', opts: ['立刻卖出', '减少持有', '不动', '加仓'], scores: [1, 2, 3, 4] },
  { q: '你的投资知识水平？', opts: ['完全不懂', '懂一点货币基金', '懂股票债券', '系统学过'], scores: [1, 2, 3, 4] },
  { q: '能接受的最大亏损幅度？', opts: ['0%', '5%', '10%', '20%以上'], scores: [1, 2, 3, 4] },
  { q: '投资目标？', opts: ['保本', '跑赢余额宝', '长期增值', '博高收益'], scores: [1, 2, 3, 4] },
]
const quizTotal = computed(() =>
  quizAnswers.value.reduce((s, a, i) => (a === null ? s : s + quiz[i].scores[a]), 0)
)
const profile = computed(() => {
  const t = quizTotal.value
  if (t <= 14) return { name: '保守型', cap: '货币+纯债', desc: '你的底线是本金安全。适合货币基金为主、少量纯债。' }
  if (t <= 20) return { name: '稳健型', cap: '债为主，股点缀', desc: '债券打底，少量股票增厚收益，回撤控制在你能睡着的范围。' }
  if (t <= 27) return { name: '平衡型', cap: '股债对半', desc: '股债均衡，涨时能跟上，跌时扛得住。' }
  if (t <= 33) return { name: '成长型', cap: '股为主', desc: '以宽基指数为主力，愿意用波动换长期收益。' }
  return { name: '激进型', cap: '全仓进攻', desc: '股票为主甚至行业基金、QDII。记住：高收益的门票是高波动。' }
})
const honestyGap = computed(() => {
  const a6 = quizAnswers.value[5], a7 = quizAnswers.value[6]
  return a6 !== null && a7 !== null && a6 - a7 >= 2
})
const submitQuiz = () => { quizDone.value = true; persistLS() }

// ---- 剧本完成状态（从Scenario.vue的localStorage读取）----
const SCENARIO_STATE_KEY = 'sim-scenario-state'
const scenarioState = computed(() => {
  try { return JSON.parse(localStorage.getItem(SCENARIO_STATE_KEY)) ?? { done: {} } } catch { return { done: {} } }
})

// ---- 阶段完成判定逻辑 ----
const stage1Done = computed(() => {
  // 阶段1完成条件：持有货币基金 + 至少推进过1天（看到收益）
  const hasMoneyFund = portfolio.holdings['fund-cash-01']?.shares > 0
  return hasMoneyFund && portfolio.day >= 1
})

const stage2Done = computed(() => {
  // 阶段2完成条件：持有纯债基金 + 至少推进过1天
  const hasBondFund = portfolio.holdings['fund-bond-01']?.shares > 0 || portfolio.holdings['fund-bond-02']?.shares > 0
  return hasBondFund && portfolio.day >= 1
})

const stage4Done = computed(() => !!scenarioState.value.done['A'])
const stage5Done = computed(() => !!scenarioState.value.done['B'] && !!scenarioState.value.done['C'] && !!scenarioState.value.done['D'])
const stage6Done = computed(() => !!scenarioState.value.done['E'])

// ---- 阶段定义 ----
const stages = computed(() => {
  const s0Done = selfTestDone.value
  const s3Done = quizDone.value
  
  return [
    {
      id: 0, name: '认识钱', status: s0Done ? 'done' : 'current',
      desc: '三道自测题，建立「只用闲钱投资」的底线认知',
      tasks: ['完成三道财务自测', '看懂三张铁律卡'],
    },
    {
      id: 1, name: '搞定活钱',
      status: stage1Done.value ? 'done' : (s0Done ? 'current' : 'locked'),
      desc: '第一笔投资：买入货币基金，理解活钱管理',
      tasks: ['买入1000元稳健货币A', '次日查看收益到账', '回答小测：生活费放哪'],
    },
    {
      id: 2, name: '认识波动',
      status: stage2Done.value ? 'done' : (s0Done ? 'current' : 'locked'),
      desc: '买入纯债基金，亲历第一次账面浮亏与修复',
      tasks: ['买入2000元纯债一号', '经历回撤日提示', '持有到回撤修复'],
    },
    {
      id: 3, name: '摸清自己', status: s3Done ? 'done' : (s0Done ? 'current' : 'locked'),
      desc: '10道风险测评题，产出你的投资者画像',
      tasks: ['完成10道测评题', '查看推荐配置', '观察言行一致性彩蛋'],
    },
    {
      id: 4, name: '第一次组合',
      status: stage4Done.value ? 'done' : (s3Done ? 'current' : 'locked'),
      desc: '按画像配置组合，快进3个月，完成第一次复盘',
      tasks: ['买入推荐组合或自选比例', '通关剧本A「牛市的味道」', '完成剧本复盘'],
    },
    {
      id: 5, name: '直面波动',
      status: stage5Done.value ? 'done' : (stage4Done.value ? 'current' : 'locked'),
      desc: '股灾、横盘、疫情三连剧本，验证真实的风险承受力',
      tasks: ['通关剧本B/C/D', '三份画像验证报告', '必要时主动调低画像'],
    },
    {
      id: 6, name: '进入真实市场',
      status: stage6Done.value ? 'done' : (stage5Done.value ? 'current' : 'locked'),
      desc: '开户指南、渠道选择、第一笔真实买入清单',
      tasks: ['通关剧本E「毕业大考」', '四项行为标准达成', '领取毕业证书'],
    },
  ]
})
const doneCount = computed(() => stages.value.filter((s) => s.status === 'done').length)

const knowledgeCards = [
  { t: '投资的第一条铁律：只用闲钱', d: '半年内要用的钱，任何基金都不该买。' },
  { t: '通货膨胀：你的钱在悄悄变少', d: '存款利息不到2%，物价每年涨2-3%。「什么都不做」也是一种亏损。' },
  { t: '收益与风险是绑定的', d: '宣称「高收益低风险」的，都是骗局。没有例外。' },
]
</script>

<template>
  <div class="learn">
    <div class="page-head">
      <h1>学习</h1>
      <p class="page-sub">六阶段 · 学一点 → 做一次 → 复盘 → 解锁下一关</p>
    </div>

    <div class="progress card">
      <div class="progress-bar"><div class="progress-fill" :style="{ width: (doneCount / 7 * 100) + '%' }"></div></div>
      <span class="progress-text">{{ doneCount }} / 7 阶段完成</span>
    </div>

    <!-- 阶段列表 -->
    <div class="stage-list">
      <div v-for="s in stages" :key="s.id" class="card stage-card" :class="s.status">
        <div class="stage-head">
          <span class="stage-no">{{ s.id }}</span>
          <div class="stage-title">
            <b>{{ s.name }}</b>
            <span class="stage-desc">{{ s.desc }}</span>
          </div>
          <span class="stage-status" :class="s.status">{{ s.status === 'done' ? '✓ 已完成' : s.status === 'current' ? '进行中' : '未解锁' }}</span>
        </div>

        <!-- 阶段0：内嵌自测 -->
        <div v-if="s.id === 0 && !selfTestDone" class="selftest">
          <p class="q">① 你现在有多少存款？</p>
          <div class="opts"><button v-for="(o, i) in savingsOpts" :key="o" :class="{ sel: selfTest.savings === i }" @click="selfTest.savings = i">{{ o }}</button></div>
          <p class="q">② 每月能存下多少钱？</p>
          <div class="opts"><button v-for="(o, i) in monthlyOpts" :key="o" :class="{ sel: selfTest.monthly === i }" @click="selfTest.monthly = i">{{ o }}</button></div>
          <p class="q">③ 这笔钱多久后要用？<em>（答案直接改变后面的推荐）</em></p>
          <div class="opts"><button v-for="o in horizonOpts" :key="o.v" :class="{ sel: selfTest.horizon === o.v }" @click="selfTest.horizon = o.v">{{ o.label }}</button></div>
        </div>
        <div v-else-if="s.id === 0 && selfTestDone" class="selftest-done">
          <p class="advice">{{ horizonAdvice }}</p>
          <div class="cards-row">
            <div v-for="k in knowledgeCards" :key="k.t" class="kcard">
              <b>{{ k.t }}</b>
              <span>{{ k.d }}</span>
            </div>
          </div>
        </div>

        <!-- 阶段3：内嵌测评 -->
        <div v-if="s.id === 3 && !quizDone" class="quiz-entry">
          <button class="cta" @click="showQuiz = true">开始风险测评（10题 · 3分钟）</button>
        </div>
        <div v-else-if="s.id === 3 && quizDone" class="quiz-result">
          <div class="profile-tag">{{ profile.name }}</div>
          <p class="advice">{{ profile.desc }}</p>
          <p v-if="honestyGap" class="honesty">⚠ 你第6题和第7题的答案不太一致。别担心，大多数人都这样——嘴上说着拿得住，跌20%时就是另一回事了。模拟盘里试试看？</p>
          <p class="retest"><a @click="quizDone = false; quizAnswers = Array(10).fill(null)" href="javascript:void(0)">重新测评</a></p>
        </div>

        <!-- 任务清单 -->
        <ul v-if="s.id !== 0 && s.id !== 3" class="tasks">
          <li v-for="t in s.tasks" :key="t">{{ t }}</li>
        </ul>
      </div>
    </div>

    <!-- 测评弹窗 -->
    <div v-if="showQuiz" class="modal-mask" @click.self="showQuiz = false">
      <div class="modal card">
        <template v-if="!quizDone">
          <div class="quiz-head">
            <span>风险测评</span>
            <span class="quiz-no num">{{ quizAnswers.filter(a => a !== null).length }} / 10</span>
          </div>
          <div v-for="(item, i) in quiz" :key="i" v-show="quizAnswers[i] !== null || i === 0 || quizAnswers[i-1] !== null" class="quiz-item">
            <p class="q">{{ i + 1 }}. {{ item.q }}</p>
            <div class="opts">
              <button v-for="(o, j) in item.opts" :key="o" :class="{ sel: quizAnswers[i] === j }" @click="quizAnswers[i] = j">{{ o }}</button>
            </div>
          </div>
          <button class="cta" :disabled="quizAnswers.some(a => a === null)" @click="submitQuiz">
            {{ quizAnswers.some(a => a === null) ? '还有题没答完' : '提交 · 查看我的画像' }}
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.learn { display: flex; flex-direction: column; gap: var(--space-6); }
.page-head { display: flex; align-items: baseline; gap: var(--space-4); }
h1 { font-size: var(--text-3xl); font-weight: var(--font-bold); letter-spacing: .02em; }
.page-sub { color: var(--text-tertiary); font-size: var(--text-sm); }
.progress { display: flex; align-items: center; gap: var(--space-4); padding: var(--space-5) var(--space-6); }
.progress-bar { flex: 1; height: 8px; background: #ece5f0; border-radius: var(--radius-sm); overflow: hidden; }
.progress-fill { height: 100%; background: var(--brand-accent); transition: width .3s; }
.progress-text { font-size: var(--text-sm); color: var(--text-secondary); white-space: nowrap; }
.stage-list { display: flex; flex-direction: column; gap: var(--space-4); }
.stage-card { padding: var(--space-6) var(--space-8); }
.stage-card.locked { border-style: dashed; }
.stage-head { display: flex; align-items: center; gap: var(--space-4); }
.stage-no { width: 30px; height: 30px; border-radius: var(--radius-md); background: var(--brand-accent); color: #fff; font-family: var(--font-mono); font-weight: var(--font-bold); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.stage-title { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.stage-title b { font-size: var(--text-lg); font-weight: var(--font-bold); }
.stage-desc { font-size: var(--text-sm); color: var(--text-secondary); }
.stage-status { font-size: var(--text-xs); padding: 4px 10px; border-radius: var(--radius-sm); white-space: nowrap; }
.stage-status.done { background: var(--positive-bg); color: var(--positive); }
.stage-status.current { background: var(--brand-primary); color: var(--brand-accent-hover); }
.stage-status.locked { background: var(--bg-subtle); color: var(--text-tertiary); }
.tasks { margin: var(--space-4) 0 0; padding-left: var(--space-6); color: var(--text-secondary); font-size: var(--text-sm); display: flex; flex-direction: column; gap: var(--space-1); }
.selftest { margin-top: var(--space-4); display: flex; flex-direction: column; gap: var(--space-3); }
.q { font-size: var(--text-base); font-weight: var(--font-medium); margin: 0; }
.q em { font-style: normal; color: var(--text-tertiary); font-size: var(--text-xs); }
.opts { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.opts button { padding: var(--space-2) var(--space-4); border: 1px solid var(--border-default); border-radius: var(--radius-md); background: #fff; cursor: pointer; font-size: var(--text-sm); color: var(--text-secondary); font-weight: var(--font-medium); }
.opts button:hover { border-color: var(--brand-accent); color: var(--brand-accent-hover); }
.opts button.sel { background: var(--brand-primary); border: 1px solid var(--brand-accent); color: var(--brand-accent-hover); font-weight: var(--font-bold); }
.advice { background: var(--info-bg); color: var(--info); border-radius: var(--radius-md); padding: var(--space-3) var(--space-4); font-size: var(--text-sm); margin: var(--space-3) 0; }
.cards-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-3); }
.kcard { background: var(--bg-subtle); border-radius: var(--radius-md); padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-2); }
.kcard b { font-size: var(--text-sm); }
.kcard span { font-size: var(--text-xs); color: var(--text-secondary); line-height: var(--leading-normal); }
.quiz-entry { margin-top: var(--space-4); }
.cta { background: var(--brand-accent); color: var(--text-on-color); border: none; padding: var(--space-3) var(--space-8); border-radius: var(--radius-md); font-size: var(--text-base); font-weight: var(--font-semibold); cursor: pointer; }
.cta:disabled { opacity: .4; cursor: not-allowed; }
.quiz-result { margin-top: var(--space-4); }
.profile-tag { display: inline-block; background: var(--brand-accent); color: var(--text-on-color); font-weight: var(--font-bold); padding: var(--space-2) var(--space-6); border-radius: var(--radius-md); font-size: var(--text-lg); margin-bottom: var(--space-2); letter-spacing: .04em; }
.honesty { background: var(--warning-bg); color: var(--warning); border-radius: var(--radius-md); padding: var(--space-3) var(--space-4); font-size: var(--text-sm); margin: var(--space-3) 0; }
.retest a { color: var(--text-tertiary); font-size: var(--text-sm); text-decoration: underline; }
.modal-mask { position: fixed; inset: 0; background: rgba(43, 34, 51, 0.40); display: flex; align-items: center; justify-content: center; z-index: 100; padding: var(--space-4); }
.modal { width: 100%; max-width: 520px; max-height: 80vh; overflow-y: auto; padding: var(--space-6); }
.quiz-head { display: flex; justify-content: space-between; font-weight: var(--font-bold); font-size: var(--text-lg); margin-bottom: var(--space-4); }
.quiz-no { color: var(--text-tertiary); font-size: var(--text-sm); font-weight: var(--font-regular); }
.quiz-item { margin-bottom: var(--space-5); }
</style>
