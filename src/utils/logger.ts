import pino from 'pino';

const env = process.env.NODE_ENV;

const level =
  env === 'production'
    ? 'info'
    : env === 'test'
    ? 'silent'
    : 'debug'; // 👈 fallback seguro

export const log = pino({
  level,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'mm-dd HH:MM:ss',
      singleLine: false,
    },
  },
});
