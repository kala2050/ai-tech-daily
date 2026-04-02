// lib/processors/selector.ts

import { ContentItem, Category } from '@/lib/types';
import { getAIConfig, isAIConfigured } from '@/lib/config/ai-providers';

// 内容评分
interface ContentScore {
  id: string;
  relevance: number;
  impact: number;
  quality: number;
  totalScore: number;
  reason: string;
}

// 高质量来源（权重更高）
const HIGH_QUALITY_SOURCES = [
  'OpenAI', 'Anthropic', 'Google DeepMind', 'Google Research', 'Meta AI',
  'Microsoft Research', 'NVIDIA', 'Apple ML', 'Amazon Science',
  'arXiv', 'Nature', 'Science', 'MIT', 'Stanford', 'Berkeley',
  'DeepMind Blog', 'OpenAI Blog', 'Google AI Blog',
];

// 分类描述
const CATEGORY_DESCRIPTIONS: Record<Category, string> = {
  'ai-tech': 'AI技术',
  'agent-tech': '智能体技术',
  'graphics-tech': '图形技术',
};

// 计算基础分数（无需AI）
function calculateBaseScore(item: ContentItem): number {
  let score = 0;

  // 来源质量（0-30分）
  if (HIGH_QUALITY_SOURCES.some(s => item.sourceName.includes(s))) {
    score += 30;
  } else if (item.sourceType === 'academic') {
    score += 20;
  } else if (item.sourceType === 'industry') {
    score += 15;
  } else {
    score += 10;
  }

  // 时间新鲜度（0-20分）
  const daysSincePublish = (Date.now() - new Date(item.publishedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSincePublish < 1) {
    score += 20;
  } else if (daysSincePublish < 7) {
    score += 15;
  } else if (daysSincePublish < 30) {
    score += 10;
  } else {
    score += 5;
  }

  // 内容长度（0-10分）- 摘要越长通常信息越多
  const summaryLength = item.summary?.length || 0;
  if (summaryLength > 200) {
    score += 10;
  } else if (summaryLength > 100) {
    score += 7;
  } else {
    score += 4;
  }

  return score;
}

// AI评估候选内容（每批5条）
async function scoreBatchWithAI(items: ContentItem[], category: Category): Promise<ContentScore[]> {
  if (!isAIConfigured() || items.length === 0) {
    return items.map((item, index) => ({
      id: item.id,
      relevance: 5,
      impact: 5,
      quality: 5,
      totalScore: calculateBaseScore(item) + 15,
      reason: '未使用AI评分',
    }));
  }

  const config = getAIConfig();
  const categoryDesc = CATEGORY_DESCRIPTIONS[category];

  const prompt = `评估以下${categoryDesc}相关内容的质量。输出JSON数组，每项包含index(1-5), relevance(1-10), impact(1-10), quality(1-10)。

内容：
${items.map((item, i) => `[${i+1}] ${item.title}`).join('\n')}

输出格式：[{"index":1,"relevance":8,"impact":7,"quality":8}]`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

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
        max_tokens: 300,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content');
    }

    // 解析JSON
    let jsonText = content.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    // 提取JSON数组
    const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found');
    }

    const scores = JSON.parse(jsonMatch[0]);

    return items.map((item, index) => {
      const score = scores.find((s: { index: number }) => s.index === index + 1);
      const baseScore = calculateBaseScore(item);

      if (score) {
        const aiScore = (score.relevance + score.impact + score.quality) / 3;
        return {
          id: item.id,
          relevance: score.relevance,
          impact: score.impact,
          quality: score.quality,
          totalScore: baseScore + aiScore * 2, // 基础分 + AI加权分
          reason: 'AI评分',
        };
      }
      return {
        id: item.id,
        relevance: 5,
        impact: 5,
        quality: 5,
        totalScore: baseScore + 15,
        reason: '评分失败',
      };
    });
  } catch (error) {
    console.error(`[Selector] AI scoring failed:`, error);
    return items.map((item) => ({
      id: item.id,
      relevance: 5,
      impact: 5,
      quality: 5,
      totalScore: calculateBaseScore(item) + 15,
      reason: 'AI评分失败',
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

  console.log(`[Selector] Selecting top ${topN} from ${items.length} items for ${category}...`);

  // 1. 先用基础分数快速筛选候选集（取前50条）
  const itemsWithBaseScore = items.map(item => ({
    item,
    baseScore: calculateBaseScore(item),
  }));

  itemsWithBaseScore.sort((a, b) => b.baseScore - a.baseScore);
  const candidates = itemsWithBaseScore.slice(0, Math.min(50, items.length));

  console.log(`[Selector] ${candidates.length} candidates selected for AI evaluation`);

  // 2. 对候选内容进行AI评估
  const batchSize = 5;
  const allScores: ContentScore[] = [];

  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize).map(c => c.item);
    const scores = await scoreBatchWithAI(batch, category);
    allScores.push(...scores);

    // 延迟避免API限流
    if (i + batchSize < candidates.length) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  // 3. 按综合评分排序
  const sortedItems = candidates
    .map(({ item }, index) => ({ item, score: allScores[index] }))
    .sort((a, b) => b.score.totalScore - a.score.totalScore)
    .slice(0, topN);

  console.log(`[Selector] Selected top ${topN}, avg score: ${(
    sortedItems.reduce((sum, s) => sum + s.score.totalScore, 0) / sortedItems.length
  ).toFixed(1)}`);

  return sortedItems.map(({ item }) => item);
}