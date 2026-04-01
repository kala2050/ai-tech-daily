# 首页刷新按钮与 AI 摘要功能设计

> 创建日期：2026-04-01
> 状态：待实现

## 1. 功能概述

在首页顶部增加"刷新数据"按钮，点击后触发内容采集并调用 AI API 生成当日综合摘要。摘要采用结构化格式（三领域各一段 + 整体趋势），持久化存储于 `latest.json`，首页直接展示。

## 2. 核心需求

- 手动触发按钮，一键刷新数据
- AI 自动生成结构化摘要（三领域 + 趋势）
- 支持多种 AI API，默认阿里百炼
- API 可通过环境变量配置

## 3. 架构设计

### 3.1 流程图

```
用户点击"刷新数据"
        ↓
调用 /api/admin/collect
        ↓
采集内容（arXiv + RSS）
        ↓
分类、去重、存储
        ↓
调用 AI API 生成摘要
        ↓
摘要存入 latest.json
        ↓
页面刷新展示
```

### 3.2 模块职责

| 模块 | 职责 | 文件 |
|------|------|------|
| 刷新按钮组件 | 触发采集、显示状态 | `components/RefreshButton.tsx` |
| AI 摘要服务 | 调用 AI API 生成摘要 | `lib/services/summarizer.ts` |
| AI Provider 配置 | API 配置与适配 | `lib/config/ai-providers.ts` |
| 类型定义 | Summary 类型扩展 | `lib/types/index.ts` |

## 4. 数据结构设计

### 4.1 Summary 类型

```typescript
interface Summary {
  aiTech: string;        // AI 技术领域摘要（约 100 字）
  agentTech: string;     // 智能体技术摘要（约 100 字）
  graphicsTech: string;  // 图形技术摘要（约 100 字）
  trend: string;         // 整体趋势点评（约 50 字）
  generatedAt: string;   // 摘要生成时间
  model: string;         // 使用的模型名称
}
```

### 4.2 LatestData 扩展

```typescript
interface LatestData {
  updatedAt: string;
  summary?: Summary;     // 新增
  categories: {
    'ai-tech': { count: number; items: ContentItem[] };
    'agent-tech': { count: number; items: ContentItem[] };
    'graphics-tech': { count: number; items: ContentItem[] };
  };
}
```

## 5. AI Provider 配置

### 5.1 环境变量

```env
# 必需
AI_API_KEY=your-api-key

# 可选（有默认值）
AI_PROVIDER=bailian              # 默认阿里百炼
AI_MODEL=qwen-turbo              # 默认模型
AI_API_BASE=                     # 自定义 API 地址（可选）
```

### 5.2 Provider 配置结构

```typescript
interface AIProviderConfig {
  name: string;           // provider 名称
  defaultModel: string;   // 默认模型
  apiBase: string;        // API 基础地址
  headers: Record<string, string>;  // 请求头
}
```

### 5.3 默认 Provider

| Provider | apiBase | defaultModel |
|----------|---------|--------------|
| bailian | https://dashscope.aliyuncs.com/compatible-mode/v1 | qwen-turbo |

用户可通过 `AI_API_BASE` 和 `AI_MODEL` 环境变量自定义配置。

## 6. 摘要生成 Prompt

```
你是一个科技资讯分析师。请根据以下今日采集的内容，生成一份结构化的技术日报摘要。

## 输出格式要求
请严格按以下 JSON 格式输出，不要添加其他内容：
{
  "aiTech": "AI技术领域的核心进展，约100字",
  "agentTech": "智能体技术领域的核心进展，约100字", 
  "graphicsTech": "图形技术领域的核心进展，约100字",
  "trend": "整体趋势点评，约50字"
}

## 今日内容

### AI 技术（共 X 条）
[列出标题，最多 10 条]

### 智能体技术（共 X 条）
[列出标题，最多 10 条]

### 图形技术（共 X 条）
[列出标题，最多 10 条]
```

## 7. UI 设计

### 7.1 首页布局

```
┌─────────────────────────────────────────────────────────┐
│  AI Tech Daily                        [刷新数据] 按钮   │
│  每日自动采集 AI、智能体、图形技术领域的最新进展          │
│  更新时间：2026-04-01 14:30                              │
├─────────────────────────────────────────────────────────┤
│  今日摘要                                                │
│  ┌─────────────────────────────────────────────────────┐│
│  │ AI 技术：今天 GPT-5.4 mini/nano 发布...             ││
│  │ 智能体技术：OpenAI 发布了 Codex 安全机制...          ││
│  │ 图形技术：NeRF 相关论文持续涌现...                   ││
│  │ 趋势：本周大模型小型化趋势明显...                    ││
│  └─────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────┤
│  [AI 技术]     [智能体技术]     [图形技术]               │
└─────────────────────────────────────────────────────────┘
```

### 7.2 刷新按钮状态

| 状态 | 显示 | 行为 |
|------|------|------|
| 默认 | "刷新数据" | 可点击 |
| 加载中 | "刷新中..." + 旋转图标 | 禁用 |
| 成功 | "刷新成功" → 2秒后恢复 | 显示成功提示 |
| 失败 | "刷新失败" → 2秒后恢复 | 显示错误信息 |

## 8. 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `lib/types/index.ts` | 修改 | 新增 Summary 类型 |
| `lib/config/ai-providers.ts` | 新建 | AI Provider 配置 |
| `lib/services/summarizer.ts` | 新建 | AI 摘要生成服务 |
| `lib/services/collector.ts` | 修改 | 集成摘要生成 |
| `lib/storage/index.ts` | 修改 | 支持 summary 读写 |
| `components/RefreshButton.tsx` | 新建 | 刷新按钮组件 |
| `components/SummaryCard.tsx` | 新建 | 摘要展示组件 |
| `app/page.tsx` | 修改 | 添加按钮和摘要 |
| `.env.example` | 新建 | 环境变量示例 |

## 9. 错误处理

| 场景 | 处理方式 |
|------|----------|
| AI API 调用失败 | 记录日志，摘要字段留空，采集数据正常保存 |
| API Key 未配置 | 摘要功能跳过，提示用户配置 |
| 采集失败 | 返回错误信息，按钮显示失败状态 |
| 网络超时 | 30秒超时，返回超时错误 |

## 10. 验收标准

- [ ] 首页顶部显示"刷新数据"按钮
- [ ] 点击按钮触发采集并显示加载状态
- [ ] 采集成功后自动生成 AI 摘要
- [ ] 摘要在首页正确展示（三领域 + 趋势）
- [ ] 刷新页面后摘要仍存在（持久化）
- [ ] AI API 可通过环境变量配置
- [ ] 默认使用阿里百炼 API
- [ ] 错误状态正确显示
