import pino from 'pino';

export const log = pino({
  level: 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'mm-dd HH:MM:ss',
      singleLine: false,
    },
  },
});

