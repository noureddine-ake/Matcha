FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the app
COPY . .

# Expose port 5000
EXPOSE 5000

# Run your DB initialization script
RUN node ./scripts/initDB.js

# Start the server using npm run dev
CMD ["npm", "run", "dev"]
