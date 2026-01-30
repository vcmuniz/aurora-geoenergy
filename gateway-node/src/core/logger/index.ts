import pino, { Logger } from 'pino';

const logLevel = process.env.LOG_LEVEL || 'info';

export const logger: Logger = pino({
  level: logLevel,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      singleLine: false,
    },
  },
});
