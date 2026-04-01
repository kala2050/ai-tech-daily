// lib/types/index.ts

export type Category = 'ai-tech' | 'agent-tech' | 'graphics-tech';

export type SourceType = 'academic' | 'industry' | 'media';

// 摘要类型
export interface Summary {
  aiTech: string;        // AI 技术领域摘要（约 100 字）
  agentTech: string;     // 智能体技术摘要（约 100 字）
  graphicsTech: string;  // 图形技术摘要（约 100 字）
  trend: string;         // 整体趋势点评（约 50 字）
  generatedAt: string;   // 摘要生成时间
  model: string;         // 使用的模型名称
}

export interface ContentItem {
  id: string;
  title: string;
  summary: string;
  titleZh?: string;        // 中文标题
  summaryZh?: string;      // 中文摘要
  translatedAt?: string;   // 翻译时间
  category: Category;
  sourceType: SourceType;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string;
  collectedAt: string;
  tags: string[];
  thumbnail?: string;
}

export interface CategoryData {
  updatedAt: string;
  total: number;
  items: ContentItem[];
}

export interface LatestData {
  updatedAt: string;
  summary?: Summary;     // 摘要
  categories: {
    'ai-tech': { count: number; items: ContentItem[] };
    'agent-tech': { count: number; items: ContentItem[] };
    'graphics-tech': { count: number; items: ContentItem[] };
  };
}

export interface RawContent {
  title: string;
  summary?: string;
  content?: string;
  url: string;
  publishedAt?: string;
  tags?: string[];
  sourceName?: string;
  sourceType?: SourceType;
}

export interface CollectorResult {
  sourceName: string;
  sourceType: SourceType;
  items: RawContent[];
  error?: string;
}

export interface CollectResult {
  timestamp: string;
  total: number;
  results: CollectorResult[];
  categories: {
    'ai-tech': number;
    'agent-tech': number;
    'graphics-tech': number;
  };
  summary?: Summary;  // 生成的摘要
}
