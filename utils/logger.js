const winston = require("winston");
const { format, transports, createLogger } = winston;
const path = require("path");
const fs = require("fs-extra");

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), "logs");
fs.ensureDirSync(logsDir);

// Define log format
const logFormat = format.printf(({ level, message, timestamp, ...meta }) => {
  // Add any additional metadata if present
  const metaStr = Object.keys(meta).length
    ? `\n${JSON.stringify(meta, null, 2)}`
    : "";

  return `${timestamp} [${level.toUpperCase()}]: ${message}${metaStr}`;
});

// Custom format for colorized console output
const consoleFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.colorize(),
  logFormat
);

// Format for file logs (without colors)
const fileFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  logFormat
);

// Create the logger instance
const logger = createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: fileFormat,
  defaultMeta: { service: "scoopit" },
  transports: [
    // Write logs with level 'error' and below to error.log
    new transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
    }),
    // Write all logs to combined.log
    new transports.File({
      filename: path.join(logsDir, "combined.log"),
    }),
  ],
  // Don't exit on uncaught errors
  exitOnError: false,
});

// If we're not in production, also log to the console
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new transports.Console({
      format: consoleFormat,
    })
  );
}

// Create a simplified fileSystem logger that doesn't rely on this[level]
function logFileSystem(operation, filePath, details = {}, level = "debug") {
  const message = `File ${operation}: ${filePath}`;
  const meta = {
    operation,
    filePath,
    ...details
  };

  // Call the appropriate logger method directly
  switch (level) {
    case "info":
      logger.info(message, meta);
      break;
    case "warn":
      logger.warn(message, meta);
      break;
    case "error":
      logger.error(message, meta);
      break;
    default:
      logger.debug(message, meta);
  }
}

// Extend logger with additional methods
const extendedLogger = {
  // Expose the core winston logger methods directly
  error: (message, meta) => logger.error(message, meta),
  warn: (message, meta) => logger.warn(message, meta),
  info: (message, meta) => logger.info(message, meta),
  debug: (message, meta) => logger.debug(message, meta),
  
  // Log the start of a new operation
  startOperation: function (operation, details = {}) {
    logger.info(`Started: ${operation}`, {
      operation,
      status: "started",
      ...details,
    });
    return { operation, startTime: Date.now() };
  },

  // Log the end of an operation
  endOperation: function (context, status = "success", details = {}) {
    const { operation, startTime } = context;
    const duration = Date.now() - startTime;

    logger.info(`Completed: ${operation} (${duration}ms)`, {
      operation,
      status,
      duration,
      ...details,
    });
  },

  // Log a successful HTTP request
  httpSuccess: function (url, statusCode, duration, details = {}) {
    logger.debug(`HTTP Success: ${url} (${statusCode}, ${duration}ms)`, {
      url,
      statusCode,
      duration,
      ...details,
    });
  },

  // Log a failed HTTP request
  httpError: function (url, error, details = {}) {
    logger.error(`HTTP Error: ${url} - ${error.message}`, {
      url,
      error: {
        message: error.message,
        code: error.code,
        stack: error.stack,
      },
      ...details,
    });
  },

  // Log file system operations - use the standalone function
  fileSystem: logFileSystem,

  // Log processing activity
  processing: function (message, details = {}) {
    logger.info(message, {
      type: "processing",
      ...details,
    });
  },

  // Log application startup
  startup: function (version, config = {}) {
    logger.info(`Application starting - version ${version}`, {
      type: "startup",
      version,
      config: {
        ...config,
        // Don't log sensitive info even if present
        password: config.password ? "[REDACTED]" : undefined,
        token: config.token ? "[REDACTED]" : undefined,
      },
    });
  },

  // Log application shutdown
  shutdown: function (reason) {
    logger.info(`Application shutting down: ${reason}`, {
      type: "shutdown",
      reason,
    });
  },

  // Progress logging for lengthy operations
  progress: function (operation, current, total, details = {}) {
    const percent = Math.round((current / total) * 100);
    logger.debug(`Progress: ${operation} ${current}/${total} (${percent}%)`, {
      operation,
      current,
      total,
      percent,
      ...details,
    });
  },
};

// Export the logger
module.exports = extendedLogger;
