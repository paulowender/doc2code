import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { logs } = body;
    
    if (!Array.isArray(logs)) {
      return NextResponse.json(
        { error: 'Invalid logs format' },
        { status: 400 }
      );
    }
    
    // Process each log entry
    logs.forEach((log) => {
      const { level, message, meta, source } = log;
      
      // Validate log level
      if (!['info', 'warn', 'error', 'debug'].includes(level)) {
        return;
      }
      
      // Add source information to meta
      const logMeta = {
        ...meta,
        source,
        clientSide: true,
      };
      
      // Log using server-side logger
      logger[level](`[CLIENT] ${message}`, logMeta);
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error processing client logs', error);
    return NextResponse.json(
      { error: 'Failed to process logs' },
      { status: 500 }
    );
  }
}
