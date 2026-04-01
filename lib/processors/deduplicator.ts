// lib/processors/deduplicator.ts

import { RawContent } from '@/lib/types';
import { getExistingUrls } from '@/lib/storage';

// 基于 URL 去重
export async function deduplicateByUrl(contents: RawContent[]): Promise<RawContent[]> {
  const existingUrls = await getExistingUrls();
  
  return contents.filter(content => {
    // 检查 URL 是否已存在
    if (existingUrls.has(content.url)) {
      return false;
    }
    
    // 添加到已存在集合（避免同批次重复）
    existingUrls.add(content.url);
    return true;
  });
}

// 批次内去重（不检查历史）
export function deduplicateWithinBatch(contents: RawContent[]): RawContent[] {
  const seenUrls = new Set<string>();
  
  return contents.filter(content => {
    if (seenUrls.has(content.url)) {
      return false;
    }
    seenUrls.add(content.url);
    return true;
  });
}
