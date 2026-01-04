FROM oven/bun:1

WORKDIR /app

COPY package*.json ./

RUN bun install

COPY . .

ENV PORT=5000
EXPOSE 5000

CMD ["bun", "dev"]