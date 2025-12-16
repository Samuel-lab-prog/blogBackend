import Elysia from 'elysia';
import cors from '@elysiajs/cors';
import { openapi, fromTypes } from '@elysiajs/openapi';
import { rateLimit } from 'elysia-rate-limit';
import { BunAdapter } from 'elysia/adapter/bun';

import { ErrorPlugin } from './utils/errorPlugin';
import { LoggerPlugin } from './utils/loggerPlugin';
import { sanitize } from './utils/xssClean';

import { postsRouter } from './routes/posts/controllers';
import { authRouter } from './routes/auth/controllers';


const PREFIX = '/api/v1';
const INSTANCE_NAME = 'mainServerInstance';
const HOST_NAME = 'localhost';
const PORT = Number(process.env.PORT) || 3000;

const OPEN_API_SETTINGS = {
  path: '/docs',
  documentation: {
    info: {
      title: 'Blog API',
      description: 'API documentation for Blog API',
      version: '1.0.0',
    },
  },
  references: fromTypes(),
};

const ELYSIA_SETTINGS = {
  adapter: BunAdapter,
  name: INSTANCE_NAME,
  prefix: PREFIX,
  sanitize: (value: string) => sanitize(value),
  serve: {
    hostname: HOST_NAME,
    port: PORT,
  },
};

export default new Elysia(ELYSIA_SETTINGS)
  .use(LoggerPlugin)
  .use(ErrorPlugin)
  .use(rateLimit({
    max: 1000,
    duration: 15 * 60 * 1000, // 15 minutes
  }))
  .use(cors())
  .use(postsRouter)
  .use(authRouter)
  .use(openapi(OPEN_API_SETTINGS))
  .listen({ hostname: HOST_NAME, port: PORT });
