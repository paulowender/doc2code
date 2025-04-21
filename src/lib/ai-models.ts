// Define AI model interfaces and available models for each provider

export interface AIModel {
  id: string;
  name: string;
  provider: "openai" | "openrouter" | "groq";
  description: string;
  recommended: boolean;
  free: boolean;
  maxTokens: number;
}

// This function has been replaced by the API endpoint /api/check-api-keys
// and the useApiKeys hook for client-side components

// OpenAI models
export const openaiModels: AIModel[] = [
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    provider: "openai",
    description: "Most capable GPT-4 model optimized for speed and cost",
    recommended: true,
    free: false,
    maxTokens: 4096,
  },
  {
    id: "gpt-4.1-mini",
    name: "GPT-4.1 Mini",
    provider: "openai",
    description: "OpenAI's latest and most advanced model",
    recommended: true,
    free: true,
    maxTokens: 4096,
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    description: "OpenAI's latest and most advanced model",
    recommended: true,
    free: false,
    maxTokens: 200000,
  },
  {
    id: "gpt-4",
    name: "GPT-4",
    provider: "openai",
    description: "OpenAI's most powerful model for complex tasks",
    recommended: false,
    free: false,
    maxTokens: 4096,
  },
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    provider: "openai",
    description: "Fast and cost-effective model for simpler tasks",
    recommended: false,
    free: true,
    maxTokens: 4096,
  },
];

// OpenRouter models
export const openrouterModels: AIModel[] = [
  {
    id: "anthropic/claude-3-opus",
    name: "Claude 3 Opus",
    provider: "openrouter",
    description: "Anthropic's most powerful model with exceptional reasoning",
    recommended: true,
    free: false,
    maxTokens: 4096,
  },
  {
    id: "anthropic/claude-3-sonnet",
    name: "Claude 3 Sonnet",
    provider: "openrouter",
    description: "Balanced model for quality and speed",
    recommended: true,
    free: false,
    maxTokens: 4096,
  },
  {
    id: "meta-llama/llama-3-70b-instruct",
    name: "Llama 3 70B",
    provider: "openrouter",
    description: "Meta's powerful open model with strong coding abilities",
    recommended: true,
    free: true,
    maxTokens: 4096,
  },
  {
    id: "google/gemini-pro",
    name: "Gemini Pro",
    provider: "openrouter",
    description: "Google's advanced model with strong reasoning",
    recommended: false,
    free: true,
    maxTokens: 4096,
  },
];

// Groq models
export const groqModels: AIModel[] = [
  {
    id: "llama3-70b-8192",
    name: "Llama 3 70B",
    provider: "groq",
    description: "Meta's powerful model optimized for speed on Groq",
    recommended: true,
    free: true,
    maxTokens: 5000,
  },
  {
    id: "llama3-8b-8192",
    name: "Llama 3 8B",
    provider: "groq",
    description: "Smaller, faster Llama 3 model",
    recommended: false,
    free: true,
    maxTokens: 5000,
  },
  {
    id: "mixtral-8x7b-32768",
    name: "Mixtral 8x7B",
    provider: "groq",
    description: "Powerful mixture-of-experts model with long context",
    recommended: true,
    free: true,
    maxTokens: 5000,
  },
  {
    id: "gemma-7b-it",
    name: "Gemma 7B",
    provider: "groq",
    description: "Google's lightweight open model",
    recommended: false,
    free: true,
    maxTokens: 5000,
  },
];

// Get models by provider
export function getModelsByProvider(
  provider: "openai" | "openrouter" | "groq"
): AIModel[] {
  switch (provider) {
    case "openai":
      return openaiModels;
    case "openrouter":
      return openrouterModels;
    case "groq":
      return groqModels;
    default:
      return [];
  }
}

// This function has been replaced by the API endpoint /api/check-api-keys
// and the useApiKeys hook for client-side components

// Get default model for a provider
export function getDefaultModel(
  provider: "openai" | "openrouter" | "groq"
): string {
  // Get models for the provider
  let models: AIModel[] = [];
  switch (provider) {
    case "openai":
      models = openaiModels;
      break;
    case "openrouter":
      models = openrouterModels;
      break;
    case "groq":
      models = groqModels;
      break;
    default:
      models = [];
  }

  // Find recommended model or use first model
  const recommended = models.find((model) => model.recommended);
  return recommended ? recommended.id : models[0]?.id || "";
}
