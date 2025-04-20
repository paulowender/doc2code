/**
 * Estimates the number of tokens in a string.
 * This is a rough estimate based on the rule of thumb that 1 token ≈ 4 characters for English text.
 * 
 * @param text The text to estimate tokens for
 * @returns Estimated number of tokens
 */
export function estimateTokens(text: string): number {
  // Simple estimation: ~4 characters per token for English text
  return Math.ceil(text.length / 4);
}

/**
 * Truncates text to fit within a specified token limit.
 * 
 * @param text The text to truncate
 * @param maxTokens The maximum number of tokens allowed
 * @param reserveTokens Number of tokens to reserve for system messages and other overhead
 * @returns The truncated text
 */
export function truncateToTokenLimit(text: string, maxTokens: number, reserveTokens: number = 1000): string {
  const availableTokens = maxTokens - reserveTokens;
  
  if (availableTokens <= 0) {
    throw new Error(`Invalid token limit: ${maxTokens} with reserve of ${reserveTokens}`);
  }
  
  const estimatedTokens = estimateTokens(text);
  
  if (estimatedTokens <= availableTokens) {
    return text; // No truncation needed
  }
  
  // Calculate approximate character limit
  const approxCharLimit = availableTokens * 4;
  
  // Truncate the text
  const truncated = text.slice(0, approxCharLimit);
  
  // Add a note about truncation
  const truncationNote = "\n\n[NOTE: This documentation has been truncated due to token limits. Please consider splitting your documentation into smaller chunks for complete processing.]";
  
  return truncated + truncationNote;
}

/**
 * Gets the maximum token limit for a specific AI provider and model
 * 
 * @param provider The AI provider (openai, openrouter, groq)
 * @param model The model name
 * @returns The maximum token limit for the model
 */
export function getModelTokenLimit(provider: string, model: string): number {
  // Default limits for different providers
  const limits: Record<string, Record<string, number>> = {
    openai: {
      'gpt-4-turbo': 128000,
      'gpt-4o': 128000,
      'gpt-4': 8192,
      'gpt-3.5-turbo': 16384,
      'default': 8192
    },
    openrouter: {
      'anthropic/claude-3-opus': 200000,
      'anthropic/claude-3-sonnet': 200000,
      'meta-llama/llama-3-70b-instruct': 8192,
      'google/gemini-pro': 32768,
      'default': 8192
    },
    groq: {
      'llama3-70b-8192': 5000, // Setting lower than actual to account for rate limits
      'llama3-8b-8192': 5000,
      'mixtral-8x7b-32768': 5000,
      'gemma-7b-it': 5000,
      'default': 5000
    }
  };
  
  // Get the limit for the specific model, or use the default for the provider
  return limits[provider]?.[model] || limits[provider]?.['default'] || 4096;
}
