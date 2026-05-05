FROM node:20-alpine AS base

RUN apk update && apk upgrade --no-cache && \
    apk add --no-cache bash curl

RUN npm install -g pnpm@latest

ENV NODE_OPTIONS=--max-old-space-size=1024

WORKDIR /app

##################################

FROM base AS dependencies

RUN mkdir -p /app/backend

COPY pnpm-lock.yaml pnpm-workspace.yaml /app/
COPY backend/package.json /app/backend/
COPY frontend/package.json /app/

RUN cd /app && pnpm install --prod --no-frozen-lockfile

##################################

FROM base AS builder

RUN mkdir -p /app/backend

COPY pnpm-lock.yaml pnpm-workspace.yaml /app/
COPY backend/package.json /app/backend/
COPY frontend/package.json /app/

RUN cd /app && pnpm install --no-frozen-lockfile

COPY frontend/ ./

RUN cd /app && pnpm build

##################################

FROM base AS production

ENV NODE_ENV=production

COPY --from=dependencies /app/node_modules ./node_modules

COPY --from=builder /app/.next ./.next

COPY --from=builder /app/package.json ./

COPY frontend/public ./public

EXPOSE 3000

CMD ["pnpm", "start"]

##################################

FROM base AS development

ENV NODE_ENV=development

RUN mkdir -p /app/backend

COPY pnpm-lock.yaml pnpm-workspace.yaml /app/
COPY backend/package.json /app/backend/
COPY frontend/package.json /app/

RUN cd /app && pnpm install --no-frozen-lockfile

COPY frontend/ ./

EXPOSE 3000

CMD ["sh", "-c", "while true; do pnpm dev; done"]
