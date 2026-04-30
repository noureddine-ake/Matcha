FROM node:20-alpine AS base

RUN apk update && apk upgrade --no-cache && \
    apk add --no-cache bash curl

RUN npm install -g pnpm@latest

ENV NODE_OPTIONS=--max-old-space-size=1024

WORKDIR /app

##################################################

FROM base AS dependencies

COPY package*.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --prod --frozen-lockfile

##################################################

FROM base AS dev-dependencies

COPY package*.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile

##################################################

FROM dev-dependencies AS development

ENV NODE_ENV=development

COPY . .

EXPOSE 3000

CMD ["sh", "-c", "while true; do pnpm dev; done"]

##################################################

FROM dependencies AS builder

COPY . .

RUN pnpm build

##################################################

FROM base AS production

ENV NODE_ENV=production

COPY --from=dependencies /app/node_modules ./node_modules

COPY --from=builder /app/.next ./.next

COPY --from=builder /app/package.json ./

COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["pnpm", "start"]
