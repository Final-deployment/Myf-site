# Use Node.js 20 (LTS)
FROM node:20-slim

# Set working directory
WORKDIR /app

# Install build dependencies for better-sqlite3 (python3, make, g++)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Rebuild better-sqlite3 to ensure binary compatibility
RUN npm rebuild better-sqlite3

# Copy source code (including locally built dist)
COPY . .

# NOTE: We assume 'dist' is already built locally to ensure consistency
# RUN npm run build - Skipped to use local build

# Expose port
EXPOSE 5000

# Start command
CMD ["npm", "run", "start"]
