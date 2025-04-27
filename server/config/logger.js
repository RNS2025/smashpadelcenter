const winston = require("winston");
const path = require("path");

const DEBUG_MODE = process.env.DEBUG_MODE === "true";

const logger = winston.createLogger({
  level: DEBUG_MODE ? "debug" : "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
    DEBUG_MODE ? winston.format.prettyPrint() : winston.format.simple()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ level, message, timestamp, ...metadata }) => {
          let msg = `${timestamp} [${level}]: ${message}`;
          if (DEBUG_MODE && Object.keys(metadata).length > 0) {
            msg += "\n" + JSON.stringify(metadata, null, 2);
          }
          return msg;
        })
      ),
    }),
    new winston.transports.File({
      filename: path.join(__dirname, "../logs/error.log"),
      level: "error",
    }),
    new winston.transports.File({
      filename: path.join(__dirname, "../logs/combined.log"),
    }),
  ],
});

// Only add console transport if we're not in production or if DEBUG_MODE is true
if (process.env.NODE_ENV !== "production" || DEBUG_MODE) {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ level, message, timestamp, ...metadata }) => {
          let msg = `${timestamp} [${level}]: ${message}`;
          if (DEBUG_MODE && Object.keys(metadata).length > 0) {
            msg += "\n" + JSON.stringify(metadata, null, 2);
          }
          return msg;
        })
      ),
    })
  );
}

// Add debug message about current mode
logger.debug(`Logger initialized in ${DEBUG_MODE ? "debug" : "normal"} mode`);

module.exports = logger;
