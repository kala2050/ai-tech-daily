// lib/config/sources.ts

import { SourceType } from '@/lib/types';

export interface SourceConfig {
  name: string;
  type: SourceType;
  url: string;
  enabled: boolean;
}

// RSS 来源配置
export const RSS_SOURCES: SourceConfig[] = [
  // 工业界博客
  {
    name: 'OpenAI Blog',
    type: 'industry',
    url: 'https://openai.com/blog/rss.xml',
    enabled: true,
  },
  {
    name: 'DeepMind Blog',
    type: 'industry',
    url: 'https://deepmind.google/discover/blog/rss.xml',
    enabled: true,
  },
  {
    name: 'Anthropic Blog',
    type: 'industry',
    url: 'https://www.anthropic.com/news/rss',
    enabled: true,
  },
  {
    name: 'Google Research',
    type: 'industry',
    url: 'https://research.google/blog/rss.xml',
    enabled: true,
  },
  {
    name: 'NVIDIA Blog',
    type: 'industry',
    url: 'https://developer.nvidia.com/blog/feed/',
    enabled: true,
  },
  // 媒体来源
  {
    name: 'AI News',
    type: 'media',
    url: 'https://artificialintelligence-news.com/feed/',
    enabled: true,
  },
  {
    name: 'VentureBeat AI',
    type: 'media',
    url: 'https://venturebeat.com/category/ai/feed/',
    enabled: true,
  },
];

// arXiv 分类配置
export const ARXIV_CATEGORIES = [
  'cs.AI',   // Artificial Intelligence
  'cs.LG',   // Machine Learning
  'cs.CV',   // Computer Vision
  'cs.GR',   // Graphics
  'cs.CL',   // Computation and Language
  'cs.RO',   // Robotics
];

export const ARXIV_BASE_URL = 'http://export.arxiv.org/api/query';
