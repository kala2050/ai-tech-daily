// lib/processors/selector.ts

import { ContentItem, Category } from '@/lib/types';
import { getAIConfig, isAIConfigured } from '@/lib/config/ai-providers';

// 内容评分
interface ContentScore {
  id: string;
  relevance: number;    // 技术相关性 1-10
  impact: number;       // 业界影响力 1-10
  quality: number;      // 内容质量 1-10
  totalScore: number;   // 综合评分
  reason: string;       // 评分理由
}

// 分类描述
const CATEGORY_DESCRIPTIONS: Record<Category, string> = {
  'ai-tech': 'AI技术领域：大模型(LLM)、深度学习、NLP、计算机视觉、机器学习算法等',
  'agent-tech': '智能体技术领域：AI Agent、多智能体系统、RAG、工具调用、自主决策等',
  'graphics-tech': '图形技术领域：渲染技术、GPU计算、视觉计算、3D图形、游戏引擎等',
};

// 批量评估内容（每批10条）
async function scoreBatch(items: ContentItem[], category: Category): Promise<ContentScore[]> {
  if (!isAIConfigured() || items.length === 0) {
    // 无API配置时，按时间排序返回默认评分
    return items.map((item, index) => ({
      id: item.id,
      relevance: 5,
      impact: 5,
      quality: 5,
      totalScore: 15 - index * 0.1, // 按原始顺序递减
      reason: '未配置AI评分',
    }));
  }

  const config = getAIConfig();
  const categoryDesc = CATEGORY_DESCRIPTIONS[category];

  const prompt = `你是一个科技内容评估专家。请评估以下内容对于"${categoryDesc}"领域的价值。

评估维度（每项1-10分）：
1. 相关性：与该领域的技术相关程度
2. 影响力：对业界的影响程度（来自顶级公司/机构、重大突破、广泛关注的议题得分更高）
3. 质量：内容的深度和信息价值

待评估内容：
${items.map((item, i) => `[${i+1}] 标题：${item.title}
摘要：${item.summary.slice(0, 200)}
来源：${item.sourceName}`).join('\n\n')}

请直接输出JSON数组格式结果：
[{"index":1,"relevance":8,"impact":7,"quality":8,"reason":"简短理由"}]`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

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
        max_tokens: 1000,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`[Selector] API error: ${response.status}`);
      return items.map((item, index) => ({
        id: item.id,
        relevance: 5,
        impact: 5,
        quality: 5,
        totalScore: 15 - index * 0.1,
        reason: 'API调用失败',
      }));
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return items.map((item, index) => ({
        id: item.id,
        relevance: 5,
        impact: 5,
        quality: 5,
        totalScore: 15 - index * 0.1,
        reason: '无响应',
      }));
    }

    // 解析JSON
    let jsonText = content.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const scores = JSON.parse(jsonText);

    return items.map((item, index) => {
      const score = scores.find((s: { index: number }) => s.index === index + 1);
      if (score) {
        const totalScore = score.relevance + score.impact + score.quality;
        return {
          id: item.id,
          relevance: score.relevance,
          impact: score.impact,
          quality: score.quality,
          totalScore,
          reason: score.reason || '',
        };
      }
      return {
        id: item.id,
        relevance: 5,
        impact: 5,
        quality: 5,
        totalScore: 15,
        reason: '未评分',
      };
    });
  } catch (error) {
    console.error('[Selector] Error:', error);
    return items.map((item, index) => ({
      id: item.id,
      relevance: 5,
      impact: 5,
      quality: 5,
      totalScore: 15 - index * 0.1,
      reason: '评分失败',
    }));
  }
}

// 筛选Top N内容
export async function selectTopItems(
  items: ContentItem[],
  category: Category,
  topN: number = 20
): Promise<ContentItem[]> {
  if (items.length <= topN) {
    return items;
  }

  console.log(`[Selector] Evaluating ${items.length} items for ${category}...`);

  // 分批评分（每批10条）
  const batchSize = 10;
  const allScores: ContentScore[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const scores = await scoreBatch(batch, category);
    allScores.push(...scores);

    // 延迟避免API限流
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // 按综合评分排序
  const sortedItems = items
    .map((item, index) => ({ item, score: allScores[index] }))
    .sort((a, b) => b.score.totalScore - a.score.totalScore)
    .slice(0, topN);

  console.log(`[Selector] Selected top ${topN} items, avg score: ${(
    sortedItems.reduce((sum, s) => sum + s.score.totalScore, 0) / sortedItems.length
  ).toFixed(1)}`);

  return sortedItems.map(({ item }) => item);
}