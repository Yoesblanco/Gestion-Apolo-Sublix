import pino from 'pino';
import { env } from '../../config/env';

export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(env.NODE_ENV !== 'production' && {
    transport: {
      target: 'pino/file', // direct synchronous output without extra thread overhead in dev
    },
  }),
});
