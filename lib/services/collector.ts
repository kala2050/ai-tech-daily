// lib/services/collector.ts

import { ArxivCollector } from '@/lib/collectors/arxiv';
import { createRSSCollectors } from '@/lib/collectors/rss';
import { deduplicateByUrl, deduplicateWithinBatch } from '@/lib/processors/deduplicator';
import { classifyBatch } from '@/lib/processors/classifier';
import { formatBatch } from '@/lib/processors/formatter';
import { appendToCategory, updateLatestData, cleanOldHistory, readCategoryData, updateSummary, updateTranslations } from '@/lib/storage';
import { CollectResult, Category, Summary, ContentItem } from '@/lib/types';
import { generateSummary } from './summarizer';
import { translateItems } from './translator';

export async function runCollection(): Promise<CollectResult> {
  const result: CollectResult = {
    timestamp: new Date().toISOString(),
    total: 0,
    results: [],
    categories: {
      'ai-tech': 0,
      'agent-tech': 0,
      'graphics-tech': 0,
    },
  };

  // 1. 执行所有采集器
  const collectors = [
    new ArxivCollector(),
    ...createRSSCollectors(),
  ];

  const collectResults = await Promise.all(
    collectors.map(collector => collector.collect())
  );

  result.results = collectResults;

  // 2. 合并所有原始内容
  const allRawContents = collectResults
    .filter(r => !r.error)
    .flatMap(r => r.items);

  // 3. 批次内去重
  const uniqueContents = deduplicateWithinBatch(allRawContents);

  // 4. 历史去重
  const newContents = await deduplicateByUrl(uniqueContents);

  // 5. 分类
  const classifiedContents = classifyBatch(newContents);

  // 6. 格式化并存储
  for (const [category, contents] of classifiedContents) {
    if (contents.length > 0) {
      const formattedItems = formatBatch(contents, category as Category);
      const addedCount = await appendToCategory(category as Category, formattedItems);
      result.categories[category as Category] = addedCount;
      result.total += addedCount;
    }
  }

  // 7. 更新首页数据
  await updateLatestData();

  // 8. 异步翻译（不阻塞响应）
  translateNewItems().catch(err => {
    console.error('[Collector] Background translation failed:', err);
  });

  // 9. 生成 AI 摘要
  let summary: Summary | null = null;
  try {
    const aiTechData = await readCategoryData('ai-tech');
    const agentTechData = await readCategoryData('agent-tech');
    const graphicsTechData = await readCategoryData('graphics-tech');

    summary = await generateSummary({
      'ai-tech': aiTechData.items,
      'agent-tech': agentTechData.items,
      'graphics-tech': graphicsTechData.items,
    });

    if (summary) {
      await updateSummary(summary);
      result.summary = summary;
    }
  } catch (error) {
    console.error('[Collector] Summary generation failed:', error);
  }

  // 10. 清理过期历史
  await cleanOldHistory();

  console.log(`[Collect] Completed: ${result.total} new items added${summary ? ', summary generated' : ''}`);

  return result;
}

// 异步翻译新内容
async function translateNewItems(): Promise<void> {
  console.log('[Collector] Starting background translation...');

  const categories: Category[] = ['ai-tech', 'agent-tech', 'graphics-tech'];
  const allItems: ContentItem[] = [];

  for (const category of categories) {
    const data = await readCategoryData(category);
    // 只翻译未翻译的内容
    const untranslated = data.items.filter(item => !item.titleZh && !item.translatedAt);
    allItems.push(...untranslated);
  }

  if (allItems.length === 0) {
    console.log('[Collector] No items need translation');
    return;
  }

  console.log(`[Collector] Translating ${allItems.length} items...`);

  const translations = await translateItems(allItems);

  if (translations.size > 0) {
    await updateTranslations(translations);
    console.log(`[Collector] Translation completed: ${translations.size} items`);
  }
}
