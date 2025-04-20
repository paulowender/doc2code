import axios from "axios";
import logger from "@/lib/logger";

export async function generateSDKWithOpenRouter(
  documentation: string,
  language: string,
  model: string = "anthropic/claude-3-opus"
): Promise<string> {
  try {
    logger.info(
      `Generating SDK with OpenRouter for language: ${language} using model: ${model}`
    );

    if (!process.env.OPENROUTER_API_KEY) {
      logger.error("OPENROUTER_API_KEY is not set");
      throw new Error("OPENROUTER_API_KEY is not set");
    }

    // Model is passed as a parameter
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    logger.debug("OpenRouter request configuration", {
      model,
      language,
      appUrl,
    });

    try {
      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model,
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
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "HTTP-Referer": appUrl,
            "X-Title": "doc2code",
          },
        }
      );

      logger.info("OpenRouter SDK generation successful", { model, language });

      const generatedContent = response.data.choices[0]?.message?.content;
      if (!generatedContent) {
        logger.warn("OpenRouter returned empty content");
        return "Failed to generate SDK - empty response from OpenRouter";
      }

      return generatedContent;
    } catch (axiosError) {
      if (axios.isAxiosError(axiosError)) {
        logger.error("Axios error in OpenRouter request", {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          data: axiosError.response?.data,
        });
      }
      throw axiosError;
    }
  } catch (error) {
    logger.error("Error generating SDK with OpenRouter:", error);
    throw new Error(
      `Failed to generate SDK with OpenRouter: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
