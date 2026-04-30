FROM node:20-alpine AS base

ENV NODE_OPTIONS=--max-old-space-size=1024

RUN apk update && apk upgrade --no-cache && \
    apk add --no-cache bash curl

RUN npm install -g pnpm@latest

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

EXPOSE 5000

CMD ["sh", "-c", "while true; do pnpm dev; done"]

##################################################

FROM dependencies AS production

ENV NODE_ENV=production

COPY --from=dev-dependencies /app/node_modules/.bin/.package-lock.json /tmp/ 2>/dev/null || true

COPY --chown=node:node . .

USER node

EXPOSE 5000

CMD ["node", "./dist/server.js"]
