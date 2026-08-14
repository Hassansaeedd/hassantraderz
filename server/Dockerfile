FROM node:20-alpine

WORKDIR /app

# Install dependencies first (cached layer)
COPY package*.json ./
RUN npm ci --only=production

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy application source
COPY src ./src

# Create upload & log directories
RUN mkdir -p uploads logs

EXPOSE 3001

CMD ["node", "src/index.js"]
