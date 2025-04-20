import axios from "axios";
import logger from "@/lib/logger";

export async function generateSDKWithGroq(
  documentation: string,
  language: string
): Promise<string> {
  try {
    logger.info(`Generating SDK with Groq for language: ${language}`);

    if (!process.env.GROQ_API_KEY) {
      logger.error("GROQ_API_KEY is not set");
      throw new Error("GROQ_API_KEY is not set");
    }

    const model = "llama3-70b-8192";

    logger.debug("Groq request configuration", { model, language });

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

              ${documentation}`,
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
