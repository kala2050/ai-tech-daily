// lib/services/translator.ts

import { ContentItem } from '@/lib/types';
import { getAIConfig, isAIConfigured } from '@/lib/config/ai-providers';

// 翻译单条内容
export async function translateItem(item: ContentItem): Promise<{ titleZh: string; summaryZh: string } | null> {
  if (!isAIConfigured()) {
    return null;
  }

  const config = getAIConfig();

  // 检查是否需要翻译（简单判断：如果包含中文则跳过）
  const hasChinese = (text: string) => /[\u4e00-\u9fa5]/.test(text);
  if (hasChinese(item.title) && hasChinese(item.summary)) {
    return null;
  }

  const prompt = `请将以下英文内容翻译成中文，保持专业术语的准确性。

标题：
${item.title}

摘要：
${item.summary}

请直接输出翻译结果，格式如下（JSON格式）：
{"titleZh":"翻译后的标题","summaryZh":"翻译后的摘要"}`;

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
      throw new Error(`Translation API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Empty translation response');
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
    console.error(`[Translator] Failed to translate item ${item.id}:`, error);
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

  for (let i = 0; i < itemsToTranslate.length; i++) {
    const item = itemsToTranslate[i];
    const result = await translateItem(item);

    if (result) {
      results.set(item.id, result);
    }

    onProgress?.(i + 1, itemsToTranslate.length);

    // 延迟 500ms 避免 API 限流
    if (i < itemsToTranslate.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log(`[Translator] Completed: ${results.size} items translated`);
  return results;
}
