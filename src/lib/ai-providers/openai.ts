import OpenAI from "openai";
import logger from "@/lib/logger";
import {
  truncateToTokenLimit,
  getModelTokenLimit,
} from "@/lib/utils/truncateText";

let openai: OpenAI;

try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  if (!process.env.OPENAI_API_KEY) {
    logger.warn("OPENAI_API_KEY is not set");
  }
} catch (error) {
  logger.error("Failed to initialize OpenAI client", error);
  // Create a dummy client that will throw an error when used
  openai = {} as OpenAI;
}

export async function generateSDKWithOpenAI(
  documentation: string,
  language: string,
  model: string = "gpt-4-turbo"
): Promise<string> {
  try {
    logger.info(
      `Generating SDK with OpenAI for language: ${language} using model: ${model}`
    );

    if (!openai.chat?.completions?.create) {
      logger.error("OpenAI client is not properly initialized");
      throw new Error("OpenAI client is not properly initialized");
    }

    if (!process.env.OPENAI_API_KEY) {
      logger.error("OPENAI_API_KEY is not set");
      throw new Error("OPENAI_API_KEY is not set");
    }

    // Get token limit for the model and truncate documentation if needed
    const tokenLimit = getModelTokenLimit("openai", model);
    const originalLength = documentation.length;
    const truncatedDocumentation = truncateToTokenLimit(
      documentation,
      tokenLimit
    );

    if (truncatedDocumentation.length < originalLength) {
      logger.warn(
        `Documentation truncated from ${originalLength} characters to ${truncatedDocumentation.length} characters to fit within token limit for OpenAI model ${model}`
      );
    }

    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: `You are an expert SDK generator. Your task is to convert API documentation into a well-structured, production-ready SDK in ${language}.
          Include proper error handling, documentation, and follow best practices for the language.
          The SDK should be easy to use and understand.`,
        },
        {
          role: "user",
          content: `Here is the API documentation. Please generate a complete SDK in ${language} that wraps this API:

          ${truncatedDocumentation}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 4000,
    });

    logger.info("OpenAI SDK generation successful", {
      model,
      language,
    });

    const generatedContent = response.choices[0]?.message?.content;
    if (!generatedContent) {
      logger.warn("OpenAI returned empty content");
      return "Failed to generate SDK - empty response from OpenAI";
    }

    return generatedContent;
  } catch (error) {
    logger.error("Error generating SDK with OpenAI:", error);
    throw new Error(
      `Failed to generate SDK with OpenAI: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
