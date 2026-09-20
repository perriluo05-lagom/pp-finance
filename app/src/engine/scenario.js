// T5 · 剧本引擎：预设行情剧本 + 事件系统
// 与 02-数据设计/剧本设计.md 一致
//
// 剧本数据结构：
//   id, name, days, prototype(历史原型), emotion(核心情绪),
//   stages: [{ from, to, label, moves: { assetId: 累计涨跌% } }]
//   events: [{ day, type: 'news'|'shock'|'teach'|'tempt', text }]
//   review: 复盘报告配置
//
// 引擎运行：按 stages 线性插值出每日目标累计涨幅 → 反解日收益
// （保证剧本走势确定性可复现，不依赖随机）

export const SCENARIOS = [
  {
    id: 'A', name: '牛市的味道', days: 60, prototype: '2014-2015牛市',
    emotion: '贪婪的甜', unlock: '完成风险测评（阶段3）',
    stages: [
      { from: 1, to: 15, label: '缓涨启动', moves: { 'fund-index-01': 8, 'fund-index-03': 12, 'fund-gold-01': 1, 'fund-bond-01': 0 } },
      { from: 16, to: 40, label: '主升浪', moves: { 'fund-index-01': 18, 'fund-index-03': 35, 'fund-gold-01': -2, 'fund-bond-01': -0.5 } },
      { from: 41, to: 55, label: '疯狂加速', moves: { 'fund-index-01': 15, 'fund-index-03': 28, 'fund-gold-01': -3, 'fund-bond-01': -1 } },
      { from: 56, to: 60, label: '高位震荡', moves: { 'fund-index-01': 3, 'fund-index-03': 5, 'fund-gold-01': 0, 'fund-bond-01': 0 } },
    ],
    events: [
      { day: 1, type: 'news', text: '新用户开户礼包：10万虚拟本金已到账。最近大盘涨得不错，身边同学都在聊股票——你要不要看看？' },
      { day: 20, type: 'news', text: '上证指数突破近三年高点，券商开户数创纪录' },
      { day: 40, type: 'shock', text: '"这次不一样"——社交媒体上大学生晒基金收益截图刷屏' },
      { day: 55, type: 'teach', text: '你的创业板仓位已盈利+60%以上。想一想：如果明天开始每天跌5%，你打算什么时候卖？（请记住此刻的答案）' },
    ],
    review: {
      focus: ['收益 vs 沪深300', '换手率与摩擦成本', '教学卡：牛市里最贵的错觉——以为赚钱是因为自己聪明'],
      teaching: {
        marketContext: '这是一个典型的"缓涨→主升浪→疯狂加速→高位震荡"四阶段牛市。前15天缓慢上涨是机构建仓期，第16-40天主升浪是资金涌入推动，第41-55天疯狂加速是散户追高情绪达到顶峰，最后5天高位震荡是聪明钱开始撤退的信号。',
        keySignals: [
          '成交量持续放大但价格涨幅收窄 → 主力在出货',
          '身边所有人都在晒收益截图 → 市场过热预警',
          '创业板单日涨幅超过主板3倍以上 → 风险偏好极端化',
          '媒体频繁出现"这次不一样"的标题 → 历史教训被遗忘'
        ],
        strategyTips: '理性策略应该是：前15天逐步建仓（不要一次性梭哈），主升浪期间持有不动（频繁操作只会增加摩擦成本），疯狂加速期分批减仓锁定利润（比如每涨10%卖出1/3仓位），高位震荡期保留少量底仓观察。记住：牛市中最大的错误不是买晚了，而是该卖的时候没卖。'
      }
    },
  },
  {
    id: 'B', name: '第一次大跌', days: 90, prototype: '2015年6月股灾',
    emotion: '恐惧', unlock: '通关剧本A', core: true,
    stages: [
      { from: 1, to: 5, label: '高位横盘', moves: { 'fund-index-01': 2, 'fund-index-03': 3, 'fund-gold-01': 0, 'fund-bond-01': 0 } },
      { from: 6, to: 20, label: '第一波下跌', moves: { 'fund-index-01': -18, 'fund-index-03': -28, 'fund-gold-01': 5, 'fund-bond-01': 0.5 } },
      { from: 21, to: 35, label: '反弹诱多', moves: { 'fund-index-01': 10, 'fund-index-03': 15, 'fund-gold-01': -2, 'fund-bond-01': 0 } },
      { from: 36, to: 55, label: '第二波下跌', moves: { 'fund-index-01': -15, 'fund-index-03': -25, 'fund-gold-01': 4, 'fund-bond-01': 0.3 } },
      { from: 56, to: 75, label: '磨底', moves: { 'fund-index-01': -5, 'fund-index-03': -8, 'fund-gold-01': 0, 'fund-bond-01': 0.2 } },
      { from: 76, to: 90, label: '修复', moves: { 'fund-index-01': 8, 'fund-index-03': 12, 'fund-gold-01': 0, 'fund-bond-01': 0.3 } },
    ],
    events: [
      { day: 5, type: 'news', text: '市场传闻监管层关注两融风险' },
      { day: 8, type: 'shock', text: '你的创业板持仓单日-6%。真实市场里，这一天你的账户会亏掉半年生活费。现在的感觉如何？' },
      { day: 20, type: 'news', text: '千股跌停。财经媒体标题："黑色星期一"' },
      { day: 25, type: 'tempt', text: '室友跟你说："跌这么多，反弹了！我全仓抄底了"——你要跟吗？' },
      { day: 36, type: 'teach', text: '注意：反弹结束，第二波下跌开始。如果你第25天抄了底，现在是什么心情？' },
      { day: 75, type: 'teach', text: '底部不是一天形成的。磨底的煎熬比下跌更磨人——这是大多数人割在地板上的原因' },
    ],
    review: {
      focus: ['最大回撤对比', '行为记录：你在最低点附近做了什么', '教学卡：恐慌中卖出的每一分钱，都是别人捡走的便宜筹码'],
      teaching: {
        marketContext: '这是2015年股灾的经典走势：高位横盘→第一波暴跌→反弹诱多→第二波暴跌→磨底→修复。关键特征是"反弹不是反转"——第21-35天的反弹让很多人以为底部到了，结果第二波跌得更深。真正的底部出现在第75天附近，但那时候市场情绪已经绝望到极点。',
        keySignals: [
          '千股跌停 + 两融爆仓 → 流动性危机，不要抄底',
          '反弹时成交量萎缩 → 假反弹，主力在诱多出货',
          '黄金逆势上涨 → 避险情绪升温，但极端恐慌时黄金也会补跌',
          '债券基金小幅正收益 → 资金从股市逃向债市，这是"聪明钱"的信号'
        ],
        strategyTips: '暴跌中的理性策略： 第一波下跌时不要急着抄底，等企稳信号（连续3天不创新低）；② 反弹时如果成交量没有放大，不要加仓——这大概率是诱多；③ 磨底期是最煎熬的，但也是定投的最佳时机（成本低、风险可控）；④ 修复期不要追高，等回调再介入。记住：底部不是一个点，而是一个区域。'
      }
    },
  },
  {
    id: 'C', name: '漫长的横盘', days: 120, prototype: '2022年震荡市',
    emotion: '无聊/煎熬', unlock: '通关剧本B',
    stages: [
      { from: 1, to: 30, label: '阴跌', moves: { 'fund-index-01': -8, 'fund-index-03': -12, 'fund-gold-01': 3, 'fund-bond-01': 0.5, 'fund-qdii-01': -15 } },
      { from: 31, to: 45, label: '假反弹', moves: { 'fund-index-01': 6, 'fund-index-03': 8, 'fund-gold-01': 0, 'fund-bond-01': 0, 'fund-qdii-01': 5 } },
      { from: 46, to: 70, label: '二次探底', moves: { 'fund-index-01': -7, 'fund-index-03': -10, 'fund-gold-01': 2, 'fund-bond-01': 0.4, 'fund-qdii-01': -8 } },
      { from: 71, to: 100, label: '无聊横盘', moves: { 'fund-index-01': 2, 'fund-index-03': 1, 'fund-gold-01': 1, 'fund-bond-01': 0.5, 'fund-qdii-01': 2 } },
      { from: 101, to: 120, label: '悄悄回升', moves: { 'fund-index-01': 6, 'fund-index-03': 9, 'fund-gold-01': 0, 'fund-bond-01': 0.3, 'fund-qdii-01': 8 } },
    ],
    events: [
      { day: 1, type: 'news', text: '这半年市场没有大新闻，只有无尽的磨人。你的对手不是市场，是无聊' },
      { day: 50, type: 'teach', text: '定投时刻表：如果你从第1天起每月定投1000元沪深300，此刻你的成本线比一次性买入低——横盘期是定投的朋友、梭哈的敌人' },
      { day: 90, type: 'news', text: '"A股还有没有希望"成为社交平台热帖，阅读量过亿' },
      { day: 118, type: 'teach', text: '回头看：第100天时你以为市场死了，其实它在悄悄蓄力' },
    ],
    review: {
      focus: ['定投 vs 一次性对比', '横盘期操作频率', '教学卡：没事别打开账户'],
      teaching: {
        marketContext: '这是典型的"震荡市"——没有明确方向，上上下下磨人。第1-30天阴跌是资金缓慢流出，第31-45天假反弹是技术性修复，第46-70天二次探底确认支撑位，第71-100天无聊横盘是多空力量均衡，最后20天悄悄回升是资金开始布局下一轮行情。横盘市的特征是"涨一天跌两天"，让人产生"永远涨不起来"的错觉。',
        keySignals: [
          '成交量持续萎缩 → 市场缺乏方向，观望情绪浓厚',
          '板块轮动加快（今天消费涨明天科技涨） → 资金在寻找主线但没找到',
          '债券基金稳定正收益 → 资金在避险，股市缺乏增量资金',
          '黄金小幅上涨 → 不确定性溢价，但幅度不大说明恐慌不严重'
        ],
        strategyTips: '横盘市的理性策略： 定投是最佳选择（成本低、心态稳），每月固定日期投入固定金额；② 不要频繁操作（横盘期交易成本会吃掉所有利润）；③ 如果已经持有，躺平不动比来回切换好；④ 利用横盘期学习研究，为下一轮行情做准备。记住：横盘期是定投的朋友、梭哈的敌人。'
      }
    },
  },
  {
    id: 'D', name: '环球同此凉热？不', days: 60, prototype: '2020年3月疫情V型',
    emotion: '困惑→释然', unlock: '通关剧本C',
    stages: [
      { from: 1, to: 5, label: '冲击前奏', moves: { 'fund-index-01': 2, 'fund-qdii-01': -3, 'fund-gold-01': 2, 'fund-index-03': 3 } },
      { from: 6, to: 15, label: '全球暴跌', moves: { 'fund-index-01': -12, 'fund-qdii-01': -25, 'fund-gold-01': 8, 'fund-index-03': -15 } },
      { from: 16, to: 20, label: '流动性恐慌', moves: { 'fund-index-01': -5, 'fund-qdii-01': -10, 'fund-gold-01': -6, 'fund-index-03': -6 } },
      { from: 21, to: 40, label: 'V型反转', moves: { 'fund-index-01': 18, 'fund-qdii-01': 30, 'fund-gold-01': 5, 'fund-index-03': 22 } },
      { from: 41, to: 60, label: '新高', moves: { 'fund-index-01': 8, 'fund-qdii-01': 18, 'fund-gold-01': 3, 'fund-index-03': 10 } },
    ],
    events: [
      { day: 6, type: 'news', text: '突发：全球风险资产遭抛售。你的A股和美股基金同日下跌——"分散"失效了吗？' },
      { day: 18, type: 'shock', text: '为什么黄金也在跌？极端恐慌时，机构卖掉一切能卖的资产换现金——包括黄金。"避险资产"保平安，但保不了极端时刻' },
      { day: 21, type: 'news', text: '全球央行联手注入流动性，市场开始反弹' },
      { day: 30, type: 'teach', text: 'V型反转中，错过前10天反弹 = 错过大部分收益。你反弹前在场内吗？' },
    ],
    review: {
      focus: ['组合 vs 只持有A股', '黄金的"背叛"', '教学卡：分散不是永远不亏，是让"亏"变得可以承受'],
      teaching: {
        marketContext: '这是2020年3月疫情冲击的经典V型走势。关键特征是"全球联动暴跌→流动性恐慌→央行救市→V型反转"。第6-15天全球暴跌时，A股、美股、黄金同步下跌——"分散投资失效"的错觉出现；第16-20天流动性恐慌达到顶峰，连黄金这种避险资产都被抛售换现金；第21天起央行联手注入流动性，市场开始V型反转。',
        keySignals: [
          '全球市场同步暴跌 → 系统性风险，不是单一市场问题',
          '黄金也下跌 → 流动性恐慌极端阶段，"现金为王"',
          '央行宣布救市措施 → 政策底出现，但市场底通常滞后1-2周',
          'V型反弹前10天涨幅最大 → 错过这10天 = 错过大部分收益'
        ],
        strategyTips: 'V型反转中的理性策略： 暴跌初期不要恐慌卖出（除非急需用钱），因为V型反弹会很快；② 如果仓位不重，可以在流动性恐慌阶段（黄金也跌的时候）小幅加仓——这是"别人恐惧我贪婪"的时刻；③ 分散投资在极端时刻会"失效"，但长期来看仍然有效——QDII在反弹阶段涨幅远超A股；④ 黄金的"背叛"是暂时的，恐慌过后它会重新发挥避险作用。记住：分散不是永远不亏，是让"亏"变得可以承受。'
      }
    },
  },
  {
    id: 'E', name: '毕业大考', days: 150, prototype: '牛市+股灾+横盘混合',
    emotion: '全部混合', unlock: '通关剧本D + 完成阶段6学习',
    stages: [
      // 第一幕 1-50 牛市狂欢（复用A行情）
      { from: 1, to: 20, label: '第一幕·缓涨', moves: { 'fund-index-01': 10, 'fund-index-03': 15, 'fund-gold-01': 0, 'fund-bond-01': 0 } },
      { from: 21, to: 45, label: '第一幕·疯狂', moves: { 'fund-index-01': 25, 'fund-index-03': 45, 'fund-gold-01': -3, 'fund-bond-01': -1 } },
      { from: 46, to: 50, label: '第一幕·顶部', moves: { 'fund-index-01': 3, 'fund-index-03': 4, 'fund-gold-01': 0, 'fund-bond-01': 0 } },
      // 第二幕 51-100 暴跌+横盘
      { from: 51, to: 70, label: '第二幕·暴跌', moves: { 'fund-index-01': -25, 'fund-index-03': -38, 'fund-gold-01': 6, 'fund-bond-01': 0.5 } },
      { from: 71, to: 85, label: '第二幕·诱多反弹', moves: { 'fund-index-01': 8, 'fund-index-03': 12, 'fund-gold-01': -2, 'fund-bond-01': 0 } },
      { from: 86, to: 100, label: '第二幕·磨底', moves: { 'fund-index-01': -6, 'fund-index-03': -8, 'fund-gold-01': 1, 'fund-bond-01': 0.3 } },
      // 第三幕 101-150 修复+坑
      { from: 101, to: 120, label: '第三幕·修复', moves: { 'fund-index-01': 15, 'fund-index-03': 20, 'fund-gold-01': 2, 'fund-bond-01': 0.3 } },
      { from: 121, to: 127, label: '第三幕·回调', moves: { 'fund-index-01': -8, 'fund-index-03': -12, 'fund-gold-01': 2, 'fund-bond-01': 0.2 } },
      { from: 128, to: 150, label: '第三幕·新高', moves: { 'fund-index-01': 12, 'fund-index-03': 18, 'fund-gold-01': 1, 'fund-bond-01': 0.2 } },
    ],
    events: [
      { day: 30, type: 'tempt', text: '爆款基金上热搜，"XX进取一号"宣传"上一只产品年化120%"。宿舍楼下新开了两家券商营业部' },
      { day: 48, type: 'shock', text: '人人都在赚钱。你的定力还剩多少？' },
      { day: 55, type: 'shock', text: '暴跌开始。第一天就-5%。这次没有人提前告诉你' },
      { day: 62, type: 'tempt', text: '你关注的财经博主晒出年化80%的战绩，卖课链接在评论区' },
      { day: 75, type: 'tempt', text: '室友借钱加杠杆，一周赚了30%，劝你也上' },
      { day: 88, type: 'tempt', text: '表哥神秘地说他有内幕消息，某行业基金要翻倍' },
      { day: 124, type: 'teach', text: '修复路上的坑：反弹不等于一帆风顺，-8%的回调就是给你上的最后一课' },
    ],
    review: {
      focus: ['四项行为判定（顶部/底部/杠杆内幕/换手率）', '毕业证书'],
      teaching: {
        marketContext: '这是综合大考——牛市+股灾+横盘+修复的完整周期。第一幕（1-50天）是牛市狂欢，考验你能否在众人贪婪时保持冷静；第二幕（51-100天）是暴跌+磨底，考验你能否在恐惧中不割肉、不抄底；第三幕（101-150天）是修复+回调+新高，考验你能否在反弹路上拿得住。整个周期模拟了真实投资者最容易犯的所有错误。',
        keySignals: [
          '爆款基金上热搜 + 券商营业部排队 → 牛市顶部信号，该减仓了',
          '暴跌第一天就-5%且无人提前预警 → 真正的风险从来不会提前通知',
          '财经博主晒80%年化 + 卖课 → 幸存者偏差，别被个案迷惑',
          '室友借钱加杠杆一周赚30% → 短期运气长期能力，杠杆是双刃剑',
          '表哥说有内幕消息 → 真有内幕的人不会告诉你，这是陷阱',
          '修复路上突然-8%回调 → 反弹不是一帆风顺，这是最后一课'
        ],
        strategyTips: '毕业大考的理性策略： 牛市期（1-50天）：分批建仓，疯狂期分批减仓，不要试图卖在最高点；② 暴跌期（51-70天）：不割肉、不抄底，等企稳信号； 磨底期（71-100天）：如果有余力可以小额定投，但不要梭哈；④ 修复期（101-150天）：持有不动，不要因为中途回调就卖出。四项行为标准：不在顶部追高、不在底部割肉、不碰杠杆和内幕、控制换手率。达到这四项，你就毕业了。'
      }
    },
  },
]

// 计算某资产到第day天的"剧本累计涨幅目标"（%）
// 规则：前面所有已完成stage的moves之和 + 当前stage按进度插值
function cumTargetAt(scenario, day, assetId) {
  let cum = 0
  for (const stage of scenario.stages) {
    if (day < stage.from) break
    const move = assetId in stage.moves ? stage.moves[assetId] : (stage.moves['fund-index-01'] ?? 0) * 0.8
    if (day >= stage.to) {
      cum += move // 该阶段已走完，全额计入
    } else {
      const span = stage.to - stage.from + 1
      const progress = (day - stage.from + 1) / span
      cum += move * progress // 当前阶段按进度插值
      break
    }
  }
  return cum
}

// 生成剧本全程的每日收益率表（确定性）
export function buildScenarioSeries(scenario) {
  const keys = ['fund-index-01', 'fund-index-02', 'fund-index-03', 'fund-bond-01', 'fund-bond-02',
    'fund-industry-01', 'fund-industry-02', 'fund-qdii-01', 'fund-gold-01']
  const series = {}
  const cum = {}
  for (const key of keys) { series[key] = []; cum[key] = [0] }
  for (let day = 1; day <= scenario.days; day++) {
    for (const key of keys) {
      const targetCum = cumTargetAt(scenario, day, key) / 100
      const prev = cum[key][cum[key].length - 1]
      series[key].push(targetCum - prev)
      cum[key].push(targetCum)
    }
  }
  return { series, cum }
}

export const byScenarioId = (id) => SCENARIOS.find((s) => s.id === id)
