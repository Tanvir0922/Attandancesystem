# Lightweight base image
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package files first (for cache)
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Change ownership (security)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup \
    && chown -R appuser:appgroup /app

USER appuser

# Expose port
EXPOSE 3001

# Start server
CMD ["node", "server.js"]
