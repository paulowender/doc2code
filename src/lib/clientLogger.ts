// Client-side logger that sends logs to the server

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  meta?: any;
  timestamp: string;
  source: string;
}

// Queue to store logs that haven't been sent yet
let logQueue: LogEntry[] = [];
let isSending = false;
const MAX_QUEUE_SIZE = 100;
const FLUSH_INTERVAL = 5000; // 5 seconds

// Set up interval to flush logs
if (typeof window !== 'undefined') {
  setInterval(flushLogs, FLUSH_INTERVAL);
}

// Function to send logs to the server
async function flushLogs() {
  if (isSending || logQueue.length === 0) return;
  
  try {
    isSending = true;
    const logsToSend = [...logQueue];
    logQueue = [];
    
    const response = await fetch('/api/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ logs: logsToSend }),
    });
    
    if (!response.ok) {
      // If sending fails, add logs back to the queue (if there's space)
      if (logQueue.length + logsToSend.length <= MAX_QUEUE_SIZE) {
        logQueue = [...logsToSend, ...logQueue];
      }
      console.error('Failed to send logs to server:', await response.text());
    }
  } catch (error) {
    console.error('Error sending logs to server:', error);
  } finally {
    isSending = false;
  }
}

// Add a log entry to the queue
function addToQueue(level: LogLevel, message: string, meta?: any) {
  // Always log to console
  console[level](message, meta || '');
  
  // Add to queue
  const logEntry: LogEntry = {
    level,
    message,
    meta,
    timestamp: new Date().toISOString(),
    source: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
  };
  
  // Add to queue, but don't exceed max size
  if (logQueue.length < MAX_QUEUE_SIZE) {
    logQueue.push(logEntry);
  }
  
  // If queue is getting full, flush immediately
  if (logQueue.length >= MAX_QUEUE_SIZE / 2) {
    flushLogs();
  }
}

// Client logger interface
const clientLogger = {
  info: (message: string, meta?: any) => addToQueue('info', message, meta),
  warn: (message: string, meta?: any) => addToQueue('warn', message, meta),
  error: (message: string, meta?: any) => addToQueue('error', message, meta),
  debug: (message: string, meta?: any) => addToQueue('debug', message, meta),
  
  // Force flush logs immediately
  flush: () => flushLogs(),
};

export default clientLogger;
