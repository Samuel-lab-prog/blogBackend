FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install

COPY . .

RUN bun run generate

ENV PORT=5000
EXPOSE 5000

CMD ["bun", "run", "start"]
