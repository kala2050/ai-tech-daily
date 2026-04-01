// lib/services/summarizer.ts

import { Summary, ContentItem } from '@/lib/types';
import { getAIConfig, isAIConfigured, getModelDisplayName } from '@/lib/config/ai-providers';

// 生成摘要的 Prompt
function buildPrompt(categories: {
  'ai-tech': ContentItem[];
  'agent-tech': ContentItem[];
  'graphics-tech': ContentItem[];
}): string {
  const formatItems = (items: ContentItem[], maxCount: number = 10): string => {
    return items.slice(0, maxCount)
      .map(item => `- ${item.title}`)
      .join('\n');
  };

  return `你是一个科技资讯分析师。请根据以下今日采集的内容，生成一份结构化的技术日报摘要。

## 输出格式要求
请严格按以下 JSON 格式输出，不要添加 markdown 代码块标记，直接输出 JSON：
{"aiTech":"AI技术领域的核心进展，约100字","agentTech":"智能体技术领域的核心进展，约100字","graphicsTech":"图形技术领域的核心进展，约100字","trend":"整体趋势点评，约50字"}

## 今日内容

### AI 技术（共 ${categories['ai-tech'].length} 条）
${formatItems(categories['ai-tech'])}

### 智能体技术（共 ${categories['agent-tech'].length} 条）
${formatItems(categories['agent-tech'])}

### 图形技术（共 ${categories['graphics-tech'].length} 条）
${formatItems(categories['graphics-tech'])}`;
}

// 解析 AI 返回的 JSON
function parseSummaryResponse(text: string, model: string): Summary {
  try {
    // 尝试提取 JSON（处理可能的 markdown 代码块）
    let jsonText = text.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    
    const parsed = JSON.parse(jsonText);
    
    return {
      aiTech: parsed.aiTech || '',
      agentTech: parsed.agentTech || '',
      graphicsTech: parsed.graphicsTech || '',
      trend: parsed.trend || '',
      generatedAt: new Date().toISOString(),
      model: model,
    };
  } catch (error) {
    console.error('[Summarizer] Failed to parse response:', error);
    throw new Error('Failed to parse AI response as JSON');
  }
}

// 生成摘要
export async function generateSummary(categories: {
  'ai-tech': ContentItem[];
  'agent-tech': ContentItem[];
  'graphics-tech': ContentItem[];
}): Promise<Summary | null> {
  // 检查是否配置了 API
  if (!isAIConfigured()) {
    console.warn('[Summarizer] AI_API_KEY not configured, skipping summary generation');
    return null;
  }

  const config = getAIConfig();
  
  // 检查是否有内容
  const totalItems = categories['ai-tech'].length + categories['agent-tech'].length + categories['graphics-tech'].length;
  if (totalItems === 0) {
    console.warn('[Summarizer] No content to summarize');
    return null;
  }

  const prompt = buildPrompt(categories);

  try {
    console.log(`[Summarizer] Generating summary with ${config.provider}/${config.model}...`);
    
    const response = await fetch(`${config.apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('Empty response from AI API');
    }

    const summary = parseSummaryResponse(content, getModelDisplayName());
    console.log('[Summarizer] Summary generated successfully');
    
    return summary;
  } catch (error) {
    console.error('[Summarizer] Failed to generate summary:', error);
    return null;
  }
}
