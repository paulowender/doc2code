import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Check which API keys are available
    const apiKeys = {
      openai: typeof process.env.OPENAI_API_KEY === 'string' && process.env.OPENAI_API_KEY.length > 0,
      openrouter: typeof process.env.OPENROUTER_API_KEY === 'string' && process.env.OPENROUTER_API_KEY.length > 0,
      groq: typeof process.env.GROQ_API_KEY === 'string' && process.env.GROQ_API_KEY.length > 0
    };
    
    logger.info('API keys check', { apiKeys });
    
    return NextResponse.json({ apiKeys });
  } catch (error) {
    logger.error('Error checking API keys', error);
    return NextResponse.json(
      { error: 'Failed to check API keys' },
      { status: 500 }
    );
  }
}
