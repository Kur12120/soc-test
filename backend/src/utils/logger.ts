type LogLevel = "info" | "warn" | "error" | "debug";

const formatLog = (level: LogLevel, message: string, meta?: unknown): string => {
  const ts = new Date().toISOString();
  if (meta === undefined) return `[${ts}] ${level.toUpperCase()}: ${message}`;
  return `[${ts}] ${level.toUpperCase()}: ${message} ${JSON.stringify(meta)}`;
};

const logger = {
  info:  (msg: string, meta?: unknown) => console.log(formatLog("info", msg, meta)),
  warn:  (msg: string, meta?: unknown) => console.warn(formatLog("warn", msg, meta)),
  error: (msg: string, meta?: unknown) => console.error(formatLog("error", msg, meta)),
  debug: (msg: string, meta?: unknown) => {
    if (process.env.APP_ENV !== "production") console.debug(formatLog("debug", msg, meta));
  },
};

export default logger;
