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
 * Minifies text by removing unnecessary whitespace and comments.
 * This helps reduce token count while preserving essential content.
 *
 * @param text The text to minify
 * @param isJson Whether the text is JSON (special handling for JSON)
 * @returns The minified text
 */
export function minifyText(text: string, isJson: boolean = false): string {
  if (!text) return text;

  if (isJson) {
    try {
      // For JSON, parse and stringify to remove whitespace
      const parsed = JSON.parse(text);
      return JSON.stringify(parsed);
    } catch (e) {
      // If parsing fails, fall back to regular minification
      console.warn(
        "Failed to parse as JSON, falling back to regular minification"
      );
    }
  }

  return (
    text
      // Remove comments (both // and /* */ style)
      .replace(/\/\/.*$/gm, "") // Remove single line comments
      .replace(/\/\*[\s\S]*?\*\//g, "") // Remove multi-line comments
      // Remove extra whitespace
      .replace(/\s+/g, " ")
      // Remove whitespace around punctuation
      .replace(/\s*([\.,;:\(\)\[\]\{\}])\s*/g, "$1")
      // Trim leading/trailing whitespace
      .trim()
  );
}

/**
 * Truncates text to fit within a specified token limit.
 *
 * @param text The text to truncate
 * @param maxTokens The maximum number of tokens allowed
 * @param reserveTokens Number of tokens to reserve for system messages and other overhead
 * @returns The truncated text
 */
export function truncateToTokenLimit(
  text: string,
  maxTokens: number,
  reserveTokens: number = 1000
): string {
  const availableTokens = maxTokens - reserveTokens;

  if (availableTokens <= 0) {
    throw new Error(
      `Invalid token limit: ${maxTokens} with reserve of ${reserveTokens}`
    );
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
  const truncationNote =
    "\n\n[NOTE: This documentation has been truncated due to token limits. Please consider splitting your documentation into smaller chunks for complete processing.]";

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
      "gpt-4-turbo": 128000,
      "gpt-4o": 128000,
      "gpt-4": 8192,
      "gpt-3.5-turbo": 16384,
      default: 8192,
    },
    openrouter: {
      "anthropic/claude-3-opus": 200000,
      "anthropic/claude-3-sonnet": 200000,
      "meta-llama/llama-3-70b-instruct": 8192,
      "google/gemini-pro": 32768,
      default: 8192,
    },
    groq: {
      "llama3-70b-8192": 5000, // Setting lower than actual to account for rate limits
      "llama3-8b-8192": 5000,
      "mixtral-8x7b-32768": 5000,
      "gemma-7b-it": 5000,
      default: 5000,
    },
  };

  // Get the limit for the specific model, or use the default for the provider
  return limits[provider]?.[model] || limits[provider]?.["default"] || 4096;
}

/**
 * Splits text into chunks of approximately equal token size
 *
 * @param text The text to split
 * @param maxTokensPerChunk Maximum tokens per chunk
 * @param overlap Number of tokens to overlap between chunks
 * @returns Array of text chunks
 */
export function splitTextIntoChunks(
  text: string,
  maxTokensPerChunk: number = 4000,
  overlap: number = 200
): string[] {
  if (!text) return [];

  const estimatedTotalTokens = estimateTokens(text);

  // If text is already small enough, return it as a single chunk
  if (estimatedTotalTokens <= maxTokensPerChunk) {
    return [text];
  }

  const chunks: string[] = [];
  const charsPerToken = 4; // Approximate characters per token
  const charsPerChunk = maxTokensPerChunk * charsPerToken;
  const overlapChars = overlap * charsPerToken;

  let startPos = 0;

  while (startPos < text.length) {
    // Calculate end position for this chunk
    let endPos = startPos + charsPerChunk;

    // Adjust if we're at the end of the text
    if (endPos >= text.length) {
      endPos = text.length;
    } else {
      // Try to find a good break point (newline or period)
      const searchEndPos = Math.min(endPos + 100, text.length); // Look a bit further for a good break
      const textToSearch = text.substring(endPos, searchEndPos);

      // Look for paragraph break, then sentence break
      const paragraphBreak = textToSearch.indexOf("\n\n");
      const sentenceBreak = textToSearch.indexOf(". ");

      if (paragraphBreak !== -1 && paragraphBreak < 100) {
        endPos += paragraphBreak + 2; // Include the newlines
      } else if (sentenceBreak !== -1 && sentenceBreak < 100) {
        endPos += sentenceBreak + 1; // Include the period
      }
    }

    // Extract the chunk
    chunks.push(text.substring(startPos, endPos));

    // Move to next chunk position, accounting for overlap
    startPos = endPos - overlapChars;

    // Make sure we're making progress
    if (
      startPos >= text.length ||
      (chunks.length > 1 && startPos >= text.length - overlapChars)
    ) {
      break;
    }
  }

  return chunks;
}
