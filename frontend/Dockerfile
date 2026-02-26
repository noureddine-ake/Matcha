FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# --- Production server ---
# FROM node:18-alpine
# WORKDIR /app

# COPY --from=builder /app ./

EXPOSE 3000
CMD ["npm", "run", "dev"]
