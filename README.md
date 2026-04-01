# AI Tech Daily - AI 技术日报

每日自动采集 AI、智能体、图形技术领域的最新进展，AI 翻译为中文并生成结构化摘要。

## 功能特性

- 🤖 **自动采集** — arXiv 论文 + RSS 技术博客
- 🌐 **中文翻译** — AI 自动翻译标题和摘要
- 📝 **智能摘要** — 结构化日报摘要（三领域 + 趋势）
- ⏰ **定时更新** — 每日自动采集（Cron Job）
- 🚀 **一键刷新** — 手动触发采集按钮

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env.local`：

```bash
cp .env.example .env.local
```

编辑 `.env.local`：

```env
# 必需：AI API 密钥（阿里百炼）
AI_API_KEY=your-api-key-here

# 可选配置
AI_PROVIDER=bailian
AI_MODEL=qwen-turbo

# 安全配置
CRON_SECRET=your-random-secret
```

### 3. 本地运行

```bash
npm run dev
```

访问 http://localhost:3000

## Vercel 部署

### 步骤

1. **推送代码到 GitHub**

```bash
git init
git add .
git commit -m "feat: initialize AI Tech Daily"
git remote add origin https://github.com/YOUR_USERNAME/ai-tech-daily.git
git push -u origin main
```

2. **Vercel 导入项目**

- 访问 https://vercel.com
- 点击 "New Project"
- 导入 GitHub 仓库 `ai-tech-daily`

3. **配置环境变量**

在 Vercel 项目设置中添加：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `AI_API_KEY` | `sk-xxx` | 阿里百炼 API Key |
| `CRON_SECRET` | `random-string` | Cron 验证密钥 |

4. **部署完成**

获得访问地址：`https://your-project.vercel.app`

## 配置说明

### AI API 配置

支持多种 AI Provider，默认阿里百炼：

| Provider | AI_PROVIDER | 默认模型 |
|----------|-------------|----------|
| 阿里百炼 | `bailian` | qwen-turbo |
| OpenAI | `openai` | gpt-4o-mini |
| DeepSeek | `deepseek` | deepseek-chat |

### 阿里百炼 API Key 获取

1. 访问 https://bailian.console.aliyun.com/
2. 开通服务
3. 创建 API Key

## 手动触发采集

访问：`https://your-domain.vercel.app/api/admin/collect?secret=YOUR_CRON_SECRET`

## 项目结构

```
ai-tech-daily/
├── app/                    # Next.js 页面
│   ├── page.tsx           # 首页
│   ├── ai-tech/           # AI 技术分类页
│   ├── agent-tech/        # 智能体技术分类页
│   └── graphics-tech/     # 图形技术分类页
├── components/            # UI 组件
├── lib/
│   ├── collectors/        # 采集器
│   ├── processors/        # 处理器（分类、去重）
│   ├── services/          # 服务（翻译、摘要）
│   ├── storage/           # 存储
│   ├── config/            # 配置
│   └── types/             # 类型定义
└── data/                  # 数据文件（JSON）
```

## License

MIT
