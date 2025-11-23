# Backend API (Node/Express)
FROM node:20-alpine AS base

WORKDIR /app
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy application source
COPY . .

EXPOSE 4000
CMD ["node", "server.js"]
