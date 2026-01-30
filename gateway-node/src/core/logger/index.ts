import pino, { Logger } from 'pino';

const logLevel = process.env.LOG_LEVEL || 'info';
const isDevelopment = process.env.NODE_ENV !== 'production';

export const logger: Logger = pino(
  {
    level: logLevel,
  },
  isDevelopment
    ? pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          singleLine: false,
        },
      })
    : undefined
);
