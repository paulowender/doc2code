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
import { v4 as uuidv4 } from "uuid";

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

    // Generate a session ID for tracking progress
    const sessionId = uuidv4();

    // Initialize progress
    await fetch(
      `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/api/generate-sdk/progress`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          current: 0,
          total: 1,
          status: "initializing",
        }),
      }
    );

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
      // Define chunks variable outside the if block to make it accessible in the entire scope
      let chunks: string[] = [];

      // If chunking is enabled and the documentation is large
      if (useChunking) {
        logger.info("Using chunking for large documentation");
        chunks = splitTextIntoChunks(processedDocumentation);
        logger.info(`Documentation split into ${chunks.length} chunks`);

        // Update progress with total chunks
        await fetch(
          `${
            process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
          }/api/generate-sdk/progress`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              sessionId,
              current: 0,
              total: chunks.length + 1, // +1 for final combination step
              status: "processing",
            }),
          }
        );

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
            `IMPORTANT: This is a multi-part task. I will send you ${chunks.length} parts of an API documentation. ` +
            `For now, I'm only sending part 1 of ${chunks.length}. Please wait for all parts before creating the final SDK. ` +
            `For this first part, just analyze the API structure and plan how you would create an SDK for it. ` +
            `DO NOT start implementing the SDK yet. Just acknowledge that you've received part 1 and understand the API structure. ` +
            `\n\nHere's the first part of the API documentation:\n\n${chunks[0]}\n\n` +
            `Remember, just acknowledge receipt of this part and briefly describe what you see in the API. ` +
            `Wait for all ${chunks.length} parts before creating the SDK.`;

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

          // Update progress
          await fetch(
            `${
              process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
            }/api/generate-sdk/progress`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                sessionId,
                current: 1,
                total: chunks.length + 1,
                status: "processing",
              }),
            }
          );

          // Process remaining chunks
          for (let i = 1; i < chunks.length; i++) {
            logger.info(`Processing chunk ${i + 1} of ${chunks.length}`);

            const chunkPrompt =
              `This is part ${i + 1} of ${
                chunks.length
              } of the API documentation. ` +
              `Please just acknowledge receipt of this part and briefly describe what you see in this section of the API. ` +
              `DO NOT start implementing anything yet. Just confirm you've received part ${
                i + 1
              } of ${chunks.length}. ` +
              `\n\nHere's part ${i + 1} of the API documentation:\n\n${
                chunks[i]
              }\n\n` +
              `Remember, just acknowledge receipt of this part. We'll implement the full SDK after all parts are received.`;

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

            // Update progress
            try {
              const progressResponse = await fetch(
                `${
                  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
                }/api/generate-sdk/progress`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    sessionId,
                    current: i + 2, // +1 for 0-indexing, +1 for first chunk already processed
                    total: chunks.length + 1,
                    status: "processing",
                  }),
                }
              );

              if (!progressResponse.ok) {
                logger.warn(`Failed to update progress for chunk ${i + 1}`, {
                  status: progressResponse.status,
                  statusText: progressResponse.statusText,
                });
              }
            } catch (progressError) {
              logger.error(
                `Error updating progress for chunk ${i + 1}`,
                progressError
              );
            }
          }

          // Final pass to combine and clean up the SDK parts
          // Now that we have all parts, create the actual SDK
          // Combine all chunks into one complete documentation
          const fullDocumentation = chunks.join("\n\n--- NEXT PART ---\n\n");

          const combinationPrompt =
            `Now that you have received all ${chunks.length} parts of the API documentation, please create a complete, ` +
            `professional, production-ready SDK that wraps this API. ` +
            `The SDK should be a complete, self-contained package that can be imported and used in any project. ` +
            `Include proper error handling, documentation, and follow best practices for ${language}. ` +
            `The SDK should be easy to use, with a clean and intuitive interface. ` +
            `\n\nInclude the following in your SDK:\n` +
            `1. A main client class that handles authentication and provides access to all API resources\n` +
            `2. Resource classes for each major API section\n` +
            `3. Methods for each API endpoint with proper parameter typing\n` +
            `4. Comprehensive error handling\n` +
            `5. Clear documentation with examples\n` +
            `6. Proper TypeScript types/interfaces (if applicable)\n\n` +
            `Make sure the final SDK is well-organized, follows best practices for ${language}, ` +
            `and is ready for production use. Here is the complete API documentation:\n\n${fullDocumentation}`;

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

      // Update progress to complete
      await fetch(
        `${
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/api/generate-sdk/progress`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
            current: useChunking ? chunks?.length + 1 || 1 : 1,
            total: useChunking ? chunks?.length + 1 || 1 : 1,
            status: "complete",
          }),
        }
      );

      // Return the generated SDK
      return NextResponse.json(
        { sdk, sessionId },
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
