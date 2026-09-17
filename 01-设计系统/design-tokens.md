# 设计 Tokens · v1

> 本项目所有视觉决策的单一真源。修改颜色/字号/间距等基础规范只在这里改，代码引用Token名称而非具体值。

**项目**: 资产模拟教学网页
**风格定位**: 马卡龙精调版 · 现代无衬线 · 大留白 · 高级克制
**目标用户**: 中国大学生理财小白
**最后更新**: 2026-09-16

---

## 一、颜色 Colors

### 文字层

| Token | 色号 | 用途 |
|---|---|---|
| `text-primary` | `#7d6b8f` | 标题、主要文字、按钮上的字 |
| `text-secondary` | `#a89bb5` | 次要说明、副标题 |
| `text-tertiary` | `#c4bacd` | 占位符、禁用状态、极不重要辅助信息 |
| `text-on-color` | `#ffffff` | 深色按钮/深色区块上的文字 |

### 背景层

| Token | 色号 | 用途 |
|---|---|---|
| `bg-page` | `#fdfcfd` | 页面最底层背景（带极微粉调的白） |
| `bg-card` | `#ffffff` | 卡片、弹窗背景 |
| `bg-subtle` | `#faf7fb` | 弱化的分区背景 |
| `bg-hover` | `#f5f0f8` | 鼠标悬停背景 |

### 边界层

| Token | 色号 | 用途 |
|---|---|---|
| `border-default` | `#f0ebf5` | 卡片边框、分割线 |
| `border-strong` | `#e5dbec` | 强调边框（选中态） |

### 语义色 · 收益方向

⚠️ **本项目采用"温柔绿+粉调红"方案，跳出中国股市红涨绿跌、海外正相反的争议。用户价值观：稳态投资教育，弱化情绪化引导。**

| Token | 色号 | 用途 |
|---|---|---|
| `positive` | `#8fbf8b` | 正收益、上涨、赚钱、成功 |
| `positive-bg` | `#e8f2e6` | 正收益浅色底（标签用） |
| `negative` | `#e89bb0` | 负收益、下跌、亏钱 |
| `negative-bg` | `#fbe8ee` | 负收益浅色底 |
| `warning` | `#e8b565` | 警告、风险提示 |
| `warning-bg` | `#fcf3e0` | 警告底 |
| `info` | `#8ab5c9` | 中性信息、提示 |
| `info-bg` | `#e5f0f5` | 信息底 |

### 品牌色

| Token | 色号 | 用途 |
|---|---|---|
| `brand-primary` | `#ffd6e7` | 品牌氛围、logo色 |
| `brand-accent` | `#7d6b8f` | 主要操作按钮（复用文字色，高级） |

### 资产分类色

图表、标签、持仓分布饼图专用。**每一类资产在全站统一使用同一颜色**，形成视觉记忆。

| Token | 色号 | 资产类别 | 情感锚 |
|---|---|---|---|
| `asset-cash` | `#ffe7ba` | 货币基金 | 奶黄 · 稳定感 |
| `asset-bond` | `#d4f0f0` | 债券基金 | 薄荷蓝 · 冷静 |
| `asset-equity` | `#e2d5f8` | 股票/指数基金 | 香芋紫 · 主角感 |
| `asset-industry` | `#ffd6e7` | 行业主题基金 | 樱花粉 · 热度 |
| `asset-overseas` | `#c9e4c5` | QDII 海外 | 抹茶绿 · 成长 |
| `asset-gold` | `#f5e6ca` | 黄金 | 奶油米 · 避险 |

---

## 二、字体 Typography

### 字体族

```
font-sans: "Inter", -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif
font-mono: "SF Mono", "JetBrains Mono", "Menlo", Consolas, monospace
```

**使用规则**:
- 中文正文与标题：`font-sans`
- 数字（金额、收益率、日期）：`font-mono`（等宽让数据列对齐舒适）
- 混排时中英文自动匹配

### 字号阶梯

| Token | 值 | 用途 |
|---|---|---|
| `text-xs` | 12px | 极小辅助、脚注 |
| `text-sm` | 13px | 表格内文字、次要说明 |
| `text-base` | 15px | 正文（中文场景15px比14px更舒适） |
| `text-lg` | 17px | 稍强调正文 |
| `text-xl` | 20px | 卡片标题 |
| `text-2xl` | 24px | 页面副标题 |
| `text-3xl` | 32px | 页面主标题 |
| `text-hero` | 48px | 关键数字（资产总额、大收益率） |

### 字重

| Token | 值 | 用途 |
|---|---|---|
| `font-regular` | 400 | 正文默认 |
| `font-medium` | 500 | 稍强调 |
| `font-semibold` | 600 | 标题 |
| `font-bold` | 700 | 关键数字 |

### 行高

| Token | 值 | 用途 |
|---|---|---|
| `leading-tight` | 1.3 | 大标题 |
| `leading-normal` | 1.5 | 正文 |
| `leading-loose` | 1.75 | 长段落说明 |

---

## 三、间距 Spacing

以 **4px** 为基本单位。

| Token | 值 | 用途 |
|---|---|---|
| `space-1` | 4px | 极紧凑元素间距 |
| `space-2` | 8px | 图标与文字间距 |
| `space-3` | 12px | 表单项内部 |
| `space-4` | 16px | 小卡片内边距 |
| `space-6` | 24px | 标准卡片内边距 |
| `space-8` | 32px | 卡片之间 |
| `space-12` | 48px | 页面区块之间 |
| `space-16` | 64px | 大区块之间 |

---

## 四、圆角 Radius

| Token | 值 | 用途 |
|---|---|---|
| `radius-sm` | 6px | 标签、小按钮 |
| `radius-md` | 10px | 输入框、按钮 |
| `radius-lg` | 14px | 卡片 |
| `radius-xl` | 20px | 大卡片、弹窗 |
| `radius-full` | 9999px | 圆形头像、圆形标签 |

---

## 五、阴影 Shadow

⚠️ **粉彩风格阴影必须用带葡萄紫色调的透明色，不用纯黑。**

| Token | 值 | 用途 |
|---|---|---|
| `shadow-sm` | `0 1px 2px rgba(125, 107, 143, 0.05)` | 微凸元素 |
| `shadow-md` | `0 4px 12px rgba(125, 107, 143, 0.08)` | 卡片默认 |
| `shadow-lg` | `0 8px 24px rgba(125, 107, 143, 0.12)` | 悬浮弹窗 |

---

## 六、待补充

以下 Token 会在后续步骤中扩充，先占位:

- **K线颜色**（做K线图时定，考虑跟 positive/negative 的关系）
- **图表辅助色**（网格线、坐标轴、数据点 hover 态）
- **动画时长与缓动函数**
- **响应式断点**（桌面 / 平板 / 手机）
- **事件提示色**（剧本模式弹窗的分级配色）

---

## 更新日志

- **2026-09-16 v1**: 初版。基于马卡龙配色 + 现代无衬线字体确认。收益方向色采用温柔绿+粉调红。
