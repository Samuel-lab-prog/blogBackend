import pino from 'pino';

const env = process.env.NODE_ENV;

let level = 'debug';

if (env === 'test') {
	level = 'silent';
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
