# AI Tech Daily 开发对话记录

> 记录时间：2026-04-02
> 项目地址：http://112.74.58.44
> GitHub：https://github.com/kala2050/ai-tech-daily

---

## 一、项目启动

### 用户需求
> "继续开展当前项目工作"

### 项目背景
这是一个AI技术日报网站项目，需要实现：
- 自动采集AI、智能体、图形技术领域内容
- AI生成每日摘要和趋势分析
- 中文翻译所有内容

---

## 二、核心功能开发

### 2.1 添加刷新按钮

**用户需求：**
> "在首页增加一个手动触发更新的按钮，并且能够帮忙自动提炼内容的简要，综合每天的进展"

**实现方案：**
- 创建 `RefreshButton.tsx` 组件
- 调用 `/api/admin/collect` 接口触发采集
- 采集完成后自动刷新页面

**关键代码：**
```typescript
// RefreshButton.tsx
const handleRefresh = async () => {
  const response = await fetch('/api/admin/collect?secret=kala2024secret');
  // 刷新页面
  window.location.reload();
};
```

### 2.2 AI摘要生成

**用户需求：**
> "能够帮忙自动提炼内容的简要，综合每天的进展"

**实现方案：**
- 创建 `lib/services/summarizer.ts`
- 使用阿里百炼API生成结构化摘要
- 三个分类摘要 + 整体趋势分析

**摘要格式：**
```typescript
interface Summary {
  aiTech: string;        // AI技术摘要
  agentTech: string;     // 智能体技术摘要
  graphicsTech: string;  // 图形技术摘要
  trend: string;         // 整体趋势
}
```

### 2.3 中文翻译功能

**用户需求：**
> "收集到的内容显示文中文，包括摘要内容也是中文"

**实现方案：**
- 创建 `lib/services/translator.ts`
- 批量翻译标题和摘要
- 存储翻译结果到数据文件

---

## 三、部署过程与问题排查

### 3.1 选择部署平台

**用户：**
> "我想部署在阿里云上怎么做"

**我：** 提供了两种选择，用户选择了轻量应用服务器

**用户：**
> "已经购买，IP是112.74.58.44"

### 3.2 SSH连接问题

**用户：**
> "为啥SSH认证失败？"

**排查：** 用户给的文件是公钥，不是私钥。最终找到私钥文件 `kala.pem`

**解决：**
```bash
ssh -i "D:/claude project/kala.pem" root@112.74.58.44
```

### 3.3 刷新按钮Unauthorized错误

**用户：**
> "能够访问，点击测试采集功能 出现 Unauthorized..."

**原因：** 前端硬编码 `secret=admin`，服务器配置的是 `kala2024secret`

**解决：** 统一使用 `kala2024secret`

### 3.4 翻译API返回401错误

**用户反馈：**
> "我是用阿里的coding plan套餐的... 可用模型里面没有qwen-turbo，但有qwen3.5-plus"

**问题：** 阿里云开发者套餐不支持qwen-turbo模型

**解决：** 将默认模型从 `qwen-turbo` 改为 `qwen-plus`（qwen3.5-plus响应慢）

```typescript
// lib/config/ai-providers.ts
defaultModel: 'qwen-plus',
```

### 3.5 PM2环境变量不生效

**问题：** .env.local文件在standalone模式下不加载

**多次尝试：**
1. 复制.env.local到standalone目录 - 不生效
2. PM2 restart - 不生效
3. `pm2 env 0` 检查 - 环境变量确实没有

**最终解决：** 使用 `ecosystem.config.js` 显式定义环境变量

```javascript
module.exports = {
  apps: [{
    name: 'ai-tech-daily',
    script: 'server.js',
    env: {
      AI_API_KEY: 'sk-30a4fe7a394e41d0a79c98f4a565717a',
      AI_MODEL: 'qwen-plus',
      CRON_SECRET: 'kala2024secret'
    }
  }]
}
```

### 3.6 网站显示Application Error

**用户：** 发送截图显示客户端异常页面

**排查：**
1. 检查PM2日志 - 发现大量401翻译错误
2. 检查环境变量 - PM2进程没有加载
3. 检查启动方式 - standalone模式需要用 `node server.js`

**解决：** 完全删除PM2进程后用ecosystem.config.js重新启动

### 3.7 翻译超时问题

**问题：** qwen3.5-plus模型包含推理过程，响应时间过长导致超时

**错误日志：**
```
[Translator] Error: Headers Timeout Error
[Translator] Error: This operation was aborted
```

**解决：**
1. 切换到qwen-plus模型（响应更快）
2. 增加超时时间到120秒

### 3.8 ISR缓存不更新

**问题：** 首页一直显示旧数据，刷新页面不更新

**原因：** Next.js ISR缓存机制，数据更新但页面缓存没过期

**解决：** 改用动态渲染

```typescript
// app/page.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;
```

---

## 四、最终优化：AI筛选Top 20

### 4.1 用户需求

**用户：**
> "当前网站页面还是大量都是英文，我的目标是页面浏览都是中文，对于每个业界信息都是有简要的总结，另外每个维度只需要top20的内容就行，top20的内容中要强相关，并且业界影响力大的"

### 4.2 实现方案

**两阶段筛选：**

1. **规则筛选（快速）**
   - 来源质量：顶级公司/机构得分高
   - 时间新鲜度：越新得分越高
   - 内容长度：摘要越长信息越多

2. **AI评估（精细）**
   - 只对候选集（Top 50）进行AI评估
   - 评估维度：相关性、影响力、质量

**关键代码：**
```typescript
// lib/processors/selector.ts
const HIGH_QUALITY_SOURCES = [
  'OpenAI', 'Anthropic', 'Google DeepMind', 'NVIDIA', 'arXiv', ...
];

function calculateBaseScore(item: ContentItem): number {
  // 来源质量 + 时间新鲜度 + 内容长度
}
```

### 4.3 结果验证

**成功日志：**
```
[Selector] Selecting top 20 from 864 items for ai-tech...
[Selector] 50 candidates selected for AI evaluation
[Selector] Selected top 20, avg score: 76.3
[Translator] 60 items translated, 0 failed
```

---

## 五、经验教训总结

### 5.1 模型选择

| 模型 | 特点 | 适用场景 |
|------|------|----------|
| qwen-turbo | 快速但开发者套餐不支持 | 不推荐 |
| qwen3.5-plus | 包含推理，响应慢 | 深度思考场景 |
| qwen-plus | 响应快，稳定 | **推荐**：翻译、摘要 |

**教训：** 选择模型前先确认套餐支持的模型列表

### 5.2 PM2部署要点

1. **standalone模式不自动加载.env.local**
   - 必须用ecosystem.config.js显式定义环境变量

2. **修改环境变量后要完全重启**
   ```bash
   pm2 delete ai-tech-daily
   pm2 start ecosystem.config.js
   ```

3. **验证环境变量是否生效**
   ```bash
   pm2 env 0 | grep AI_API
   ```

### 5.3 API调用优化

1. **设置合理超时** - 翻译和摘要都需要足够时间
2. **批量处理延迟** - 每条翻译后延迟300ms避免限流
3. **两阶段筛选** - 先规则后AI，减少API调用次数

### 5.4 调试技巧

```bash
# 查看PM2日志
pm2 logs ai-tech-daily --lines 50

# 检查环境变量
pm2 env 0 | grep -E 'AI_API|AI_MODEL'

# 测试API连通性
curl -s 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions' \
  -H 'Authorization: Bearer your-key' \
  -d '{"model": "qwen-plus", "messages": [{"role": "user", "content": "Hi"}]}'

# 检查数据文件
cat /var/www/ai-tech-daily/.next/standalone/data/ai-tech.json | jq '.items[0]'
```

### 5.5 部署检查清单

- [ ] SSH密钥文件正确
- [ ] ecosystem.config.js环境变量配置
- [ ] API Key有效且模型支持
- [ ] 数据文件复制到standalone目录
- [ ] PM2进程环境变量验证
- [ ] Nginx配置API超时时间
- [ ] 定时任务配置

---

## 六、常用运维命令

```bash
# 服务管理
pm2 status
pm2 logs ai-tech-daily
pm2 restart ai-tech-daily

# 手动采集
curl 'http://localhost:3000/api/admin/collect?secret=kala2024secret'

# 查看数据
ls -la /var/www/ai-tech-daily/.next/standalone/data/
```

---

## 七、项目最终状态

| 功能 | 状态 |
|------|------|
| 网站 | http://112.74.58.44 ✅ |
| 全中文显示 | ✅ |
| 每分类Top 20 | ✅ |
| AI摘要 | ✅ |
| AI筛选 | ✅ |

**示例内容：**
- 推理偏移：上下文如何悄然缩短大语言模型的推理过程
- 配方比厨房更重要：AI天气预报流程的数学基础
- SMASH：基于第一人称视觉实现人形机器人全身协同的可扩展乒乓球技能

---

*文档最后更新：2026-04-02*