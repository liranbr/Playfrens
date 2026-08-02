# -------- Build Stage --------
FROM node:20-alpine AS build
WORKDIR /app

# Install build tools (needed to compile some deps during npm install)
RUN apk add --no-cache python3 make g++

# Copy package.json and lockfile
COPY package*.json ./

# Install ALL deps (including dev, needed for building frontend)
RUN npm install

# Copy everything
COPY . .

# Build frontend -> /app/dist
RUN npm run build


# -------- Backend Stage --------
FROM node:20-alpine AS backend-build
WORKDIR /app

# Install build tools for backend install
RUN apk add --no-cache python3 make g++

# Copy backend source (flattened into /app)
COPY backend/ ./ 

# Copy frontend build into /app/public
COPY --from=build /app/dist ./public

# Copy only package.json + lockfile
COPY package*.json ./

# Install ONLY production dependencies
RUN npm install --omit=dev --ignore-scripts && npm cache clean --force

# Remove build tools to slim down
RUN apk del python3 make g++


# -------- Final Runtime Stage --------
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copy app + node_modules from backend-build
COPY --from=backend-build /app /app

# Secrets come from the host's environment variables
COPY .env.example .env.example
COPY .env.public .env.public

EXPOSE 3000
CMD ["node", "server.js"]
