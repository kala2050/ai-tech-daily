// lib/collectors/base.ts

import { RawContent, CollectorResult, SourceType } from '@/lib/types';

export interface CollectorConfig {
  name: string;
  sourceType: SourceType;
  timeout?: number;
  retries?: number;
}

export abstract class BaseCollector {
  protected name: string;
  protected sourceType: SourceType;
  protected timeout: number;
  protected retries: number;

  constructor(config: CollectorConfig) {
    this.name = config.name;
    this.sourceType = config.sourceType;
    this.timeout = config.timeout || 30000;
    this.retries = config.retries || 2;
  }

  // 子类实现具体采集逻辑
  abstract fetch(): Promise<RawContent[]>;

  // 执行采集（带错误处理）
  async collect(): Promise<CollectorResult> {
    const result: CollectorResult = {
      sourceName: this.name,
      sourceType: this.sourceType,
      items: [],
    };

    let attempts = 0;
    while (attempts <= this.retries) {
      try {
        const items = await this.fetchWithTimeout();
        result.items = items;
        break;
      } catch (error) {
        attempts++;
        if (attempts > this.retries) {
          result.error = error instanceof Error ? error.message : 'Unknown error';
          console.error(`[${this.name}] Collection failed after ${attempts} attempts:`, result.error);
        } else {
          console.warn(`[${this.name}] Attempt ${attempts} failed, retrying...`);
          await this.delay(1000 * attempts);
        }
      }
    }

    return result;
  }

  // 带超时的采集
  private async fetchWithTimeout(): Promise<RawContent[]> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timeout after ${this.timeout}ms`));
      }, this.timeout);

      this.fetch()
        .then(items => {
          clearTimeout(timer);
          resolve(items);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  // 延迟辅助
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
