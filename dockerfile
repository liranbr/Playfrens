# -------- Build Stage --------
FROM node:20 AS build
WORKDIR /app

# Copy package.json and lockfile
COPY package*.json ./
RUN npm install

# Copy everything
COPY . .

# Build frontend
RUN npm run build

# -------- Backend Stage --------
FROM node:20 AS backend-build
WORKDIR /app/backend

# Copy backend source
COPY backend/ .

# Copy node_modules from build stage
COPY --from=build /app/node_modules /app/node_modules

# Copy frontend build output into backend/public
COPY --from=build /app/dist /app/backend/public

# Copy .env from build stage
COPY --from=build /app/.env /app/.env

# -------- Final Runtime Stage --------
FROM node:20-slim
WORKDIR /app

# Copy backend source
COPY --from=backend-build /app/backend /app/backend

# Copy node_modules
COPY --from=backend-build /app/node_modules /app/node_modules

# Copy environment files into /app/backend
COPY .env /app/backend/.env
COPY .env.example /app/backend/.env.example
COPY .env.public /app/backend/.env.public

WORKDIR /app/backend

EXPOSE 3000
CMD ["node", "server.js"]