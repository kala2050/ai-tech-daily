// lib/storage/index.ts

import fs from 'fs/promises';
import path from 'path';
import { Category, CategoryData, LatestData, ContentItem, Summary } from '@/lib/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const HISTORY_DIR = path.join(DATA_DIR, 'history');

// 确保目录存在
async function ensureDirs(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(HISTORY_DIR, { recursive: true });
  } catch {
    // 目录已存在
  }
}

// 分类文件路径映射
const CATEGORY_FILES: Record<Category, string> = {
  'ai-tech': path.join(DATA_DIR, 'ai-tech.json'),
  'agent-tech': path.join(DATA_DIR, 'agent-tech.json'),
  'graphics-tech': path.join(DATA_DIR, 'graphics-tech.json'),
};

const LATEST_FILE = path.join(DATA_DIR, 'latest.json');

// 空数据模板
function emptyCategoryData(): CategoryData {
  return {
    updatedAt: new Date().toISOString(),
    total: 0,
    items: [],
  };
}

function emptyLatestData(): LatestData {
  return {
    updatedAt: new Date().toISOString(),
    summary: undefined,
    categories: {
      'ai-tech': { count: 0, items: [] },
      'agent-tech': { count: 0, items: [] },
      'graphics-tech': { count: 0, items: [] },
    },
  };
}

// 读取分类数据
export async function readCategoryData(category: Category): Promise<CategoryData> {
  await ensureDirs();
  const filePath = CATEGORY_FILES[category];
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as CategoryData;
  } catch {
    return emptyCategoryData();
  }
}

// 写入分类数据
export async function writeCategoryData(
  category: Category,
  data: CategoryData
): Promise<void> {
  await ensureDirs();
  const filePath = CATEGORY_FILES[category];
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// 读取首页数据
export async function readLatestData(): Promise<LatestData> {
  await ensureDirs();
  try {
    const content = await fs.readFile(LATEST_FILE, 'utf-8');
    return JSON.parse(content) as LatestData;
  } catch {
    return emptyLatestData();
  }
}

// 写入首页数据
export async function writeLatestData(data: LatestData): Promise<void> {
  await ensureDirs();
  await fs.writeFile(LATEST_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// 追加内容到分类
export async function appendToCategory(
  category: Category,
  items: ContentItem[]
): Promise<number> {
  const data = await readCategoryData(category);
  
  // 合并新内容（按时间倒序）
  const existingIds = new Set(data.items.map(item => item.id));
  const newItems = items.filter(item => !existingIds.has(item.id));
  
  data.items = [...newItems, ...data.items];
  
  // 保留最近 100 条
  if (data.items.length > 100) {
    const removed = data.items.slice(100);
    // 归档移除的内容
    await archiveItems(removed);
    data.items = data.items.slice(0, 100);
  }
  
  data.total = data.items.length;
  data.updatedAt = new Date().toISOString();
  
  await writeCategoryData(category, data);
  return newItems.length;
}

// 更新首页数据（各分类取最新 5 条）
export async function updateLatestData(): Promise<void> {
  const categories: Category[] = ['ai-tech', 'agent-tech', 'graphics-tech'];
  
  const latest: LatestData = {
    updatedAt: new Date().toISOString(),
    categories: {
      'ai-tech': { count: 0, items: [] },
      'agent-tech': { count: 0, items: [] },
      'graphics-tech': { count: 0, items: [] },
    },
  };
  
  for (const category of categories) {
    const data = await readCategoryData(category);
    latest.categories[category] = {
      count: data.total,
      items: data.items.slice(0, 5),
    };
  }
  
  await writeLatestData(latest);
}

// 归档内容到历史
async function archiveItems(items: ContentItem[]): Promise<void> {
  if (items.length === 0) return;
  
  await ensureDirs();
  const today = new Date().toISOString().split('T')[0];
  const historyFile = path.join(HISTORY_DIR, `${today}.json`);
  
  let historyItems: ContentItem[] = [];
  try {
    const content = await fs.readFile(historyFile, 'utf-8');
    historyItems = JSON.parse(content) as ContentItem[];
  } catch {
    // 文件不存在
  }
  
  historyItems = [...items, ...historyItems];
  await fs.writeFile(historyFile, JSON.stringify(historyItems, null, 2), 'utf-8');
}

// 清理过期历史（保留 30 天）
export async function cleanOldHistory(): Promise<void> {
  await ensureDirs();
  const files = await fs.readdir(HISTORY_DIR);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0];
  
  for (const file of files) {
    if (file.endsWith('.json')) {
      const fileDate = file.replace('.json', '');
      if (fileDate < cutoffDate) {
        await fs.unlink(path.join(HISTORY_DIR, file));
      }
    }
  }
}

// 获取所有已存在的 URL（用于去重）
export async function getExistingUrls(): Promise<Set<string>> {
  const categories: Category[] = ['ai-tech', 'agent-tech', 'graphics-tech'];
  const urls = new Set<string>();

  for (const category of categories) {
    const data = await readCategoryData(category);
    data.items.forEach(item => urls.add(item.sourceUrl));
  }

  return urls;
}

// 更新摘要
export async function updateSummary(summary: Summary | null): Promise<void> {
  const data = await readLatestData();
  data.summary = summary || undefined;
  data.updatedAt = new Date().toISOString();
  await writeLatestData(data);
}

// 更新内容的翻译
export async function updateTranslations(
  updates: Map<string, { titleZh: string; summaryZh: string }>
): Promise<void> {
  const categories: Category[] = ['ai-tech', 'agent-tech', 'graphics-tech'];
  const translatedAt = new Date().toISOString();

  for (const category of categories) {
    const data = await readCategoryData(category);
    let hasUpdates = false;

    for (const item of data.items) {
      const update = updates.get(item.id);
      if (update) {
        item.titleZh = update.titleZh;
        item.summaryZh = update.summaryZh;
        item.translatedAt = translatedAt;
        hasUpdates = true;
      }
    }

    if (hasUpdates) {
      data.updatedAt = translatedAt;
      await writeCategoryData(category, data);
    }
  }

  // 同时更新 latest.json
  const latest = await readLatestData();
  for (const category of categories) {
    for (const item of latest.categories[category].items) {
      const update = updates.get(item.id);
      if (update) {
        item.titleZh = update.titleZh;
        item.summaryZh = update.summaryZh;
        item.translatedAt = translatedAt;
      }
    }
  }
  latest.updatedAt = translatedAt;
  await writeLatestData(latest);

  console.log(`[Storage] Updated translations for ${updates.size} items`);
}
