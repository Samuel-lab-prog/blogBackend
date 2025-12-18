import pino from 'pino';

const env = process.env.NODE_ENV || 'development';
let level = undefined;

if (env === 'production') {
  level = 'info';
} else {
  level = 'debug';
}

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
