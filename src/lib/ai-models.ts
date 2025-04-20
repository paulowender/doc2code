// Define AI model interfaces and available models for each provider

export interface AIModel {
  id: string;
  name: string;
  provider: 'openai' | 'openrouter' | 'groq';
  description: string;
  recommended: boolean;
  maxTokens: number;
}

// OpenAI models
export const openaiModels: AIModel[] = [
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    description: 'Most capable GPT-4 model optimized for speed and cost',
    recommended: true,
    maxTokens: 4096
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    description: 'OpenAI\'s latest and most advanced model',
    recommended: true,
    maxTokens: 4096
  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'openai',
    description: 'OpenAI\'s most powerful model for complex tasks',
    recommended: false,
    maxTokens: 4096
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    description: 'Fast and cost-effective model for simpler tasks',
    recommended: false,
    maxTokens: 4096
  }
];

// OpenRouter models
export const openrouterModels: AIModel[] = [
  {
    id: 'anthropic/claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'openrouter',
    description: 'Anthropic\'s most powerful model with exceptional reasoning',
    recommended: true,
    maxTokens: 4096
  },
  {
    id: 'anthropic/claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    provider: 'openrouter',
    description: 'Balanced model for quality and speed',
    recommended: true,
    maxTokens: 4096
  },
  {
    id: 'meta-llama/llama-3-70b-instruct',
    name: 'Llama 3 70B',
    provider: 'openrouter',
    description: 'Meta\'s powerful open model with strong coding abilities',
    recommended: true,
    maxTokens: 4096
  },
  {
    id: 'google/gemini-pro',
    name: 'Gemini Pro',
    provider: 'openrouter',
    description: 'Google\'s advanced model with strong reasoning',
    recommended: false,
    maxTokens: 4096
  }
];

// Groq models
export const groqModels: AIModel[] = [
  {
    id: 'llama3-70b-8192',
    name: 'Llama 3 70B',
    provider: 'groq',
    description: 'Meta\'s powerful model optimized for speed on Groq',
    recommended: true,
    maxTokens: 4096
  },
  {
    id: 'llama3-8b-8192',
    name: 'Llama 3 8B',
    provider: 'groq',
    description: 'Smaller, faster Llama 3 model',
    recommended: false,
    maxTokens: 4096
  },
  {
    id: 'mixtral-8x7b-32768',
    name: 'Mixtral 8x7B',
    provider: 'groq',
    description: 'Powerful mixture-of-experts model with long context',
    recommended: true,
    maxTokens: 4096
  },
  {
    id: 'gemma-7b-it',
    name: 'Gemma 7B',
    provider: 'groq',
    description: 'Google\'s lightweight open model',
    recommended: false,
    maxTokens: 4096
  }
];

// Get models by provider
export function getModelsByProvider(provider: 'openai' | 'openrouter' | 'groq'): AIModel[] {
  switch (provider) {
    case 'openai':
      return openaiModels;
    case 'openrouter':
      return openrouterModels;
    case 'groq':
      return groqModels;
    default:
      return [];
  }
}

// Get default model for a provider
export function getDefaultModel(provider: 'openai' | 'openrouter' | 'groq'): string {
  const models = getModelsByProvider(provider);
  const recommended = models.find(model => model.recommended);
  return recommended ? recommended.id : models[0]?.id || '';
}
