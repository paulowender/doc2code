import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import {
  generateSDKWithOpenAI,
  generateSDKWithOpenRouter,
  generateSDKWithGroq,
} from '@/lib/ai-providers';

// Create a rate limiter that allows 10 requests per hour
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  analytics: true,
});

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    
    // Check rate limit
    const { success, limit, reset, remaining } = await ratelimit.limit(ip);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: { 'X-RateLimit-Limit': limit.toString(), 'X-RateLimit-Remaining': remaining.toString(), 'X-RateLimit-Reset': reset.toString() } }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { documentation, language, aiProvider } = body;
    
    // Validate input
    if (!documentation || !language || !aiProvider) {
      return NextResponse.json(
        { error: 'Missing required fields: documentation, language, or aiProvider' },
        { status: 400 }
      );
    }
    
    // Generate SDK based on selected AI provider
    let sdk: string;
    
    switch (aiProvider) {
      case 'openai':
        sdk = await generateSDKWithOpenAI(documentation, language);
        break;
      case 'openrouter':
        sdk = await generateSDKWithOpenRouter(documentation, language);
        break;
      case 'groq':
        sdk = await generateSDKWithGroq(documentation, language);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid AI provider' },
          { status: 400 }
        );
    }
    
    // Return the generated SDK
    return NextResponse.json(
      { sdk },
      { 
        status: 200,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString()
        }
      }
    );
  } catch (error) {
    console.error('Error generating SDK:', error);
    return NextResponse.json(
      { error: 'Failed to generate SDK' },
      { status: 500 }
    );
  }
}
