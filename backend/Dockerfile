
##################################

FROM node:20-alpine AS base
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN apk update && apk upgrade --no-cache && \
    apk add --no-cache bash curl
RUN npm install -g pnpm@latest
WORKDIR /app

##################################

FROM base AS dependencies
RUN mkdir -p /app/frontend
COPY pnpm-lock.yaml pnpm-workspace.yaml /app/
COPY backend/package.json /app/
COPY frontend/package.json /app/frontend/
COPY .npmrc /app/.npmrc
RUN cd /app && pnpm install --prod --no-frozen-lockfile

##################################

FROM base AS dev-dependencies
RUN mkdir -p /app/frontend
COPY pnpm-lock.yaml pnpm-workspace.yaml /app/
COPY backend/package.json /app/
COPY frontend/package.json /app/frontend/
COPY .npmrc /app/.npmrc
RUN cd /app && pnpm install --no-frozen-lockfile

##################################

FROM base AS production
ENV NODE_ENV=production
COPY --from=dev-dependencies /app/node_modules ./node_modules
COPY backend/ ./
RUN cd /app && pnpm build
USER node
EXPOSE 5000
CMD ["node", "./dist/server.js"]

##################################

FROM base AS development
ENV NODE_ENV=development
RUN mkdir -p /app/frontend
COPY pnpm-lock.yaml pnpm-workspace.yaml /app/
COPY backend/package.json /app/
COPY frontend/package.json /app/frontend/
COPY .npmrc /app/.npmrc
RUN cd /app && pnpm install --no-frozen-lockfile
COPY backend/ ./
EXPOSE 5000
CMD ["sh", "-c", "while true; do pnpm dev; done"]"