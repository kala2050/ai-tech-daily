// lib/collectors/rss.ts

import { BaseCollector, CollectorConfig } from './base';
import { RawContent } from '@/lib/types';
import Parser from 'rss-parser';

export interface RSSSourceConfig extends CollectorConfig {
  feedUrl: string;
}

export class RSSCollector extends BaseCollector {
  private feedUrl: string;
  private parser: Parser;

  constructor(config: RSSSourceConfig) {
    super({
      name: config.name,
      sourceType: config.sourceType,
      timeout: config.timeout,
      retries: config.retries,
    });
    this.feedUrl = config.feedUrl;
    this.parser = new Parser({
      timeout: this.timeout,
    });
  }

  async fetch(): Promise<RawContent[]> {
    const feed = await this.parser.parseURL(this.feedUrl);

    return feed.items.map(item => ({
      title: item.title || 'Untitled',
      summary: this.extractSummary(item),
      content: item.content || item.contentSnippet,
      url: item.link || '',
      publishedAt: item.pubDate || item.isoDate,
      tags: item.categories || [],
      sourceName: this.name,
      sourceType: this.sourceType,
    }));
  }

  private extractSummary(item: Parser.Item): string {
    // 优先使用摘要
    if (item.summary) return item.summary;
    
    // 使用 contentSnippet 截取前 200 字
    if (item.contentSnippet) {
      return item.contentSnippet.slice(0, 200).trim();
    }
    
    // 使用标题
    return item.title || '';
  }
}

// 批量创建 RSS 采集器
export function createRSSCollectors(): RSSCollector[] {
  const sources = [
    {
      name: 'OpenAI Blog',
      type: 'industry' as const,
      url: 'https://openai.com/blog/rss.xml',
    },
    {
      name: 'DeepMind Blog',
      type: 'industry' as const,
      url: 'https://deepmind.google/discover/blog/rss.xml',
    },
    {
      name: 'Anthropic Blog',
      type: 'industry' as const,
      url: 'https://www.anthropic.com/news/rss',
    },
    {
      name: 'Google Research',
      type: 'industry' as const,
      url: 'https://research.google/blog/rss.xml',
    },
    {
      name: 'NVIDIA Blog',
      type: 'industry' as const,
      url: 'https://developer.nvidia.com/blog/feed/',
    },
    {
      name: 'AI News',
      type: 'media' as const,
      url: 'https://artificialintelligence-news.com/feed/',
    },
    {
      name: 'VentureBeat AI',
      type: 'media' as const,
      url: 'https://venturebeat.com/category/ai/feed/',
    },
  ];

  return sources.map(source => new RSSCollector({
    name: source.name,
    sourceType: source.type,
    feedUrl: source.url,
  }));
}
