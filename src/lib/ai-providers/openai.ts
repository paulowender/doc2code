import OpenAI from "openai";
import logger from "@/lib/logger";

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
  language: string
): Promise<string> {
  try {
    logger.info(`Generating SDK with OpenAI for language: ${language}`);

    if (!openai.chat?.completions?.create) {
      logger.error("OpenAI client is not properly initialized");
      throw new Error("OpenAI client is not properly initialized");
    }

    if (!process.env.OPENAI_API_KEY) {
      logger.error("OPENAI_API_KEY is not set");
      throw new Error("OPENAI_API_KEY is not set");
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
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

          ${documentation}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 4000,
    });

    logger.info("OpenAI SDK generation successful", {
      model: "gpt-4-turbo",
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
