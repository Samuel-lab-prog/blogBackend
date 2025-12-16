import pino from 'pino';

const env = process.env.NODE_ENV || 'development';
let level = 'debug';

if(env === 'production') {
  level = 'info';
}
else if(env === 'test') {
  level = 'silent';
}
else {
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

