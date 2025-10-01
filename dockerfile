# -------- Build Stage --------
FROM node:20 AS build
WORKDIR /app

# Copy package.json and lockfile first (for cache-friendly install)
COPY package*.json ./

# Install ALL deps (prod + dev) so we can build frontend
RUN npm install

# Copy the rest of the project
COPY . .

# Build frontend -> outputs into /app/dist
RUN npm run build


# -------- Backend Stage --------
FROM node:20 AS backend-build
WORKDIR /app

# Copy backend source (flattened into /app)
COPY backend/ ./ 

# Copy frontend build into /app/public
COPY --from=build /app/dist ./public

# Copy only package.json + lockfile
COPY package*.json ./

# Install ONLY production deps
RUN npm install --omit=dev --ignore-scripts && npm cache clean --force


# -------- Final Runtime Stage --------
FROM node:20-slim
WORKDIR /app

# Copy backend code + frontend build + node_modules from backend-build
COPY --from=backend-build /app /app

# Copy environment files from host
COPY .env .env
COPY .env.example .env.example
COPY .env.public .env.public

EXPOSE 3000
CMD ["node", "server.js"]
