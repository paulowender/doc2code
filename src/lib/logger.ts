import fs from "fs";
import path from "path";
import { format } from "util";

// Ensure this module is only used on the server side
if (typeof window !== "undefined") {
  throw new Error("This module should only be imported on the server side");
}

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), "logs");
try {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
} catch (error) {
  console.error("Failed to initialize logs directory:", error);
}

// Log levels
type LogLevel = "info" | "warn" | "error" | "debug";

// Format current date for log filename
const getFormattedDate = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;
};

// Format timestamp for log entries
const getTimestamp = (): string => {
  const now = new Date();
  return now.toISOString();
};

// Write to log file
const writeToLogFile = (level: LogLevel, message: string, meta?: any): void => {
  // Always log to console
  console[level](message, meta || "");

  // Only write to file on the server side
  if (typeof window === "undefined" && logsDir) {
    try {
      const timestamp = getTimestamp();
      const formattedDate = getFormattedDate();
      const logFilePath = path.join(logsDir, `${formattedDate}.log`);

      let logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

      if (meta) {
        if (meta instanceof Error) {
          logMessage += `\n  Stack: ${meta.stack}`;
        } else {
          try {
            logMessage += `\n  Meta: ${JSON.stringify(meta, null, 2)}`;
          } catch (e) {
            logMessage += `\n  Meta: ${format(meta)}`;
          }
        }
      }

      logMessage += "\n";

      // Append to log file
      fs.appendFileSync(logFilePath, logMessage);
    } catch (error) {
      console.error("Failed to write to log file:", error);
    }
  }
};

// Logger interface
const logger = {
  info: (message: string, meta?: any) => writeToLogFile("info", message, meta),
  warn: (message: string, meta?: any) => writeToLogFile("warn", message, meta),
  error: (message: string, meta?: any) =>
    writeToLogFile("error", message, meta),
  debug: (message: string, meta?: any) =>
    writeToLogFile("debug", message, meta),

  // Log request details
  logRequest: (req: any, res: any, error?: any) => {
    const meta = {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      query: req.query,
      statusCode: res.statusCode,
      error: error
        ? {
            message: error.message,
            stack: error.stack,
          }
        : undefined,
    };

    if (error) {
      writeToLogFile("error", `Request failed: ${req.method} ${req.url}`, meta);
    } else {
      writeToLogFile(
        "info",
        `Request completed: ${req.method} ${req.url}`,
        meta
      );
    }
  },
};

export default logger;
