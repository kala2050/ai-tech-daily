// lib/services/translator.ts

import { ContentItem } from '@/lib/types';
import { getAIConfig, isAIConfigured } from '@/lib/config/ai-providers';

// 翻译单条内容
export async function translateItem(item: ContentItem): Promise<{ titleZh: string; summaryZh: string } | null> {
  if (!isAIConfigured()) {
    console.error('[Translator] AI_API_KEY not configured');
    return null;
  }

  const config = getAIConfig();

  // 检查是否需要翻译（简单判断：如果包含中文则跳过）
  const hasChinese = (text: string) => /[\u4e00-\u9fa5]/.test(text);
  if (hasChinese(item.title) && hasChinese(item.summary)) {
    return null;
  }

  const prompt = `请将以下英文内容翻译成中文，保持专业术语的准确性。直接输出JSON格式结果。

标题：${item.title}

摘要：${item.summary}

输出格式：{"titleZh":"中文标题","summaryZh":"中文摘要"}`;

  try {
    const response = await fetch(`${config.apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Translator] API error ${response.status}: ${errorText}`);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('[Translator] Empty response from API');
      return null;
    }

    // 解析 JSON
    let jsonText = content.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(jsonText);
    return {
      titleZh: parsed.titleZh || item.title,
      summaryZh: parsed.summaryZh || item.summary,
    };
  } catch (error) {
    console.error(`[Translator] Error for "${item.title.substring(0, 50)}...":`, error);
    return null;
  }
}

// 批量翻译（带延迟，避免 API 限流）
export async function translateItems(
  items: ContentItem[],
  onProgress?: (completed: number, total: number) => void
): Promise<Map<string, { titleZh: string; summaryZh: string }>> {
  const results = new Map<string, { titleZh: string; summaryZh: string }>();

  if (!isAIConfigured()) {
    console.warn('[Translator] AI_API_KEY not configured, skipping translation');
    return results;
  }

  // 过滤需要翻译的内容（不含中文的）
  const itemsToTranslate = items.filter(item => {
    const hasChinese = (text: string) => /[\u4e00-\u9fa5]/.test(text);
    return !hasChinese(item.title) || !hasChinese(item.summary);
  });

  console.log(`[Translator] ${itemsToTranslate.length} items need translation out of ${items.length}`);

  // 限制每次最多翻译 50 条，避免超时
  const maxItems = Math.min(itemsToTranslate.length, 50);
  console.log(`[Translator] Translating first ${maxItems} items...`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < maxItems; i++) {
    const item = itemsToTranslate[i];

    // 每处理 10 条打印一次进度
    if (i > 0 && i % 10 === 0) {
      console.log(`[Translator] Progress: ${i}/${maxItems}, success: ${successCount}, fail: ${failCount}`);
    }

    const result = await translateItem(item);

    if (result) {
      results.set(item.id, result);
      successCount++;
    } else {
      failCount++;
    }

    onProgress?.(i + 1, maxItems);

    // 延迟 300ms 避免 API 限流
    if (i < maxItems - 1) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  console.log(`[Translator] Completed: ${results.size} items translated, ${failCount} failed`);
  return results;
}
