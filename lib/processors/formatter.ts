// lib/processors/formatter.ts

import { v4 as uuidv4 } from 'uuid';
import { ContentItem, RawContent, Category } from '@/lib/types';

// 将 RawContent 转换为 ContentItem
export function formatContent(
  content: RawContent,
  category: Category
): ContentItem {
  return {
    id: uuidv4(),
    title: content.title,
    summary: extractSummary(content),
    category,
    sourceType: content.sourceType || 'industry',
    sourceName: content.sourceName || 'Unknown',
    sourceUrl: content.url,
    publishedAt: content.publishedAt || new Date().toISOString(),
    collectedAt: new Date().toISOString(),
    tags: content.tags || [],
    thumbnail: undefined,
  };
}

// 提取摘要
function extractSummary(content: RawContent): string {
  // 优先使用已有摘要
  if (content.summary && content.summary.length > 0) {
    return content.summary.slice(0, 300).trim();
  }
  
  // 使用正文截取
  if (content.content && content.content.length > 0) {
    return content.content.slice(0, 200).trim();
  }
  
  // 使用标题
  return content.title;
}

// 批量格式化
export function formatBatch(
  contents: RawContent[],
  category: Category
): ContentItem[] {
  return contents.map(content => formatContent(content, category));
}
