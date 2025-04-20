import axios from "axios";
import logger from "@/lib/logger";
import {
  truncateToTokenLimit,
  getModelTokenLimit,
} from "@/lib/utils/truncateText";

export async function generateSDKWithGroq(
  documentation: string,
  language: string,
  model: string = "llama3-70b-8192"
): Promise<string> {
  try {
    logger.info(
      `Generating SDK with Groq for language: ${language} using model: ${model}`
    );

    if (!process.env.GROQ_API_KEY) {
      logger.error("GROQ_API_KEY is not set");
      throw new Error("GROQ_API_KEY is not set");
    }

    // Model is passed as a parameter

    // Get token limit for the model and truncate documentation if needed
    const tokenLimit = getModelTokenLimit("groq", model);
    const originalLength = documentation.length;
    const truncatedDocumentation = truncateToTokenLimit(
      documentation,
      tokenLimit
    );

    if (truncatedDocumentation.length < originalLength) {
      logger.warn(
        `Documentation truncated from ${originalLength} characters to ${truncatedDocumentation.length} characters to fit within token limit for Groq model ${model}`
      );
    }

    logger.debug("Groq request configuration", { model, language, tokenLimit });

    try {
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
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

              ${truncatedDocumentation}`,
            },
          ],
          temperature: 0.2,
          max_tokens: 4000,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          },
        }
      );

      logger.info("Groq SDK generation successful", { model, language });

      const generatedContent = response.data.choices[0]?.message?.content;
      if (!generatedContent) {
        logger.warn("Groq returned empty content");
        return "Failed to generate SDK - empty response from Groq";
      }

      return generatedContent;
    } catch (axiosError) {
      if (axios.isAxiosError(axiosError)) {
        logger.error("Axios error in Groq request", {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          data: axiosError.response?.data,
        });
      }
      throw axiosError;
    }
  } catch (error) {
    logger.error("Error generating SDK with Groq:", error);
    throw new Error(
      `Failed to generate SDK with Groq: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
