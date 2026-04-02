// lib/config/ai-providers.ts

export interface AIProviderConfig {
  name: string;
  defaultModel: string;
  apiBase: string;
}

// 预定义的 Provider 配置
const PROVIDER_CONFIGS: Record<string, AIProviderConfig> = {
  bailian: {
    name: '阿里百炼',
    defaultModel: 'qwen3.5-plus',
    apiBase: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  },
  openai: {
    name: 'OpenAI',
    defaultModel: 'gpt-4o-mini',
    apiBase: 'https://api.openai.com/v1',
  },
  deepseek: {
    name: 'DeepSeek',
    defaultModel: 'deepseek-chat',
    apiBase: 'https://api.deepseek.com/v1',
  },
};

// 获取当前配置
export function getAIConfig(): {
  provider: string;
  model: string;
  apiKey: string;
  apiBase: string;
} {
  const provider = process.env.AI_PROVIDER || 'bailian';
  const providerConfig = PROVIDER_CONFIGS[provider] || PROVIDER_CONFIGS.bailian;
  
  return {
    provider,
    model: process.env.AI_MODEL || providerConfig.defaultModel,
    apiKey: process.env.AI_API_KEY || '',
    apiBase: process.env.AI_API_BASE || providerConfig.apiBase,
  };
}

// 检查是否配置了 API Key
export function isAIConfigured(): boolean {
  return !!process.env.AI_API_KEY;
}

// 获取模型显示名称
export function getModelDisplayName(): string {
  const config = getAIConfig();
  const providerConfig = PROVIDER_CONFIGS[config.provider];
  return `${providerConfig?.name || config.provider} / ${config.model}`;
}
