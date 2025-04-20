import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import {
  generateSDKWithOpenAI,
  generateSDKWithOpenRouter,
  generateSDKWithGroq,
} from "@/lib/ai-providers";
import logger from "@/lib/logger";

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

    const { documentation, language, aiProvider } = body;

    // Validate input
    if (!documentation || !language || !aiProvider) {
      logger.warn("Missing required fields", {
        documentation: !!documentation,
        language,
        aiProvider,
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
      documentationLength: documentation.length,
    });

    // Generate SDK based on selected AI provider
    let sdk: string;

    try {
      switch (aiProvider) {
        case "openai":
          sdk = await generateSDKWithOpenAI(documentation, language);
          break;
        case "openrouter":
          sdk = await generateSDKWithOpenRouter(documentation, language);
          break;
        case "groq":
          sdk = await generateSDKWithGroq(documentation, language);
          break;
        default:
          logger.warn(`Invalid AI provider: ${aiProvider}`);
          return NextResponse.json(
            { error: "Invalid AI provider" },
            { status: 400 }
          );
      }

      logger.info("SDK generated successfully", {
        aiProvider,
        language,
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
