FROM node:18-alpine

# Install bash and make (optional, sometimes needed for some modules)
RUN apk add --no-cache bash

WORKDIR /app

# Copy only package files first
COPY package*.json ./

# Install all dependencies
RUN npm install --include=dev

# Copy the rest of the application
COPY . .

EXPOSE 5000

# Use npx to run nodemon from local node_modules
CMD ["npx", "nodemon", "server.js"] 
