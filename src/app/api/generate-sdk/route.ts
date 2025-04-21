import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import {
  generateSDKWithOpenAI,
  generateSDKWithOpenRouter,
  generateSDKWithGroq,
} from "@/lib/ai-providers";
import logger from "@/lib/logger";
import { minifyText, splitTextIntoChunks } from "@/lib/utils/truncateText";

// Create a rate limiter that allows 10 requests per hour
let ratelimit: Ratelimit;

try {
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, "1 h"),
    analytics: true,
  });
  logger.info("Rate limiter initialized successfully");
} catch (error) {
  logger.error("Failed to initialize rate limiter", error);
  // Create a fallback rate limiter that doesn't require Redis
  ratelimit = {
    limit: async () => ({
      success: true,
      limit: 10,
      reset: 3600,
      remaining: 10,
    }),
  } as Ratelimit;
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get("x-forwarded-for") || "anonymous";
    logger.info(`Processing request from IP: ${ip}`);

    // Check rate limit
    try {
      const { success, limit, reset, remaining } = await ratelimit.limit(ip);

      if (!success) {
        logger.warn(`Rate limit exceeded for IP: ${ip}`);
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again later." },
          {
            status: 429,
            headers: {
              "X-RateLimit-Limit": limit.toString(),
              "X-RateLimit-Remaining": remaining.toString(),
              "X-RateLimit-Reset": reset.toString(),
            },
          }
        );
      }
    } catch (rateLimitError) {
      logger.error("Rate limiting error", rateLimitError);
      // Continue without rate limiting if there's an error
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
      logger.debug("Request body parsed", { body });
    } catch (parseError) {
      logger.error("Failed to parse request body", parseError);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { documentation, language, aiProvider, model, minify, useChunking } =
      body;

    // Validate input
    if (!documentation || !language || !aiProvider) {
      logger.warn("Missing required fields", {
        documentation: !!documentation,
        language,
        aiProvider,
        model,
      });
      return NextResponse.json(
        {
          error:
            "Missing required fields: documentation, language, or aiProvider",
        },
        { status: 400 }
      );
    }

    // Log request details
    logger.info("Generating SDK", {
      language,
      aiProvider,
      model,
      documentationLength: documentation.length,
    });

    // Process documentation based on options
    let processedDocumentation = documentation;

    // Apply minification if requested
    if (minify) {
      logger.info("Minifying documentation");
      const originalLength = processedDocumentation.length;
      processedDocumentation = minifyText(processedDocumentation);
      logger.info(
        `Documentation minified from ${originalLength} to ${processedDocumentation.length} characters`
      );
    }

    // Generate SDK based on selected AI provider
    let sdk: string;

    try {
      // If chunking is enabled and the documentation is large
      if (useChunking) {
        logger.info("Using chunking for large documentation");
        const chunks = splitTextIntoChunks(processedDocumentation);
        logger.info(`Documentation split into ${chunks.length} chunks`);

        if (chunks.length === 1) {
          // If only one chunk, process normally
          logger.info("Only one chunk needed, processing normally");
          switch (aiProvider) {
            case "openai":
              sdk = await generateSDKWithOpenAI(
                processedDocumentation,
                language,
                model
              );
              break;
            case "openrouter":
              sdk = await generateSDKWithOpenRouter(
                processedDocumentation,
                language,
                model
              );
              break;
            case "groq":
              sdk = await generateSDKWithGroq(
                processedDocumentation,
                language,
                model
              );
              break;
            default:
              logger.warn(`Invalid AI provider: ${aiProvider}`);
              return NextResponse.json(
                { error: "Invalid AI provider" },
                { status: 400 }
              );
          }
        } else {
          // Process each chunk separately and combine results
          logger.info(`Processing ${chunks.length} chunks separately`);

          // First chunk: Generate the SDK structure
          let firstChunkPrompt =
            `This is part 1 of ${chunks.length} of the API documentation. ` +
            `Please create the SDK structure and implement the first part of the API. ` +
            `Focus on creating a well-structured SDK that can be extended with more endpoints later.\n\n${chunks[0]}`;

          let sdkParts: string[] = [];

          // Process first chunk
          switch (aiProvider) {
            case "openai":
              sdk = await generateSDKWithOpenAI(
                firstChunkPrompt,
                language,
                model
              );
              break;
            case "openrouter":
              sdk = await generateSDKWithOpenRouter(
                firstChunkPrompt,
                language,
                model
              );
              break;
            case "groq":
              sdk = await generateSDKWithGroq(
                firstChunkPrompt,
                language,
                model
              );
              break;
            default:
              logger.warn(`Invalid AI provider: ${aiProvider}`);
              return NextResponse.json(
                { error: "Invalid AI provider" },
                { status: 400 }
              );
          }

          sdkParts.push(sdk);

          // Process remaining chunks
          for (let i = 1; i < chunks.length; i++) {
            logger.info(`Processing chunk ${i + 1} of ${chunks.length}`);

            const chunkPrompt =
              `This is part ${i + 1} of ${
                chunks.length
              } of the API documentation. ` +
              `I've already created the basic SDK structure. Now I need you to implement the endpoints ` +
              `described in this part of the documentation. Here's the documentation for this part:\n\n${chunks[i]}\n\n` +
              `Please provide ONLY the new endpoint implementations that should be added to the existing SDK. ` +
              `Do not repeat the SDK structure or previously implemented endpoints.`;

            let chunkSdk: string;
            switch (aiProvider) {
              case "openai":
                chunkSdk = await generateSDKWithOpenAI(
                  chunkPrompt,
                  language,
                  model
                );
                break;
              case "openrouter":
                chunkSdk = await generateSDKWithOpenRouter(
                  chunkPrompt,
                  language,
                  model
                );
                break;
              case "groq":
                chunkSdk = await generateSDKWithGroq(
                  chunkPrompt,
                  language,
                  model
                );
                break;
              default:
                logger.warn(`Invalid AI provider: ${aiProvider}`);
                return NextResponse.json(
                  { error: "Invalid AI provider" },
                  { status: 400 }
                );
            }

            sdkParts.push(chunkSdk);
          }

          // Final pass to combine and clean up the SDK parts
          const combinationPrompt =
            `I have generated an SDK in parts. Please combine these parts into a cohesive, ` +
            `well-structured SDK, removing any duplications or inconsistencies. Here are the parts:\n\n` +
            sdkParts
              .map((part, index) => `--- PART ${index + 1} ---\n${part}\n\n`)
              .join("");

          switch (aiProvider) {
            case "openai":
              sdk = await generateSDKWithOpenAI(
                combinationPrompt,
                language,
                model
              );
              break;
            case "openrouter":
              sdk = await generateSDKWithOpenRouter(
                combinationPrompt,
                language,
                model
              );
              break;
            case "groq":
              sdk = await generateSDKWithGroq(
                combinationPrompt,
                language,
                model
              );
              break;
            default:
              logger.warn(`Invalid AI provider: ${aiProvider}`);
              return NextResponse.json(
                { error: "Invalid AI provider" },
                { status: 400 }
              );
          }
        }
      } else {
        // Process normally without chunking
        switch (aiProvider) {
          case "openai":
            sdk = await generateSDKWithOpenAI(
              processedDocumentation,
              language,
              model
            );
            break;
          case "openrouter":
            sdk = await generateSDKWithOpenRouter(
              processedDocumentation,
              language,
              model
            );
            break;
          case "groq":
            sdk = await generateSDKWithGroq(
              processedDocumentation,
              language,
              model
            );
            break;
          default:
            logger.warn(`Invalid AI provider: ${aiProvider}`);
            return NextResponse.json(
              { error: "Invalid AI provider" },
              { status: 400 }
            );
        }
      }

      logger.info("SDK generated successfully", {
        aiProvider,
        language,
        model,
        sdkLength: sdk.length,
      });

      // Return the generated SDK
      return NextResponse.json(
        { sdk },
        {
          status: 200,
          headers: {
            "X-RateLimit-Limit": "10",
            "X-RateLimit-Remaining": "9",
            "X-RateLimit-Reset": "3600",
          },
        }
      );
    } catch (generationError) {
      logger.error(`Error generating SDK with ${aiProvider}`, generationError);
      return NextResponse.json(
        { error: `Failed to generate SDK with ${aiProvider}` },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Unhandled error in generate-sdk API route", error);
    return NextResponse.json(
      { error: "Failed to generate SDK due to an unexpected error" },
      { status: 500 }
    );
  }
}
