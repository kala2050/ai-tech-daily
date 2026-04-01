// lib/processors/classifier.ts

import { Category, RawContent } from '@/lib/types';
import { CATEGORY_KEYWORDS } from '@/lib/config/keywords';

export function classifyContent(content: RawContent): Category {
  const text = `${content.title} ${(content.summary || '')} ${(content.tags || []).join(' ')}`.toLowerCase();
  
  const scores: Record<Category, number> = {
    'ai-tech': 0,
    'agent-tech': 0,
    'graphics-tech': 0,
  };

  // 计算各分类的关键词匹配得分
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        scores[category as Category] += 1;
      }
    }
  }

  // 返回得分最高的分类
  let maxScore = 0;
  let bestCategory: Category = 'ai-tech'; // 默认分类

  for (const [category, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestCategory = category as Category;
    }
  }

  return bestCategory;
}

// 批量分类
export function classifyBatch(contents: RawContent[]): Map<Category, RawContent[]> {
  const result = new Map<Category, RawContent[]>();
  result.set('ai-tech', []);
  result.set('agent-tech', []);
  result.set('graphics-tech', []);

  for (const content of contents) {
    const category = classifyContent(content);
    result.get(category)!.push(content);
  }

  return result;
}
