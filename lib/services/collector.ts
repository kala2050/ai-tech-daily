// lib/services/collector.ts

import { ArxivCollector } from '@/lib/collectors/arxiv';
import { createRSSCollectors } from '@/lib/collectors/rss';
import { deduplicateByUrl, deduplicateWithinBatch } from '@/lib/processors/deduplicator';
import { classifyBatch } from '@/lib/processors/classifier';
import { formatBatch } from '@/lib/processors/formatter';
import { selectTopItems } from '@/lib/processors/selector';
import { writeCategoryData, readCategoryData, updateLatestData, cleanOldHistory, updateSummary, updateTranslations } from '@/lib/storage';
import { CollectResult, Category, Summary, ContentItem } from '@/lib/types';
import { generateSummary } from './summarizer';
import { translateItems } from './translator';

const TOP_N = 20; // 每个分类保留的内容数量

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

  // 6. 格式化、AI筛选、存储
  for (const [category, contents] of classifiedContents) {
    if (contents.length > 0) {
      // 格式化
      const formattedItems = formatBatch(contents, category as Category);

      // 读取现有内容
      const existingData = await readCategoryData(category as Category);
      const allItems = [...formattedItems, ...existingData.items];

      // AI筛选Top N
      console.log(`[Collector] Selecting top ${TOP_N} items for ${category} from ${allItems.length} total...`);
      const topItems = await selectTopItems(allItems, category as Category, TOP_N);

      // 保存
      await writeCategoryData(category as Category, {
        updatedAt: new Date().toISOString(),
        total: topItems.length,
        items: topItems,
      });

      result.categories[category as Category] = formattedItems.length;
      result.total += formattedItems.length;
    }
  }

  // 7. 更新首页数据
  await updateLatestData();

  // 8. 翻译Top 20内容（阻塞式，确保翻译完成）
  await translateTopItems();

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

  console.log(`[Collect] Completed: ${result.total} new items collected, Top ${TOP_N} selected per category${summary ? ', summary generated' : ''}`);

  return result;
}

// 翻译Top 20内容
async function translateTopItems(): Promise<void> {
  console.log('[Collector] Translating top items...');

  const categories: Category[] = ['ai-tech', 'agent-tech', 'graphics-tech'];
  const allItems: ContentItem[] = [];

  for (const category of categories) {
    const data = await readCategoryData(category);
    // 只翻译未翻译的内容
    const untranslated = data.items.filter(item => !item.titleZh && !item.translatedAt);
    allItems.push(...untranslated);
  }

  if (allItems.length === 0) {
    console.log('[Collector] All items already translated');
    return;
  }

  console.log(`[Collector] Translating ${allItems.length} items...`);

  const translations = await translateItems(allItems);

  if (translations.size > 0) {
    await updateTranslations(translations);
    console.log(`[Collector] Translation completed: ${translations.size} items`);
  }
}