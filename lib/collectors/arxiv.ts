// lib/collectors/arxiv.ts

import { BaseCollector, CollectorConfig } from './base';
import { RawContent } from '@/lib/types';
import { ARXIV_CATEGORIES, ARXIV_BASE_URL } from '@/lib/config/sources';

export class ArxivCollector extends BaseCollector {
  private categories: string[];

  constructor(config?: CollectorConfig) {
    super({
      name: 'arXiv',
      sourceType: 'academic',
      ...config,
    });
    this.categories = ARXIV_CATEGORIES;
  }

  async fetch(): Promise<RawContent[]> {
    // 构建 API 查询 URL
    const query = this.categories.map(cat => `cat:${cat}`).join(' OR ');
    const searchQuery = `search_query=${query}&sortBy=submittedDate&sortOrder=descending&max_results=50`;
    const url = `${ARXIV_BASE_URL}?${searchQuery}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`arXiv API error: ${response.status}`);
    }

    const text = await response.text();
    return this.parseArxivResponse(text);
  }

  private parseArxivResponse(xml: string): RawContent[] {
    const items: RawContent[] = [];

    // 简单 XML 解析（不依赖外部库）
    const entries = xml.split('<entry>').slice(1);

    for (const entry of entries) {
      try {
        const id = this.extractValue(entry, 'id');
        const title = this.extractValue(entry, 'title').trim();
        const summary = this.extractValue(entry, 'summary').trim();
        const published = this.extractValue(entry, 'published');

        // 提取 arXiv ID 作为链接
        const arxivId = id.split('/abs/')[1] || id;
        const link = `https://arxiv.org/abs/${arxivId}`;

        // 提取分类标签
        const categoryMatches = entry.match(/category term="([^"]+)"/g) || [];
        const tags = categoryMatches
          .map(m => m.match(/term="([^"]+)"/)?.[1])
          .filter(Boolean) as string[];

        items.push({
          title,
          summary,
          url: link,
          publishedAt: published,
          tags,
          sourceName: 'arXiv',
          sourceType: 'academic',
        });
      } catch {
        // 跳过解析失败的条目
        continue;
      }
    }

    return items;
  }

  private extractValue(xml: string, tag: string): string {
    const match = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`, 's'));
    return match ? match[1].trim() : '';
  }
}
