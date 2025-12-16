// requestContext.ts
import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestTimingContext = {
  dbTimings: number[];
};

export const requestContext = new AsyncLocalStorage<RequestTimingContext>();
