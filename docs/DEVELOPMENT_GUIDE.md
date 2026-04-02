# AI Tech Daily 开发全流程记录

> 记录时间：2026-04-02
> 项目地址：http://112.74.58.44
> GitHub：https://github.com/kala2050/ai-tech-daily

---

## 一、项目概述

### 1.1 项目目标
构建一个AI技术日报网站，自动采集AI、智能体、图形技术领域的最新进展，实现：
- 自动采集多源技术内容（RSS、arXiv等）
- AI生成每日摘要和趋势分析
- 中文翻译所有内容
- AI筛选Top 20高质量内容

### 1.2 技术栈
| 技术 | 用途 |
|------|------|
| Next.js 15 | 前端框架（App Router） |
| TypeScript | 类型安全 |
| Tailwind CSS | 样式 |
| 阿里百炼 API | AI翻译和摘要 |
| PM2 | 进程管理 |
| Nginx | 反向代理 |

### 1.3 项目结构
```
ai-tech-daily/
├── app/                    # Next.js App Router
│   ├── page.tsx           # 首页
│   ├── ai-tech/           # AI技术分类页
│   ├── agent-tech/        # 智能体技术分类页
│   └── graphics-tech/     # 图形技术分类页
├── components/            # React组件
│   ├── CategoryCard.tsx   # 分类卡片
│   ├── ContentItem.tsx    # 内容项
│   └── RefreshButton.tsx  # 刷新按钮
├── lib/
│   ├── collectors/        # 数据采集器
│   ├── processors/        # 数据处理器
│   │   ├── classifier.ts  # 内容分类
│   │   ├── selector.ts    # AI内容筛选
│   │   └── formatter.ts   # 格式化
│   ├── services/
│   │   ├── collector.ts   # 采集服务
│   │   ├── translator.ts  # 翻译服务
│   │   └── summarizer.ts  # 摘要服务
│   ├── storage/           # 数据存储
│   └── config/            # 配置
├── data/                  # 数据文件目录
└── ecosystem.config.js    # PM2配置
```

---

## 二、开发过程

### 2.1 初始化项目

```bash
# 创建Next.js项目
npx create-next-app@latest ai-tech-daily --typescript --tailwind --app

# 安装依赖
npm install uuid
npm install -D @types/uuid
```

### 2.2 核心功能实现

#### 2.2.1 数据类型定义 (lib/types/index.ts)

```typescript
export type Category = 'ai-tech' | 'agent-tech' | 'graphics-tech';

export interface ContentItem {
  id: string;
  title: string;
  summary: string;
  titleZh?: string;        // 中文标题
  summaryZh?: string;      // 中文摘要
  translatedAt?: string;
  category: Category;
  sourceType: SourceType;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string;
  collectedAt: string;
  tags: string[];
}

export interface Summary {
  aiTech: string;
  agentTech: string;
  graphicsTech: string;
  trend: string;
  generatedAt: string;
  model: string;
}
```

#### 2.2.2 AI配置 (lib/config/ai-providers.ts)

```typescript
const PROVIDER_CONFIGS: Record<string, AIProviderConfig> = {
  bailian: {
    name: '阿里百炼',
    defaultModel: 'qwen-plus',  // 注意：qwen3.5-plus响应慢
    apiBase: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  },
};

export function getAIConfig() {
  return {
    provider: process.env.AI_PROVIDER || 'bailian',
    model: process.env.AI_MODEL || 'qwen-plus',
    apiKey: process.env.AI_API_KEY || '',
    apiBase: process.env.AI_API_BASE || providerConfig.apiBase,
  };
}
```

#### 2.2.3 翻译服务 (lib/services/translator.ts)

关键点：
- 使用AbortController设置超时（120秒）
- 批量翻译，每次最多50条
- 延迟300ms避免API限流

```typescript
export async function translateItem(item: ContentItem) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000);

  const response = await fetch(`${config.apiBase}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 500,
    }),
    signal: controller.signal,
  });

  clearTimeout(timeoutId);
  // ... 解析响应
}
```

#### 2.2.4 AI内容筛选器 (lib/processors/selector.ts)

**两阶段筛选策略：**

1. **阶段一：规则筛选**
   - 来源质量（顶级公司/机构得分高）
   - 时间新鲜度（越新得分越高）
   - 内容长度（摘要越长信息越多）

2. **阶段二：AI评估**
   - 只对候选集（Top 50）进行AI评估
   - 评估维度：相关性、影响力、质量

```typescript
// 高质量来源列表
const HIGH_QUALITY_SOURCES = [
  'OpenAI', 'Anthropic', 'Google DeepMind', 'Google Research', 'Meta AI',
  'Microsoft Research', 'NVIDIA', 'Apple ML', 'Amazon Science',
  'arXiv', 'Nature', 'Science', 'MIT', 'Stanford', 'Berkeley',
];

// 计算基础分数
function calculateBaseScore(item: ContentItem): number {
  let score = 0;

  // 来源质量（0-30分）
  if (HIGH_QUALITY_SOURCES.some(s => item.sourceName.includes(s))) {
    score += 30;
  }

  // 时间新鲜度（0-20分）
  const daysSincePublish = (Date.now() - new Date(item.publishedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSincePublish < 1) score += 20;
  else if (daysSincePublish < 7) score += 15;
  else score += 10;

  return score;
}
```

---

## 三、遇到的问题与解决方案

### 3.1 翻译API返回401错误

**问题：** 使用qwen-turbo模型时报401错误

**原因：** 阿里云开发者套餐不支持qwen-turbo模型

**解决：** 切换到qwen-plus模型

```typescript
// 修改 lib/config/ai-providers.ts
defaultModel: 'qwen-plus',  // 原来是 'qwen-turbo'
```

### 3.2 PM2环境变量不生效

**问题：** .env.local文件在standalone模式下不加载

**原因：** Next.js standalone模式的server.js不会自动加载.env.local

**解决：** 使用ecosystem.config.js显式定义环境变量

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'ai-tech-daily',
    cwd: '/var/www/ai-tech-daily/.next/standalone',
    script: 'server.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      AI_API_KEY: 'your-api-key',
      AI_MODEL: 'qwen-plus',
      CRON_SECRET: 'your-secret'
    }
  }]
}
```

### 3.3 翻译超时问题

**问题：** qwen3.5-plus模型包含推理过程，响应很慢导致超时

**解决：**
1. 切换到qwen-plus模型
2. 增加超时时间到120秒

### 3.4 ISR缓存不更新

**问题：** 首页显示旧数据，刷新不更新

**解决：** 使用动态渲染替代ISR

```typescript
// app/page.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;
```

### 3.5 CRON_SECRET不匹配

**问题：** 点击刷新按钮返回Unauthorized

**解决：** 确保前端和后端使用相同的secret

```typescript
// components/RefreshButton.tsx
const response = await fetch('/api/admin/collect?secret=kala2024secret');
```

---

## 四、部署流程

### 4.1 服务器环境准备

```bash
# 更新系统
apt update && apt upgrade -y

# 安装Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 安装PM2
npm install -g pm2

# 安装Nginx
apt install -y nginx
```

### 4.2 部署脚本 (deploy.sh)

```bash
#!/bin/bash
SERVER_IP="112.74.58.44"
GITHUB_REPO="https://github.com/kala2050/ai-tech-daily.git"

# 拉取代码
cd /var/www
git clone $GITHUB_REPO
cd ai-tech-daily

# 创建环境变量
cat > .env.local << EOF
AI_API_KEY=your-api-key
AI_MODEL=qwen-plus
CRON_SECRET=your-secret
EOF

# 安装依赖并构建
npm install
npm run build

# 启动PM2
pm2 start ecosystem.config.js
pm2 save

# 配置Nginx
# ... (见下文)
```

### 4.3 Nginx配置

```nginx
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # API接口增加超时（采集和翻译耗时较长）
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_read_timeout 600s;
    }
}
```

### 4.4 设置定时任务

```bash
# 每天早上6点自动采集
(crontab -l; echo "0 6 * * * curl 'http://127.0.0.1:3000/api/admin/collect?secret=kala2024secret' > /dev/null 2>&1") | crontab -
```

---

## 五、常用命令

```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs ai-tech-daily

# 重启服务
pm2 restart ai-tech-daily

# 手动触发采集
curl 'http://localhost:3000/api/admin/collect?secret=kala2024secret'

# 查看数据
cat /var/www/ai-tech-daily/.next/standalone/data/ai-tech.json | jq '.items[0]'
```

---

## 六、关键经验总结

### 6.1 模型选择
- qwen3.5-plus 包含推理过程，响应慢，适合需要深度思考的场景
- qwen-plus 响应快，适合批量翻译和摘要生成
- 阿里云开发者套餐有模型限制，需确认可用模型列表

### 6.2 性能优化
- 两阶段筛选：先用规则筛选候选集，再用AI精细评估
- 翻译延迟：每条翻译后延迟300ms，避免API限流
- 超时设置：翻译和摘要都需要足够的超时时间

### 6.3 部署注意事项
- standalone模式需要手动复制数据文件
- PM2环境变量要用ecosystem.config.js显式定义
- 动态渲染比ISR更适合实时数据更新

### 6.4 调试技巧
```bash
# 检查PM2进程环境变量
pm2 env 0 | grep AI_API

# 测试API连通性
curl -s 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions' \
  -H 'Authorization: Bearer your-api-key' \
  -H 'Content-Type: application/json' \
  -d '{"model": "qwen-plus", "messages": [{"role": "user", "content": "Hi"}]}'

# 检查数据文件更新时间
ls -la /var/www/ai-tech-daily/.next/standalone/data/
```

---

## 七、后续优化方向

1. **内容质量**
   - 增加更多高质量数据源
   - 优化AI筛选评分算法
   - 添加用户反馈机制

2. **性能优化**
   - 实现增量翻译（只翻译新内容）
   - 添加Redis缓存
   - 使用消息队列异步处理

3. **功能扩展**
   - 添加搜索功能
   - 支持内容收藏
   - 生成周报/月报

---

## 八、参考资源

- [Next.js文档](https://nextjs.org/docs)
- [阿里百炼API文档](https://help.aliyun.com/zh/model-studio/)
- [PM2文档](https://pm2.keymetrics.io/docs/)
- [Nginx配置指南](https://nginx.org/en/docs/)

---

*文档最后更新：2026-04-02*